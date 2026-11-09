function mudarDeTela(nomeTela){
    const telas = document.querySelectorAll('.tela')

    telas.forEach(tela => {
        tela.style.display = 'none'
    })

    const telaAtiva = document.getElementById(`tela-${nomeTela}`)
    if(telaAtiva){
        telaAtiva.style.display = 'block';
    }
}