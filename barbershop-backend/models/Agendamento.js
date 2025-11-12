// -_-_-_- /models/Agendamento.js -_-_-_-

const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    clienteNomeWalkin: {
        type: String
    },
    valor: {
        type: Number,
        required: false
    },
    servico: { type: String, required: true },
    barbeiro: { type: String, required: true },
    dataHora: { type: Date, required: true },
    status: {
        type: String,
        required: true,
        enum: ['agendado', 'concluido', 'cancelado'],
        default: 'agendado'
    },
    pagamentoStatus: {
        type: String,
        required: true,
        enum: ['pendente', 'pago'],
        default: 'pendente'
    },
    feedbackEnviado: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Agendamento', AgendamentoSchema);