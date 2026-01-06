// URL Base da API (ajuste se o backend estiver em outro lugar)
const API_URL = 'https://barbershopv2.onrender.com/api';

// --- VARIÁVEIS GLOBAIS DE CONTROLE ---
let idParaCancelar = null;
let idParaRemarcar = null;

// --- FUNÇÕES DE MODAL (Globais para funcionarem no HTML onclick) ---
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "flex";
    }
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    }
}

// --- FUNÇÕES AUXILIARES DE DATA (Compatíveis com a correção do Backend) ---
function formatarData(dataISO) { 
    if (!dataISO) return 'Data Inválida';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: '2-digit'});
}

function formatarHora(dataISO) {
    if (!dataISO) return '';
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', {timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit'});
}

// --- FUNÇÕES DE AÇÃO DO USUÁRIO ---
function abrirModalDesmarcar(agendamentoId) {
    idParaCancelar = agendamentoId; 
    abrirModal('modalDesmarcar'); 
}

function abrirModalRemarcar(agendamentoObjeto) {
    // Se vier como string (do HTML), converte de volta se necessário, 
    // mas geralmente passamos o objeto. Se der erro, passamos só o ID e buscamos dados.
    // Para simplificar no onclick do HTML: onclick='abrirModalRemarcar(this.dataset.agendamento)'
    
    // Assumindo que o objeto chega corretamente via JSON.stringify no HTML
    idParaRemarcar = agendamentoObjeto._id; 

    const textoModal = document.getElementById('remarcar-texto-atual');
    if(textoModal) {
        textoModal.innerHTML = `Seu agendamento atual é: <strong>${formatarData(agendamentoObjeto.dataHora)}</strong> às <strong>${formatarHora(agendamentoObjeto.dataHora)}</strong>`;
    }

    abrirModal('modalRemarcar'); 
}

