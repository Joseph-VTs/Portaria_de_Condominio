const UI = {
    async initPageScript(route) {
        switch (route) {
            case 'home':
                await this.carregarAcessosHome('todos');
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
                await this.carregarSelectDestinos();
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

    definirDataHoraAtualVisitante() {
        const input = document.getElementById('v_data_hora');
        if (!input) return;
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        input.value = now.toISOString().slice(0, 16);
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
                if (dados.casa_destino) document.getElementById('select-destino-morador').value = dados.casa_destino;
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
                event.target.reset();
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
                event.target.reset();
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
                // Emendatio: Invenire formam proximam ut methodus reset() recte vocetur
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
                    <div style="display: flex; justify-content: space-between;"><h4 style="margin:0;">${v.nome}</h4><span class="tag-ativo" style="background:#d1fae5; color:#065f46;">Frequente</span></div>
                    <p style="font-size:0.9rem; color:var(--text-secondary); margin-top:0.5rem;">Doc: ${v.tipo_doc} - ${v.numero_doc}</p>
                    ${v.data_nascimento ? `<p style="font-size:0.85rem; color:var(--text-secondary);">Nasc: ${v.data_nascimento.split('-').reverse().join('/')}</p>` : ''}
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

    async carregarSelectDestinos() {
        const select = document.getElementById('select-destino-morador');
        if (!select) return;

        const res = await fetch('src/bancoDeDados/api_destinos.php');
        const data = await res.json();

        select.innerHTML = '<option value="">Selecione o destino (Proprietário ou Morador)...</option>';

        if (data.ruas && data.ruas.length > 0) {
            data.ruas.forEach(r => {
                let optgroup = document.createElement('optgroup');
                optgroup.label = `📍 ${r.nome}`;

                let temMembros = false;

                if (data.proprietarios) {
                    data.proprietarios.filter(p => p.rua === r.nome).forEach(p => {
                        temMembros = true;
                        let option = document.createElement('option');
                        option.value = `Proprietário: ${p.nome} (Casa ${p.casa})`;
                        option.textContent = `Proprietário: ${p.nome} - Casa ${p.casa}`;
                        optgroup.appendChild(option);
                    });
                }

                if (data.moradores) {
                    data.moradores.filter(m => m.rua === r.nome).forEach(m => {
                        temMembros = true;
                        let option = document.createElement('option');
                        option.value = `Morador: ${m.nome} (${m.parentesco || 'Morador'}) - Casa ${m.casa}`;
                        option.textContent = `Morador: ${m.nome} (${m.parentesco || 'Morador'}) - Casa ${m.casa}`;
                        optgroup.appendChild(option);
                    });
                }

                if (!temMembros) {
                    let option = document.createElement('option');
                    option.disabled = true;
                    option.textContent = `Nenhum registo nesta rua`;
                    optgroup.appendChild(option);
                }

                select.appendChild(optgroup);
            });
        }
    },

    async carregarAcessosHome(statusFiltro) {
        await this.filtrarAcessos(null, statusFiltro);
    },

    async renderHomeCards(status) {
        let filtroApi = 'todos';
        if (status === 'pendente') filtroApi = 'pendente';
        if (status === 'concluido') filtroApi = 'concluido';
        await this.carregarAcessosHome(filtroApi);
    },

    async filtrarAcessos(tipoLiberacao, status) {
        const container = document.getElementById('home-cards-container');
        if (!container) return;

        let url = 'src/bancoDeDados/api_acessos.php?hoje=1';
        let params = [];
        if (status && status !== 'todos') params.push(`status=${status}`);
        if (tipoLiberacao) params.push(`liberacao=${tipoLiberacao}`);
        if (params.length > 0) url += '&' + params.join('&');

        const res = await fetch(url);
        const acessos = await res.json();

        container.innerHTML = '';
        if (acessos.length === 0) {
            container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Nenhum registo encontrado para o dia de hoje.</p>`;
            return;
        }

        acessos.forEach(item => {
            const card = document.createElement('div');
            card.className = `card ${item.status_visitante === 'PENDENTE' ? 'card-visitante' : ''}`;
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--accent);">LIBERAÇÃO: ${item.liberacao}</span>
                    <span class="tag-ativo" style="background: ${item.status_visitante === 'PENDENTE' ? '#fef3c7' : '#d1fae5'}; color: ${item.status_visitante === 'PENDENTE' ? '#92400e' : '#065f46'};">${item.status_visitante}</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">🕒 Entrou: ${item.data_hora_entrada}</p>
                ${item.data_hora_saida ? `<p style="font-size: 0.85rem; color: var(--success); margin-bottom: 0.5rem;">🕒 Saiu: ${item.data_hora_saida}</p>` : ''}
                
                <h3 style="font-size: 1.1rem; margin-bottom: 0.25rem;">Registo de Acesso</h3>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">📍 <strong>Destino:</strong> ${item.rua_destino}, ${item.casa_destino}</p>
                ${item.observacao ? `<p style="font-size: 0.85rem; font-style: italic; color: var(--text-secondary); margin-top: 0.5rem;">Obs: "${item.observacao}"</p>` : ''}
                
                ${item.status_visitante === 'PENDENTE' ? `
                    <div class="card-overlay">
                        <button class="btn-action btn-success" onclick="UI.marcarSaida(${item.id})">Marcar Saída</button>
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

    async carregarCondominio() {
        const select = document.getElementById('casa_rua_id');
        if (!select) return;
        const res = await fetch('src/bancoDeDados/api_condominio.php');
        const data = await res.json();
        select.innerHTML = '<option value="">Selecione a Rua...</option>';
        if (data.ruas) {
            data.ruas.forEach(r => {
                select.innerHTML += `<option value="${r.id}">${r.nome}</option>`;
            });
        }
    },

    async salvarRua(event) {
        event.preventDefault();
        const nome = document.getElementById('rua_nome').value;
        try {
            const res = await fetch('src/bancoDeDados/api_condominio.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acao: 'salvar_rua', nome })
            });
            const resp = await res.json();

            alert(resp.mensagem || resp.erro || 'Rua salva com sucesso!');

            if (resp.sucesso) {
                event.target.reset();
                this.carregarCondominio();
            }
        } catch (e) {
            console.error("Erro ao salvar rua:", e);
            alert('Erro de comunicação com o servidor.');
        }
    },

    async salvarCasa(event) {
        event.preventDefault();
        const rua_id = document.getElementById('casa_rua_id').value;
        const numero_casa = document.getElementById('casa_numero').value;
        try {
            const res = await fetch('src/bancoDeDados/api_condominio.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acao: 'salvar_casa', rua_id, numero_casa })
            });
            const resp = await res.json();

            alert(resp.mensagem || resp.erro || 'Casa salva com sucesso!');

            if (resp.sucesso) {
                event.target.reset();
            }
        } catch (e) {
            console.error("Erro ao salvar casa:", e);
            alert('Erro de comunicação com o servidor.');
        }
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
                    <div style="display: flex; justify-content: space-between;"><h4 style="margin:0;">${p.nome}</h4><span class="tag-ativo">Ativo</span></div>
                    <p style="font-size:0.9rem; color:var(--text-secondary); margin-top:0.5rem;">${p.rua}, Casa ${p.casa}</p>
                    <p style="font-size:0.9rem; margin-top:0.25rem;">Doc: ${p.numero_doc}</p>
                    <p style="font-size:0.85rem; color:var(--text-secondary);">Nasc: ${p.data_nascimento ? p.data_nascimento.split('-').reverse().join('/') : '-'}</p>
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
                    <div style="display: flex; justify-content: space-between;"><h4 style="margin:0;">${m.nome}</h4><span class="tag-ativo">${m.parentesco || 'Morador'}</span></div>
                    <p style="font-size:0.9rem; color:var(--text-secondary); margin-top:0.5rem;">Responsável: ${m.proprietario_nome || 'Independente'} (${m.rua}, Casa ${m.casa})</p>
                    <p style="font-size:0.9rem; margin-top:0.25rem;">Doc: ${m.numero_doc}</p>
                    <p style="font-size:0.85rem; color:var(--text-secondary);">Nasc: ${m.data_nascimento ? m.data_nascimento.split('-').reverse().join('/') : '-'}</p>
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
    }
};