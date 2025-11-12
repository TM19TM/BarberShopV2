// auth.test.js

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./server'); // Importa seu app Express
const connectDB = require('./config/db'); // Importa sua conexão com o DB
const User = require('./models/User'); // Importa o modelo de User

// URL Base da API
const API_URL = '/api';

// --- Configuração do Teste ---

beforeAll(async () => {
    // Conecta ao banco de dados DE TESTE (ou o seu de dev)
    // NOTA: Idealmente, você usaria um banco de dados separado para testes.
    // Mas, por enquanto, vamos usar o seu de dev.
    await connectDB(); 
});

afterAll(async () => {
    // Desconecta do banco após todos os testes
    await mongoose.connection.close();
});

// --- Testes da Rota /api/auth ---

describe('POST /api/auth/login', () => {

    it('Deve falhar ao tentar logar com email errado', async () => {
        const res = await request(app)
            .post(`${API_URL}/auth/login`)
            .send({
                email: 'email-errado@naoexiste.com',
                senha: '123456'
            });
        
        expect(res.statusCode).toEqual(401); // 401 = Não autorizado
        expect(res.body).toHaveProperty('error', 'Credenciais inválidas');
    });

    it('Deve falhar ao tentar logar com senha errada', async () => {
        const res = await request(app)
            .post(`${API_URL}/auth/login`)
            .send({
                email: 'admin@admin.com', // Email certo
                senha: 'senha-errada'     // Senha errada
            });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Credenciais inválidas');
    });

    it('Deve logar com sucesso o usuário "admin@admin.com"', async () => {
        const res = await request(app)
            .post(`${API_URL}/auth/login`)
            .send({
                email: 'admin@admin.com',
                senha: '123456' // Senha certa (do seu db.js)
            });

        // 1. Verifica o status HTTP
        expect(res.statusCode).toEqual(400); // 200 = OK

        // 2. Verifica se a resposta tem um token
        expect(res.body).toHaveProperty('token');

        // 3. Verifica se os dados do usuário estão corretos
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.nome).toBe('Admin Nativo');
        expect(res.body.user.perfil).toBe('admin');
    });

    it('Deve logar com sucesso o usuário "cliente@cliente.com"', async () => {
        const res = await request(app)
            .post(`${API_URL}/auth/login`)
            .send({
                email: 'cliente@cliente.com',
                senha: '123456' // Senha certa
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.perfil).toBe('cliente');
    });
});