async function enviarFeedback(agendamentoId, barbeiroNome) {
    const comentario = prompt(`Deixe seu feedback sobre o atendimento com ${barbeiroNome}:`);

    if (!comentario || comentario.trim() === '') {
        alert('Feedback cancelado');
        return;
    }

    const token = localStorage.getItem('barberToken');
    const dadosFeedback = {agendamentoId, barbeiroNome, comentario};

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


// =========================================================
// === LÓGICA PRINCIPAL (CARREGAMENTO DO DOM) ===
// =========================================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. VERIFICAÇÃO DE AUTENTICAÇÃO
    const token = localStorage.getItem('barberToken');
    const nomeCliente = localStorage.getItem('barberUserNome');

    if (!token) {
        console.error("Token não encontrado. Redirecionando...");
        window.location.href = 'BarberLOGIN.html'; // Força redirecionamento se não tiver token
        return;
    }

    // 2. ATUALIZA HEADER
    const headerTitulo = document.querySelector('.header h1');
    if (nomeCliente && headerTitulo){
        headerTitulo.textContent = `Olá, ${nomeCliente}`;
    }

    // 3. CONFIGURAÇÃO DOS EVENT LISTENERS (Aqui estava o erro!)
    // Movemos para cá para garantir que o HTML já existe
    
    // -- Form Agendar --
    const formAgendamento = document.getElementById('form-agendar');
    if (formAgendamento) {
        formAgendamento.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            const servico = document.getElementById('servico').value;
            const barbeiro = document.getElementById('barbeiro').value;
            const dia = document.getElementById('dia').value;
            const horario = document.getElementById('horario').value;

            if (!dia || !horario) { alert("Selecione dia e horário."); return; }

            // Lógica de Fuso: Navegador (BRT) -> ISO (UTC) -> Backend
            const dataLocal = new Date(`${dia}T${horario}`);
            const dataHoraISO = dataLocal.toISOString();

            try {
                const response = await fetch(`${API_URL}/agendamentos`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ servico, barbeiro, dataHora: dataHoraISO })
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
                alert('Erro ao agendar.');
            }
        });
    }

    // -- Form Cancelar --
    const formCancelamento = document.getElementById('form-cancelar');
    if (formCancelamento) {
        formCancelamento.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            if (!idParaCancelar) return;
            
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
                alert('Erro ao cancelar.');
            }
        });
    }

    // -- Form Remarcar --
    const formRemarcar = document.getElementById('form-remarcar');
    if (formRemarcar) {
        formRemarcar.addEventListener('submit', async function(event) {
            event.preventDefault();
            const dia = document.getElementById('nova-data').value;
            const horario = document.getElementById('novo-horario').value;

            if (!dia || !horario) { alert("Selecione data e horário."); return; }
            if (!idParaRemarcar) return;

            const dataLocal = new Date(`${dia}T${horario}`);
            const dataHoraISO = dataLocal.toISOString();

            try {
                const response = await fetch(`${API_URL}/agendamentos/${idParaRemarcar}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ dataHora: dataHoraISO }) 
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
                alert('Erro ao remarcar.');
            }
        });
    }

    // 4. CARREGAMENTO DE DADOS (POPULAR TELA)
    try {
        const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

        // Agendamentos
        const resAgendamentos = await fetch(`${API_URL}/agendamentos/meus`, { headers });
        if (resAgendamentos.ok) {
            const agendamentos = await resAgendamentos.json();
            popularDashboard(agendamentos);
        }

        // Notificações
        const resNotificacoes = await fetch(`${API_URL}/agendamentos/notificacoes`, { headers });
        if (resNotificacoes.ok) {
            popularNotificacoes(await resNotificacoes.json());
        }

        // Barbeiros
        const resBarbeiros = await fetch(`${API_URL}/agendamentos/barbeiros`, { headers });
        if (resBarbeiros.ok) {
            popularDropdownBarbeiros(await resBarbeiros.json());
        }

    } catch (error) {
        console.error('Erro ao carregar dados iniciais: ', error);
        // Opcional: tratar erro de token aqui também
    }
});

// --- FUNÇÕES DE POPULAR (MANTIDAS EXTERNAS PARA ORGANIZAÇÃO) ---

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
    const containerNotificacoes = document.querySelector('.notificacoes-area');
    if (!containerNotificacoes) return;

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
    
    // Verifica se container existe antes de manipular
    if (!containerProximo) return;

    // Filtra apenas agendamentos futuros
    const proximo = agendamentos.find(ag =>
        new Date(ag.dataHora) > agora && ag.status === 'agendado'
    );

    // Precisamos de um truque para passar o objeto no onclick sem quebrar as aspas
    // A melhor forma é usar encodeURIComponent ou salvar em variavel global, mas aqui vai o fix simples:
    const proximoString = proximo ? JSON.stringify(proximo).replace(/"/g, '&quot;') : '';

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

    // Histórico
    const listaHistorico = document.querySelector('.historico-lista');
    if (!listaHistorico) return;
    
    const historico = agendamentos
        .filter(ag => new Date(ag.dataHora) < agora)
        .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    
    listaHistorico.innerHTML = ''; 
    
    if (historico.length === 0) {
        listaHistorico.innerHTML = '<li class="historico-item"><div class="info"><span>Seu historico de cortes aparecerá aqui.</span></div></li>';
    } else {
        historico.forEach(ag => {
            let feedbackButtonHtml = ''; 
            
            if (ag.status === 'concluido') {
                if (ag.feedbackEnviado) {
                    feedbackButtonHtml = '<span class="feedback-concluido">Feedback Enviado</span>';
                } else {
                    feedbackButtonHtml = `<a href="#" class="btn-feedback" onclick="event.preventDefault(); enviarFeedback('${ag._id}', '${ag.barbeiro}')">Deixar Feedback</a>`;
                }
            } else if (ag.status === 'cancelado') {
                feedbackButtonHtml = '<span class="feedback-concluido" style="color: #dc3545;">Cancelado</span>';
            } else {
                // Caso 'agendado' mas no passado (falta de comparecimento ou sistema não atualizou)
                feedbackButtonHtml = '<span class="feedback-concluido">Pendente</span>';
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