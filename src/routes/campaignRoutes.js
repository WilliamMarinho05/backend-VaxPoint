// src/routes/campaignRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const auth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/requireAdmin');




// ==========================================================================
// 1. LISTAR CAMPANHAS ATIVAS COM ESTOQUE NO POSTO
// ==========================================================================
router.get('/campaigns', auth, requireAdmin,  async (req, res) => {
    const { id_posto } = req.query;

    if (!id_posto) {
        return res.status(400).json({ error: "id_posto é obrigatório." });
    }

    try {
        const db = await openDb();

        const campanhas = await db.all(`
            SELECT c.*, v.nome_vacina, v.tipo as tipo_vacina
            FROM campanhas c
            INNER JOIN vacinas v ON c.id_vacina = v.id_vacina
            INNER JOIN estoque_postos e ON v.id_vacina = e.id_vacina
            WHERE e.id_posto = ? AND e.quantidade > 0
        `, [id_posto]);

        return res.status(200).json(campanhas);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao buscar campanhas." });
    }
});


// ==========================================================================
// 2. CHECK INTENTIONS (VERSÃO FINAL CORRIGIDA)
// ==========================================================================
router.post('/check-intentions', auth, requireAdmin, async (req, res) => {
    const { email, data_nascimento, id_posto } = req.body;

    if (!email || !data_nascimento || !id_posto) {
        return res.status(400).json({ error: "Campos obrigatórios." });
    }

    try {
        const db = await openDb();

        // 1. Buscar usuário
        const usuario = await db.get(
            `SELECT id_usuario, nome 
             FROM usuarios 
             WHERE email = ? AND data_nascimento = ?`,
            [email, data_nascimento]
        );

        if (!usuario) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        // 2. Buscar intenções com dados completos para o frontend
        const intencoes = await db.all(`
            SELECT 
                i.id_intencao,
                i.id_usuario,
                i.id_pet,
                i.id_vacina,
                i.id_campanha,
                i.id_posto,

                -- usuário (sempre existe)
                u.nome AS nome_usuario,

                -- pet (pode ser null)
                p.nome AS nome_pet,
                p.especie AS especie_pet,

                -- vacina
                v.nome_vacina,

                -- campanha
                c.titulo AS titulo_campanha

            FROM intencoes_vacinacao i

            JOIN usuarios u 
                ON u.id_usuario = i.id_usuario

            LEFT JOIN pets p 
                ON p.id_pet = i.id_pet

            JOIN vacinas v 
                ON v.id_vacina = i.id_vacina

            LEFT JOIN campanhas c 
                ON c.id_campanha = i.id_campanha

            WHERE i.id_usuario = ?
              AND i.id_posto = ?
        `, [usuario.id_usuario, id_posto]);

        return res.json({
            success: true,
            user: usuario,
            intencoes
        });

    } catch (error) {
        console.error("Erro ao buscar intenções:", error);
        return res.status(500).json({ error: "Erro ao buscar intenções." });
    }
});


