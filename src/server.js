const express = require('express');
const cors = require('cors');
const { initDb } = require('./database');

require('dotenv').config();


// Importando as rotas
const authRoutes = require('./routes/authRoutes');
const petRoutes = require('./routes/petRoutes');
const infoRoutes = require('./routes/infoRoutes');
const historicoRoutes = require('./routes/historicRoutes');

const app = express();
app.use(cors());
app.use(express.json()); // Permite ler JSON no corpo das requisições

// Inicializa o banco de dados
initDb();

// Configurando as rotas na API
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/historico', historicoRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Servidor VaxPoint rodando na porta ${PORT}`);
});