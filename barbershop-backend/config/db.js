// -_-_-_- /config/db.js -_-_-_-
// Lida com a conexão do MongoDB e o "seeding" do admin

const mongoose = require('mongoose');
const User = require('../models/User'); // Precisamos do modelo de usuário
const bcrypt = require('bcryptjs'); // Precisamos do bcrypt para hashear a senha

/**
 * @description Verifica se um usuário admin padrão existe; se não, cria um.
 */
const seedAdminUser = async () => {
    try {
        const adminEmail = 'admin@admin.com';
        const adminPassword = 'admin'; // A senha que você vai usar para logar

        // 1. Procura pelo usuário admin
        const existingAdmin = await User.findOne({ email: adminEmail });

        // 2. Se o admin NÃO existir, crie um
        if (!existingAdmin) {
            console.log('Usuário admin nativo não encontrado. Criando...');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            const adminUser = new User({
                nome: 'Admin Nativo',
                telefone: '00000000000',
                dataNascimento: new Date('1990-01-01'), // Data de placeholder
                email: adminEmail,
                senha: hashedPassword,
                perfil: 'admin' // O mais importante
            });

            await adminUser.save();
            console.log('Usuário admin nativo criado com sucesso!');
            console.log(`Email: ${adminEmail}`);
            console.log(`Senha: ${adminPassword}`);
        } else {
            console.log('Usuário admin nativo já existe.');
        }
    } catch (error) {
        console.error('Erro ao verificar ou criar usuário admin nativo:', error);
    }
};

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        await mongoose.connect(MONGO_URI);
        console.log("A conexão com o MongoDB foi concluida com sucesso! tenha um otimo dia :)");

        // --- CHAMA A FUNÇÃO DE SEEDING AQUI ---
        // Isso garante que só rode depois que o banco conectar.
        await seedAdminUser();

    } catch (err) {
        console.error("Infelizmente não conseguimos ter acesso ao MongoDB... \n", err);
        process.exit(1); // Sai do processo com falha
    }
};

module.exports = connectDB;