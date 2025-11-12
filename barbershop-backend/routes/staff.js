// -_-_-_- /routes/staff.js -_-_-_-
// Define as URLs para as ações da Recepção e Admin

const express = require('express');
const router = express.Router();
const { verificarToken, verificarStaff } = require('../middleware/auth');
const {
    getAgendaDoDia,
    getPagamentosPendentes,
    processarPagamento,
    getTodosFeedbacks,
    getDashboardAdmin
} = require('../controllers/staffController');

// Todas as rotas aqui são protegidas por DOIS middlewares:
// 1. verificarToken (saber se está logado)
// 2. verificarStaff (saber se é admin ou recepção)
const authStaff = [verificarToken, verificarStaff];

// /api/staff/agenda-dia
router.get('/agenda-dia', authStaff, getAgendaDoDia);

// /api/staff/pagamentos-pendentes
router.get('/pagamentos-pendentes', authStaff, getPagamentosPendentes);

// /api/staff/pagar/:id
router.put('/pagar/:id', authStaff, processarPagamento);

// /api/staff/feedbacks-todos
router.get('/feedbacks-todos', authStaff, getTodosFeedbacks);

// /api/staff/dashboard-admin
router.get('/dashboard-admin', authStaff, getDashboardAdmin);

module.exports = router;