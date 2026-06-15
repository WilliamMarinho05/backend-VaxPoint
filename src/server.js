// src/server.js
const express = require('express');
const cors = require('cors');
const { initDb } = require('./database');
const popularBanco = require('./seed'); // 1. IMPORTA O SEED AQUI

require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const petRoutes = require('./routes/petRoutes');
const infoRoutes = require('./routes/infoRoutes');
const historicoRoutes = require('./routes/historicRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/historico', historicoRoutes);

// 2. FUNÇÃO AUTOMÁTICA DE STARTUP
async function iniciarSistema() {
    try {
        // Primeiro: Garante que as tabelas existem
        await initDb(); 
        
        // Segundo: Roda a verificação de dados do seed automaticamente
        await popularBanco(); 

        // Terceiro: Abre a porta do servidor para o Postman / Frontend
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Servidor VaxPoint rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Erro crítico ao iniciar o sistema:", error);
    }
}

// Executa o fluxo automático completo
iniciarSistema();