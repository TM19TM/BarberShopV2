// -_-_-_- /config/db.js -_-_-_-
// Lida com a conexão do MongoDB e o "seeding" dos usuários de teste

const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * @description Verifica se os usuários de teste padrão existem; se não, cria eles.
 */
const seedDefaultUsers = async () => {
    try {
        // Senha padrão para TODOS os usuários de teste
        const defaultPassword = '123456'; 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);

        // 1. Define os 4 usuários que queremos garantir que existam
        const usersToSeed = [
            {
                nome: 'Admin Nativo',
                email: 'admin@admin.com',
                perfil: 'admin',
            },
            {
                nome: 'Recepcionista Teste',
                email: 'recepcao@admin.com',
                perfil: 'recepcionista',
            },
            {
                nome: 'Barbeiro Teste',
                email: 'barbeiro@admin.com',
                perfil: 'barbeiro',
            },
            {
                nome: 'Cliente Teste',
                email: 'cliente@cliente.com',
                perfil: 'cliente',
            }
        ];

        let createdCount = 0;
        
        // 2. Loop para verificar e criar cada um
        for (const userData of usersToSeed) {
            const existingUser = await User.findOne({ email: userData.email });

            if (!existingUser) {
                console.log(`Usuário ${userData.perfil} (${userData.email}) não encontrado. Criando...`);
                
                const newUser = new User({
                    ...userData, // 'nome', 'email', 'perfil'
                    telefone: '00000000000', // Placeholder
                    dataNascimento: new Date('1990-01-01'), // Placeholder
                    senha: hashedPassword,
                });

                await newUser.save();
                createdCount++;
            }
        }

        if (createdCount > 0) {
            console.log(`${createdCount} novo(s) usuário(s) de teste criado(s).`);
            console.log(`A senha padrão para todos é: ${defaultPassword}`);
        } else {
            console.log('Todos os usuários de teste já existem.');
        }

    } catch (error) {
        console.error('Erro ao verificar ou criar usuários de teste:', error);
    }
};

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        await mongoose.connect(MONGO_URI);
        console.log("A conexão com o MongoDB foi concluida com sucesso! tenha um otimo dia :)");

        // --- CHAMA A FUNÇÃO DE SEEDING AQUI ---
        // (Nome da função atualizado)
        await seedDefaultUsers(); 

    } catch (err) {
        console.error("Infelizmente não conseguimos ter acesso ao MongoDB... \n", err);
        process.exit(1); // Sai do processo com falha
    }
};

module.exports = connectDB;