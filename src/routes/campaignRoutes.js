// src/routes/campaignRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');

// ==========================================================================
// 1. LISTAR CAMPANHAS ATIVAS COM ESTOQUE NO POSTO
// ==========================================================================
router.get('/campaigns', async (req, res) => {
    const { id_posto } = req.query;
    if (!id_posto) return res.status(400).json({ error: "id_posto é obrigatório." });

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
// 2. FILTRAR INTENÇÕES ATIVAS DO CIDADÃO (E-mail + Data de Nascimento)
// ==========================================================================
router.post('/check-intentions', async (req, res) => {
    const { email, data_nascimento, id_posto } = req.body;

    if (!email || !data_nascimento || !id_posto) {
        return res.status(400).json({ error: "Campos obrigatórios: email, data_nascimento, id_posto." });
    }

    try {
        const db = await openDb();
        
        const usuario = await db.get(
            'SELECT id_usuario FROM usuarios WHERE email = ? AND data_nascimento = ?',
            [email, data_nascimento]
        );

        if (!usuario) {
            return res.status(404).json({ error: "Cidadão não encontrado no sistema." });
        }

        const intencoes = await db.all(`
            SELECT i.id_intencao, i.id_usuario, i.id_vacina, i.id_pet, i.id_campanha,
                   u.nome as nome_usuario, p.nome as nome_pet, p.especie as especie_pet,
                   v.nome_vacina, c.titulo as titulo_campanha
            FROM intencoes_vacinacao i
            INNER JOIN usuarios u ON i.id_usuario = u.id_usuario
            INNER JOIN vacinas v ON i.id_vacina = v.id_vacina
            LEFT JOIN pets p ON i.id_pet = p.id_pet
            LEFT JOIN campanhas c ON i.id_campanha = c.id_campanha
            WHERE i.id_usuario = ? AND i.id_posto = ?
        `, [usuario.id_usuario, id_posto]);

        return res.status(200).json({ success: true, user: usuario, intencoes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao buscar intenções." });
    }
});

// ==========================================================================
// 3. CONFIRMAR INTENÇÃO (Baixa na fila de campanha)
// ==========================================================================
router.post('/confirm-intention', async (req, res) => {
    const { id_intencao, id_posto } = req.body;

    try {
        const db = await openDb();

        const intencao = await db.get('SELECT * FROM intencoes_vacinacao WHERE id_intencao = ?', [id_intencao]);
        if (!intencao) return res.status(404).json({ error: "Intenção não encontrada." });

        const estoque = await db.get(
            'SELECT quantidade FROM estoque_postos WHERE id_posto = ? AND id_vacina = ?',
            [id_posto, intencao.id_vacina]
        );
        if (!estoque || estoque.quantidade <= 0) {
            return res.status(400).json({ error: "Estoque esgotado para esta vacina neste posto." });
        }

        const dataHoje = new Date().toLocaleDateString('sv-SE');

        if (intencao.id_pet) {
            await db.run(`
                INSERT INTO historico_vacinas_pet (id_pet, id_vacina, id_posto, data_aplicacao, status)
                VALUES (?, ?, ?, ?, 'Aplicada')
            `, [intencao.id_pet, intencao.id_vacina, id_posto, dataHoje]);
        } else {
            await db.run(`
                INSERT INTO historico_vacinacao (id_usuario, id_vacina, data_prevista, status)
                VALUES (?, ?, ?, 'CONCLUIDA')
            `, [intencao.id_usuario, intencao.id_vacina, dataHoje]);
        }

        await db.run('UPDATE estoque_postos SET quantidade = quantidade - 1 WHERE id_posto = ? AND id_vacina = ?', 
            [id_posto, intencao.id_vacina]);

        await db.run('DELETE FROM intencoes_vacinacao WHERE id_intencao = ?', [id_intencao]);

        return res.status(200).json({ success: true, message: "Baixa realizada com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao confirmar intenção." });
    }
});

// ==========================================================================
// 4. BUSCAR PETS VINCULADOS AO USUÁRIO
// ==========================================================================
router.get('/user-pets/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const db = await openDb();
        const pets = await db.all('SELECT id_pet, nome, especie FROM pets WHERE id_usuario = ?', [id_usuario]);
        return res.status(200).json(pets || []);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao buscar pets do usuário." });
    }
});

// ==========================================================================
// 5. REGISTRAR APLICAÇÃO MANUAL (Sem intenção prévia)
// ==========================================================================
router.post('/register-manual', async (req, res) => {
    const { id_usuario, id_posto, id_campanha, id_pet } = req.body;

    if (!id_usuario || !id_posto || !id_campanha) {
        return res.status(400).json({ error: "Dados incompletos para o registro." });
    }

    try {
        const db = await openDb();
        
        // 1. Pega os dados da campanha para saber qual é a vacina
        const campanha = await db.get('SELECT id_vacina FROM campanhas WHERE id_campanha = ?', [id_campanha]);
        if (!campanha) return res.status(404).json({ error: "Campanha não encontrada." });

        const id_vacina = campanha.id_vacina;


        // 2. Valida o estoque (Segurança)
        const estoque = await db.get(
            'SELECT quantidade FROM estoque_postos WHERE id_posto = ? AND id_vacina = ?',
            [id_posto, id_vacina]
        );

        if (!estoque || estoque.quantidade <= 0) {
            return res.status(400).json({ error: "Estoque esgotado para esta vacina neste posto." });
        }

        const dataHoje = new Date().toLocaleDateString('sv-SE');

        // 3. Insere no histórico adequado
        if (id_pet) {
            await db.run(`
                INSERT INTO historico_vacinas_pet (id_pet, id_vacina, id_posto, data_aplicacao, status)
                VALUES (?, ?, ?, ?, 'Aplicada')
            `, [id_pet, id_vacina, id_posto, dataHoje]);
        } else {
            await db.run(`
                INSERT INTO historico_vacinacao (id_usuario, id_vacina, data_prevista, status)
                VALUES (?, ?, ?, 'CONCLUIDA')
            `, [id_usuario, id_vacina, dataHoje]);
        }

        // 4. Dá baixa de 1 unidade no estoque
        await db.run('UPDATE estoque_postos SET quantidade = quantidade - 1 WHERE id_posto = ? AND id_vacina = ?', 
            [id_posto, id_vacina]);

        return res.status(200).json({ success: true, message: "Aplicação registrada com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno ao registrar aplicação manual." });
    }
});

module.exports = router;