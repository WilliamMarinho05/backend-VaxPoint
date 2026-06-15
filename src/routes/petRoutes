// src/routes/petRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');

// Cadastrar um Pet
router.post('/', async (req, res) => {
    const { id_dono, nome, especie, raca, data_nascimento } = req.body;
    try {
        const db = await openDb();
        const result = await db.run(
            'INSERT INTO pets (id_dono, nome, especie, raca, data_nascimento) VALUES (?, ?, ?, ?, ?)',
            [id_dono, nome, especie, raca, data_nascimento]
        );
        res.status(201).json({ success: true, id_pet: result.lastID });
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao cadastrar pet." });
    }
});

// Buscar todos os pets de um dono
router.get('/:idDono', async (req, res) => {
    try {
        const db = await openDb();
        const pets = await db.all('SELECT * FROM pets WHERE id_dono = ?', [req.params.idDono]);
        res.json(pets);
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao buscar pets." });
    }
});

module.exports = router;