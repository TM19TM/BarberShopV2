// -_-_-_- /config/db.js -_-_-_-
// Lida apenas com a conexão do MongoDB

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        await mongoose.connect(MONGO_URI);
        console.log("A conexão com o MongoDB foi concluida com sucesso! tenha um otimo dia :)");
    } catch (err) {
        console.error("Infelizmente não conseguimos ter acesso ao MongoDB... \n", err);
        process.exit(1); // Sai do processo com falha
    }
};

module.exports = connectDB;