// src/routes/petRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');

router.post('/', async (req, res) => {
    const { id_dono, nome, especie, raca, data_nascimento } = req.body;
    
    // Normaliza para o padrão do CHECK do banco
    let especieFormatada = especie;
    if (especie.toLowerCase().includes('cão') || especie.toLowerCase().includes('cachorro')) especieFormatada = 'Cachorro';
    if (especie.toLowerCase().includes('gato')) especieFormatada = 'Gato';

    try {
        const db = await openDb();
        const result = await db.run(
            'INSERT INTO pets (id_dono, nome, especie, raca, data_nascimento) VALUES (?, ?, ?, ?, ?)',
            [id_dono, nome, especieFormatada, raca, data_nascimento]
        );
        res.status(201).json({ success: true, id_pet: result.lastID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Erro ao cadastrar pet. Verifique se a espécie é Cachorro ou Gato." });
    }
});

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