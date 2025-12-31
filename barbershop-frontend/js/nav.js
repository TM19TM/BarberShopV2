// Script para /js/nav.js
// Versão simplificada para evitar erros de carregamento

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Menu Mobile ---
    const btnMobile = document.getElementById('btn-mobile');
    const nav = document.getElementById('nav');

    if (btnMobile && nav) {
        function toggleMenu(event) {
            if (event.type === 'touchstart') event.preventDefault();
            nav.classList.toggle('active');
            const active = nav.classList.contains('active');
            event.currentTarget.setAttribute('aria-expanded', active);
        }

        btnMobile.addEventListener('click', toggleMenu);
        btnMobile.addEventListener('touchstart', toggleMenu);
    }

    // --- 2. Logout ---
    const btnSair = document.getElementById('btn-sair'); // Certifique-se que o botão de sair tem este ID no HTML
    // Se o seu botão de sair for gerado dinamicamente, este código não vai funcionar.
    // Mas no seu HTML atual, o botão Sair parece fazer parte do menu fixo.
    if (btnSair) {
        btnSair.addEventListener('click', (e) => {
            e.preventDefault();
            if(confirm("Deseja realmente sair?")) {
                localStorage.clear();
                window.location.href = 'BarberLOGIN.html';
            }
        });
    }

    // --- 3. Verificar Autenticação ---
    const token = localStorage.getItem('barberToken');
    const paginasPublicas = ['BarberLOGIN.html', 'index.html', 'BarberRESET.html'];
    const path = window.location.pathname;
    const paginaAtual = path.substring(path.lastIndexOf('/') + 1);

    if (!token && !paginasPublicas.includes(paginaAtual)) {
        console.warn("Sem token, redirecionando...");
        window.location.href = 'BarberLOGIN.html';
    }
    
    // --- 4. Mostrar Nome do Usuário (Opcional) ---
    const nomeUsuario = localStorage.getItem('barberUserNome');
    const userElement = document.querySelector('.user-name strong'); // Ajuste o seletor conforme seu HTML
    if (userElement && nomeUsuario) {
        userElement.textContent = nomeUsuario.split(' ')[0];
    }
});