// ==========================================================================
// 3. CONFIRM INTENTION (VERSÃO FINAL CORRIGIDA)
// ==========================================================================
router.post('/confirm-intention', auth, requireAdmin, async (req, res) => {
    const { id_intencao, id_posto } = req.body;

    // 1. validação básica
    if (!id_intencao || !id_posto) {
        return res.status(400).json({ error: "Campos obrigatórios." });
    }

    try {
        const db = await openDb();

        // 2. buscar intenção
        const intencao = await db.get(
            `SELECT * FROM intencoes_vacinacao WHERE id_intencao = ?`,
            [id_intencao]
        );

        if (!intencao) {
            return res.status(404).json({ error: "Intenção não encontrada." });
        }

        // 3. valida posto (mais seguro com Number dos dois lados)
        if (Number(intencao.id_posto) !== Number(id_posto)) {
            return res.status(403).json({ error: "Posto inválido para esta intenção" });
        }

        // 4. valida vacina
        if (!intencao.id_vacina) {
            return res.status(400).json({ error: "Intenção sem vacina vinculada." });
        }

        // 5. checar estoque
        const estoque = await db.get(
            `SELECT quantidade 
             FROM estoque_postos 
             WHERE id_posto = ? AND id_vacina = ?`,
            [id_posto, intencao.id_vacina]
        );

        if (!estoque || estoque.quantidade <= 0) {
            return res.status(400).json({ error: "Sem estoque." });
        }

        // 6. baixa estoque
        await db.run(
            `UPDATE estoque_postos 
             SET quantidade = quantidade - 1 
             WHERE id_posto = ? AND id_vacina = ?`,
            [id_posto, intencao.id_vacina]
        );

        // 7. histórico (garantido)
        if (intencao.id_pet) {
            await db.run(`
                INSERT INTO historico_vacinas_pet
                (
                    id_pet,
                    id_vacina,
                    id_posto,
                    data_aplicacao,
                    status
                )
                VALUES (?, ?, ?, date('now'), 'Aplicada')
            `, [
                intencao.id_pet,
                intencao.id_vacina,
                id_posto
            ]);

        } else {

            await db.run(`
                INSERT INTO historico_vacinacao
                (
                    id_usuario,
                    id_vacina,
                    data_prevista,
                    status
                )
                VALUES (?, ?, date('now'), 'CONCLUIDA')
            `, [
                intencao.id_usuario,
                intencao.id_vacina
            ]);

        }

        // 8. remover intenção
        await db.run(
            `DELETE FROM intencoes_vacinacao WHERE id_intencao = ?`,
            [id_intencao]
        );

        return res.json({ success: true });

    } catch (error) {
        console.error("Erro confirm-intention:", error);
        return res.status(500).json({ error: "Erro interno." });
    }
});

// ==========================================================================
// 4. REGISTER MANUAL APPLICATION
// ==========================================================================
router.post('/register-manual', auth, requireAdmin, async (req, res) => {
    const { id_usuario, id_posto, id_campanha, id_pet } = req.body;

    if (!id_usuario || !id_posto || !id_campanha) {
        return res.status(400).json({ error: "Campos obrigatórios." });
    }

    try {
        const db = await openDb();

        const campanha = await db.get(
            'SELECT * FROM campanhas WHERE id_campanha = ?',
            [id_campanha]
        );

        if (!campanha) {
            return res.status(404).json({ error: "Campanha não encontrada." });
        }

        const estoque = await db.get(
            `SELECT quantidade 
             FROM estoque_postos 
             WHERE id_posto = ? AND id_vacina = ?`,
            [id_posto, campanha.id_vacina]
        );

        if (!estoque || estoque.quantidade <= 0) {
            return res.status(400).json({ error: "Sem estoque." });
        }

        await db.run(
            `UPDATE estoque_postos 
             SET quantidade = quantidade - 1 
             WHERE id_posto = ? AND id_vacina = ?`,
            [id_posto, campanha.id_vacina]
        );

        if (id_pet) {
            await db.run(`
                INSERT INTO historico_vacinas_pet
                (
                    id_pet,
                    id_vacina,
                    id_posto,
                    data_aplicacao,
                    status
                )
                VALUES (?, ?, ?, date('now'), 'Aplicada')
            `, [
                id_pet,
                campanha.id_vacina,
                id_posto
            ]);

        } else {

            await db.run(`
                INSERT INTO historico_vacinacao
                (
                    id_usuario,
                    id_vacina,
                    data_prevista,
                    status
                )
                VALUES (?, ?, date('now'),'CONCLUIDA')
            `, [
                id_usuario,
                campanha.id_vacina
            ]);

        }

        return res.json({
            success: true,
            message: "Vacinação registrada com sucesso"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno." });
    }
});

router.get('/user-pets/:id_usuario', auth, requireAdmin, async (req, res) => {

    try {

        const db = await openDb();

        const pets = await db.all(`
            SELECT
                p.*,
                r.nome_raca
            FROM pets p
            LEFT JOIN racas r
                ON r.id_raca = p.id_raca
            WHERE p.id_usuario = ?
            ORDER BY p.nome
        `, [req.params.id_usuario]);

        res.json(pets);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Erro ao buscar pets."
        });

    }

});

module.exports = router;