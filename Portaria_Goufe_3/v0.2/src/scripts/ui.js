const UI = {
    dadosAcessosCache: [],

    async initPageScript(route) {
        switch (route) {
            case 'home':
                await this.carregarAcessosHome('todos');
                this.configurarPesquisaHome();
                break;
            case 'dashboard':
                this.initDashboardCharts();
                break;
            case 'proprietarios':
                this.initSubSpaTabs();
                await this.carregarSelectRuas('p_rua');
                this.configurarEventoTrocaRua('p_rua', 'p_casa');
                await this.carregarListaProprietarios();
                break;
            case 'moradores':
                this.initSubSpaTabs();
                await this.carregarSelectRuas('m_rua');
                this.configurarEventoTrocaRua('m_rua', 'm_casa');
                await this.carregarSelectProprietarios();
                await this.carregarListaMoradores();
                break;
            case 'visitantes':
                this.initSubSpaTabs();
                await this.configurarAutocompleteDestinos();
                this.definirDataHoraAtualVisitante();
                break;
            case 'condominio':
                await this.carregarCondominio();
                break;
        }
    },

    initSubSpaTabs() {
        const triggers = document.querySelectorAll('.sub-spa-nav button');
        const contents = document.querySelectorAll('.sub-spa-content');

        triggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.getAttribute('data-target');
                triggers.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                contents.forEach(c => {
                    c.style.display = c.id === targetId ? 'block' : 'none';
                });
            });
        });
    },

    formatarDataHora(dataHoraStr) {
        if (!dataHoraStr) return '';
        const [data, hora] = dataHoraStr.split(' ');
        if (!data) return dataHoraStr;
        const dataFormatada = data.split('-').reverse().join('/');
        return hora ? `${dataFormatada} ${hora}` : dataFormatada;
    },

    definirDataHoraAtualVisitante() {
        const input = document.getElementById('v_data_hora');
        if (!input) return;
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        input.value = now.toISOString().slice(0, 16);
    },

    configurarPesquisaHome() {
        const inputPesquisa = document.getElementById('input-pesquisa-home');
        if (!inputPesquisa) return;

        inputPesquisa.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase().trim();
            this.renderizarCardsFiltrados(termo);
        });
    },

    async carregarAcessosHome(statusFiltro) {
        let url = 'src/bancoDeDados/api_acessos.php?hoje=1';
        if (statusFiltro && statusFiltro !== 'todos') url += `&status=${statusFiltro}`;

        try {
            const res = await fetch(url);
            this.dadosAcessosCache = await res.json();
            this.renderizarCardsFiltrados('');
        } catch (e) {
            console.error("Erro ao carregar acessos da Home:", e);
        }
    },

    async filtrarAcessos(tipoLiberacao, status) {
        let url = 'src/bancoDeDados/api_acessos.php?hoje=1';
        let params = [];
        if (status && status !== 'todos') params.push(`status=${status}`);
        if (tipoLiberacao) params.push(`liberacao=${tipoLiberacao}`);
        if (params.length > 0) url += '&' + params.join('&');

        const res = await fetch(url);
        this.dadosAcessosCache = await res.json();
        this.renderizarCardsFiltrados('');
    },

    renderizarCardsFiltrados(termo) {
        const container = document.getElementById('home-cards-container');
        if (!container) return;

        container.innerHTML = '';

        const listaFiltrada = this.dadosAcessosCache.filter(item => {
            const rua = (item.rua_destino || '').toLowerCase();
            const casa = (item.casa_destino || '').toLowerCase();
            const obs = (item.observacao || '').toLowerCase();
            const placa = (item.v_placa || '').toLowerCase();
            const liberacao = (item.liberacao || '').toLowerCase();
            return rua.includes(termo) || casa.includes(termo) || obs.includes(termo) || placa.includes(termo) || liberacao.includes(termo);
        });

        if (listaFiltrada.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem; background: #fff; border-radius: 12px; border: 1px solid var(--border);">🔍 Nenhum registo encontrado.</div>`;
            return;
        }

        listaFiltrada.forEach(item => {
            const isPendente = item.status_visitante === 'PENDENTE';
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div>
                    <div class="card-header">
                        <span class="badge-tipo">${item.liberacao}</span>
                        <span class="badge ${isPendente ? 'badge-pendente' : 'badge-concluido'}">${item.status_visitante}</span>
                    </div>
                    <div class="card-body">
                        <div class="card-info">🕒 <span>Entrou: ${this.formatarDataHora(item.data_hora_entrada)}</span></div>
                        ${item.data_hora_saida ? `<div class="card-info" style="color: var(--success);">🕒 <span>Saiu: ${this.formatarDataHora(item.data_hora_saida)}</span></div>` : ''}
                        
                        <div class="card-title">📍 ${item.rua_destino}, ${item.casa_destino}</div>
                        ${item.v_placa ? `<div class="card-info">🚗 <strong>Veículo:</strong> ${item.veiculo_modelo || ''} (${item.v_placa})</div>` : ''}
                        ${item.observacao ? `<div class="card-obs">"${item.observacao}"</div>` : ''}
                    </div>
                </div>
                
                ${isPendente ? `
                    <div class="card-footer">
                        <button class="btn-action btn-success" onclick="UI.marcarSaida(${item.id})">
                            <span>✅</span> Marcar Saída
                        </button>
                    </div>
                ` : ''}
            `;
            container.appendChild(card);
        });
    },

    async marcarSaida(id) {
        const res = await fetch('src/bancoDeDados/api_acessos.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.sucesso) this.carregarAcessosHome('todos');
    },

    async configurarAutocompleteDestinos() {
        const input = document.getElementById('v_destino_input');
        const hiddenInput = document.getElementById('select-destino-morador');
        const containerResultados = document.getElementById('v_destino_results');
        if (!input || !containerResultados) return;

        try {
            const res = await fetch('src/bancoDeDados/api_destinos.php');
            const data = await res.json();

            let listaOpcoes = [];
            if (data.proprietarios) {
                data.proprietarios.forEach(p => {
                    listaOpcoes.push({
                        texto: `Proprietário: ${p.nome} - Casa ${p.casa} (${p.rua})`,
                        valor: `Proprietário: ${p.nome} (Casa ${p.casa})`
                    });
                });
            }
            if (data.moradores) {
                data.moradores.forEach(m => {
                    listaOpcoes.push({
                        texto: `Morador: ${m.nome} (${m.parentesco || 'Morador'}) - Casa ${m.casa} (${m.rua})`,
                        valor: `Morador: ${m.nome} (${m.parentesco || 'Morador'}) - Casa ${m.casa}`
                    });
                });
            }

            input.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase().trim();
                containerResultados.innerHTML = '';

                if (val.length < 1) {
                    containerResultados.style.display = 'none';
                    return;
                }

                const filtrados = listaOpcoes.filter(o => o.texto.toLowerCase().includes(val));

                if (filtrados.length > 0) {
                    filtrados.forEach(opt => {
                        const div = document.createElement('div');
                        div.className = 'autocomplete-item';
                        div.textContent = opt.texto;
                        div.onclick = () => {
                            input.value = opt.texto;
                            if (hiddenInput) hiddenInput.value = opt.valor;
                            containerResultados.style.display = 'none';
                        };
                        containerResultados.appendChild(div);
                    });
                    containerResultados.style.display = 'block';
                } else {
                    containerResultados.style.display = 'none';
                }
            });

            document.addEventListener('click', (e) => {
                if (!input.contains(e.target) && !containerResultados.contains(e.target)) {
                    containerResultados.style.display = 'none';
                }
            });
        } catch (e) {
            console.error("Erro ao carregar destinos para autocomplete:", e);
        }
    },

    async buscarAutoPreenchimentoPlaca(placa) {
        if (placa.trim().length < 7) return;

        try {
            const res = await fetch(`src/bancoDeDados/api_visitantes.php?buscar_placa=${encodeURIComponent(placa)}`);
            const dados = await res.json();

            if (dados && dados.encontrado !== false) {
                if (dados.v_nome) document.getElementById('v_nome').value = dados.v_nome;
                if (dados.v_tipo_doc) document.getElementById('v_tipo_doc').value = dados.v_tipo_doc;
                if (dados.v_numero_doc) document.getElementById('v_numero_doc').value = dados.v_numero_doc;
                if (dados.v_data_nascimento) document.getElementById('v_data_nascimento').value = dados.v_data_nascimento;
                if (dados.modelo) document.getElementById('v_modelo').value = dados.modelo;
                if (dados.cor) document.getElementById('v_cor').value = dados.cor;
                if (dados.tipo_placa) document.getElementById('v_tipo_placa').value = dados.tipo_placa;
                if (dados.casa_destino) {
                    document.getElementById('select-destino-morador').value = dados.casa_destino;
                    const inputDestino = document.getElementById('v_destino_input');
                    if (inputDestino) inputDestino.value = dados.casa_destino;
                }
                if (dados.observacao) document.getElementById('v_observacao').value = dados.observacao;
            }
        } catch (e) {
            console.error("Erro no autopreenchimento por placa:", e);
        }
    },

    async carregarSelectRuas(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        try {
            const res = await fetch('src/bancoDeDados/api_condominio.php');
            const data = await res.json();
            select.innerHTML = '<option value="">Selecione a Rua...</option>';
            if (data.ruas && data.ruas.length > 0) {
                data.ruas.forEach(r => {
                    select.innerHTML += `<option value="${r.nome}" data-rua-id="${r.id}">${r.nome}</option>`;
                });
            } else {
                select.innerHTML = '<option value="">Nenhuma rua cadastrada</option>';
            }
        } catch (e) {
            console.error("Erro ao carregar ruas", e);
        }
    },

    configurarEventoTrocaRua(idSelectRua, idSelectCasa) {
        const selectRua = document.getElementById(idSelectRua);
        const selectCasa = document.getElementById(idSelectCasa);
        if (!selectRua || !selectCasa) return;

        selectRua.addEventListener('change', async (e) => {
            const optionSelecionada = e.target.options[e.target.selectedIndex];
            const ruaId = optionSelecionada ? optionSelecionada.getAttribute('data-rua-id') : null;

            if (!ruaId) {
                selectCasa.innerHTML = '<option value="">Selecione primeiro a Rua...</option>';
                return;
            }

            selectCasa.innerHTML = '<option value="">A carregar casas...</option>';

            try {
                const res = await fetch('src/bancoDeDados/api_condominio.php');
                const data = await res.json();

                const casasDaRua = data.casas ? data.casas.filter(c => c.rua_id == ruaId) : [];

                selectCasa.innerHTML = '<option value="">Selecione a Casa...</option>';
                if (casasDaRua.length > 0) {
                    casasDaRua.forEach(c => {
                        selectCasa.innerHTML += `<option value="${c.numero_casa}">${c.numero_casa}</option>`;
                    });
                } else {
                    selectCasa.innerHTML = '<option value="">Nenhuma casa cadastrada nesta rua</option>';
                }
            } catch (err) {
                console.error("Erro ao carregar casas", err);
                selectCasa.innerHTML = '<option value="">Erro ao carregar casas</option>';
            }
        });
    },

    adicionarCampoVeiculo() {
        const container = document.getElementById('container-veiculos');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'veiculo-item';
        div.style = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;';
        div.innerHTML = `
            <input type="text" class="v_modelo" placeholder="Modelo" autocomplete="off">
            <input type="text" class="v_cor" placeholder="Cor" autocomplete="off">
            <select class="v_tipo_placa">
                <option value="ANTIGA">Antiga (ABC-1234)</option>
                <option value="MERCOSUL">Mercosul (ABC1A23)</option>
            </select>
            <input type="text" class="v_placa" placeholder="Placa" oninput="Validation.aplicarMascaraPlaca(this)" autocomplete="off">
        `;
        container.appendChild(div);
    },

    adicionarCampoVeiculoMorador() {
        const container = document.getElementById('container-veiculos-morador');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'veiculo-item-m';
        div.style = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;';
        div.innerHTML = `
            <input type="text" class="vm_modelo" placeholder="Modelo" autocomplete="off">
            <input type="text" class="vm_cor" placeholder="Cor" autocomplete="off">
            <select class="vm_tipo_placa">
                <option value="ANTIGA">Antiga (ABC-1234)</option>
                <option value="MERCOSUL">Mercosul (ABC1A23)</option>
            </select>
            <input type="text" class="vm_placa" placeholder="Placa" oninput="Validation.aplicarMascaraPlaca(this)" autocomplete="off">
        `;
        container.appendChild(div);
    },

    adicionarCampoMoradorDep() {
        const container = document.getElementById('container-moradores-dep');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'morador-dep-item';
        div.style = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;';
        div.innerHTML = `
            <input type="text" class="md_nome" placeholder="Nome Completo" autocomplete="off">
            <select class="md_parentesco">
                <option value="Dono">Dono</option>
                <option value="Conjuge">Cônjuge</option>
                <option value="Filho(a)">Filho(a)</option>
                <option value="Parente">Parente</option>
                <option value="Inquilino">Inquilino</option>
                <option value="Outros">Outros</option>
            </select>
            <select class="md_tipo_doc">
                <option value="CPF">CPF</option>
                <option value="RG">RG</option>
            </select>
            <input type="text" class="md_num_doc" placeholder="Documento" autocomplete="off">
            <input type="date" class="md_data_nasc">
            <button type="button" onclick="this.closest('.morador-dep-item').remove()" class="btn-action" style="background:#fee2e2; color:#991b1b; padding: 0.5rem 0.75rem; border:none; cursor:pointer;" title="Remover">🗑️</button>
        `;
        container.appendChild(div);
    },

    adicionarCampoMoradorDepMorador() {
        const container = document.getElementById('container-moradores-dep-m');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'morador-dep-item-m';
        div.style = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;';
        div.innerHTML = `
            <input type="text" class="mdm_nome" placeholder="Nome Completo" autocomplete="off">
            <select class="mdm_parentesco">
                <option value="Dono">Dono</option>
                <option value="Conjuge">Cônjuge</option>
                <option value="Filho(a)">Filho(a)</option>
                <option value="Parente">Parente</option>
                <option value="Inquilino">Inquilino</option>
                <option value="Outros">Outros</option>
            </select>
            <select class="mdm_tipo_doc">
                <option value="CPF">CPF</option>
                <option value="RG">RG</option>
            </select>
            <input type="text" class="mdm_num_doc" placeholder="Documento" autocomplete="off">
            <input type="date" class="mdm_data_nasc">
            <button type="button" onclick="this.closest('.morador-dep-item-m').remove()" class="btn-action" style="background:#fee2e2; color:#991b1b; padding: 0.5rem 0.75rem; border:none; cursor:pointer;" title="Remover">🗑️</button>
        `;
        container.appendChild(div);
    },

    async salvarProprietario(event) {
        event.preventDefault();
        const veiculos = [];
        document.querySelectorAll('.veiculo-item').forEach(item => {
            const modelo = item.querySelector('.v_modelo').value;
            const cor = item.querySelector('.v_cor').value;
            const tipo_placa = item.querySelector('.v_tipo_placa').value;
            const placa = item.querySelector('.v_placa').value;
            if (modelo && placa) veiculos.push({ modelo, cor, tipo_placa, placa });
        });

        const moradores = [];
        document.querySelectorAll('.morador-dep-item').forEach(item => {
            const nome = item.querySelector('.md_nome').value;
            const parentesco = item.querySelector('.md_parentesco').value;
            const tipo_doc = item.querySelector('.md_tipo_doc').value;
            const numero_doc = item.querySelector('.md_num_doc').value;
            const data_nascimento = item.querySelector('.md_data_nasc').value;
            if (nome && numero_doc) moradores.push({ nome, parentesco, tipo_doc, numero_doc, data_nascimento });
        });

        const dados = {
            nome: document.getElementById('p_nome').value,
            tipo_doc: document.getElementById('p_tipo_doc').value,
            numero_doc: document.getElementById('p_numero_doc').value,
            data_nascimento: document.getElementById('p_data_nascimento').value,
            rua: document.getElementById('p_rua').value,
            casa: document.getElementById('p_casa').value,
            veiculos: veiculos,
            moradores: moradores
        };

        try {
            const res = await fetch('src/bancoDeDados/api_proprietarios.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const respJson = await res.json();
            alert(respJson.mensagem || respJson.erro || 'Proprietário cadastrado com sucesso!');
            if (respJson.sucesso) {
                const formEl = event.target.closest('form') || document.querySelector('form');
                if (formEl) formEl.reset();
                this.carregarListaProprietarios();
            }
        } catch (e) {
            console.error("Erro ao salvar proprietário:", e);
            alert('Erro ao conectar com o servidor.');
        }
    },

    async salvarMorador(event) {
        event.preventDefault();
        const veiculos = [];
        document.querySelectorAll('.veiculo-item-m').forEach(item => {
            const modelo = item.querySelector('.vm_modelo').value;
            const cor = item.querySelector('.vm_cor').value;
            const tipo_placa = item.querySelector('.vm_tipo_placa').value;
            const placa = item.querySelector('.vm_placa').value;
            if (modelo && placa) veiculos.push({ modelo, cor, tipo_placa, placa });
        });

        const moradoresAdicionais = [];
        document.querySelectorAll('.morador-dep-item-m').forEach(item => {
            const nome = item.querySelector('.mdm_nome').value;
            const parentesco = item.querySelector('.mdm_parentesco').value;
            const tipo_doc = item.querySelector('.mdm_tipo_doc').value;
            const numero_doc = item.querySelector('.mdm_num_doc').value;
            const data_nascimento = item.querySelector('.mdm_data_nasc').value;
            if (nome && numero_doc) moradoresAdicionais.push({ nome, parentesco, tipo_doc, numero_doc, data_nascimento });
        });

        const selectRua = document.getElementById('m_rua');
        const selectCasa = document.getElementById('m_casa');

        const dados = {
            proprietario_id: document.getElementById('select-proprietario-ref').value,
            nome: document.getElementById('m_nome').value,
            parentesco: document.getElementById('m_parentesco').value,
            tipo_doc: document.getElementById('m_tipo_doc').value,
            numero_doc: document.getElementById('m_numero_doc').value,
            data_nascimento: document.getElementById('m_data_nascimento').value,
            rua: selectRua.value,
            casa: selectCasa.value,
            veiculos: veiculos,
            moradores: moradoresAdicionais
        };

        try {
            const res = await fetch('src/bancoDeDados/api_moradores.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const respJson = await res.json();
            alert(respJson.mensagem || respJson.erro || 'Morador cadastrado com sucesso!');
            if (respJson.sucesso) {
                const formEl = event.target.closest('form') || document.querySelector('form');
                if (formEl) formEl.reset();
                selectRua.disabled = false;
                selectCasa.disabled = false;
                this.carregarListaMoradores();
            }
        } catch (e) {
            console.error("Erro ao salvar morador:", e);
            alert('Erro ao conectar com o servidor.');
        }
    },

    async salvarVisitante(event, apenasCadastro = false) {
        event.preventDefault();
        const destinoStr = document.getElementById('select-destino-morador') ? document.getElementById('select-destino-morador').value : 'Geral';
        const dataHoraInput = document.getElementById('v_data_hora');
        const dataNascInput = document.getElementById('v_data_nascimento');

        const dados = {
            data_hora: dataHoraInput && dataHoraInput.value ? dataHoraInput.value : null,
            casa_destino: destinoStr,
            nome: document.getElementById('v_nome') ? document.getElementById('v_nome').value : '',
            tipo_doc: document.getElementById('v_tipo_doc') ? document.getElementById('v_tipo_doc').value : 'CPF',
            numero_doc: document.getElementById('v_numero_doc') ? document.getElementById('v_numero_doc').value : '',
            data_nascimento: dataNascInput && dataNascInput.value ? dataNascInput.value : null,
            observacao: document.getElementById('v_observacao') ? document.getElementById('v_observacao').value : '',
            placa: document.getElementById('v_placa') ? document.getElementById('v_placa').value : '',
            modelo: document.getElementById('v_modelo') ? document.getElementById('v_modelo').value : '',
            cor: document.getElementById('v_cor') ? document.getElementById('v_cor').value : '',
            tipo_placa: document.getElementById('v_tipo_placa') ? document.getElementById('v_tipo_placa').value : 'ANTIGA',
            frequente: apenasCadastro ? 1 : 0,
            apenas_cadastro: apenasCadastro ? 1 : 0
        };

        try {
            const res = await fetch('src/bancoDeDados/api_visitantes.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const respJson = await res.json();

            if (!res.ok || respJson.erro) {
                alert('Erro no Servidor: ' + (respJson.erro || 'Desconhecido'));
                console.error("Erro da API de visitantes:", respJson);
                return;
            }

            alert(respJson.mensagem || 'Operação realizada com sucesso!');
            if (respJson.sucesso) {
                const formEl = event.target.closest('form') || document.querySelector('form');
                if (formEl) formEl.reset();

                if (typeof this.definirDataHoraAtualVisitante === 'function') {
                    this.definirDataHoraAtualVisitante();
                }
                if (!apenasCadastro) {
                    app.navigate('home');
                }
            }
        } catch (e) {
            console.error("Erro de rede ao salvar visitante:", e);
            alert('Erro ao conectar com o servidor. Verifique o console para mais detalhes.');
        }
    },

    async carregarListaVisitantesFrequentes() {
        const container = document.getElementById('container-grid-visitantes-frequentes');
        if (!container) return;
        const res = await fetch('src/bancoDeDados/api_visitantes.php');
        const lista = await res.json();
        container.innerHTML = '';
        if (lista.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Nenhum visitante frequente cadastrado.</p>';
            return;
        }
        lista.forEach(v => {
            container.innerHTML += `
                <div class="card">
                    <div style="display: flex; justify-content: space-between;"><h4 style="margin:0;">${v.nome}</h4><span class="badge badge-concluido">Frequente</span></div>
                    <p style="font-size:0.9rem; color:var(--text-secondary); margin-top:0.5rem;">Doc: ${v.tipo_doc} - ${v.numero_doc}</p>
                    ${v.data_nascimento ? `<p style="font-size:0.85rem; color:var(--text-secondary);">Nasc: ${v.data_nascimento.split('-').reverse().join('/')}</p>` : ''}
                    <button onclick="UI.abrirTimeline('VISITANTE', ${v.id}, '${v.nome}')" class="btn-action" style="margin-top:0.75rem; width:100%; background:#e2e8f0; color:var(--text-primary); font-size:0.85rem; padding:0.4rem;">📊 Ver Histórico / Timeline</button>
                </div>
            `;
        });
    },

    async carregarSelectProprietarios() {
        const select = document.getElementById('select-proprietario-ref');
        if (!select) return;
        const res = await fetch('src/bancoDeDados/api_proprietarios.php');
        const lista = await res.json();
        select.innerHTML = '<option value="">Nenhum / Morador Independente</option>';
        lista.forEach(p => {
            select.innerHTML += `<option value="${p.id}" data-rua="${p.rua}" data-casa="${p.casa}">${p.id} - ${p.nome} (Casa ${p.casa})</option>`;
        });

        select.removeEventListener('change', window._proprietarioChangeHandler);
        window._proprietarioChangeHandler = async (e) => {
            const opt = e.target.options[e.target.selectedIndex];
            const rua = opt.getAttribute('data-rua');
            const casa = opt.getAttribute('data-casa');

            const selectRua = document.getElementById('m_rua');
            const selectCasa = document.getElementById('m_casa');

            if (rua && casa) {
                selectRua.value = rua;
                selectRua.dispatchEvent(new Event('change'));

                setTimeout(() => {
                    selectCasa.value = casa;
                    selectCasa.disabled = true;
                }, 250);
                selectRua.disabled = true;
            } else {
                selectRua.disabled = false;
                selectCasa.disabled = false;
                selectRua.value = '';
                selectCasa.innerHTML = '<option value="">Selecione primeiro a Rua...</option>';
            }
        };
        select.addEventListener('change', window._proprietarioChangeHandler);
    },

    async carregarListaProprietarios() {
        const container = document.getElementById('container-grid-proprietarios');
        if (!container) return;
        const res = await fetch('src/bancoDeDados/api_proprietarios.php');
        const lista = await res.json();
        container.innerHTML = '';
        lista.forEach(p => {
            container.innerHTML += `
                <div class="card">
                    <div style="display: flex; justify-content: space-between;"><h4 style="margin:0;">${p.nome}</h4><span class="badge badge-concluido">Ativo</span></div>
                    <p style="font-size:0.9rem; color:var(--text-secondary); margin-top:0.5rem;">${p.rua}, Casa ${p.casa}</p>
                    <p style="font-size:0.9rem; margin-top:0.25rem;">Doc: ${p.numero_doc}</p>
                    <p style="font-size:0.85rem; color:var(--text-secondary);">Nasc: ${p.data_nascimento ? p.data_nascimento.split('-').reverse().join('/') : '-'}</p>
                    <button onclick="UI.abrirTimeline('PROPRIETARIO', ${p.id}, '${p.nome}')" class="btn-action" style="margin-top:0.75rem; width:100%; background:#e2e8f0; color:var(--text-primary); font-size:0.85rem; padding:0.4rem;">📊 Ver Histórico / Timeline</button>
                </div>
            `;
        });
    },

    async carregarListaMoradores() {
        const container = document.getElementById('container-grid-moradores');
        if (!container) return;
        const res = await fetch('src/bancoDeDados/api_moradores.php');
        const lista = await res.json();
        container.innerHTML = '';
        lista.forEach(m => {
            container.innerHTML += `
                <div class="card">
                    <div style="display: flex; justify-content: space-between;"><h4 style="margin:0;">${m.nome}</h4><span class="badge badge-concluido">${m.parentesco || 'Morador'}</span></div>
                    <p style="font-size:0.9rem; color:var(--text-secondary); margin-top:0.5rem;">Responsável: ${m.proprietario_nome || 'Independente'} (${m.rua}, Casa ${m.casa})</p>
                    <p style="font-size:0.9rem; margin-top:0.25rem;">Doc: ${m.numero_doc}</p>
                    <p style="font-size:0.85rem; color:var(--text-secondary);">Nasc: ${m.data_nascimento ? m.data_nascimento.split('-').reverse().join('/') : '-'}</p>
                    <button onclick="UI.abrirTimeline('MORADOR', ${m.id}, '${m.nome}')" class="btn-action" style="margin-top:0.75rem; width:100%; background:#e2e8f0; color:var(--text-primary); font-size:0.85rem; padding:0.4rem;">📊 Ver Histórico / Timeline</button>
                </div>
            `;
        });
    },

    initDashboardCharts() {
        const ctx = document.getElementById('movimentacaoChart');
        if (!ctx) return;

        fetch('src/bancoDeDados/api_dashboard.php')
            .then(res => res.json())
            .then(dados => {
                if (window.meuGrafico instanceof Chart) {
                    window.meuGrafico.destroy();
                }

                window.meuGrafico = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Proprietários', 'Moradores', 'Visitantes'],
                        datasets: [
                            { label: 'Entradas Ativas', data: [dados.proprietarios.entradas, dados.moradores.entradas, dados.visitantes.entradas], backgroundColor: '#2563eb', borderRadius: 6 },
                            { label: 'Saídas Concluídas', data: [dados.proprietarios.saidas, dados.moradores.saidas, dados.visitantes.saidas], backgroundColor: '#10b981', borderRadius: 6 }
                        ]
                    },
                    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
                });
            });
    },

    async abrirTimeline(tipo, id, nomePessoa) {
        const modal = document.getElementById('modal-timeline');
        const titulo = document.getElementById('modal-timeline-titulo');
        const conteudo = document.getElementById('modal-timeline-conteudo');

        if (!modal) return;

        titulo.textContent = `Timeline de Acessos: ${nomePessoa}`;
        conteudo.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">A carregar histórico...</p>';
        modal.style.display = 'flex';

        try {
            const res = await fetch(`src/bancoDeDados/api_historico.php?tipo=${tipo}&id=${id}`);
            const historico = await res.json();

            conteudo.innerHTML = '';

            if (!historico || historico.length === 0) {
                conteudo.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Nenhum registo de acesso encontrado para esta pessoa.</p>';
                return;
            }

            let html = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';
            historico.forEach(item => {
                const isPendente = item.status_visitante === 'PENDENTE';

                html += `
                    <div style="border: 1px solid var(--border); border-radius: 8px; padding: 0.85rem; background: #ffffff; box-shadow: var(--shadow);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                            <span class="badge-tipo">${item.liberacao}</span>
                            <span class="badge ${isPendente ? 'badge-pendente' : 'badge-concluido'}">${item.status_visitante}</span>
                        </div>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.2rem 0;">🕒 Entrou: ${this.formatarDataHora(item.data_hora_entrada)}</p>
                        ${item.data_hora_saida ? `<p style="font-size: 0.85rem; color: var(--success); margin: 0.2rem 0;">🕒 Saiu: ${this.formatarDataHora(item.data_hora_saida)}</p>` : ''}
                        <p style="font-size: 0.85rem; margin: 0.3rem 0 0 0;">📍 <strong>Destino:</strong> ${item.rua_destino || 'Principal'}, ${item.casa_destino || 'Geral'}</p>
                        ${item.v_placa ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0;">🚗 Veículo: ${item.modelo || ''} (${item.v_placa})</p>` : ''}
                        ${item.observacao ? `<p style="font-size: 0.8rem; font-style: italic; color: var(--text-secondary); margin-top: 0.3rem;">Obs: "${item.observacao}"</p>` : ''}
                    </div>
                `;
            });
            html += '</div>';
            conteudo.innerHTML = html;

        } catch (e) {
            console.error("Erro ao carregar histórico:", e);
            conteudo.innerHTML = '<p style="text-align: center; color: #dc2626; padding: 2rem;">Erro ao carregar o histórico de acessos.</p>';
        }
    },

    fecharModalTimeline() {
        const modal = document.getElementById('modal-timeline');
        if (modal) modal.style.display = 'none';
    }
};