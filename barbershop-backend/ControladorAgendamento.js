// -_-_-_- /controllers/agendamentoController.js -_-_-_-
// Contém a lógica das rotas do cliente

const Agendamento = require('../models/Agendamento');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// --- ROTA PARA CRIAR UM NOVO AGENDAMENTO ---
exports.criarAgendamento = async (req, res) => {
    try {
        const { servico, barbeiro, dia, horario } = req.body;
        const clienteId = req.user.id;
        const dataHoraAgendamento = new Date(dia + 'T' + horario);

        const novoAgendamento = new Agendamento({
            cliente: clienteId,
            servico,
            barbeiro,
            dataHora: dataHoraAgendamento
        });

        await novoAgendamento.save();
        res.status(201).json({ message: 'Seu agendamento foi criado com sucesso! Nos vemos em breve :)' });
    } catch (error) {
        console.error('Erro ao agendar:', error);
        res.status(500).json({ error: 'Infelizmente ocorreu um erro no servidor. Tente novamente mais tarde.' });
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

// --- ROTA PARA ATUALIZAR/REMARCAR UM AGENDAMENTO ---
exports.remarcarAgendamento = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const agendamentoId = req.params.id;
        const { dia, horario } = req.body;

        const agendamento = await Agendamento.findById(agendamentoId);

        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        }
        if (agendamento.cliente.toString() !== clienteId) {
            return res.status(403).json({ error: 'Você não tem permissão para alterar esse agendamento.' });
        }

        const novaDataHora = new Date(dia + 'T' + horario);
        agendamento.dataHora = novaDataHora;
        agendamento.status = 'agendado';

        await agendamento.save();
        res.status(200).json({ message: 'Agendamento remarcado com sucesso! Nos vemos em breve :)' });
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
        res.status(200).json(agendamentos);
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
        const hoje = new Date();
        const aniversario = new Date(user.dataNascimento);

        if (aniversario.getUTCMonth() === hoje.getUTCMonth() && aniversario.getUTCDate() === hoje.getUTCDate()) {
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
            return res.status(400).json({ error: 'Dados incompletospara o feedback.' });
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