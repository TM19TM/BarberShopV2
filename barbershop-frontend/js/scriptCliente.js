// Script para /js/scriptCliente.js

// URL Base da API (ajuste se o backend estiver em outro lugar)
const API_URL = 'https://barbershopv2.onrender.com';

// Função para abrir um modal específico
function abrirModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "flex";
    }
}

// Função para fechar um modal específico
function fecharModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    }
}

// --- FUNÇÃO PARA ENVIAR FEEDBACK ---  
async function enviarFeedback(agendamentoId, barbeiroNome) {
    const comentario = prompt(`Deixe seu feedback sobre o atendimento com ${barbeiroNome}:`);

    if (!comentario || comentario.trim() === '') {
        alert('Feedback cancelado');
        return;
    }

    const token = localStorage.getItem('barberToken');
    const dadosFeedback = {agendamentoId, barbeiroNome, comentario};

    try {
        const response = await fetch(`${API_URL}/agendamentos/feedback`, { // Rota atualizada
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(dadosFeedback)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message); //Feedback enviado com sucesso!
            window.location.reload(); // Recarrega a página
        } else {
            alert('Erro: ' + result.error); // Erro ao enviar feedback ou Feedback já enviado anteriormente
        }
    } catch (error) {
        console.error('Erro ao enviar feedback', error);
        alert('Erro de conexão ao enviar feedback. Por favor, tente novamente.');
    }
}

// --- VARIÁVEL GLOBAL PARA GUARDAR O ID ---
let idParaCancelar = null;
let idParaRemarcar = null;

// --- FUNÇÃO PARA ABRIR O MODAL E DESMARCAR ---
function abrirModalDesmarcar(agendamentoId) {
    idParaCancelar = agendamentoId; // Guarda o ID do agendamento
    abrirModal('modalDesmarcar'); // Abre o modal
}

// --- FUNÇÃO PARA ABRIR O MODAL E REMARCAR ---
function abrirModalRemarcar(agendamento) {
    idParaRemarcar = agendamento._id; // Guarda o ID do agendamento

    const textoModal = document.getElementById('remarcar-texto-atual');
    textoModal.innerHTML = `Seu agendamento atual é: <strong>${formatarData(agendamento.dataHora)}</strong> às <strong>${formatarHora(agendamento.dataHora)}</strong>`;

    abrirModal('modalRemarcar'); // Abre o modal')
}

// -_-_-_- FUNÇÕES AUXILIARES PARA FORMATAR DATA E HORA -_-_-_-
function formatarData(dataISO) { 
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {timeZone: 'UTC', weekday: 'long', day: '2-digit', month: '2-digit'});
}
function formatarHora(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', {timeZone: 'UTC', hour: '2-digit', minute: '2-digit'});
}

// -_-_-_- FUNÇÃO PARA POPULAR OS DADOS -_-_-_-

// --- Função para popular a seleção de barbeiros
function popularDropdownBarbeiros(barbeiros) {
    const selectBarbeiro = document.getElementById('barbeiro');
    // Limpa opções antigas, exceto a primeira (se houver)
    selectBarbeiro.innerHTML = '<option value="">Qualquer um</option>';

    barbeiros.forEach(barbeiro => {
        const option = document.createElement('option');
        option.value = barbeiro.nome; // Colocamos o nome do barbeiro
        option.textContent = barbeiro.nome; // Exibimos o nome do barbeiro
        selectBarbeiro.appendChild(option);
    });
}

// Preenche a área de notificações
function popularNotificacoes(notificacoes) {
    const containerNotificacoes = document.querySelector('.notificacoes-area');
    containerNotificacoes.innerHTML = ''; //Limpa a área

    notificacoes.forEach(notif => {
        const divAlerta = document.createElement('div');
        divAlerta.className = `alerta ${notif.tipo}`; // exemplo - "alerta info"
        divAlerta.innerHTML = notif.mensagem;
        containerNotificacoes.appendChild(divAlerta);
    });
}

