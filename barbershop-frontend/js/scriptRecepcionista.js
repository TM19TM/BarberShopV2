// Script para /js/scriptRecepcionista.js

// URL Base da API (ajuste se o backend estiver em outro lugar)
const API_URL = 'https://barbershopv2.onrender.com';

// --- Funções Auxiliares ---
function formatarHora(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
}
function formatarValor(valor) {
    if (typeof valor !== 'number') valor = 0;
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
        container.innerHTML += `
            <li class="pagamento-item">
                <span class="cliente">${nomeCliente}</span>
                <br>
                <span>Serviço: ${ag.servico} (com ${ag.barbeiro})</span>
                <br>
                <span class="valor">Valor: ${formatarValor(ag.valor)}</span>
                <br>
                <button onclick="processarPagamento('${ag._id}', '${nomeCliente}', '${formatarValor(ag.valor)}')">Processar Pagamento</button>
            </li>
        `;
    });
}

// --- Função de Ação ---

async function processarPagamento(idPedido, nome, valor) {
    if (!confirm(`Confirmar pagamento de ${valor} para ${nome}?`)) {
        return;
    }

    const token = localStorage.getItem('barberToken');
    try {
        const response = await fetch(`${API_URL}/staff/pagamentos/processar/${idPedido}`, { // Rota atualizada
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

    // 1. Segurança (Verificação de perfil ainda é necessária)
    if (!token || (perfilUser !== 'recepcionista' && perfilUser !== 'admin')) {
        alert('Acesso negado. Faça login como Recepção ou Admin.');
        window.location.href = 'BarberLOGIN.html';
        return;
    }

    // 2. Personalização
    try {
        document.querySelector('.container p strong').textContent = nomeUser;
    } catch (e) {}

    // 3. Buscar todos os dados
    try {
        const headers = { 'Authorization': 'Bearer ' + token };

        // Fetch 1: Agenda do Dia
        const resAgenda = await fetch(`${API_URL}/staff/agenda-do-dia`, { headers }); // Rota atualizada
        if (resAgenda.ok) popularAgenda(await resAgenda.json());

        // Fetch 2: Feedbacks
        const resFeedback = await fetch(`${API_URL}/staff/feedbacks-todos`, { headers }); // Rota atualizada
        if (resFeedback.ok) popularFeedbacks(await resFeedback.json());

        // Fetch 3: Pagamentos Pendentes
        const resPagamentos = await fetch(`${API_URL}/staff/pagamentos-pendentes`, { headers }); // Rota atualizada
        if (resPagamentos.ok) popularPagamentos(await resPagamentos.json());

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        alert('Erro ao carregar dados do servidor.');
    }
});