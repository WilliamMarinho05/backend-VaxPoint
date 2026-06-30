// src/routes/historicoRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const auth = require('../middlewares/auth');

// Buscar histórico unificado do usuário e de seus pets (Apenas Leitura)
router.get('/', auth, async (req, res) => {
    const id_usuario = req.user.id;

    try {
        const db = await openDb();

        // Fazemos um UNION para juntar o histórico humano e o histórico dos pets na mesma lista
        const historico = await db.all(`
            SELECT 
                h.id_historico, h.data_prevista, h.status,
                v.nome_vacina, v.tipo,
                NULL as nome_pet
            FROM historico_vacinacao h
            JOIN vacinas v ON h.id_vacina = v.id_vacina
            WHERE h.id_usuario = ?

            UNION ALL

            SELECT 
                hp.id_historico, hp.data_aplicacao as data_prevista, hp.status,
                v.nome_vacina, v.tipo,
                p.nome as nome_pet
            FROM historico_vacinas_pet hp
            JOIN vacinas v ON hp.id_vacina = v.id_vacina
            JOIN pets p ON hp.id_pet = p.id_pet
            WHERE p.id_usuario = ?
            
            ORDER BY data_prevista DESC
        `, [id_usuario, id_usuario]);

        res.json(historico);
    } catch (error) {
        console.error("Erro no BD ao buscar histórico:", error);
        res.status(500).json({ success: false, message: "Erro ao buscar histórico." });
    }
});

module.exports = router;