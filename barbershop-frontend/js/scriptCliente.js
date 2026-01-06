/**
 * Script para o Painel do Cliente (scriptCliente.js)
 * Gerencia agendamentos, notificações, feedbacks e interface do dashboard.
 */

// URL Base da API - Altere para a URL do Render em produção
const API_URL = 'http://localhost:3000/api';

// --- CONTROLE DE MODAIS ---
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "flex";
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

// --- FUNÇÕES AUXILIARES DE FORMATAÇÃO (HORÁRIO LOCAL) ---
function formatarData(dataISO) { 
    const data = new Date(dataISO);
    // Usamos o padrão local para evitar erros de fuso horário (UTC)
    return data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function formatarHora(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// --- VARIÁVEIS GLOBAIS DE ESTADO ---
let idParaCancelar = null;
let idParaRemarcar = null;

// --- FUNÇÃO PARA ENVIAR FEEDBACK ---  
async function enviarFeedback(agendamentoId, barbeiroNome) {
    const comentario = prompt(`Como foi seu atendimento com ${barbeiroNome}?`);

    if (!comentario || comentario.trim() === '') {
        return;
    }

    const token = localStorage.getItem('barberToken');
    const dadosFeedback = { agendamentoId, barbeiroNome, comentario };

    try {
        const response = await fetch(`${API_URL}/agendamentos/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(dadosFeedback)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Obrigado pelo seu feedback!');
            window.location.reload();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao enviar feedback:', error);
        alert('Erro de conexão ao enviar feedback.');
    }
}

// --- FUNÇÕES DE ABERTURA DE MODAIS ESPECÍFICOS ---
function abrirModalDesmarcar(agendamentoId) {
    idParaCancelar = agendamentoId;
    abrirModal('modalDesmarcar');
}

function abrirModalRemarcar(agendamento) {
    idParaRemarcar = agendamento._id;
    const textoModal = document.getElementById('remarcar-texto-atual');
    textoModal.innerHTML = `Seu agendamento atual: <strong>${formatarData(agendamento.dataHora)}</strong> às <strong>${formatarHora(agendamento.dataHora)}</strong>`;
    abrirModal('modalRemarcar');
}

// --- POPULADORES DE INTERFACE ---

function popularDropdownBarbeiros(barbeiros) {
    const selectBarbeiro = document.getElementById('barbeiro');
    if (!selectBarbeiro) return;
    
    selectBarbeiro.innerHTML = '<option value="">Qualquer um</option>';
    barbeiros.forEach(barbeiro => {
        const option = document.createElement('option');
        option.value = barbeiro.nome;
        option.textContent = barbeiro.nome;
        selectBarbeiro.appendChild(option);
    });
}

function popularNotificacoes(notificacoes) {
    const container = document.querySelector('.notificacoes-area');
    if (!container) return;
    
    container.innerHTML = '';
    notificacoes.forEach(notif => {
        const divAlerta = document.createElement('div');
        divAlerta.className = `alerta ${notif.tipo}`;
        divAlerta.innerHTML = notif.mensagem;
        container.appendChild(divAlerta);
    });
}

function popularDashboard(agendamentos) {
    const agora = new Date();
    const containerProximo = document.querySelector('.proximo-corte');
    if (!containerProximo) return;

    /**
     * LÓGICA DE EXIBIÇÃO:
     * O agendamento aparece se for no futuro OU se começou há menos de 60 minutos.
     * Isso evita que o agendamento suma da tela do cliente assim que o relógio bate a hora marcada.
     */
    const proximo = agendamentos.find(ag => {
        const dataAg = new Date(ag.dataHora);
        const tempoLimite = new Date(agora.getTime() - 60 * 60000); // 60 minutos atrás
        return (dataAg > tempoLimite) && ag.status === 'agendado';
    });

    if (proximo) {
        containerProximo.innerHTML = `
        <h3>Seu próximo agendamento:</h3>
        <div class="detalhes">
            Dia: <strong>${formatarData(proximo.dataHora)}</strong> às <strong>${formatarHora(proximo.dataHora)}</strong>
            <br>
            com o Barbeiro: <strong>${proximo.barbeiro}</strong>
            <br>
            Serviço: <strong>${proximo.servico}</strong>
        </div>
        <div class="botoes-acao">
            <button class="btn-remarcar" id="btn-trigger-remarcar">Remarcar</button>
            <button class="btn-desmarcar" id="btn-trigger-desmarcar">Desmarcar Corte</button>
        </div>
        `; 

        // Adicionando eventos aos botões gerados dinamicamente
        document.getElementById('btn-trigger-remarcar').onclick = () => abrirModalRemarcar(proximo);
        document.getElementById('btn-trigger-desmarcar').onclick = () => abrirModalDesmarcar(proximo._id);

    } else {
        containerProximo.innerHTML = `
        <h3>Você não tem nenhum agendamento futuro.</h3>
        <div class="detalhes">Clique em "Agendar Novo Corte" para marcar seu horário!</div>
        `;
    }

    // --- POPULAR HISTÓRICO ---
    const listaHistorico = document.querySelector('.historico-lista');
    if (!listaHistorico) return;

    // Filtra agendamentos que já passaram (mais de 1 hora atrás) ou estão concluídos/cancelados
    const historico = agendamentos
        .filter(ag => new Date(ag.dataHora) < new Date(agora.getTime() - 60 * 60000) || ag.status !== 'agendado')
        .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    
    listaHistorico.innerHTML = ''; 
    
    if (historico.length === 0) {
        listaHistorico.innerHTML = '<li class="historico-item"><div class="info"><span>Seu histórico aparecerá aqui após o primeiro corte.</span></div></li>';
    } else {
        historico.forEach(ag => {
            let acaoHtml = ''; 
            if (ag.status === 'concluido') {
                acaoHtml = ag.feedbackEnviado 
                    ? '<span class="feedback-concluido">Feedback Enviado</span>' 
                    : `<a href="#" class="btn-feedback" id="fb-btn-${ag._id}">Deixar Feedback</a>`;
            } else if (ag.status === 'cancelado') {
                acaoHtml = '<span class="feedback-concluido" style="color: #dc3545;">Cancelado</span>';
            }
        
            const item = document.createElement('li');
            item.className = 'historico-item';
            item.innerHTML = `
                <div class="info">
                    <span class="servico">${ag.servico}</span>
                    <span>Data: ${formatarData(ag.dataHora)} às ${formatarHora(ag.dataHora)}</span>
                    <span>Barbeiro: ${ag.barbeiro}</span>
                    <span>Valor: <strong>${ag.valor ? `R$ ${ag.valor.toFixed(2)}` : 'N/D'}</strong></span>
                </div>
                <div class="acao-historico">${acaoHtml}</div>
            `;
            listaHistorico.appendChild(item);

            // Adiciona evento de feedback se o botão existir
            const btnFb = document.getElementById(`fb-btn-${ag._id}`);
            if (btnFb) {
                btnFb.onclick = (e) => {
                    e.preventDefault();
                    enviarFeedback(ag._id, ag.barbeiro);
                };
            }
        });
    }
}

// --- LÓGICA PRINCIPAL AO CARREGAR ---
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('barberToken');
    const nomeCliente = localStorage.getItem('barberUserNome');

    if (!token) {
        window.location.href = 'BarberLOGIN.html';
        return;
    }

    const headerTitulo = document.querySelector('.header h1');
    if (headerTitulo && nomeCliente) {
        headerTitulo.textContent = `Olá, ${nomeCliente.split(' ')[0]}`;
    }

    try {
        const headers = { 'Authorization': 'Bearer ' + token };

        // 1. Busca agendamentos
        const resAg = await fetch(`${API_URL}/agendamentos/meus`, { headers });
        if (resAg.ok) popularDashboard(await resAg.json());

        // 2. Busca notificações
        const resNotif = await fetch(`${API_URL}/agendamentos/notificacoes`, { headers });
        if (resNotif.ok) popularNotificacoes(await resNotif.json());

        // 3. Busca lista de barbeiros
        const resBarb = await fetch(`${API_URL}/agendamentos/barbeiros`, { headers });
        if (resBarb.ok) popularDropdownBarbeiros(await resBarb.json());

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
});

// --- LISTENERS DE FORMULÁRIO ---

// Agendar
document.getElementById('form-agendar')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const token = localStorage.getItem('barberToken');
    const payload = {
        servico: document.getElementById('servico').value,
        barbeiro: document.getElementById('barbeiro').value,
        dia: document.getElementById('dia').value,
        horario: document.getElementById('horario').value
    };

    try {
        const res = await fetch(`${API_URL}/agendamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (res.ok) {
            alert(result.message);
            window.location.reload();
        } else {
            alert(result.error);
        }
    } catch (err) { alert('Erro ao conectar com o servidor.'); }
});

// Cancelar
document.getElementById('form-cancelar')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!idParaCancelar) return;
    const token = localStorage.getItem('barberToken');

    try {
        const res = await fetch(`${API_URL}/agendamentos/${idParaCancelar}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            alert('Agendamento cancelado.');
            window.location.reload();
        } else {
            const data = await res.json();
            alert(data.error);
        }
    } catch (err) { alert('Erro ao cancelar.'); }
});

// Remarcar
document.getElementById('form-remarcar')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!idParaRemarcar) return;
    const token = localStorage.getItem('barberToken');
    const payload = {
        dia: document.getElementById('nova-data').value,
        horario: document.getElementById('novo-horario').value
    };

    try {
        const res = await fetch(`${API_URL}/agendamentos/${idParaRemarcar}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert('Agendamento remarcado!');
            window.location.reload();
        } else {
            const data = await res.json();
            alert(data.error);
        }
    } catch (err) { alert('Erro ao remarcar.'); }
});