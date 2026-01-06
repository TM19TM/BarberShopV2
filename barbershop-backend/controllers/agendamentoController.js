// -_-_-_- /controllers/agendamentoController.js -_-_-_-

const Agendamento = require('../models/Agendamento');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// --- ROTA PARA CRIAR UM NOVO AGENDAMENTO ---
exports.criarAgendamento = async (req, res) => {
    try {
        const { servico, barbeiro, dia, horario } = req.body;
        const clienteId = req.user.id;
        
        // CORREÇÃO: Criar a data garantindo que o JS entenda como horário local
        // Usamos o formato YYYY-MM-DDTHH:mm para o construtor Date
        const dataHoraAgendamento = new Date(`${dia}T${horario}:00`);

        if (isNaN(dataHoraAgendamento.getTime())) {
            return res.status(400).json({ error: 'Data ou horário inválidos.' });
        }

        const novoAgendamento = new Agendamento({
            cliente: clienteId,
            servico,
            barbeiro,
            dataHora: dataHoraAgendamento
        });

        await novoAgendamento.save();
        res.status(201).json({ message: 'Seu agendamento foi criado com sucesso! Nos vemos em breve :)' });
    } catch (error) {
        console.error('Erro ao agendar:', error);
        res.status(500).json({ error: 'Infelizmente ocorreu um erro no servidor.' });
    }
};

// --- ROTA PARA APAGAR/CANCELAR UM AGENDAMENTO ---
exports.cancelarAgendamento = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const agendamentoId = req.params.id;
        const agendamento = await Agendamento.findById(agendamentoId);

        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        if (agendamento.cliente.toString() !== clienteId) {
            return res.status(403).json({ error: 'Você não tem permissão para cancelar este agendamento.' });
        }

        await Agendamento.findByIdAndDelete(agendamentoId);
        res.status(200).json({ message: 'Agendamento cancelado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cancelar agendamento: ', error);
        res.status(500).json({ error: 'Erro no servidor ao cancelar o agendamentos.' });
    }
};

// --- ROTA PARA ATUALIZAR/REMARCAR UM AGENDAMENTO ---
exports.remarcarAgendamento = async (req, res) => {
    try {
        const clienteId = req.user.id;
        const agendamentoId = req.params.id;
        const { dataHora } = req.body;

        const agendamento = await Agendamento.findById(agendamentoId);

        if (!agendamento) {
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        }
        if (agendamento.cliente.toString() !== clienteId) {
            return res.status(403).json({ error: 'Você não tem permissão para alterar esse agendamento.' });
        }

        // Conversão limpa
        const dataObjeto = new Date(dataHora);

        // Atualizar data real e string visual
        agendamento.dataHora = dataObjeto;
        agendamento.status = 'agendado';
        agendamento.dataLocal = dataObjeto.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', ' às ');

        await agendamento.save();
        res.status(200).json({ 
            message: 'Agendamento remarcado com sucesso! Nos vemos em breve :)',
            agendamento
        });
    } catch (error) {
        console.error('Erro ao remarcar agendamento: ', error);
        res.status(500).json({ error: 'Erro no servidor ao remarcar agendamento.' });
    }
};

