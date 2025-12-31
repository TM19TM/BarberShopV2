// -_-_-_- /controllers/agendamentoController.js -_-_-_-
// Contém a lógica das rotas do cliente

const Agendamento = require('../models/Agendamento');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// --- FUNÇÕES AUXILIARES DE CONVERSÃO ---
function converterLocalParaUTC(dataLocal) {
    // Se o usuário seleciona 20:00 em São Paulo (UTC-3), 
    // precisamos adicionar 3 horas para armazenar como UTC
    return new Date(dataLocal.getTime() + (3 * 60 * 60000));
}

function converterUTCparaLocal(dataUTC) {
    // Para mostrar ao usuário: UTC - 3 horas
    return new Date(dataUTC.getTime() - (3 * 60 * 60000));
}

// --- ROTA PARA CRIAR UM NOVO AGENDAMENTO (CORRIGIDO DEFINITIVO) ---
exports.criarAgendamento = async (req, res) => {
    try {
        const { servico, barbeiro, dataHora } = req.body;
        const clienteId = req.user.id;

        console.log('DEBUG - Recebido do frontend:', {
            dataHoraRecebida: dataHora,
            momentoRecebimento: new Date().toISOString()
        });

        // 1. A data recebida do frontend está em UTC-3 (horário do usuário)
        const dataHoraLocal = new Date(dataHora);
        
        // 2. Converter para UTC para armazenar no banco
        const dataHoraUTC = converterLocalParaUTC(dataHoraLocal);
        
        // 3. Criar a string visual formatada
        const dataVisual = dataHoraLocal.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', ' às ');

        console.log('DEBUG - Conversões:', {
            dataHoraLocal: dataHoraLocal.toISOString(),
            dataHoraUTC: dataHoraUTC.toISOString(),
            dataVisual
        });

        const novoAgendamento = new Agendamento({
            cliente: clienteId,
            servico,
            barbeiro,
            dataHora: dataHoraUTC, // Salva como UTC+0 no banco
            dataLocal: dataVisual // Salva string formatada para exibição
        });

        await novoAgendamento.save();
        res.status(201).json({ 
            message: 'Agendamento criado com sucesso!',
            agendamento: novoAgendamento
        });
    } catch (error) {
        console.error('Erro ao agendar:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
};

// --- ROTA PARA APAGAR/CANCELAR UM AGENDAMENTO ---
exports.cancelarAgendamento = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const agendamentoId = req.params.id;
        const agendamento = await Agendamento.findById(agendamentoId);

        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        if (agendamento.cliente.toString() !== clienteId) {
            return res.status(403).json({ error: 'Você não tem permissão para cancelar este agendamento.' });
        }

        await Agendamento.findByIdAndDelete(agendamentoId);
        res.status(200).json({ message: 'Agendamento cancelado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cancelar agendamento: ', error);
        res.status(500).json({ error: 'Erro no servidor ao cancelar o agendamentos.' });
    }
};

// --- ROTA PARA ATUALIZAR/REMARCAR UM AGENDAMENTO (CORRIGIDO) ---
exports.remarcarAgendamento = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const agendamentoId = req.params.id;
        
        const { dataHora } = req.body;

        const agendamento = await Agendamento.findById(agendamentoId);

        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        }
        if (agendamento.cliente.toString() !== clienteId) {
            return res.status(403).json({ error: 'Você não tem permissão para alterar esse agendamento.' });
        }

        // Converter para UTC
        const dataHoraLocal = new Date(dataHora);
        const dataHoraUTC = converterLocalParaUTC(dataHoraLocal);

        // Atualizar com a data convertida para UTC
        agendamento.dataHora = dataHoraUTC;
        agendamento.status = 'agendado';

        // Atualizar também a string visual
        agendamento.dataLocal = dataHoraLocal.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', ' às ');

        await agendamento.save();
        res.status(200).json({ 
            message: 'Agendamento remarcado com sucesso! Nos vemos em breve :)',
            agendamento
        });
    } catch (error) {
        console.error('Erro ao remarcar agendamento: ', error);
        res.status(500).json({ error: 'Erro no servidor ao remarcar agendamento.' });
    }
};

