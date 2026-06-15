// src/routes/infoRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');

// Buscar postos de saúde
router.get('/postos', async (req, res) => {
    try {
        const db = await openDb();
        const postos = await db.all('SELECT * FROM postos');
        res.json(postos);
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao buscar postos." });
    }
});

// Buscar campanhas ativas
router.get('/campanhas', async (req, res) => {
    try {
        const db = await openDb();
        const campanhas = await db.all(`
            SELECT c.*, p.nome_posto 
            FROM campanhas c 
            LEFT JOIN postos p ON c.id_posto = p.id_posto
        `);
        res.json(campanhas);
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao buscar campanhas." });
    }
});

module.exports = router;