// --- ROTA BUSCAR AGENDAMENTOS DO CLIENTE ---
exports.getMeusAgendamentos = async (req, res) => {
    try {
        const clientId = req.user.id;
        const agendamentos = await Agendamento.find({ cliente: clientId }).sort({ dataHora: 1 });
        
        // Formata para exibição sem alterar a data original do banco
        const agendamentosFormatados = agendamentos.map(agendamento => {
            const dataObj = new Date(agendamento.dataHora);
            
            // Força a exibição no horário de SP
            const dataDisplay = dataObj.toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(',', ' às ');

            // Dia da semana com base na hora local de SP
            // Precisamos criar um objeto Date ajustado para pegar o getDay() correto do Brasil
            const dataSP = new Date(dataObj.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
            const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
            const diaSemana = diasSemana[dataSP.getDay()];
            
            return {
                ...agendamento._doc,
                dataHoraDisplay: dataDisplay, // Usa o calculado agora para garantir consistência
                diaSemana: diaSemana
            };
        });
        
        res.status(200).json(agendamentosFormatados);
    } catch (error) {
        console.error('Erro ao buscar agendamentos: ', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar agendamentos.' })
    }
};

// --- ROTA PARA BARBEIRO VER AGENDAMENTOS (Do Dia) ---
exports.getAgendamentosBarbeiro = async (req, res) => {
    try {
        const barbeiroNome = req.user.nome;
        
        // Define o início e fim do dia HOJE em São Paulo
        const hojeSP = new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
        const inicioDiaSP = new Date(hojeSP);
        inicioDiaSP.setHours(0, 0, 0, 0);
        
        const fimDiaSP = new Date(hojeSP);
        fimDiaSP.setHours(23, 59, 59, 999);

        // Busca no banco qualquer data que caia entre o inicio e fim do dia de SP
        // O Mongo faz a comparação correta mesmo guardando em UTC
        const agendamentos = await Agendamentos.find({ 
            barbeiro: barbeiroNome,
            dataHora: { 
                $gte: inicioDiaSP, 
                $lte: fimDiaSP 
            },
            status: 'agendado'
        }).populate('cliente', 'nome').sort({ dataHora: 1 });
        
        const agendamentosFormatados = agendamentos.map(agendamento => {
            const dataObj = new Date(agendamento.dataHora);
            return {
                _id: agendamento._id,
                cliente: agendamento.cliente,
                servico: agendamento.servico,
                dataHora: agendamento.dataHora,
                horaDisplay: dataObj.toLocaleTimeString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            };
        });
        
        res.status(200).json(agendamentosFormatados);
    } catch (error) {
        console.error('Erro ao buscar agendamentos do barbeiro:', error);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
};

// --- ROTA BUSCAR NOTIFICAÇÃO (Aniversário) ---
exports.getMinhasNotificacoes = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const notificacoes = [];
        
        // Compara dia e mês ignorando o ano e o fuso exato, focando na data local
        const hoje = new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
        const hojeObj = new Date(hoje);
        
        // Data de nascimento do banco (assumindo que foi salva corretamente ou é string)
        // Se for Date object no banco, precisamos ter cuidado, mas geralmente aniversário se compara apenas dia/mês
        const aniversario = new Date(user.dataNascimento);
        // Ajuste simples para dia/mes UTC vs Local: vamos usar UTC methods no aniversario se ele foi salvo como UTC puro sem hora
        
        // Abordagem robusta:
        if ((aniversario.getUTCDate() === hojeObj.getDate()) && 
            (aniversario.getUTCMonth() === hojeObj.getMonth())) {
             
            notificacoes.push({
                tipo: 'info',
                mensagem: `<strong>Feliz Aniversário, ${user.nome}!</strong> Você ganhou <strong>10% de desconto</strong> no seu próximo corte como presente!`
            });
        }
        
        res.status(200).json(notificacoes);
    } catch (error) {
        console.error('Erro ao buscar notificações: ', error);
        res.status(500).json({ error: 'Erro no servidor.' })
    }
};

// --- Rota CLIENTE DEIXAR FEEDBACK ---
exports.deixarFeedback = async (req, res) => {
    try {
        const { agendamentoId, barbeiroNome, comentario } = req.body;
        const clienteNome = req.user.nome;

        if (!agendamentoId || !barbeiroNome || !comentario) {
            return res.status(400).json({ error: 'Dados incompletos para o feedback.' });
        }

        const agendamento = await Agendamento.findById(agendamentoId);
        if (!agendamento || agendamento.cliente.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Você não pode deixar feedback para esse agendamento.' });
        }
        if (agendamento.feedbackEnviado === true) {
            return res.status(400).json({ error: 'Você já enviou um feedback para este agendamento.' });
        }

        const novoFeedback = new Feedback({
            agendamentoId,
            barbeiroNome,
            comentario,
            clienteNome
        });

        await novoFeedback.save();
        await Agendamento.findByIdAndUpdate(agendamentoId, { feedbackEnviado: true });

        res.status(201).json({ message: 'Feedback enviado com sucesso! Obrigado!' })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Você já deixou um feedback para esse agendamento (erro DB).' });
        }
        console.error('Erro ao salvar feedback: ', error);
        res.status(500).json({ error: 'Erro no servidor ao salvar feedback.' });
    }
};

// --- ROTA BUSCAR LISTA DE BARBEIROS ---
exports.getBarbeiros = async (req, res) => {
    try {
        const barbeiros = await User.find({ perfil: 'barbeiro' }).select('nome');
        res.status(200).json(barbeiros);
    } catch (error) {
        console.error('Erro ao buscar lista de barbeiros: ', error);
        res.status(500).json({ error: 'Erro no servidor ao buscar barbeiros.' });
    }
};