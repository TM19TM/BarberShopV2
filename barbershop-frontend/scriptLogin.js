// Script para /js/login.js

// URL Base da API (ajuste se o backend estiver em outro lugar)
const API_URL = 'http://localhost:3000/api';

function mostrarPainel(idDoPainel) {
    // Esconde todos os formulários
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'none';

    // Mostra apenas o formulário solicitado
    document.getElementById(idDoPainel).style.display = 'block';
}

// --- Formulário de cadastro ---
const registerForm = document.getElementById('register-form');
registerForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const nome = document.getElementById('nome-reg').value;
    const telefone = document.getElementById('telefone-reg').value;
    const dataNascimento = document.getElementById('nasc-reg').value;
    const email = document.getElementById('email-reg').value;
    const senha = document.getElementById('senha-reg').value;

    const formData = { nome, telefone, dataNascimento, email, senha };

    try {
        const response = await fetch(`${API_URL}/auth/register`, { // URL ATUALIZADA
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Cadastro finalizado com sucesso! Agora você pode fazer login.');
            mostrarPainel('login-form');
        } else {
            alert('Parece que o seu cadastro teve algum erro:' + result.error);
        }
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        alert('Não foi possivel estabelecer uma comunicação com o servidor. Tente novamente mais tarde.');
    }
});

// --- Formulário de login ---
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email-login').value;
    const senha = document.getElementById('senha-login').value;

    const formData = { email, senha };

    try {
        const response = await fetch(`${API_URL}/auth/login`, { // URL ATUALIZADA
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Bem-vindo, ${result.user.nome}!`);

            localStorage.setItem('barberToken', result.token);
            localStorage.setItem('barberUserNome', result.user.nome);
            localStorage.setItem('barberUserProfile', result.user.perfil);

            // Redireciona para os arquivos HTML corretos (ajuste os caminhos se necessário)
            switch (result.user.perfil) {
                case 'cliente':
                    window.location.href = 'BarberCLIENTE.html';
                    break;
                case 'barbeiro':
                    window.location.href = 'BarberBARBEIRO.html';
                    break;
                case 'recepcionista':
                    window.location.href = 'BarberRECEPCIONISTA.html';
                    break;
                case 'admin':
                    window.location.href = 'BarberDONO.html';
                    break;
                default:
                    alert('Perfil de usuário desconhecido.');
                    break;
            }
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.log('Erro ao tentar fazer login', error);
        alert('Não foi possivel conectar ao servidor. Tente novamente.');
    }
});

// --- Formulário de recuperação de senha ---
const forgotPasswordForm = document.getElementById('forgot-password-form');
forgotPasswordForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const email = document.getElementById('email-forgot').value;

    const button = forgotPasswordForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Enviando...';

    try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, { // URL ATUALIZADA
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const result = await response.json();
        alert(result.message || result.error);

        if (response.ok) {
            mostrarPainel('login-form');
        }
    } catch (error) {
        console.error('Erro no forgot-password: ', error);
        alert('Erro ao conectar com o servidor. ');
    } finally {
        button.disabled = false;
        button.innerText = 'Enviar Link';
    }
});