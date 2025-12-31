// Script para /js/scriptBarbeiro.js

// URL Base da API 
const API_URL = 'https://barbershopv2.onrender.com/api';

// --- Função para o Barbeiro concluir o atendimento ---
async function concluirAtendimento(agendamentoId) {
    const valorInput = prompt("Qual o valor final o serviço? (Ex: 50)");
    if (!valorInput) {
        alert('Cancelado.');
        return;
    }

    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor < 0) {
        alert('Valor inválido. por favor digite apenas números.');
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
            body: JSON.stringify({valor: valor})
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
    if (!servico) return 

    const valorInput = prompt("Qual o valor final do serviço? (Ex: 50)");
    if (!valorInput) return; 

    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor < 0) {
        alert('Valor inválido. Por favor, insira apenas números.');
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
            body: JSON.stringify({clienteNome: clienteNome, servico: servico, valor: valor})
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            window.location.reload()
        }else{
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao registrar walk-in: ', error);
        alert('Erro de conexão ao registrar o atendimento.');
    }
}

// --- Função para formatar a hora (CORRIGIDA -3H MANUAL) ---
function formatarHora(dataISO) {
    const data = new Date(dataISO);
    data.setHours(data.getHours() - 3); // Subtrai 3 horas manualmente para corrigir o visual
    return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit', 
        minute: '2-digit'
    });
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
            <button onclick="concluirAtendimento('${ag._id}')">Concluir Atendimento</button>
        </li>
        `;
        listaContainer.innerHTML += itemHtml;
    })
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
    })
}

// --- LÓGICA PRINCIPAL (FUNCIONA QUANDO A PÁGINA É CARREGADA) ---
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('barberToken');
    const nomeBarbeiro = localStorage.getItem('barberUserNome');

    // nav.js já cuida da verificação de token
    if (!token) {
        console.error("barbeiro.js: Token não encontrado, aguardando redirecionamento do nav.js");
        return;
    }

    try {
        const strongElement = document.querySelector('.container p strong');
        if (strongElement && nomeBarbeiro) {
            strongElement.textContent = nomeBarbeiro;
        }
    } catch (e) {console.error("Erro ao definir nome: ", e);}

    document.getElementById('btn-add-walkin').addEventListener('click', adicionarWalkin);

    try {
        const headers = { 'Authorization': 'Bearer ' + token };

        // 1. Requisição Agenda
        const response = await fetch(`${API_URL}/barbeiro/agenda`, { headers }); 
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Não foi possivel carregar sua agenda');
        }
        const agenda = await response.json();
        popularAgenda(agenda);    
        
        // 2. Requisição Feedbacks
        const responseFeedback = await fetch(`${API_URL}/barbeiro/feedbacks`, { headers }); 
        if (!responseFeedback.ok) throw new Error('Erro ao carregar feedbacks');
        const feedbacks = await responseFeedback.json();
        popularFeedbacks(feedbacks);

        // 3. Requisição Estatística
        const responseStats = await fetch(`${API_URL}/barbeiro/estatisticas`, { headers }); 
        if (responseStats.ok) {
            const stats = await responseStats.json()
            document.getElementById('contador-hoje').textContent = stats.totalConcluidos;
        }else{
            console.error('Erro ao buscar estatísticas.');
        }

       } catch (error) {
        console.error('Erro ao buscar dados do dashboard: ', error);
        if (error.message.includes('Token')) {
            alert('Sua sessão expirou. Faça o login novamente.');
            localStorage.clear();
            window.location.href = 'BarberLOGIN.html';
        } else {
            // Tratamento de erros visuais na interface
            if (error.message.includes('agenda')) {
                document.querySelector('.agenda-lista').innerHTML = `<li class="agenda-item"><span class="info" style="color: red;">Erro ao carregar agenda.</span></li>`;
            }
            if (error.message.includes('feedbacks')) {
                document.querySelector('.feedback-lista').innerHTML = `<li class="feedback-item"><div class="comentario" style="color: red;">Erro ao carregar feedbacks.</div></li>`;
            }
        }
    }
});