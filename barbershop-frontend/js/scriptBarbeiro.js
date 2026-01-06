/**
 * Script para o Painel do Barbeiro (scriptBarbeiro.js)
 * Gere a agenda do dia, conclusão de serviços e registo de walk-ins.
 */

// URL Base da API - Altere para a URL do Render em produção
const API_URL = 'http://localhost:3000/api';

// --- FUNÇÃO PARA CONCLUIR ATENDIMENTO ---
async function concluirAtendimento(agendamentoId) {
    const valorInput = prompt("Qual o valor final do serviço? (Ex: 50)");
    
    if (valorInput === null) return; // Cancelado pelo utilizador

    const valor = parseFloat(valorInput.replace(',', '.'));
    if (isNaN(valor) || valor < 0) {
        alert('Valor inválido. Por favor, digite apenas números.');
        return;
    }

    const token = localStorage.getItem('barberToken');

    try {
        const response = await fetch(`${API_URL}/barbeiro/concluir/${agendamentoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ valor: valor })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Atendimento concluído! O pagamento foi enviado para a recepção.');
            window.location.reload(); 
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao concluir atendimento:', error);
        alert('Erro de conexão ao tentar concluir o atendimento.');
    }
}

// --- FUNÇÃO PARA ADICIONAR WALK-IN (CLIENTE SEM MARCAÇÃO) ---
async function adicionarWalkin() {
    const clienteNome = prompt("Qual o nome do cliente?");
    if (!clienteNome) return; 

    const servico = prompt(`Qual o serviço prestado para ${clienteNome}? (Ex: Corte)`);
    if (!servico) return;

    const valorInput = prompt("Qual o valor do serviço?");
    if (!valorInput) return; 

    const valor = parseFloat(valorInput.replace(',', '.'));
    if (isNaN(valor) || valor < 0) {
        alert('Valor inválido.');
        return;
    } 

    const token = localStorage.getItem('barberToken');

    try {
        const response = await fetch(`${API_URL}/barbeiro/walkin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ clienteNome, servico, valor })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Atendimento registado com sucesso!');
            window.location.reload();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao registar walk-in:', error);
        alert('Erro de conexão.');
    }
}

// --- FUNÇÃO DE FORMATAÇÃO DE HORA (CORREÇÃO DE FUSO) ---
function formatarHora(dataISO) {
    const data = new Date(dataISO);
    // REMOVIDO: timeZone: 'UTC'
    // Agora o navegador usa o fuso horário local do computador do barbeiro
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// --- POPULADORES DE INTERFACE ---

function popularAgenda(agendamentos) {
    const listaContainer = document.querySelector('.agenda-lista');
    if (!listaContainer) return;

    listaContainer.innerHTML = '';

    if (agendamentos.length === 0) {
        listaContainer.innerHTML = '<li class="agenda-item"><span class="info">Não tem clientes agendados para hoje.</span></li>';
        return;
    }

    agendamentos.forEach(ag => {
        // Verifica se é cliente do sistema ou walk-in
        const nomeExibicao = ag.cliente ? ag.cliente.nome : (ag.clienteNomeWalkin || 'Cliente Externo');
        
        const itemHtml = `
        <li class="agenda-item">
            <div class="info-atendimento">
                <span class="horario">${formatarHora(ag.dataHora)}</span>
                <span class="detalhes">Cliente: <strong>${nomeExibicao}</strong> - (${ag.servico})</span>
            </div>
            <button class="btn-concluir" onclick="concluirAtendimento('${ag._id}')">Finalizar</button>
        </li>
        `;
        listaContainer.innerHTML += itemHtml;
    });
}

function popularFeedbacks(feedbacks) {
    const listaContainer = document.querySelector('.feedback-lista');
    if (!listaContainer) return;

    listaContainer.innerHTML = '';

    if (feedbacks.length === 0) {
        listaContainer.innerHTML = '<li class="feedback-item"><div class="comentario">Ainda não recebeu feedbacks dos seus clientes.</div></li>';
        return;
    }

    feedbacks.forEach(fb => {
        const valorHtml = fb.agendamentoId?.valor 
            ? `<span class="valor-servico">R$ ${fb.agendamentoId.valor.toFixed(2)}</span>` 
            : '';

        const itemHtml = `
            <li class="feedback-item">
                <div class="header-feedback">
                    <strong>${fb.clienteNome}</strong>
                    ${valorHtml}
                </div>
                <div class="comentario">"${fb.comentario}"</div>
            </li>
        `;
        listaContainer.innerHTML += itemHtml;
    });
}

// --- LÓGICA AO CARREGAR A PÁGINA ---
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('barberToken');
    const nomeBarbeiro = localStorage.getItem('barberUserNome');

    if (!token) {
        window.location.href = 'BarberLOGIN.html';
        return;
    }

    // Personaliza a saudação
    const strongElement = document.querySelector('.container p strong');
    if (strongElement && nomeBarbeiro) {
        strongElement.textContent = nomeBarbeiro.split(' ')[0];
    }

    // Listener do botão Walk-in
    document.getElementById('btn-add-walkin')?.addEventListener('click', adicionarWalkin);

    try {
        const headers = { 'Authorization': 'Bearer ' + token };

        // 1. Carrega a Agenda do Dia
        const resAgenda = await fetch(`${API_URL}/barbeiro/agenda`, { headers });
        if (resAgenda.ok) {
            popularAgenda(await resAgenda.json());
        }

        // 2. Carrega os Feedbacks
        const resFeedback = await fetch(`${API_URL}/barbeiro/feedbacks`, { headers });
        if (resFeedback.ok) {
            popularFeedbacks(await resFeedback.json());
        }

        // 3. Carrega Estatísticas (Contador de hoje)
        const resStats = await fetch(`${API_URL}/barbeiro/estatisticas`, { headers });
        if (resStats.ok) {
            const stats = await resStats.json();
            const contador = document.getElementById('contador-hoje');
            if (contador) contador.textContent = stats.totalConcluidos;
        }

    } catch (error) {
        console.error('Erro ao carregar dados do barbeiro:', error);
    }
});