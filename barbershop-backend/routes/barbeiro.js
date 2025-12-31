// -_-_-_- /routes/barbeiro.js -_-_-_-
// Define as URLs para as ações do painel do barbeiro

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth'); // Middleware para garantir que está logado
const {
    getMinhaAgenda,
    getMeusFeedbacks,
    concluirAtendimento,
    addWalkin,
    getEstatisticas
} = require('../controllers/barbeiroController'); // Importa o controlador CORRETO

// Todas as rotas aqui são prefixadas com /api/barbeiro (definido no server.js)

// GET /api/barbeiro/agenda -> Busca os agendamentos de hoje
router.get('/agenda', verificarToken, getMinhaAgenda);

// GET /api/barbeiro/feedbacks -> Busca os feedbacks recentes
router.get('/feedbacks', verificarToken, getMeusFeedbacks);

// GET /api/barbeiro/estatisticas -> Busca contagem de cortes
router.get('/estatisticas', verificarToken, getEstatisticas);

// POST /api/barbeiro/walkin -> Adiciona um cliente que veio sem marcar
router.post('/walkin', verificarToken, addWalkin);

// PUT /api/barbeiro/concluir/:id -> Marca um atendimento como concluído
router.put('/concluir/:id', verificarToken, concluirAtendimento);

module.exports = router;