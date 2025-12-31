document.addEventListener('DOMContentLoaded', () => {
    const btnEntrar = document.getElementById('btnEntrar');

    btnEntrar.addEventListener('click', () => {
        // Agora precisamos entrar na pasta html para achar o login
        window.location.href = 'html/BarberLOGIN.html';
    });
});