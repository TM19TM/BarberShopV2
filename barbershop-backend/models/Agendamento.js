// -_-_-_- /models/Agendamento.js -_-_-_-
const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    servico: { type: String, required: true },
    barbeiro: { type: String, required: true },
    
    // O campo REAL (cálculos do sistema) - Mantemos UTC (22h)
    dataHora: { type: Date, required: true },

    // O campo VISUAL (para você ler no banco) - Salvará "19:00"
    dataLocal: { type: String }, 

    status: {
        type: String,
        enum: ['agendado', 'concluido', 'cancelado'],
        default: 'agendado'
    },
    valor: { type: Number },
    feedbackEnviado: { type: Boolean, default: false },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Agendamento', AgendamentoSchema);