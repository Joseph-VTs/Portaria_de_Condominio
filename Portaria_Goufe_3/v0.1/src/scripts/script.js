// Ler o input básico
const campoNome = document.getElementById('name');
const nomeDigitado = campoNome.value
console.log(nomeDigitado)

// Quando tiver mais de 5 campos
const formulario = document.getElementById('meuForm')

formulario.addEventListener('submit', async function (event) {
    event.preventDefault()

    // Scanear o Formulário
    const scanner = new FormData(formulario)

    // Tranformar os itens em um objeto JS
    const dadosProntos = Object.fromEntries(scanner)

    // console.log(dadosProntos)

    const resposta = await fetch('http://localhost:3001/salvar', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosProntos)
    })

    if (resposta.ok) {
        alert('Proprietário Cadastrado com Sucesso!')
        formulario.reset()
    } else {
        alert('Erro ao Salvar Cadastro!')
    }
})