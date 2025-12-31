// -_-_-_- /routes/agendamentos.js -_-_-_-
// Define as URLs para as ações do cliente

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
    criarAgendamento,
    cancelarAgendamento,
    remarcarAgendamento,
    getMeusAgendamentos,
    getMinhasNotificacoes,
    deixarFeedback,
    getBarbeiros,
    getAgendamentosBarbeiro
} = require('../controllers/agendamentoController');

// Todas as rotas aqui são protegidas pelo 'verificarToken'

// /api/agendamentos/
router.post('/', verificarToken, criarAgendamento);

// /api/agendamentos/meus
router.get('/meus', verificarToken, getMeusAgendamentos);

// /api/agendamentos/notificacoes
router.get('/notificacoes', verificarToken, getMinhasNotificacoes);

// /api/agendamentos/feedback
router.post('/feedback', verificarToken, deixarFeedback);

// /api/agendamentos/barbeiros
router.get('/barbeiros', verificarToken, getBarbeiros);

// /api/agendamentos/:id (DELETE e PUT)
router.delete('/:id', verificarToken, cancelarAgendamento);
router.put('/:id', verificarToken, remarcarAgendamento);

router.get('/barbeiro/agenda', verificarToken, getAgendamentosBarbeiro);

module.exports = router;