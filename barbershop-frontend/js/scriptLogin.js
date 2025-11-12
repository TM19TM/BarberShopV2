// Script para /js/scriptLogin.js

// URL Base da API (ajuste se o backend estiver em outro lugar)
const API_URL = 'https://barbershopv2.onrender.com';

function mostrarPainel(idDoPainel) {
    // Esconde todos os formulários
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'none';

    // Mostra apenas o formulário solicitado
    document.getElementById(idDoPainel).style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    
    // -_-_-_- Formulário de cadastro -_-_-_-
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async function(event){
        event.preventDefault(); 

        const nome = document.getElementById('nome-reg').value;
        const telefone = document.getElementById('telefone-reg').value;
        const dataNascimento = document.getElementById('nasc-reg').value;
        const email = document.getElementById('email-reg').value;
        const senha = document.getElementById('senha-reg').value;

        const formData = { nome, telefone, dataNascimento, email, senha };

        try{
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (response.ok){
                showNotification('Cadastro finalizado com sucesso! Agora você pode fazer login.');
                mostrarPainel('login-form'); // Voltar para o painel de login
            } else {
                showNotification('Erro no cadastro: ' + (result.error || 'Erro desconhecido.'));
            }
        } catch (error){
            console.error('Erro ao cadastrar usuário:', error);
            showNotification('Não foi possivel estabelecer uma comunicação com o servidor. Tente novamente mais tarde.');
        }
    });

    // -_-_-_- Formulário de login -_-_-_-
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        
        const email = document.getElementById('email-login').value;
        const senha = document.getElementById('senha-login').value;
        const formData = { email, senha };

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                // Armazena tudo no localStorage
                localStorage.setItem('barberToken', result.token);
                localStorage.setItem('barberUserNome', result.user.nome);
                localStorage.setItem('barberUserProfile', result.user.perfil);

                // Redireciona com base no perfil
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
                        showNotification('Perfil de usuário desconhecido.');
                        break;
                }
            } else {
                showNotification('Erro: ' + result.error);
            }
        } catch (error) {
            console.log('Erro ao tentar fazer login', error);
            showNotification('Não foi possivel conectar ao servidor. Tente novamente.');
        }
    });

    // -_-_-_- Formulário de recuperação de senha -_-_-_-
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    forgotPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('email-forgot').value;

        const button = forgotPasswordForm.querySelector('button');
        button.disabled = true;
        button.textContent = 'Enviando...';

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email}) 
            });

            const result = await response.json();

            showNotification(result.message || result.error);

            if (response.ok) { 
                mostrarPainel('login-form');
            }
        } catch (error) {
            console.error('Erro no forgot-password: ', error);
            showNotification('Erro ao conectar com o servidor.');
        } finally {
            button.disabled = false;
            button.innerText = 'Enviar Link';
        }
    });
});