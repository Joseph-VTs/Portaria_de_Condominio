Portaria/
├── index.html
├── README.md
├── .gitignore
└── src/
    ├── bancoDeDados/
    │   └── schema.sql
    ├── css/
    │   └── styles.css
    ├── paginas/
    │   ├── home.html
    │   ├── dashboard.html
    │   ├── proprietarios.html
    │   ├── moradores.html
    │   └── visitantes.html
    └── scripts/
        ├── app.js
        ├── db.js
        ├── ui.js
        └── validation.js










# 🏢 Sistema de Portaria de Condomínio

Sistema web responsivo desenvolvido para gestão centralizada de controlo de acessos (Proprietários, Moradores e Visitantes) com painel interativo para portaria.

## 🚀 Funcionalidades
- **SPA (Single Page Application)**: Navegação rápida sem recarregamento de página.
- **Controlo Visual de Visitantes**: Transição interativa com acções no hover para registar saídas de visitantes pendentes.
- **Validação Inteligente**: Validação de placas antigas (ABC-1234) e padrão Mercosul (ABC1C23).
- **Dashboard Estatístico**: Análise de movimentação por períodos com gráficos dinâmicos.

## 🛠️ Tecnologias
- HTML5, CSS3 (Grid e Flexbox)
- JavaScript ES6+ (Modular)
- Chart.js (Visualização de dados)
- MySQL / PostgreSQL (Persistência)

## 🗄️ Configuração do Banco de Dados
1. Execute o script contido em `src/bancoDeDados/schema.sql` no seu SGBD de preferência (ex: XAMPP / MariaDB).
2. Configure a ligação no seu serviço backend.