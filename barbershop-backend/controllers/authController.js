// -_-_-_- /controllers/authController.js -_-_-_-
// Contém toda a lógica de registro, login e recuperação de senha.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const transporter = require('../config/nodemailer');

// --- ROTA DE CADASTRO DE USUÁRIO ---
exports.register = async (req, res) => {
    try {
        const { nome, telefone, dataNascimento, email, senha } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);

        const novoUsuario = new User({
            nome,
            telefone,
            dataNascimento,
            email,
            senha: hashedPassword,
        });

        await novoUsuario.save();
        res.status(201).json({ message: 'Você foi cadastrado com sucesso! Bem vindo a nossa barbearia :)' });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Pelo o que nossos servidores mostram, esse email já está cadastrado...' });
        }
        res.status(500).json({ error: 'Infelizmente ocorreu um erro no servidor. Tente novamente mais tarde.' });
    }
};

// --- ROTA DE LOGIN DE USUÁRIO ---
exports.login = async (req, res) => {
    try {
        const { email, senha } = req.body;
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ error: "Email ou senha invalidas. Tente novamente." });
        }

        const isMatch = await bcrypt.compare(senha, user.senha);

        if (!isMatch) {
            return res.status(400).json({ error: "Email ou senha invalidas. Tente novamente." });
        }

        const token = jwt.sign(
            {
                id: user._id,
                nome: user.nome,
                perfil: user.perfil
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({
            message: "Esta tudo certo, seja bem vindo de volta :)",
            token: token,
            user: {
                nome: user.nome,
                email: user.email,
                perfil: user.perfil
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Infelizmente ocorreu um erro no servidor. Tente novamente mais tarde.' });
    }
};

// --- ROTA DO ESQUECI MINHA SENHA ---
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ message: 'Se o email existir em nossa base de dados, você receberá um email...' });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '20m' }
        );

        // ATENÇÃO: Atualize este link para o link do seu frontend quando estiver em produção
        const resetLink = `http://127.0.0.1:5500/barbershop-frontend/BarberRESET.html?token=${token}`;

        await transporter.sendMail({
            from: 'BarberShop Admin <no-reply@barbershop.com>',
            to: email,
            subject: 'Recuperação de senha - BarberShop',
            html: `
            <p>Olá ${user.nome}!</p>
            <p>Recebemos um pedido de recuperação de senha. Se foi você, clique no link abaixo:</p>
            <a href="${resetLink}" target="_blank">Clique aqui para redefinir sua senha</a>
            <p>O link expira em 20 minutos.</p>
            <p>Se você não solicitou a recuperação de senha, por favor ignore este email.</p>
            `
        });

        res.status(200).json({ message: 'Se o email existir em nossa base, um link será enviado.' });
    } catch (error) {
        console.error('Erro no forgot-password:', error);
        res.status(500).json({ error: 'Erro no servidor ao enviar email' });
    }
};

// --- ROTA DE REDEFINIÇÃO DE SENHA ---
exports.resetPassword = async (req, res) => {
    const { token, novaSenha } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(novaSenha, salt);

        await User.findByIdAndUpdate(decoded.id, { senha: hashedPassword });
        res.status(200).json({ message: 'Senha atualizada com sucesso! seja bem vindo novamente :)' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(400).json({ error: 'Link de recuperação invalido ou expirado. Por favor, solicite um novo link.' });
        }
        console.error('Erro no reset-password:', error);
        res.status(500).json({ error: 'Erro no servidor ao redefinir a senha.' });
    }
};