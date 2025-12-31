// -_-_-_- /controllers/agendamentoController.js -_-_-_-
// Contém a lógica das rotas do cliente

const Agendamento = require('../models/Agendamento');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// --- ROTA PARA CRIAR UM NOVO AGENDAMENTO (CORRIGIDO) ---
exports.criarAgendamento = async (req, res) => {
    try {
        const { servico, barbeiro, dataHora } = req.body;
        const clienteId = req.user.id;

        // 1. Converter o horário local (UTC-3) para UTC+0
        const dataHoraLocal = new Date(dataHora); // Data recebida do frontend (já em UTC-3)
        
        // Converter para UTC para armazenar no banco
        const dataHoraUTC = new Date(dataHoraLocal.getTime() + (dataHoraLocal.getTimezoneOffset() * 60000));
        
        // 2. Criar a string visual "Brasileira" - corrigida
        const dataVisual = new Date(dataHoraLocal).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }); // Vai gerar algo como "31/12/2025, 19:00"

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
            agendamento: {
                ...novoAgendamento._doc,
                dataHoraLocal: dataHoraLocal // Para referência
            }
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
        
        // Recebemos apenas 'dataHora' do frontend (em UTC-3)
        const { dataHora } = req.body;

        const agendamento = await Agendamento.findById(agendamentoId);

        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        }
        if (agendamento.cliente.toString() !== clienteId) {
            return res.status(403).json({ error: 'Você não tem permissão para alterar esse agendamento.' });
        }

        // Converter o horário local (UTC-3) para UTC+0
        const dataHoraLocal = new Date(dataHora);
        const dataHoraUTC = new Date(dataHoraLocal.getTime() + (dataHoraLocal.getTimezoneOffset() * 60000));

        // Atualizar com a data convertida para UTC
        agendamento.dataHora = dataHoraUTC;
        agendamento.status = 'agendado';

        // Atualizar também a string visual
        agendamento.dataLocal = new Date(dataHoraLocal).toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        await agendamento.save();
        res.status(200).json({ 
            message: 'Agendamento remarcado com sucesso! Nos vemos em breve :)',
            dataHora: dataHoraUTC
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
            const dataHoraLocal = new Date(dataHoraUTC.getTime() - (180 * 60000)); // -3 horas (180 minutos)
            
            return {
                ...agendamento._doc,
                dataHoraLocal: dataHoraLocal,
                dataHoraDisplay: dataHoraLocal.toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
        });
        
        res.status(200).json(agendamentosConvertidos);
    } catch (error) {
        console.error('Erro ao buscar agendamentos: ', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar agendamentos.' })
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

// --- FUNÇÃO AUXILIAR: Converter UTC para horário local (UTC-3) ---
function converterUTCparaLocal(dataUTC) {
    return new Date(dataUTC.getTime() - (180 * 60000)); // -3 horas
}

// --- FUNÇÃO AUXILIAR: Converter local (UTC-3) para UTC ---
function converterLocalparaUTC(dataLocal) {
    return new Date(dataLocal.getTime() + (dataLocal.getTimezoneOffset() * 60000));
}