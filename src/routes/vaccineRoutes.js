const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const auth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/requireAdmin');

// ======================================================
// 1. VACINAS (pode ser pública ou protegida leve)
// ======================================================
router.get('/vaccines', auth, requireAdmin, async (req, res) => {
    const { id_posto } = req.query;

    try {
        const db = await openDb();

        let query = `
            SELECT id_vacina, nome_vacina 
            FROM vacinas 
            WHERE tipo = 'Humano'
        `;
        let params = [];

        if (id_posto) {
            query = `
                SELECT v.id_vacina, v.nome_vacina 
                FROM vacinas v
                INNER JOIN estoque_postos e ON v.id_vacina = e.id_vacina
                WHERE v.tipo = 'Humano'
                AND e.id_posto = ?
                AND e.quantidade > 0
            `;
            params = [id_posto];
        }

        const vacinas = await db.all(query, params);
        res.json(vacinas);

    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar vacinas." });
    }
});


// ======================================================
// 2. POSTOS (pode ser público)
// ======================================================
router.get('/posts', auth, requireAdmin, async (req, res) => {
    try {
        const db = await openDb();
        const postos = await db.all('SELECT id_posto, nome_posto FROM postos');
        res.json(postos);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar postos." });
    }
});


// ======================================================
// 3. VERIFICAR USUÁRIO (PROTEGIDO)
// ======================================================
router.post('/check-user', auth, requireAdmin, async (req, res) => {
    const { email, data_nascimento } = req.body;

    try {
        const db = await openDb();

        const usuario = await db.get(
            'SELECT id_usuario, nome FROM usuarios WHERE email = ? AND data_nascimento = ?',
            [email, data_nascimento]
        );

        if (!usuario) {
            return res.status(404).json({ error: "Não encontrado" });
        }

        res.json({ success: true, user: usuario });

    } catch (error) {
        res.status(500).json({ error: "Erro interno" });
    }
});


// ======================================================
// 4. CONFIRMAR VACINAÇÃO (SEGURO)
// ======================================================
router.post('/confirm-routine', auth, requireAdmin, async (req, res) => {
    const { id_usuario, id_vacina, id_posto } = req.body;

    if (!id_usuario || !id_vacina || !id_posto) {
        return res.status(400).json({ error: "Campos obrigatórios" });
    }

    try {
        const db = await openDb();

        const estoque = await db.get(
            'SELECT quantidade FROM estoque_postos WHERE id_posto = ? AND id_vacina = ?',
            [id_posto, id_vacina]
        );

        if (!estoque || estoque.quantidade <= 0) {
            return res.status(400).json({ error: "Sem estoque" });
        }

        const dataHoje = new Date().toLocaleDateString('sv-SE');

        await db.run(`
            INSERT INTO historico_vacinacao 
            (id_usuario, id_vacina, data_prevista, status)
            VALUES (?, ?, ?, 'CONCLUIDA')
        `, [id_usuario, id_vacina, dataHoje]);

        await db.run(`
            UPDATE estoque_postos 
            SET quantidade = quantidade - 1 
            WHERE id_posto = ? AND id_vacina = ?
        `, [id_posto, id_vacina]);

        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ error: "Erro interno" });
    }
});

module.exports = router;