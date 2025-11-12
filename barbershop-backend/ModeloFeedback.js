// -_-_-_- /models/Feedback.js -_-_-_-

const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    barbeiroNome: { type: String, required: true, index: true },
    clienteNome: { type: String, required: true },
    comentario: { type: String, required: true },
    agendamentoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agendamento',
        required: true,
        unique: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);