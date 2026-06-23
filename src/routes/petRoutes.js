// src/routes/petRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');

// =======================================================
// 1. BUSCAR TODAS AS RAÇAS (DEVE FICAR NO TOPO)
// GET: /api/pets/racas
// =======================================================
router.get('/racas', async (req, res) => {
    try {
        const db = await openDb();
        const racas = await db.all('SELECT * FROM racas ORDER BY nome_raca ASC');
        res.json(racas);
    } catch (error) {
        console.error("Erro ao buscar raças no banco:", error);
        res.status(500).json({ success: false, message: "Erro ao buscar raças." });
    }
});

// =======================================================
// 2. LISTAR PETS FILTRADOS PELO DONO
// GET: /api/pets/usuario/:idUsuario
// =======================================================
router.get('/usuario/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    try {
        const db = await openDb();
        const pets = await db.all(`
            SELECT p.*, r.nome_raca 
            FROM pets p
            LEFT JOIN racas r ON p.id_raca = r.id_raca
            WHERE p.id_usuario = ?
        `, [idUsuario]);
        
        res.json(pets);
    } catch (error) {
        console.error("Erro ao buscar pets:", error);
        res.status(500).json({ success: false, message: "Erro ao buscar pets." });
    }
});

// =======================================================
// 3. CADASTRAR PET COM O DONO CORRETO
// POST: /api/pets
// =======================================================
router.post('/', async (req, res) => {
    const { 
        id_usuario,
        nome, especie, id_raca, porte, peso, sexo, 
        data_nascimento, numero_microchip, foto_url 
    } = req.body;

    if (!id_usuario) {
        return res.status(400).json({ success: false, message: "ID do usuário não fornecido." });
    }

    let especieFormatada = especie;
    if (especie.toLowerCase().includes('cão') || especie.toLowerCase().includes('cachorro')) especieFormatada = 'Cachorro';
    if (especie.toLowerCase().includes('gato')) especieFormatada = 'Gato';

    try {
        const db = await openDb();
        const result = await db.run(`
            INSERT INTO pets (
                nome, especie, id_raca, porte, peso, sexo, 
                data_nascimento, numero_microchip, foto_url, id_usuario
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome, especieFormatada, parseInt(id_raca), porte, parseFloat(peso), sexo, 
                data_nascimento, numero_microchip, foto_url, parseInt(id_usuario)
            ]
        );
        
        res.status(201).json({ success: true, id_pet: result.lastID });
    } catch (error) {
        console.error("Erro ao cadastrar pet:", error);
        res.status(500).json({ success: false, message: "Erro ao cadastrar pet no banco." });
    }
});

// =======================================================
// 4. ATUALIZAR PET
// PUT: /api/pets/:idPet
// =======================================================
router.put('/:idPet', async (req, res) => {
    const { idPet } = req.params;
    const { 
        nome, especie, id_raca, porte, peso, sexo, 
        data_nascimento, numero_microchip, foto_url 
    } = req.body;

    let especieFormatada = especie;
    if (especie.toLowerCase().includes('cão') || especie.toLowerCase().includes('cachorro')) especieFormatada = 'Cachorro';
    if (especie.toLowerCase().includes('gato')) especieFormatada = 'Gato';

    try {
        const db = await openDb();
        await db.run(`
            UPDATE pets SET 
                nome = ?, especie = ?, id_raca = ?, porte = ?, peso = ?, 
                sexo = ?, data_nascimento = ?, numero_microchip = ?, foto_url = ?
            WHERE id_pet = ?`,
            [
                nome, especieFormatada, id_raca, porte, peso, sexo, 
                data_nascimento, numero_microchip, foto_url, idPet
            ]
        );
        res.json({ success: true, message: "Pet atualizado com sucesso." });
    } catch (error) {
        console.error("Erro ao atualizar pet:", error);
        res.status(500).json({ success: false, message: "Erro ao atualizar dados do pet." });
    }
});

// =======================================================
// 5. DELETAR PET
// DELETE: /api/pets/:idPet
// =======================================================
router.delete('/:idPet', async (req, res) => {
    const { idPet } = req.params;
    try {
        const db = await openDb();
        await db.run('DELETE FROM pets WHERE id_pet = ?', [idPet]);
        res.json({ success: true, message: "Pet removido com sucesso." });
    } catch (error) {
        console.error("Erro ao deletar pet:", error);
        res.status(500).json({ success: false, message: "Erro ao excluir o pet." });
    }
});

module.exports = router;