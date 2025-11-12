// Script para /js/scriptDono.js

// URL Base da API (ajuste se o backend estiver em outro lugar)
const API_URL = 'https://barbershopv2.onrender.com';

// --- Funções Auxiliares ---
function formatarValor(valor) {
    if (typeof valor !== 'number') valor = 0;
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- Funções de Preenchimento (Populators) ---

function popularWidgets(stats) {
    document.querySelector('.widget .valor').textContent = formatarValor(stats.faturamentoTotal);
    document.querySelectorAll('.widget .valor')[1].textContent = stats.totalAtendimentos;
}

function popularTabelaBarbeiros(performance) {
    const container = document.getElementById('tabela-barbeiros-corpo');
    container.innerHTML = '';

    if (performance.length === 0) {
        container.innerHTML = '<tr><td colspan="3">Nenhum dado encontrado para o período.</td></tr>';
        return;
    }

    performance.forEach(barbeiro => {
        container.innerHTML += `
            <tr>
                <td>${barbeiro._id}</td>
                <td>${barbeiro.atendimentos}</td>
                <td>${formatarValor(barbeiro.faturamento)}</td>
            </tr>
        `;
    });
}

function popularTabelaFeedbacks(feedbacks) {
    const container = document.getElementById('tabela-feedbacks-corpo');
    container.innerHTML = '';

    if (feedbacks.length === 0) {
        container.innerHTML = '<tr><td colspan="3">Nenhum feedback recente.</td></tr>';
        return;
    }

    feedbacks.forEach(fb => {
        container.innerHTML += `
            <tr>
                <td>${fb.clienteNome}</td>
                <td><strong>${fb.barbeiroNome}</strong></td> <td>"${fb.comentario}"</td>
            </tr>
        `;
    });
}

function popularDropdownBarbeiros(barbeiros) {
    const select = document.getElementById('filtro-barbeiro');
    barbeiros.forEach(barbeiro => {
        const option = document.createElement('option');
        option.value = barbeiro.nome;
        option.textContent = barbeiro.nome;
        select.appendChild(option);
    });
}

// --- Função Principal de Busca ---

async function buscarDadosDashboard(token, dataInicio, dataFim, barbeiro) {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    if (barbeiro) params.append('barbeiro', barbeiro);

    const queryString = params.toString();
    const headers = { 'Authorization': 'Bearer ' + token };

    try {
        // Requisição 1: Estatísticas (com filtros)
        const resStats = await fetch(`${API_URL}/staff/dashboard-admin?${queryString}`, { headers }); // Rota atualizada
        if (!resStats.ok) throw new Error('Erro ao buscar estatísticas');

        const dados = await resStats.json();
        popularWidgets(dados.stats);
        popularTabelaBarbeiros(dados.performanceBarbeiros);

        // Requisição 2: Feedbacks (com filtros)
        const resFeedbacks = await fetch(`${API_URL}/staff/feedbacks-todos?${queryString}`, { headers }); // Rota atualizada
        if (!resFeedbacks.ok) throw new Error('Erro ao buscar feedbacks');

        const feedbacks = await resFeedbacks.json();
        popularTabelaFeedbacks(feedbacks);

    } catch (error) {
        console.error("Erro no dashboard:", error.message);
        if (error.message.includes('Token') || error.message.includes('Acesso restrito')) {
            showNotification('Sessão expirada ou acesso negado. Faça login como admin.');
            localStorage.clear();
            window.location.href = 'BarberLOGIN.html';
        }
    }
}

// --- Função para buscar os barbeiros (só roda 1 vez) ---
async function carregarFiltrosIniciais(token) {
    try {
        // Rota atualizada (usa a rota do cliente, pois é a mesma info)
        const response = await fetch(`${API_URL}/agendamentos/barbeiros`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (response.ok) {
            const barbeiros = await response.json();
            popularDropdownBarbeiros(barbeiros);
        } else {
            console.error("Não foi possível carregar o filtro de barbeiros.");
        }
    } catch (e) {
        console.error("Erro ao carregar filtros:", e);
    }
}

// --- LÓGICA PRINCIPAL (Ao Carregar) ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('barberToken');
    const nomeDono = localStorage.getItem('barberUserNome');

    // nav.js já cuida da verificação de token
    if (!token) {
        console.error("dono.js: Token não encontrado, aguardando redirecionamento do nav.js");
        return;
    }

    try {
        document.querySelector('.container p strong').textContent = nomeDono;
    } catch (e) { }

    const btnFiltrar = document.querySelector('.filtros button');
    btnFiltrar.addEventListener('click', () => {
        const dataInicio = document.getElementById('data-inicio').value;
        const dataFim = document.getElementById('data-fim').value;
        const barbeiro = document.getElementById('filtro-barbeiro').value;

        if (dataInicio && !dataFim) {
            showNotification('Por favor, selecione a data final.');
            return;
        }
        if (!dataInicio && dataFim) {
            showNotification('Por favor, selecione a data inicial.');
            return;
        }
        
        buscarDadosDashboard(token, dataInicio, dataFim, barbeiro || null);
    });

    // Busca os dados iniciais (todos os tempos, todos barbeiros)
    buscarDadosDashboard(token, null, null, null);
    // Busca a lista de barbeiros para o dropdown
    carregarFiltrosIniciais(token);
});