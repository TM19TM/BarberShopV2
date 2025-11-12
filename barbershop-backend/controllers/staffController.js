// -_-_-_- /controllers/staffController.js -_-_-_-
// Contém a lógica das rotas da Recepção e do Admin

const Agendamento = require('../models/Agendamento');
const Feedback = require('../models/Feedback');

// --- ROTA BUSCAR AGENDA DO DIA (TODOS) ---
exports.getAgendaDoDia = async (req, res) => {
    try {
        const hojeInicio = new Date();
        hojeInicio.setHours(0, 0, 0, 0);
        const hojeFim = new Date();
        hojeFim.setHours(23, 59, 59, 999);

        const agenda = await Agendamento.find({
            status: 'agendado',
            dataHora: { $gte: hojeInicio, $lte: hojeFim }
        })
            .sort({ dataHora: 1 })
            .populate('cliente', 'nome');

        res.status(200).json(agenda);
    } catch (error) {
        console.error('Erro ao buscar agenda do dia:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
};

// --- ROTA BUSCAR PAGAMENTOS PENDENTES ---
exports.getPagamentosPendentes = async (req, res) => {
    try {
        const pagamentos = await Agendamento.find({
            status: 'concluido',
            pagamentoStatus: 'pendente'
        })
            .sort({ updatedAt: 1 })
            .populate('cliente', 'nome');

        res.status(200).json(pagamentos);
    } catch (error) {
        console.error('Erro ao buscar pagamentos pendentes:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
};

// --- ROTA PARA PROCESSAR UM PAGAMENTO ---
exports.processarPagamento = async (req, res) => {
    try {
        const agendamentoId = req.params.id;
        const agendamento = await Agendamento.findById(agendamentoId);

        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        }
        if (agendamento.pagamentoStatus === 'pago') {
            return res.status(400).json({ error: 'Este pagamento já foi processado.' });
        }

        agendamento.pagamentoStatus = 'pago';
        await agendamento.save();

        res.status(200).json({ message: 'Pagamento processado com sucesso!' });
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
};

// --- ROTA BUSCAR TODOS FEEDBACKS (ADMIN/RECEPÇÃO) ---
exports.getTodosFeedbacks = async (req, res) => {
    try {
        const { barbeiro } = req.query;
        const filtro = {};
        if (barbeiro) {
            filtro.barbeiroNome = barbeiro;
        };

        const feedbacks = await Feedback.find(filtro)
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json(feedbacks);
    } catch (error) {
        console.error('Erro ao buscar todos feedbacks:', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar feedbacks.' });
    }
};

// --- ROTA PRINCIPAL DO DASHBOARD ADMIN ---
exports.getDashboardAdmin = async (req, res) => {
    try {
        const { dataInicio, dataFim, barbeiro } = req.query;

        const filtro = { status: 'concluido' };
        if (barbeiro) {
            filtro.barbeiro = barbeiro;
        }
        if (dataInicio && dataFim) {
            const fim = new Date(dataFim);
            fim.setDate(fim.getDate() + 1);
            filtro.dataHora = {
                $gte: new Date(dataInicio),
                $lt: fim
            };
        }

        // Cálculos de Faturamento e Atendimentos
        const stats = await Agendamento.aggregate([
            { $match: filtro },
            {
                $group: {
                    _id: null,
                    faturamentoTotal: { $sum: "$valor" },
                    totalAtendimentos: { $sum: 1 }
                }
            }
        ]);

        // Cálculo de Performance dos Barbeiros
        const performance = await Agendamento.aggregate([
            { $match: filtro },
            {
                $group: {
                    _id: "$barbeiro",
                    faturamento: { $sum: "$valor" },
                    atendimentos: { $sum: 1 }
                }
            },
            { $sort: { faturamento: -1 } }
        ]);

        res.status(200).json({
            stats: stats[0] || { faturamentoTotal: 0, totalAtendimentos: 0 },
            performanceBarbeiros: performance
        });

    } catch (error) {
        console.error('Erro ao buscar dados do dashboard admin:', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar dados.' });
    }
};