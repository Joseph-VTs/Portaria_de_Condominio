const http = require('http');
const fs = require('fs');
const path = require('path');

// A sua linha perfeita:
const ARQUIVO_JSON = path.join(__dirname, 'src/bancoJson/cadProprietarios.json');

// Comando mágico: Garante que as pastas 'src' e 'bancoJson' existam antes de salvar!
const pastaDoBanco = path.dirname(ARQUIVO_JSON);

const servidor = http.createServer((req, res) => {
    // Libera o acesso para o HTML conversar com o servidor
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // Rota que recebe os dados do formulário
    if (req.method === 'POST' && req.url === '/salvar') {
        let corpo = '';

        req.on('data', chunk => { corpo += chunk; });
        req.on('end', () => {
            const novoDado = JSON.parse(corpo);
            novoDado.id = Date.now(); // Cria um ID único

            // 1. Ler o arquivo existente (se não existir, começa uma lista vazia '[]')
            let listaAnterior = [];
            if (fs.existsSync(ARQUIVO_JSON)) {
                const conteudoDoArquivo = fs.readFileSync(ARQUIVO_JSON, 'utf-8');
                listaAnterior = JSON.parse(conteudoDoArquivo || '[]');
            }

            // 2. Adicionar o novo registro na lista
            listaAnterior.push(novoDado);

            // 3. Gravar de volta no arquivo físico atualizando tudo
            fs.writeFileSync(ARQUIVO_JSON, JSON.stringify(listaAnterior, null, 2));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ mensagem: 'Sucesso!' }));
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

servidor.listen(3001, () => {
    console.log('Servidor rodando! Deixe esta janela aberta.');
    console.log('Abra o seu index.html no navegador e faça um teste.');
});
