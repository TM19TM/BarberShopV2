// Script para /js/recepcionista.js

// URL Base da API (ajuste se o backend estiver em outro lugar)
const API_URL = 'http://localhost:3000/api';

// --- Funções Auxiliares ---
function formatarHora(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}
function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function getNomeCliente(ag) {
    if (ag.cliente) return ag.cliente.nome; // Cliente do sistema
    if (ag.clienteNomeWalkin) return ag.clienteNomeWalkin; // Cliente walk-in
    return 'Cliente (Walk-in)';
}

// --- Funções de Preenchimento (Populators) ---

function popularAgenda(agendamentos) {
    const container = document.querySelector('.agenda-lista');
    container.innerHTML = '';
    if (agendamentos.length === 0) {
        container.innerHTML = '<li class="agenda-item">Nenhum cliente agendado para hoje.</li>';
        return;
    }
    agendamentos.forEach(ag => {
        const nomeCliente = getNomeCliente(ag);
        container.innerHTML += `
            <li class="agenda-item">
                <span class="horario">${formatarHora(ag.dataHora)}</span>
                <span>Cliente: <strong>${nomeCliente}</strong></span> |
                <span class="barbeiro">Barbeiro: ${ag.barbeiro}</span>
            </li>
        `;
    });
}

function popularFeedbacks(feedbacks) {
    const container = document.querySelector('.feedback-lista');
    container.innerHTML = '';
    if (feedbacks.length === 0) {
        container.innerHTML = '<li class="feedback-item"><div class="comentario">Nenhum feedback recente.</div></li>';
        return;
    }
    feedbacks.forEach(fb => {
        container.innerHTML += `
            <li class="feedback-item">
                <span class="cliente">${fb.clienteNome} (p/ ${fb.barbeiroNome}):</span>
                <div class="comentario">"${fb.comentario}"</div>
            </li>
        `;
    });
}

function popularPagamentos(pagamentos) {
    const container = document.querySelector('.pagamento-lista');
    container.innerHTML = '';
    if (pagamentos.length === 0) {
        container.innerHTML = '<li class="pagamento-item">Nenhum pagamento pendente.</li>';
        return;
    }
    pagamentos.forEach(ag => {
        const nomeCliente = getNomeCliente(ag);
        const valorFormatado = formatarValor(ag.valor);
        container.innerHTML += `
            <li class="pagamento-item">
                <span class="cliente">${nomeCliente}</span>
                <br>
                <span>Serviço: ${ag.servico} (com ${ag.barbeiro})</span>
                <br>
                <span class="valor">Valor: ${valorFormatado}</span>
                <br>
                <button data-id="${ag._id}" data-nome="${nomeCliente}" data-valor="${valorFormatado}">Processar Pagamento</button>
            </li>
        `;
    });

    // Adiciona listeners aos botões
    container.querySelectorAll('button[data-id]').forEach(button => {
        button.addEventListener('click', (e) => {
            const { id, nome, valor } = e.target.dataset;
            processarPagamento(id, nome, valor);
        });
    });
}

// --- Função de Ação ---
async function processarPagamento(idPedido, nome, valor) {
    // Confirmação nativa (pode ser trocada por um modal customizado se preferir)
    if (!confirm(`Confirmar pagamento de ${valor} para ${nome}?`)) {
        return;
    }

    const token = localStorage.getItem('barberToken');
    try {
        const response = await fetch(`${API_URL}/staff/pagar/${idPedido}`, { // URL ATUALIZADA
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            window.location.reload();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        alert('Erro de conexão ao processar pagamento.');
    }
}

// --- LÓGICA PRINCIPAL (Ao Carregar) ---
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('barberToken');
    const nomeUser = localStorage.getItem('barberUserNome');
    const perfilUser = localStorage.getItem('barberUserProfile');

    // 1. Segurança
    if (!token || (perfilUser !== 'recepcionista' && perfilUser !== 'admin')) {
        alert('Acesso negado. Faça login como Recepção ou Admin.');
        window.location.href = 'BarberLOGIN.html';
        return;
    }

    // 2. Personalização
    try {
        document.querySelector('.container p strong').textContent = nomeUser;
    } catch (e) { }

    // 3. Buscar todos os dados
    try {
        const headers = { 'Authorization': 'Bearer ' + token };

        // Fetch 1: Agenda do Dia
        const resAgenda = await fetch(`${API_URL}/staff/agenda-dia`, { headers }); // URL ATUALIZADA
        if (resAgenda.ok) popularAgenda(await resAgenda.json());

        // Fetch 2: Feedbacks
        const resFeedback = await fetch(`${API_URL}/staff/feedbacks-todos`, { headers }); // URL ATUALIZADA
        if (resFeedback.ok) popularFeedbacks(await resFeedback.json());

        // Fetch 3: Pagamentos Pendentes
        const resPagamentos = await fetch(`${API_URL}/staff/pagamentos-pendentes`, { headers }); // URL ATUALIZADA
        if (resPagamentos.ok) popularPagamentos(await resPagamentos.json());

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        alert('Erro ao carregar dados do servidor.');
        if (error.message.includes('Token')) {
            localStorage.clear();
            window.location.href = 'BarberLOGIN.html';
        }
    }
});