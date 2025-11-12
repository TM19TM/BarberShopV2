// -_-_-_- /middleware/auth.js -_-_-_-
// Contém os middlewares de verificação de token e perfil

const jwt = require('jsonwebtoken');

// Middleware de Autenticação (Cliente, Barbeiro, Staff)
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) {
        return res.status(401).json({ error: 'Acesso negado. Faça o login para continuar.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado. Faça o login novamente.' });
        }
        req.user = user; // Adiciona os dados do usuário (id, nome, perfil) ao req
        next();
    });
};

// Middleware de Autorização (Apenas Recepção e Admin)
const verificarStaff = (req, res, next) => {
    // Este middleware DEVE ser usado DEPOIS do verificarToken
    const perfil = req.user.perfil;
    if (perfil !== 'admin' && perfil !== 'recepcionista') {
        return res.status(403).json({ error: 'Acesso restrito a administradores ou recepção.' });
    }
    next();
};

module.exports = { verificarToken, verificarStaff };