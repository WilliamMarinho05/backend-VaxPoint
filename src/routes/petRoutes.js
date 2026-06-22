// src/routes/petRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');

// =======================================================
// BUSCAR TODAS AS RAÇAS DO BANCO DE DADOS
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
// LISTAR PETS (Usando a coluna correta id_usuario)
// GET: /api/pets
// =======================================================
router.get('/', async (req, res) => {
    // Como o login não está integrado, assumimos temporariamente o usuário ID 1
    const id_usuario = 1; 

    try {
        const db = await openDb();
        // Traz as informações do pet junto com o nome textual da raça
        const pets = await db.all(`
            SELECT p.*, r.nome_raca 
            FROM pets p
            LEFT JOIN racas r ON p.id_raca = r.id_raca
            WHERE p.id_usuario = ?
        `, [id_usuario]);
        
        res.json(pets);
    } catch (error) {
        console.error("Erro ao buscar pets:", error);
        res.status(500).json({ success: false, message: "Erro ao buscar pets." });
    }
});

// =======================================================
// CADASTRAR PET (Usando a coluna correta id_usuario)
// POST: /api/pets
// =======================================================
router.post('/', async (req, res) => {
    const { 
        nome, especie, id_raca, porte, peso, sexo, 
        data_nascimento, numero_microchip, foto_url 
    } = req.body;
    
    const id_usuario = 1; // Temporário até integrar o Login

    let especieFormatada = especie;
    if (especie.toLowerCase().includes('cão') || especie.toLowerCase().includes('cachorro')) especieFormatada = 'Cachorro';
    if (especie.toLowerCase().includes('gato')) especieFormatada = 'Gato';

    try {
        const db = await openDb();
        const result = await db.run(`
            INSERT INTO pets (
                id_usuario, nome, especie, id_raca, porte, peso, sexo, 
                data_nascimento, numero_microchip, foto_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_usuario, nome, especieFormatada, id_raca, porte, peso, sexo, 
                data_nascimento, numero_microchip, foto_url
            ]
        );
        res.status(201).json({ success: true, id_pet: result.lastID });
    } catch (error) {
        console.error("Erro ao cadastrar pet:", error);
        res.status(500).json({ success: false, message: "Erro ao cadastrar pet no banco." });
    }
});

// =======================================================
// ATUALIZAR PET
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
        res.json({ success: true, message: "Pet updated successfully!" });
    } catch (error) {
        console.error("Erro ao atualizar pet:", error);
        res.status(500).json({ success: false, message: "Erro ao atualizar dados do pet." });
    }
});

// =======================================================
// DELETAR PET
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