// Pega a lista de agendamentos e atualiza o HTML
function popularDashboard(agendamentos) {
    const agora = new Date();
    const containerProximo = document.querySelector('.proximo-corte');

    const proximo = agendamentos.find(ag =>
        new Date(ag.dataHora) > agora && ag.status === 'agendado'
    );

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
            <button class="btn-remarcar" onclick='abrirModalRemarcar(${JSON.stringify(proximo)})'>Remarcar</button>
            <button class="btn-desmarcar" onclick="abrirModalDesmarcar('${proximo._id}')">Desmarcar Corte</button>
        </div>
        `; 
    } else {
        containerProximo.innerHTML = `
        <h3>Você não tem nenhum agendamento futuro.</h3>
        <div class="detalhes">
            Clique em "Agendar Novo Corte" para marcar seu horário!
        </div>
        `;
    }

    // 2. POPULAR O HISTÓRICO DE CORTES
    const listaHistorico = document.querySelector('.historico-lista');
    
    const historico = agendamentos
        .filter(ag => new Date(ag.dataHora) < agora)
        .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    
    listaHistorico.innerHTML = ''; 
    
    if (historico.length === 0) {
        listaHistorico.innerHTML = '<li class="historico-item"><div class="info"><span>Seu historico de cortes aparecerá aqui.</span></div></li>';
    } else {
        historico.forEach(ag => {
            let feedbackButtonHtml = '<span class="feedback-concluido"></span>'; 
            if (ag.status === 'concluido') {
                if (ag.feedbackEnviado) {
                    feedbackButtonHtml = '<span class="feedback-concluido">Feedback Enviado</span>';
                } else {
                    feedbackButtonHtml = `<a href="#" class="btn-feedback" onclick="event.preventDefault(); enviarFeedback('${ag._id}', '${ag.barbeiro}')">Deixar Feedback</a>`;
                }
            } else if (ag.status === 'cancelado') {
                feedbackButtonHtml = '<span class="feedback-concluido" style="color: #dc3545;">Cancelado</span>';
            }
        
            const item = `
                <li class="historico-item">
                    <div class="info">
                        <span class="servico">${ag.servico}</span>
                        <span>Data: ${formatarData(ag.dataHora)} às ${formatarHora(ag.dataHora)}</span>
                        <span>Barbeiro: ${ag.barbeiro}</span>
                        <span>Valor: <strong>${ag.valor ? `R$ ${ag.valor.toFixed(2)}` : 'N/D'}</strong></span>
                    </div>
                    ${feedbackButtonHtml}
                </li>
                `;
            listaHistorico.innerHTML += item;
        });
    }
}


// --- LÓGICA PRINCIPAL (Ao Carregar) ---
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('barberToken');
    const nomeCliente = localStorage.getItem('barberUserNome');

    // nav.js já cuida da verificação de token, mas checamos de novo
    if (!token) {
        console.error("cliente.js: Token não encontrado, aguardando redirecionamento do nav.js");
        return;
    }

    const headerTitulo = document.querySelector('.header h1');
    if (nomeCliente){
        headerTitulo.textContent = `Olá, ${nomeCliente}`;
    }

    try {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        };

        // 1. Buscar Agendamentos
        const resAgendamentos = await fetch(`${API_URL}/agendamentos/meus`, { headers });
        if (!resAgendamentos.ok) throw new Error('Erro ao buscar agendamentos');
        const agendamentos = await resAgendamentos.json();
        popularDashboard(agendamentos);

        // 2. Buscar Notificações
        const resNotificacoes = await fetch(`${API_URL}/agendamentos/notificacoes`, { headers });
        if (resNotificacoes.ok) {
            popularNotificacoes(await resNotificacoes.json());
        } else {
            console.error('Não foi possivel buscar as notificações.');
        }

        // 3. Buscar Barbeiros
        const resBarbeiros = await fetch(`${API_URL}/agendamentos/barbeiros`, { headers });
        if (resBarbeiros.ok) {
            popularDropdownBarbeiros(await resBarbeiros.json());
        } else {
            console.error('Não foi possivel buscar a lista de barbeiros.');
        }

    } catch (error) {
        console.error('Erro ao carregar dados: ', error);
        if (error.message.includes('Token')) {
            alert('Sua sessão expirou. Por favor, faça login novamente.');
            localStorage.clear(); 
            window.location.href = 'BarberLOGIN.html';
        }
    }
});

// --- ENVIAR O FORMULÁRIO DE AGENDAMENTO ---
const formAgendamento = document.getElementById('form-agendar');
formAgendamento.addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const servico = document.getElementById('servico').value;
    const barbeiro = document.getElementById('barbeiro').value;
    const dia = document.getElementById('dia').value;
    const horario = document.getElementById('horario').value;

    const token = localStorage.getItem('barberToken');
    const dadosAgendamento = {servico, barbeiro, dia, horario};
    
    try {
        const response = await fetch(`${API_URL}/agendamentos/novo`, { // Rota atualizada
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(dadosAgendamento)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            fecharModal('modalAgendamento');
            window.location.reload(); 
        } else {
            alert('Erro: '+ result.error);
        }
    } catch (error) {
        console.log('Erro ao agendar: ', error);
        alert('Erro ao agendar. Por favor, tente novamente mais tarde.');
    }
});

// --- FORMULÁRIO DE CANCELAMENTO ---
const formCancelamento = document.getElementById('form-cancelar');
formCancelamento.addEventListener('submit', async function(event) {
    event.preventDefault(); 

    if (!idParaCancelar) {
        alert('Erro: ID do agendamento não encontrado.');
        return;
    }
    const token = localStorage.getItem('barberToken');

    try {
        const response = await fetch(`${API_URL}/agendamentos/${idParaCancelar}`, {
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
        alert('Erro ao conectar com o servidor. Por favor, tente novamente mais tarde.');
    }
});

// --- FORMULÁRIO DE REMARCAÇÃO ---
const formRemarcar = document.getElementById('form-remarcar');
formRemarcar.addEventListener('submit', async function(event) {
    event.preventDefault();

    const dia = document.getElementById('nova-data').value;
    const horario = document.getElementById('novo-horario').value;

    if (!idParaRemarcar) {
        alert('Erro: ID do agendamento não encontrado.');
        return;
    }
    const token = localStorage.getItem('barberToken');

    try {
        const response = await fetch(`${API_URL}/agendamentos/${idParaRemarcar}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({dia: dia, horario: horario}) 
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            idParaRemarcar = null;
            fecharModal('modalRemarcar');
            window.location.reload()
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        console.error('Erro ao remarcar o agendamento: ', error);
        alert('Erro ao conectar com o servidor. Por favor, tente novamente mais tarde.');
    }
});