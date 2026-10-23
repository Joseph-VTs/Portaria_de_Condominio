const Validation = {
    verificarPlaca(inputElement) {
        const valor = inputElement.value.trim().toUpperCase();
        const regexAntiga = /^[A-Z]{3}-\d{4}$/;
        const regexMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/;

        if (regexAntiga.test(valor) || regexMercosul.test(valor)) {
            inputElement.style.borderColor = 'var(--success)';
            return true;
        } else {
            inputElement.style.borderColor = 'var(--danger)';
            return false;
        }
    },

    aplicarMascaraPlaca(input) {
        let v = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (v.length > 7) v = v.substring(0, 7);
        
        // Formatação automática subtil para o modelo antigo se aplicável
        if (v.length > 3 && !v.includes('-') && /^[A-Z]{3}\d/.test(v)) {
            if (!isNaN(v.charAt(4))) {
                v = v.slice(0, 3) + '-' + v.slice(3);
            }
        }
        input.value = v;
        this.verificarPlaca(input);
    }
};