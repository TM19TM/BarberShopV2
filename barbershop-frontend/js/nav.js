// Script para /js/nav.js
// Este script é carregado em TODAS as páginas de dashboard (Cliente, Barbeiro, etc.)

/**
 * Mostra uma notificação (toast) na tela.
 * @param {string} message - A mensagem para exibir.
 * @param {string} type - 'success' (verde) ou 'error' (vermelho).
 * @param {number} duration - Duração em milissegundos (padrão: 3000).
 */
function showNotification(message, type = 'error', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) return; // Não faz nada se o container não existir

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Anima a entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // Pequeno delay para a animação funcionar

    // Remove a notificação depois do tempo
    setTimeout(() => {
        toast.classList.remove('show');
        
        // Espera a animação de saída terminar para remover o elemento
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }, duration);
}

/**
 * Faz o logout do usuário limpando o localStorage
 */
function logout() {
    if (confirm("Tem certeza que deseja sair?")) {
        localStorage.clear();
        window.location.href = 'BarberLOGIN.html';
    }
}

/**
 * Constrói a barra de navegação baseada no perfil do usuário
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Pega os dados da sessão
    const token = localStorage.getItem('barberToken');
    const perfil = localStorage.getItem('barberUserProfile');
    const nome = localStorage.getItem('barberUserNome') || 'Usuário';

    // 2. Guarda de Segurança: Se não há token, expulsa para o login
    if (!token) {
        // Não mostre alerta aqui, pois as páginas individuais já farão isso.
        // Apenas evitamos construir a nav.
        console.error("nav.js: Token não encontrado, usuário não autenticado.");
        // Se a página JS principal falhar em redirecionar, este é um backup.
        // window.location.href = 'BarberLOGIN.html'; 
        return;
    }

    // 3. Define qual página está ativa
    const currentPage = window.location.pathname.split('/').pop();

    const isActive = (page) => (currentPage === page) ? 'active' : '';

    // 4. Define os links que CADA perfil pode ver
    let navLinks = '';

    switch (perfil) {
        case 'admin':
            navLinks = `
                <li><a href="BarberDONO.html" class="${isActive('BarberDONO.html')}">Admin</a></li>
                <li><a href="BarberRECEPCIONISTA.html" class="${isActive('BarberRECEPCIONISTA.html')}">Recepção</a></li>
                <li><a href="BarberBARBEIRO.html" class="${isActive('BarberBARBEIRO.html')}">Barbeiro</a></li>
                <li><a href="BarberCLIENTE.html" class="${isActive('BarberCLIENTE.html')}">Cliente</a></li>
            `;
            break;
        case 'recepcionista':
            navLinks = `
                <li><a href="BarberRECEPCIONISTA.html" class="${isActive('BarberRECEPCIONISTA.html')}">Recepção</a></li>
                <li><a href="BarberBARBEIRO.html" class="${isActive('BarberBARBEIRO.html')}">Barbeiro</a></li>
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
            navLinks = ''; // Nenhum link se o perfil for desconhecido
    }

    // 5. Cria o HTML completo da Navbar
    const navHTML = `
        <a href="#" class="logo">Barber<span>Shop</span></a>
        
        <div class="menu-toggle" id="menu-toggle">
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
        </div>

        <ul class="nav-links" id="nav-links">
            ${navLinks}
        </ul>

        <div class="user-menu">
            <span class="user-name">Olá, <strong>${nome.split(' ')[0]}</strong></span>
            <button id="btn-logout">Sair</button>
        </div>
    `;

    // 6. Injeta a Navbar no Header
    const header = document.getElementById('main-header');
    if (header) {
        header.innerHTML = navHTML;
    } else {
        console.error("Elemento #main-header não encontrado. A navbar não pode ser injetada.");
        return;
    }

    // 7. Adiciona os Event Listeners DEPOIS de injetar o HTML
    document.getElementById('btn-logout').addEventListener('click', logout);

    // Adiciona funcionalidade ao menu hamburger (mobile)
    const menuToggle = document.getElementById('menu-toggle');
    const navLinksMenu = document.getElementById('nav-links');
    menuToggle.addEventListener('click', () => {
        navLinksMenu.classList.toggle('active');
    });
});