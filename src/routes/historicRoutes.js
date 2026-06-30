// src/routes/historicoRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const auth = require('../middlewares/auth');

// Registrar uma vacina tomada ou planejada
router.post('/', auth, async (req, res) => {
    const id_usuario = req.user.id;
    const { id_pet, id_vacina, data_prevista, status } = req.body;

    try {
        const db = await openDb();

        await db.run(
            'INSERT INTO historico_vacinacao (id_usuario, id_pet, id_vacina, data_prevista, status) VALUES (?, ?, ?, ?, ?)',
            [id_usuario, id_pet || null, id_vacina, data_prevista, status]
        );

        res.status(201).json({ success: true, message: "Registro adicionado ao diário!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao registrar vacina." });
    }
});

// Buscar histórico unificado do usuário e de seus pets
router.get('/', auth, async (req, res) => {
    const id_usuario = req.user.id;

    try {
        const db = await openDb();

        const historico = await db.all(`
            SELECT 
                h.id_historico, h.data_prevista, h.status,
                v.nome_vacina, v.tipo,
                p.nome as nome_pet
            FROM historico_vacinacao h
            JOIN vacinas v ON h.id_vacina = v.id_vacina
            LEFT JOIN pets p ON h.id_pet = p.id_pet
            WHERE h.id_usuario = ?
            ORDER BY h.data_prevista DESC
        `, [id_usuario]);

        res.json(historico);
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao buscar histórico." });
    }
});

module.exports = router;