// Script para /js/reset.js

// URL Base da API (ajuste se o backend estiver em outro lugar)
const API_URL = 'http://localhost:3000/api';

const resetForm = document.getElementById('reset-password-form');

// Pega o token da URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    alert('Link invalido ou não encontrado. Redirecionado para o login.');
    setTimeout(() => {
        window.location.href = 'BarberLOGIN.html'; // Corrigido para LOGIN
    }, 1000);
}

resetForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const novaSenha = document.getElementById('nova-senha').value;
    const confirmaSenha = document.getElementById('confirma-senha').value;

    if (novaSenha !== confirmaSenha) {
        alert('As senhas não coincidem! Por favor, tente novamente.');
        return;
    }
    if (novaSenha.length < 6) {
        alert('A senha precisa ter pelo menos 6 caracteres.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/reset-password`, { // URL ATUALIZADA
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, novaSenha: novaSenha })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            window.location.href = 'BarberLOGIN.html';
        } else {
            alert('Erro: ' + result.error);
        }

    } catch (error) {
        console.error('Erro no reset-password:', error);
        alert('Ocorreu um erro ao redefinir a senha. Por favor, tente novamente mais tarde.');
    }
});