// Script para /js/cliente.js

// URL Base da API (ajuste se o backend estiver em outro lugar)
const API_URL = 'http://localhost:3000/api';

// --- Variáveis Globais ---
let idParaCancelar = null;
let idParaRemarcar = null;

// --- Funções do Modal ---
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "flex";
}
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

// --- Funções Auxiliares de Formatação ---
function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}
function formatarHora(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

// --- Funções de Ação (API) ---

async function enviarFeedback(agendamentoId, barbeiroNome) {
    const comentario = prompt(`Deixe seu feedback sobre o atendimento com ${barbeiroNome}:`);
    if (!comentario || comentario.trim() === '') {
        alert('Feedback cancelado');
        return;
    }

    const token = localStorage.getItem('barberToken');
    const dadosFeedback = { agendamentoId, barbeiroNome, comentario };

    try {
        const response = await fetch(`${API_URL}/agendamentos/feedback`, { // URL ATUALIZADA
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(dadosFeedback)
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            window.location.reload();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao enviar feedback', error);
        alert('Erro de conexão ao enviar feedback.');
    }
}

function abrirModalDesmarcar(agendamentoId) {
    idParaCancelar = agendamentoId;
    abrirModal('modalDesmarcar');
}

function abrirModalRemarcar(agendamento) {
    idParaRemarcar = agendamento._id;
    const textoModal = document.getElementById('remarcar-texto-atual');
    textoModal.innerHTML = `Seu agendamento atual é: <strong>${formatarData(agendamento.dataHora)}</strong> às <strong>${formatarHora(agendamento.dataHora)}</strong>.`;
    abrirModal('modalRemarcar');
}

// --- Funções de Preenchimento (Populators) ---

function popularDropdownBarbeiros(barbeiros) {
    const selectBarbeiro = document.getElementById('barbeiro');
    // Adiciona uma opção padrão "Qualquer um" se não existir
    if (!selectBarbeiro.querySelector('option[value=""]')) {
        const optionDefault = document.createElement('option');
        optionDefault.value = "";
        optionDefault.textContent = "Qualquer um";
        selectBarbeiro.prepend(optionDefault); // Adiciona no início
    }
    
    barbeiros.forEach(barbeiro => {
        const option = document.createElement('option');
        option.value = barbeiro.nome;
        option.textContent = barbeiro.nome;
        selectBarbeiro.appendChild(option);
    });
}

function popularNotificacoes(notificacoes) {
    const containerNotificacoes = document.querySelector('.notificacoes-area');
    containerNotificacoes.innerHTML = '';
    notificacoes.forEach(notif => {
        const divAlerta = document.createElement('div');
        divAlerta.className = `alerta ${notif.tipo}`;
        divAlerta.innerHTML = notif.mensagem;
        containerNotificacoes.appendChild(divAlerta);
    });
}

function popularDashboard(agendamentos) {
    const agora = new Date();
    const containerProximo = document.querySelector('.proximo-corte');
    const proximo = agendamentos.find(ag => new Date(ag.dataHora) > agora && ag.status === 'agendado');

    if (proximo) {
        containerProximo.innerHTML = `
            <h3>Seu próximo agendamento:</h3>
            <div class="detalhes">
                Dia: <strong>${formatarData(proximo.dataHora)}</strong> às <strong>${formatarHora(proximo.dataHora)}</strong>
                <br> com o Barbeiro: <strong>${proximo.barbeiro}</strong>
                <br> Serviço: <strong>${proximo.servico}</strong>
            </div>
            <div class="botoes-acao">
                <button class="btn-remarcar" id="btn-abrir-remarcar">Remarcar</button>
                <button class="btn-desmarcar" id="btn-abrir-desmarcar">Desmarcar Corte</button>
            </div>`;
        
        // Adiciona listeners aos botões criados dinamicamente
        document.getElementById('btn-abrir-remarcar').onclick = () => abrirModalRemarcar(proximo);
        document.getElementById('btn-abrir-desmarcar').onclick = () => abrirModalDesmarcar(proximo._id);

    } else {
        containerProximo.innerHTML = `
            <h3>Você não tem nenhum agendamento futuro.</h3>
            <div class="detalhes">Clique em "Agendar Novo Corte" para marcar seu horário!</div>`;
    }

    // Popular Histórico
    const listaHistorico = document.querySelector('.historico-lista');
    const historico = agendamentos
        .filter(ag => new Date(ag.dataHora) < agora)
        .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    
    listaHistorico.innerHTML = '';
    if (historico.length === 0) {
        listaHistorico.innerHTML = '<li class="historico-item"><div class="info"><span>Seu historico de cortes aparecerá aqui.</span></div></li>';
    } else {
        historico.forEach(ag => {
            let feedbackButtonHtml = '<span class="feedback-concluido"></span>'; // Padrão
            if (ag.status === 'concluido') {
                if (ag.feedbackEnviado) {
                    feedbackButtonHtml = '<span class="feedback-concluido">Feedback Enviado</span>';
                } else {
                    // Adiciona o ID único ao botão de feedback
                    feedbackButtonHtml = `<a href="#" class="btn-feedback" id="feedback-${ag._id}">Deixar Feedback</a>`;
                }
            } else if (ag.status === 'cancelado') {
                 feedbackButtonHtml = '<span class="feedback-concluido" style="color: #dc3545;">Cancelado</span>';
            }

            const valorFormatado = ag.valor ? `R$ ${ag.valor.toFixed(2)}` : 'N/D';
            const item = `
                <li class="historico-item">
                    <div class="info">
                        <span class="servico">${ag.servico}</span>
                        <span>Data: ${formatarData(ag.dataHora)} às ${formatarHora(ag.dataHora)}</span>
                        <span>Barbeiro: ${ag.barbeiro}</span>
                        <span>Valor: <strong>${valorFormatado}</strong></span>
                    </div>
                    ${feedbackButtonHtml}
                </li>`;
            listaHistorico.innerHTML += item;
        });

        // Adiciona listeners para os botões de feedback após o innerHTML
        historico.forEach(ag => {
            if (ag.status === 'concluido' && !ag.feedbackEnviado) {
                const btn = document.getElementById(`feedback-${ag._id}`);
                if(btn) {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        enviarFeedback(ag._id, ag.barbeiro);
                    };
                }
            }
        });
    }
}

// --- LÓGICA PRINCIPAL (Ao Carregar) ---
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('barberToken');
    const nomeCliente = localStorage.getItem('barberUserNome');

    if (!token) {
        alert('Acesso negado. Por favor, faça login.');
        window.location.href = 'BarberLOGIN.html';
        return;
    }

    const headerTitulo = document.querySelector('.header h1');
    if (nomeCliente) headerTitulo.textContent = `Olá, ${nomeCliente}`;

    // Adiciona listeners aos botões estáticos (abrir modal)
    document.querySelector('.btn-agendar').onclick = () => abrirModal('modalAgendamento');
    document.querySelector('.close-button[onclick*="modalAgendamento"]').onclick = () => fecharModal('modalAgendamento');
    document.querySelector('.btn-cancelar-modal[onclick*="modalAgendamento"]').onclick = () => fecharModal('modalAgendamento');
    
    document.querySelector('.close-button[onclick*="modalDesmarcar"]').onclick = () => fecharModal('modalDesmarcar');
    document.querySelector('.btn-cancelar-modal[onclick*="modalDesmarcar"]').onclick = () => fecharModal('modalDesmarcar');

    document.querySelector('.close-button[onclick*="modalRemarcar"]').onclick = () => fecharModal('modalRemarcar');
    document.querySelector('.btn-cancelar-modal[onclick*="modalRemarcar"]').onclick = () => fecharModal('modalRemarcar');

    // Adiciona listeners aos cliques no overlay para fechar
    document.getElementById('modalAgendamento').onclick = () => fecharModal('modalAgendamento');
    document.getElementById('modalDesmarcar').onclick = () => fecharModal('modalDesmarcar');
    document.getElementById('modalRemarcar').onclick = () => fecharModal('modalRemarcar');
    // Impede que o clique no conteúdo feche o modal
    document.querySelectorAll('.modal-content').forEach(modal => {
        modal.onclick = (e) => e.stopPropagation();
    });


    // Buscar Dados da API
    try {
        const headers = { 'Authorization': 'Bearer ' + token };
        
        // Fetch 1: Agendamentos
        const resAgendamentos = await fetch(`${API_URL}/agendamentos/meus`, { headers }); // URL ATUALIZADA
        if (!resAgendamentos.ok) throw new Error('Erro ao buscar agendamentos');
        const agendamentos = await resAgendamentos.json();
        popularDashboard(agendamentos);

        // Fetch 2: Notificações
        const resNotif = await fetch(`${API_URL}/agendamentos/notificacoes`, { headers }); // URL ATUALIZADA
        if (resNotif.ok) popularNotificacoes(await resNotif.json());

        // Fetch 3: Barbeiros
        const resBarb = await fetch(`${API_URL}/agendamentos/barbeiros`, { headers }); // URL ATUALIZADA
        if (resBarb.ok) popularDropdownBarbeiros(await resBarb.json());

    } catch (error) {
        console.error('Erro ao carregar dados: ', error);
        if (error.message.includes('Token')) {
            alert('Sua sessão expirou. Por favor, faça login novamente.');
            localStorage.clear();
            window.location.href = 'BarberLOGIN.html';
        }
    }
});

