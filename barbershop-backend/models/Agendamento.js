// -_-_-_- /models/Agendamento.js -_-_-_-
const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    servico: {
        type: String,
        required: true
    },
    barbeiro: {
        type: String,
        required: true
    },
    // Este é o campo IMPORTANTE agora
    dataHora: {
        type: Date,
        required: true
    },
    // Removemos a obrigatoriedade de 'dia' e 'horario' antigos se existiam
    status: {
        type: String,
        enum: ['agendado', 'concluido', 'cancelado'],
        default: 'agendado'
    },
    valor: {
        type: Number
    },
    feedbackEnviado: {
        type: Boolean,
        default: false
    },
    criadoEm: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Agendamento', AgendamentoSchema);