// --- ROTA BUSCAR AGENDAMENTOS DO CLIENTE ---
exports.getMeusAgendamentos = async (req, res) => {
    try {
        const clientId = req.user.id;
        const agendamentos = await Agendamento.find({ cliente: clientId }).sort({ dataHora: 1 });
        
        // Converter horários UTC do banco para horário local (UTC-3)
        const agendamentosConvertidos = agendamentos.map(agendamento => {
            const dataHoraUTC = new Date(agendamento.dataHora);
            const dataHoraLocal = converterUTCparaLocal(dataHoraUTC);
            
            // Se dataLocal for inválido, recalcular
            let dataLocalDisplay = agendamento.dataLocal;
            if (!dataLocalDisplay || dataLocalDisplay === "Invalid Date") {
                dataLocalDisplay = dataHoraLocal.toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).replace(',', ' às ');
            }
            
            // Formatar dia da semana
            const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
            const diaSemana = diasSemana[dataHoraLocal.getDay()];
            
            return {
                ...agendamento._doc,
                dataHoraLocal: dataHoraLocal,
                dataHoraDisplay: dataLocalDisplay,
                diaSemana: diaSemana,
                horaLocal: dataHoraLocal.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'America/Sao_Paulo'
                })
            };
        });
        
        res.status(200).json(agendamentosConvertidos);
    } catch (error) {
        console.error('Erro ao buscar agendamentos: ', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar agendamentos.' })
    }
};

// --- ROTA PARA BARBEIRO VER AGENDAMENTOS ---
exports.getAgendamentosBarbeiro = async (req, res) => {
    try {
        const barbeiroNome = req.user.nome;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        // Converter o início do dia para UTC para comparação
        const hojeUTC = converterLocalParaUTC(hoje);
        
        // Buscar agendamentos futuros e de hoje
        const agendamentos = await Agendamento.find({ 
            barbeiro: barbeiroNome,
            dataHora: { $gte: hojeUTC },
            status: 'agendado'
        }).populate('cliente', 'nome').sort({ dataHora: 1 });
        
        // Converter para horário local para exibição
        const agendamentosConvertidos = agendamentos.map(agendamento => {
            const dataHoraUTC = new Date(agendamento.dataHora);
            const dataHoraLocal = converterUTCparaLocal(dataHoraUTC);
            
            return {
                ...agendamento._doc,
                dataHoraLocal: dataHoraLocal,
                horaDisplay: dataHoraLocal.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'America/Sao_Paulo'
                })
            };
        });
        
        res.status(200).json(agendamentosConvertidos);
    } catch (error) {
        console.error('Erro ao buscar agendamentos do barbeiro:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
};

// --- ROTA BUSCAR NOTIFICAÇÃO ---
exports.getMinhasNotificacoes = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const notificacoes = [];
        
        // Usar horário local (UTC-3) para verificação
        const hoje = new Date();
        const hojeLocal = new Date(hoje.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        
        const aniversario = new Date(user.dataNascimento);
        
        // Ajustar fuso horário para comparação
        aniversario.setUTCHours(0, 0, 0, 0);
        const hojeAjustado = new Date(hojeLocal);
        hojeAjustado.setUTCHours(0, 0, 0, 0);

        if (aniversario.getUTCMonth() === hojeAjustado.getMonth() && 
            aniversario.getUTCDate() === hojeAjustado.getDate()) {
            notificacoes.push({
                tipo: 'info',
                mensagem: `<strong>Feliz Aniversário, ${user.nome}!</strong> Você ganhou <strong>10% de desconto</strong> no seu próximo corte como presente!`
            });
        }
        res.status(200).json(notificacoes);
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard: ', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar dados.' })
    }
};

// --- Rota CLIENTE DEIXAR FEEDBACK ---
exports.deixarFeedback = async (req, res) => {
    try {
        const { agendamentoId, barbeiroNome, comentario } = req.body;
        const clienteNome = req.user.nome;

        if (!agendamentoId || !barbeiroNome || !comentario) {
            return res.status(400).json({ error: 'Dados incompletos para o feedback.' });
        }

        const agendamento = await Agendamento.findById(agendamentoId);
        if (!agendamento || agendamento.cliente.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Você não pode deixar feedback para esse agendamento.' });
        }
        if (agendamento.feedbackEnviado === true) {
            return res.status(400).json({ error: 'Você já enviou um feedback para este agendamento.' });
        }

        const novoFeedback = new Feedback({
            agendamentoId,
            barbeiroNome,
            comentario,
            clienteNome
        });

        await novoFeedback.save();
        await Agendamento.findByIdAndUpdate(agendamentoId, { feedbackEnviado: true });

        res.status(201).json({ message: 'Feedback enviado com sucesso! Obrigado!' })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Você já deixou um feedback para esse agendamento (erro DB).' });
        }
        console.error('Erro ao salvar feedback: ', error);
        res.status(500).json({ error: 'Erro no servidor ao salvar feedback.' });
    }
};

// --- ROTA BUSCAR LISTA DE BARBEIROS ---
exports.getBarbeiros = async (req, res) => {
    try {
        const barbeiros = await User.find({ perfil: 'barbeiro' }).select('nome');
        res.status(200).json(barbeiros);
    } catch (error) {
        console.error('Erro ao buscar lista de barbeiros: ', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar barbeiros.' });
    }
};