// Script para /js/scriptBarbeiro.js

// URL Base da API 
const API_URL = 'https://barbershopv2.onrender.com/api';

// --- Função para o Barbeiro concluir o atendimento ---
async function concluirAtendimento(agendamentoId) {
    const valorInput = prompt("Qual o valor final do serviço? (Ex: 50)");
    if (!valorInput) {
        alert('Cancelado.');
        return;
    }

    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor < 0) {
        alert('Valor inválido. Por favor digite apenas números.');
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

// --- Função para obter a hora formatada CORRETA ---
function obterHoraFormatada(agendamento) {
    console.log('DEBUG obterHoraFormatada - objeto:', agendamento);
    
    // 1. PRIMEIRA OPÇÃO: Se já tiver horaDisplay formatada do backend, use ela
    if (agendamento.horaDisplay) {
        console.log('Usando horaDisplay do backend:', agendamento.horaDisplay);
        return agendamento.horaDisplay;
    }
    
    // 2. SEGUNDA OPÇÃO: Se tiver dataHoraLocal, formate ela
    if (agendamento.dataHoraLocal) {
        const dataLocal = new Date(agendamento.dataHoraLocal);
        const horaFormatada = dataLocal.toLocaleTimeString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
        console.log('Formatando dataHoraLocal:', horaFormatada);
        return horaFormatada;
    }
    
    // 3. TERCEIRA OPÇÃO: Converter manualmente de UTC para São Paulo (-3 horas)
    if (agendamento.dataHora) {
        const dataUTC = new Date(agendamento.dataHora);
        // Subtrair 3 horas para converter UTC para horário de São Paulo
        dataUTC.setHours(dataUTC.getHours() - 3);
        
        const horas = dataUTC.getHours().toString().padStart(2, '0');
        const minutos = dataUTC.getMinutes().toString().padStart(2, '0');
        
        const horaManual = `${horas}:${minutos}`;
        console.log('Conversão manual UTC->SP:', {
            entrada: agendamento.dataHora,
            saida: horaManual
        });
        return horaManual;
    }
    
    console.warn('Nenhuma informação de hora disponível:', agendamento);
    return '--:--';
}

// --- Função para preencher a agenda no HTML ---
function popularAgenda(agendamentos) {
    const listaContainer = document.querySelector('.agenda-lista');
    listaContainer.innerHTML = '';

    console.log('DEBUG popularAgenda - dados recebidos:', agendamentos);

    if (agendamentos.length === 0) {
        listaContainer.innerHTML = '<li class="agenda-item"><span class="info">Você não tem clientes agendados para hoje.</span></li>';
        return;
    }

    agendamentos.forEach(ag => {
        const nomeCliente = ag.cliente ? ag.cliente.nome : 'Cliente Removido';
        
        // Use a função corrigida para obter a hora
        const horaFormatada = obterHoraFormatada(ag);
        
        console.log('DEBUG - Item da agenda:', {
            cliente: nomeCliente,
            horaDisplay: ag.horaDisplay,
            dataHora: ag.dataHora,
            dataHoraLocal: ag.dataHoraLocal,
            horaFormatadaFinal: horaFormatada
        });
        
        const itemHtml = `
        <li class="agenda-item">
            <div>
                <span class="horario">${horaFormatada}</span>
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
        console.log('Fazendo requisição para agenda...');
        const response = await fetch(`${API_URL}/barbeiro/agenda`, { headers }); 
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Não foi possivel carregar sua agenda');
        }
        const agenda = await response.json();
        console.log('Agenda recebida:', agenda);
        popularAgenda(agenda);    
        
        // 2. Requisição Feedbacks
        console.log('Fazendo requisição para feedbacks...');
        const responseFeedback = await fetch(`${API_URL}/barbeiro/feedbacks`, { headers }); 
        if (!responseFeedback.ok) throw new Error('Erro ao carregar feedbacks');
        const feedbacks = await responseFeedback.json();
        popularFeedbacks(feedbacks);

        // 3. Requisição Estatística
        console.log('Fazendo requisição para estatísticas...');
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

// --- Função de teste para verificar dados ---
async function testeDadosAgenda() {
    const token = localStorage.getItem('barberToken');
    if (!token) {
        console.log('Token não encontrado');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/barbeiro/agenda`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        console.log('TESTE - Dados completos da agenda:', JSON.stringify(data, null, 2));
        
        if (data.length > 0) {
            console.log('TESTE - Primeiro agendamento detalhado:', {
                dataHora: data[0].dataHora,
                dataHoraLocal: data[0].dataHoraLocal,
                horaDisplay: data[0].horaDisplay,
                cliente: data[0].cliente?.nome
            });
        }
    } catch (error) {
        console.error('TESTE - Erro:', error);
    }
}

// Para testar, execute no console: testeDadosAgenda()