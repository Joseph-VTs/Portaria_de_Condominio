const app = {
    currentRoute: 'home',

    init() {
        this.bindEvents();
        this.navigate('home');
    },

    bindEvents() {
        document.querySelectorAll('nav a[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.target.getAttribute('data-route');
                this.navigate(route);
            });
        });
    },

    async navigate(route) {
        this.currentRoute = route;
        
        // Atualizar menu ativo
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        const activeLink = document.querySelector(`nav a[data-route="${route}"]`);
        if (activeLink) activeLink.classList.add('active');

        const container = document.getElementById('app-content');
        
        try {
            const response = await fetch(`src/paginas/${route}.html`);
            if(!response.ok) throw new Error('Página não encontrada');
            const html = await response.text();
            container.innerHTML = html;

            // Inicializar scripts específicos por página
            UI.initPageScript(route);
        } catch (err) {
            container.innerHTML = `<h2>Erro ao carregar vista.</h2>`;
        }
    },

    filtrarStatus(status) {
        if(this.currentRoute !== 'home') {
            this.navigate('home').then(() => UI.renderHomeCards(status));
        } else {
            UI.renderHomeCards(status);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());