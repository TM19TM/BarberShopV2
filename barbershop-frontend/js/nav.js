// Script para /js/nav.js - Gerenciamento Dinâmico da Barra de Navegação

function logout() {
    if (confirm("Tem certeza que deseja sair?")) {
        localStorage.clear();
        // Redireciona para o login que está na mesma pasta /html
        window.location.href = 'BarberLOGIN.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Coleta dados do localStorage
    const token = localStorage.getItem('barberToken');
    let perfil = localStorage.getItem('barberUserProfile');
    const nomeCompleto = localStorage.getItem('barberUserNome') || 'Usuário';

    // 2. Verificação de Segurança
    if (!token) {
        console.warn("nav.js: Usuário não autenticado. Redirecionando...");
        window.location.href = 'BarberLOGIN.html';
        return;
    }

    // Garante que o perfil esteja em letras minúsculas para o switch funcionar
    if (perfil) perfil = perfil.toLowerCase();

    // 3. Lógica de Links Ativos
    const currentPage = window.location.pathname.split('/').pop();
    const isActive = (page) => (currentPage === page) ? 'active' : '';

    // 4. Construção dos Links por Perfil (RBAC)
    let navLinks = '';

    switch (perfil) {
        case 'admin':
            navLinks = `
                <li><a href="BarberDONO.html" class="${isActive('BarberDONO.html')}">Painel Admin</a></li>
                <li><a href="BarberRECEPCIONISTA.html" class="${isActive('BarberRECEPCIONISTA.html')}">Recepção</a></li>
                <li><a href="BarberBARBEIRO.html" class="${isActive('BarberBARBEIRO.html')}">Barbeiro</a></li>
                <li><a href="BarberCLIENTE.html" class="${isActive('BarberCLIENTE.html')}">Cliente</a></li>
            `;
            break;
        case 'recepcionista':
            navLinks = `
                <li><a href="BarberRECEPCIONISTA.html" class="${isActive('BarberRECEPCIONISTA.html')}">Recepção</a></li>
                <li><a href="BarberCLIENTE.html" class="${isActive('BarberCLIENTE.html')}">Cliente</a></li>
            `;
            break;
        case 'barbeiro':
            navLinks = `
                <li><a href="BarberBARBEIRO.html" class="${isActive('BarberBARBEIRO.html')}">Minha Agenda</a></li>
            `;
            break;
        case 'cliente':
            navLinks = `
                <li><a href="BarberCLIENTE.html" class="${isActive('BarberCLIENTE.html')}">Meus Agendamentos</a></li>
            `;
            break;
        default:
            console.error("Perfil desconhecido:", perfil);
            navLinks = `<li><a href="#">Perfil não identificado</a></li>`;
    }

    // 5. HTML da Estrutura
    const navHTML = `
        <a href="#" class="logo">Barber<span>Shop</span></a>
        
        <div class="menu-toggle" id="menu-toggle">
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar de"></div>
        </div>

        <ul class="nav-links" id="nav-links">
            ${navLinks}
        </ul>

        <div class="user-menu">
            <span class="user-name">Olá, <strong>${nomeCompleto.split(' ')[0]}</strong></span>
            <button id="btn-logout-nav">Sair</button>
        </div>
    `;

    // 6. Injeção no DOM
    const headerElement = document.getElementById('main-header');
    if (headerElement) {
        headerElement.innerHTML = navHTML;
        
        // Adiciona eventos aos botões recém-criados
        document.getElementById('btn-logout-nav').addEventListener('click', logout);
        
        const menuToggle = document.getElementById('menu-toggle');
        const navLinksList = document.getElementById('nav-links');
        
        menuToggle.addEventListener('click', () => {
            navLinksList.classList.toggle('active');
        });
    } else {
        console.error("ERRO CRÍTICO: Elemento #main-header não encontrado no HTML.");
    }
});