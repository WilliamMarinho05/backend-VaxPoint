// src/server.js
const express = require('express');
const cors = require('cors');
const { initDb } = require('./database');
const popularBanco = require('./seed');

require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const petRoutes = require('./routes/petRoutes');
const infoRoutes = require('./routes/infoRoutes');
const historicoRoutes = require('./routes/historicRoutes'); 
const vaccinationRoutes = require('./routes/vaccineRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// ROTAS (server NÃO valida admin aqui)
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/vaccination', vaccinationRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/admin', adminRoutes);

async function iniciarSistema() {
    try {
        await initDb();
        await popularBanco();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
        });

    } catch (error) {
        console.error("Erro ao iniciar sistema:", error);
    }
}

iniciarSistema();