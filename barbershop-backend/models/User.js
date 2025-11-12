// -_-_-_- /models/User.js -_-_-_-

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    telefone: { type: String, required: true },
    dataNascimento: { type: Date, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    perfil: {
        type: String,
        required: true,
        enum: ['cliente', 'barbeiro', 'recepcionista', 'admin'],
        default: 'cliente'
    }
});

module.exports = mongoose.model('User', UserSchema);