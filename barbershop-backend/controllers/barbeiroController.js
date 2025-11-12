// -_-_-_- /controllers/barbeiroController.js -_-_-_-
// Contém a lógica das rotas do barbeiro

const Agendamento = require('../models/Agendamento');
const Feedback = require('../models/Feedback');

// --- ROTA BUSCAR AGENDA DO BARBEIRO ---
exports.getMinhaAgenda = async (req, res) => {
    try {
        const nomeBarbeiro = req.user.nome;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const agenda = await Agendamento.find({
            barbeiro: nomeBarbeiro,
            dataHora: { $gte: hoje },
            status: 'agendado'
        })
            .sort({ dataHora: 1 })
            .populate('cliente', 'nome');

        res.status(200).json(agenda);
    } catch (error) {
        console.error('Erro ao buscar agenda do barbeiro:', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar agenda.' })
    }
};

// --- ROTA BUSCAR FEEDBACK DO BARBEIRO ---
exports.getMeusFeedbacks = async (req, res) => {
    try {
        const nomeBarbeiro = req.user.nome;
        const feedbacks = await Feedback.find({ barbeiroNome: nomeBarbeiro })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('agendamentoId', 'valor');

        res.status(200).json(feedbacks);
    } catch (error) {
        console.error('Erro ao buscar feedbacks: ', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar feedbacks' });
    }
};

// --- ROTA PARA O BARBEIRO CONCLUIR UM ATENDIMENTO ---
exports.concluirAtendimento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;
        const nomeBarbeiro = req.user.nome;
        const { valor } = req.body;

        if (valor === undefined || valor === null || isNaN(valor) || valor < 0) {
            return res.status(400).json({ error: 'Valor inválido.' });
        }

        const agendamento = await Agendamento.findById(agendamentoId);
        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        }
        if (agendamento.barbeiro !== nomeBarbeiro) {
            return res.status(403).json({ error: 'Você não tem permissão para concluir esse atendimento.' });
        }
        if (agendamento.status === 'concluido') {
            return res.status(400).json({ error: 'Este atendimento já foi concluído.' })
        }

        agendamento.status = 'concluido';
        agendamento.valor = valor;
        agendamento.dataHora = new Date(); // Atualiza a data para o momento da conclusão
        await agendamento.save();

        res.status(200).json({ message: 'Atendimento concluído com sucesso!.' });
    } catch (error) {
        console.error('Erro ao concluir agendamento: ', error);
        res.status(500).json({ error: 'Erro no servidor ao concluir o atendimento.' });
    }
};

// --- ROTA PARA O BARBEIRO ADICIONAR UM WALK-IN ---
exports.addWalkin = async (req, res) => {
    try {
        const { clienteNome, servico, valor } = req.body;
        const nomeBarbeiro = req.user.nome;

        if (!clienteNome || !servico || valor === undefined) {
            return res.status(400).json({ error: 'Nome do cliente, serviço e valor são obrigatorios' });
        }
        if (isNaN(valor) || valor < 0) {
            return res.status(400).json({ error: 'Valor inválido.' });
        }

        const novoAgendamento = new Agendamento({
            barbeiro: nomeBarbeiro,
            clienteNomeWalkin: clienteNome,
            servico: servico,
            valor: valor,
            dataHora: new Date(),
            status: 'concluido'
        });

        await novoAgendamento.save();
        res.status(201).json({ message: 'Atendimento walk-in registrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao registrar walk-in: ', error);
        res.status(500).json({ error: 'Erro no servidor ao registrar walk-in.' });
    }
};

// --- ROTA BUSCAR ESTATÍSTTICA DO BARBEIRO (CONTADOR) ---
exports.getEstatisticas = async (req, res) => {
    try {
        const nomeBarbeiro = req.user.nome;
        const hojeInicio = new Date();
        hojeInicio.setHours(0, 0, 0, 0);
        const hojeFim = new Date();
        hojeFim.setHours(23, 59, 59, 999);

        const totalConcluidos = await Agendamento.countDocuments({
            barbeiro: nomeBarbeiro,
            status: 'concluido',
            dataHora: { $gte: hojeInicio, $lte: hojeFim }
        });

        res.status(200).json({ totalConcluidos: totalConcluidos });
    } catch (error) {
        console.error('Erro ao buscar estatísticas: ', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar estatísticas.' });
    }
};