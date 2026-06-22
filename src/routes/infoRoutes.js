// src/routes/infoRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');

// Buscar postos de saúde
router.get('/postos', async (req, res) => {
    try {
        const db = await openDb();

        // 1. INCLUÍDO 'alerta_instabilidade' no SELECT
        const postos = await db.all(`
            SELECT 
                id_posto AS id,
                nome_posto AS nome,
                endereco,
                horario_funcionamento AS horario,
                lat,
                lng,
                alerta_instabilidade AS alertaInstabilidade
            FROM postos
        `);
        
        // 2. Formatação corrigida para o Front-end
        const postosFormatados = postos.map(posto => ({
            id: posto.id,
            nome: posto.nome,
            endereco: posto.endereco,
            horario: posto.horario,
            lat: posto.lat,
            lng: posto.lng,
            // Converte 0 ou 1 do SQLite para false ou true de forma dinâmica
            alertaInstabilidade: posto.alertaInstabilidade === 1, 
            
            // URL oficial e corrigida do Google Maps
            linkGoogleMaps: (posto.lat && posto.lng)
                ? `https://www.google.com/maps/search/?api=1&query=${posto.lat},${posto.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(posto.endereco)}`
        }));

        res.json(postosFormatados);

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Erro ao buscar postos." });
    }
});

// Buscar campanhas ativas
router.get('/campanhas', async (req, res) => {
    try {
        const db = await openDb();
        const campanhas = await db.all(`
            SELECT
                id_campanha AS id,
                titulo,
                publico,
                periodo,
                descricao,
                imagem_url AS imagemUrl
            FROM campanhas
        `);
        res.json(campanhas);
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao buscar campanhas." });
    }
});

module.exports = router;