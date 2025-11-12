// Script para /js/barbeiro.js

// URL Base da API (ajuste se o backend estiver em outro lugar)
const API_URL = 'http://localhost:3000/api';

// --- Função para o Barbeiro concluir o atendimento ---
async function concluirAtendimento(agendamentoId) {
    const valorInput = prompt("Qual o valor final o serviço? (Ex: 50)");
    if (!valorInput) {
        alert('Cancelado.');
        return;
    }
    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor < 0) {
        alert('Valor inválio. por favor digite apenas números.');
        return;
    }

    const token = localStorage.getItem('barberToken');

    try {
        const response = await fetch(`${API_URL}/barbeiro/concluir/${agendamentoId}`, { // URL ATUALIZADA
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ valor: valor })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            window.location.reload();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao concluir atendimento: ', error);
        alert('Erro de conexão ao tentar concluir o atendimento.');
    }
}

// --- Função para o barbeiro adicionar um walk-in ---
async function adicionarWalkin() {
    const clienteNome = prompt("Qual o nome do cliente?");
    if (!clienteNome) return;

    const servico = prompt(`Qual o serviço prestado para o ${clienteNome}? (EX: Corte)`);
    if (!servico) return;

    const valorInput = prompt("Qual o valor final do serviço? (Ex: 50)");
    if (!valorInput) return;

    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor < 0) {
        alert('Valor inválido. Por favor, insira apenas números.');
        return;
    }

    const token = localStorage.getItem('barberToken');

    try {
        const response = await fetch(`${API_URL}/barbeiro/walkin`, { // URL ATUALIZADA
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ clienteNome: clienteNome, servico: servico, valor: valor })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            window.location.reload();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao registrar walk-in: ', error);
        alert('Erro de conexão ao registrar o atendimento.');
    }
}

// --- Função para formatar a hora
function formatarHora(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

// --- Função para preencher a agenda no HTML ---
function popularAgenda(agendamentos) {
    const listaContainer = document.querySelector('.agenda-lista');
    listaContainer.innerHTML = '';

    if (agendamentos.length === 0) {
        listaContainer.innerHTML = '<li class="agenda-item"><span class="info">Você não tem clientes agendados para hoje.</span></li>';
        return;
    }

    agendamentos.forEach(ag => {
        const nomeCliente = ag.cliente ? ag.cliente.nome : 'Cliente Removido';
        const itemHtml = `
            <li class="agenda-item">
                <div>
                    <span class="horario">${formatarHora(ag.dataHora)}</span>
                    <span class="info">Cliente: <strong>${nomeCliente}</strong> - (Serviço: ${ag.servico})</span>
                </div>
                <button data-agendamento-id="${ag._id}">Concluir Atendimento</button>
            </li>
        `;
        listaContainer.innerHTML += itemHtml;
    });

    // Adiciona listeners aos botões criados
    listaContainer.querySelectorAll('button[data-agendamento-id]').forEach(button => {
        button.addEventListener('click', () => {
            concluirAtendimento(button.dataset.agendamentoId);
        });
    });
}

// --- Função para preencher os feedbacks no HTML ---
function popularFeedbacks(feedbacks) {
    const listaContainer = document.querySelector('.feedback-lista');
    listaContainer.innerHTML = '';

    if (feedbacks.length === 0) {
        listaContainer.innerHTML = '<li class="feedback-item"><div class="comentario">Você ainda não recebeu feedbacks.</div></li>';
        return;
    }

    feedbacks.forEach(fb => {
        let valorHtml = '';
        if (fb.agendamentoId && fb.agendamentoId.valor !== undefined) {
            const valorFormatado = `R$ ${fb.agendamentoId.valor.toFixed(2)}`;
            valorHtml = `<span class="valor">${valorFormatado}</span>`;
        }
        const itemHtml = `
            <li class="feedback-item">
                <span class="cliente">${fb.clienteNome}: ${valorHtml}</span>
                <div class="comentario">"${fb.comentario}"</div>
            </li>
        `;
        listaContainer.innerHTML += itemHtml;
    });
}

// --- LÓGICA PRINCIPAL (Ao Carregar) ---
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('barberToken');
    const nomeBarbeiro = localStorage.getItem('barberUserNome');

    if (!token) {
        alert('Acesso negado. Por favor, faça login.');
        window.location.href = 'BarberLOGIN.html';
        return;
    }

    try {
        document.querySelector('.container p strong').textContent = nomeBarbeiro;
    } catch (e) { console.error("Erro ao definir nome: ", e); }

    document.getElementById('btn-add-walkin').addEventListener('click', adicionarWalkin);

    // Buscar dados da API
    try {
        const headers = { 'Authorization': 'Bearer ' + token };

        // Fetch 1: Agenda
        const resAgenda = await fetch(`${API_URL}/barbeiro/agenda`, { headers }); // URL ATUALIZADA
        if (!resAgenda.ok) throw new Error(await resAgenda.json().error || 'Erro ao carregar agenda');
        popularAgenda(await resAgenda.json());

        // Fetch 2: Feedbacks
        const resFeedback = await fetch(`${API_URL}/barbeiro/feedbacks`, { headers }); // URL ATUALIZADA
        if (!resFeedback.ok) throw new Error('Erro ao carregar feedbacks');
        popularFeedbacks(await resFeedback.json());

        // Fetch 3: Estatísticas
        const resStats = await fetch(`${API_URL}/barbeiro/estatisticas`, { headers }); // URL ATUALIZADA
        if (resStats.ok) {
            const stats = await resStats.json();
            document.getElementById('contador-hoje').textContent = stats.totalConcluidos;
        } else {
            console.error('Erro ao buscar estatísticas.');
        }

    } catch (error) {
        console.error('Erro ao buscar dados do dashboard: ', error);
        if (error.message.includes('Token')) {
            alert('Sua sessão expirou. Faça o login novamente.');
            localStorage.clear();
            window.location.href = 'BarberLOGIN.html';
        } else {
            // Tratamento de erro mais específico
            if (error.message.includes('agenda')) {
                document.querySelector('.agenda-lista').innerHTML = `<li class="agenda-item"><span class="info" style="color: red;">Erro ao carregar agenda.</span></li>`;
            }
            if (error.message.includes('feedbacks')) {
                document.querySelector('.feedback-lista').innerHTML = `<li class="feedback-item"><div class="comentario" style="color: red;">Erro ao carregar feedbacks.</div></li>`;
            }
        }
    }
});