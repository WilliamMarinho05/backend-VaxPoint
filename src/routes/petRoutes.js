const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const auth = require('../middlewares/auth');


// =======================================================
// 1. RAÇAS (pode ser pública)
// =======================================================
router.get('/racas', async (req, res) => {
    try {
        const db = await openDb();
        const racas = await db.all('SELECT * FROM racas ORDER BY nome_raca ASC');
        res.json(racas);
    } catch (error) {
        res.status(500).json({ success: false });
    }
});


// =======================================================
// 2. LISTAR PETS DO USUÁRIO LOGADO (SEGURO)
// =======================================================
router.get('/meus', auth, async (req, res) => {
    try {
        const db = await openDb();

        const pets = await db.all(`
            SELECT p.*, r.nome_raca 
            FROM pets p
            LEFT JOIN racas r ON p.id_raca = r.id_raca
            WHERE p.id_usuario = ?
        `, [req.user.id]);

        res.json(pets);
    } catch (error) {
        res.status(500).json({ success: false });
    }
});


// =======================================================
// 3. CADASTRAR PET (SEGURO)
// =======================================================
router.post('/', auth, async (req, res) => {
    const {
        nome, especie, id_raca, porte, peso, sexo,
        data_nascimento, numero_microchip, foto_url
    } = req.body;

    try {
        const db = await openDb();

        let especieFormatada = especie;
        if (especie?.toLowerCase().includes('cão') || especie?.toLowerCase().includes('cachorro')) {
            especieFormatada = 'Cachorro';
        }
        if (especie?.toLowerCase().includes('gato')) {
            especieFormatada = 'Gato';
        }

        const result = await db.run(`
            INSERT INTO pets (
                nome, especie, id_raca, porte, peso, sexo,
                data_nascimento, numero_microchip, foto_url, id_usuario
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nome,
            especieFormatada,
            parseInt(id_raca),
            porte,
            parseFloat(peso),
            sexo,
            data_nascimento,
            numero_microchip,
            foto_url,
            req.user.id
        ]);

        res.status(201).json({ success: true, id_pet: result.lastID });

    } catch (error) {
        res.status(500).json({ success: false });
    }
});


// =======================================================
// 4. ATUALIZAR PET (SEGURANÇA: só dono altera)
// =======================================================
router.put('/:idPet', auth, async (req, res) => {
    const { idPet } = req.params;

    try {
        const db = await openDb();

        const pet = await db.get(
            'SELECT id_usuario FROM pets WHERE id_pet = ?',
            [idPet]
        );

        if (!pet || pet.id_usuario !== req.user.id) {
            return res.status(403).json({ error: "Sem permissão" });
        }

        await db.run(`
            UPDATE pets SET 
                nome = ?, especie = ?, id_raca = ?, porte = ?, peso = ?, 
                sexo = ?, data_nascimento = ?, numero_microchip = ?, foto_url = ?
            WHERE id_pet = ?
        `, [
            req.body.nome,
            req.body.especie,
            req.body.id_raca,
            req.body.porte,
            req.body.peso,
            req.body.sexo,
            req.body.data_nascimento,
            req.body.numero_microchip,
            req.body.foto_url,
            idPet
        ]);

        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false });
    }
});


// =======================================================
// 5. DELETE PET (SEGURANÇA REAL)
// =======================================================
router.delete('/:idPet', auth, async (req, res) => {
    const { idPet } = req.params;

    try {
        const db = await openDb();

        const pet = await db.get(
            'SELECT id_usuario FROM pets WHERE id_pet = ?',
            [idPet]
        );

        if (!pet || pet.id_usuario !== req.user.id) {
            return res.status(403).json({ error: "Sem permissão" });
        }

        await db.run('DELETE FROM pets WHERE id_pet = ?', [idPet]);

        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ success: false });
    }
});


// =======================================================
// 6. HISTÓRICO DO PET (SEGURANÇA)
// =======================================================
router.get('/historico/:idPet', auth, async (req, res) => {
    const { idPet } = req.params;

    try {
        const db = await openDb();

        const pet = await db.get(
            'SELECT id_usuario FROM pets WHERE id_pet = ?',
            [idPet]
        );

        if (!pet || pet.id_usuario !== req.user.id) {
            return res.status(403).json({ error: "Sem permissão" });
        }

        const historico = await db.all(`
            SELECT 
                h.id_historico,
                h.data_aplicacao,
                h.status,
                v.nome_vacina,
                v.tipo
            FROM historico_vacinas_pet h
            JOIN vacinas v ON h.id_vacina = v.id_vacina
            WHERE h.id_pet = ?
            ORDER BY h.data_aplicacao DESC
        `, [idPet]);

        res.json(historico);

    } catch (error) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;