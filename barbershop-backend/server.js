// -_-_-_- server.js (Ponto de Entrada Principal) -_-_-_-

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Importa a conexão do DB

// --- Inicialização do App ---
const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta do .env ou 3000

// --- Conexão com o Banco de Dados ---
connectDB();

// --- Middlewares Globais ---
app.use(cors()); // Habilita o CORS
app.use(express.json()); // Habilita o parsing de JSON

// --- Importação das Rotas ---
const authRoutes = require('./routes/auth');
const agendamentoRoutes = require('./routes/agendamentos');
const barbeiroRoutes = require('./routes/barbeiro');
const staffRoutes = require('./routes/staff');

// --- Definição das Rotas Principais ---
// Todas as rotas de autenticação (login, register) estarão em /api/auth
app.use('/api/auth', authRoutes); 
// Todas as rotas de cliente (agendar, cancelar) estarão em /api/agendamentos
app.use('/api/agendamentos', agendamentoRoutes);
// Todas as rotas de barbeiro (minha-agenda, concluir) estarão em /api/barbeiro
app.use('/api/barbeiro', barbeiroRoutes);
// Todas as rotas de staff (admin, recepção) estarão em /api/staff
app.use('/api/staff', staffRoutes);

// --- Rota de Teste (Opcional) ---
app.get('/', (req, res) => {
    res.send('API da Barbearia está no ar!');
});

// -_-_-_- Iniciar o Servidor -_-_-_-

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Seu servidor Backend está rodando em http://localhost:${PORT} \n Tenha um ótimo dia :)`)
    });
}

module.exports = app;