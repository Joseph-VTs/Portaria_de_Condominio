const DB = {
    // Carregar dados
    obterDados(tabela) {
        return JSON.parse(localStorage.getItem(`portaria_${tabela}`)) || [];
    },

    // Guardar dados
    guardarDados(tabela, dados) {
        localStorage.setItem(`portaria_${tabela}`, JSON.stringify(dados));
    },

    // Adicionar registo com ID auto-incremento
    inserir(tabela, registo) {
        const itens = this.obterDados(tabela);
        registo.id = Date.now(); // ID único baseado em timestamp
        registo.criado_em = new Date().toISOString();
        itens.push(registo);
        this.guardarDados(tabela, itens);
        return registo;
    },

    // Dados de exemplo iniciais para testes fluidos
    inicializarMock() {
        if (!localStorage.getItem('portaria_proprietarios')) {
            this.guardarDados('proprietarios', [
                { id: 1, nome: 'José Teodoro', tipo_doc: 'CPF', numero_doc: '123.123.123-00', data_nascimento: '1980-05-12', rua: 'Rua Bela Vista', casa: 'A-30', ativo: true },
                { id: 2, nome: 'Mariana Souza', tipo_doc: 'CPF', numero_doc: '321.321.321-11', data_nascimento: '1985-09-20', rua: 'Rua Bela Vista', casa: 'B-12', ativo: true }
            ]);
        }
        if (!localStorage.getItem('portaria_moradores')) {
            this.guardarDados('moradores', [
                { id: 1, proprietario_id: 1, nome: 'Antonio Elias', tipo_doc: 'CPF', numero_doc: '456.456.456-22', data_nascimento: '2000-02-15', ativo: true }
            ]);
        }
        if (!localStorage.getItem('portaria_acessos')) {
            this.guardarDados('acessos', [
                { id: 1, tipo_pessoa: 'VISITANTE', nome: 'Carlos Silva', doc: '789.789.789-33', veiculo: 'Sandero (Prata) - ABC-1234', destino: 'Rua Bela Vista, Casa A-30 (Antonio Elias)', observacao: 'Vai visitar seu pai', status: 'PENDENTE', data_hora: '2026-10-22 14:30', porteiro: 'Celso Padilha', liberacao: 'CANCELA_MANUAL' },
                { id: 2, tipo_pessoa: 'PROPRIETARIO', nome: 'José Teodoro', doc: '123.123.123-00', veiculo: 'Siena (Vermelha) - ABC1C23', destino: 'Residência Própria', observacao: 'Entrada Principal', status: 'CONCLUIDO', data_hora: '2026-10-22 08:15', porteiro: 'Celso Padilha', liberacao: 'PORTAO_AUTOMATICO' }
            ]);
        }
    }
};

DB.inicializarMock();