// --- Listeners dos Formulários dos Modais ---

// Formulário de AGENDAMENTO
document.getElementById('form-agendar').addEventListener('submit', async function (event) {
    event.preventDefault();
    const servico = document.getElementById('servico').value;
    const barbeiro = document.getElementById('barbeiro').value;
    const dia = document.getElementById('dia').value;
    const horario = document.getElementById('horario').value;
    const token = localStorage.getItem('barberToken');

    try {
        const response = await fetch(`${API_URL}/agendamentos`, { // URL ATUALIZADA
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ servico, barbeiro, dia, horario })
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fecharModal('modalAgendamento');
            window.location.reload();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.log('Erro ao agendar: ', error);
        alert('Erro ao agendar. Por favor, tente novamente.');
    }
});

// Formulário de CANCELAMENTO
document.getElementById('form-cancelar').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!idParaCancelar) {
        alert('Erro: ID do agendamento não encontrado.');
        return;
    }
    const token = localStorage.getItem('barberToken');

    try {
        const response = await fetch(`${API_URL}/agendamentos/${idParaCancelar}`, { // URL ATUALIZADA
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            idParaCancelar = null;
            fecharModal('modalDesmarcar');
            window.location.reload();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao cancelar o agendamento: ', error);
        alert('Erro ao conectar com o servidor.');
    }
});

// Formulário de REMARCAÇÃO
document.getElementById('form-remarcar').addEventListener('submit', async function (event) {
    event.preventDefault();
    const dia = document.getElementById('nova-data').value;
    const horario = document.getElementById('novo-horario').value;

    if (!idParaRemarcar) {
        alert('Erro: ID do agendamento não encontrado.');
        return;
    }
    const token = localStorage.getItem('barberToken');

    try {
        const response = await fetch(`${API_URL}/agendamentos/${idParaRemarcar}`, { // URL ATUALIZADA
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ dia: dia, horario: horario })
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            idParaRemarcar = null;
            fecharModal('modalRemarcar');
            window.location.reload();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao remarcar o agendamento: ', error);
        alert('Erro ao conectar com o servidor.');
    }
});