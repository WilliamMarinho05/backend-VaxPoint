// src/routes/vaccinationRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('.././database'); // Puxa o banco usando a mesma lógica dos outros arquivos

// ==========================================================================
// 1. LISTAR VACINAS HUMANAS
// ==========================================================================
router.get('/vaccines', async (req, res) => {
    const { id_posto } = req.query; // Pega o id do posto enviado pelo front (?id_posto=1)

    try {
        const db = await openDb();
        
        let query = 'SELECT id_vacina, nome_vacina FROM vacinas WHERE tipo = "Humano"';
        let params = [];

        // Se o front passar o posto, filtramos o estoque real daquele posto!
        if (id_posto) {
            query = `
                SELECT v.id_vacina, v.nome_vacina 
                FROM vacinas v
                INNER JOIN estoque_postos e ON v.id_vacina = e.id_vacina
                WHERE v.tipo = 'Humano' AND e.id_posto = ? AND e.quantidade > 0
            `;
            params = [id_posto];
        }

        const vacinas = await db.all(query, params);
        return res.status(200).json(vacinas);
    } catch (error) {
        console.error("Erro ao buscar vacinas:", error);
        return res.status(500).json({ error: "Erro interno ao buscar vacinas." });
    }
});

// ==========================================================================
// 2. LISTAR POSTOS DE SAÚDE (Para preencher o Select do posto se necessário)
// ==========================================================================
router.get('/posts', async (req, res) => {
    try {
        const db = await openDb();
        const postos = await db.all('SELECT id_posto, nome_posto FROM postos');
        return res.status(200).json(postos);
    } catch (error) {
        console.error("Erro ao buscar postos:", error);
        return res.status(500).json({ error: "Erro interno ao buscar postos." });
    }
});

// ==========================================================================
// 3. VERIFICAR SE O CIDADÃO EXISTE (E-mail + Data de Nascimento)
// ==========================================================================
router.post('/check-user', async (req, res) => {
    const { email, data_nascimento } = req.body;

    if (!email || !data_nascimento) {
        return res.status(400).json({ error: "E-mail e data de nascimento são obrigatórios." });
    }

    try {
        const db = await openDb();
        const usuario = await db.get(
            'SELECT id_usuario, nome FROM usuarios WHERE email = ? AND data_nascimento = ?',
            [email, data_nascimento]
        );

        if (!usuario) {
            return res.status(404).json({ error: "Cidadão não encontrado. Verifique os dados digitados." });
        }

        return res.status(200).json({ success: true, user: usuario });
    } catch (error) {
        console.error("Erro ao verificar usuário:", error);
        return res.status(500).json({ error: "Erro ao validar o cidadão no banco." });
    }
});

// ==========================================================================
// 4. CONFIRMAR APLICAÇÃO DE ROTINA (Salva no Histórico Humano e retira 1 do Estoque)
// ==========================================================================
router.post('/confirm-routine', async (req, res) => {
    const { id_usuario, id_vacina, id_posto } = req.body;

    if (!id_usuario || !id_vacina || !id_posto) {
        return res.status(400).json({ error: "Dados incompletos para a aplicação (id_usuario, id_vacina, id_posto)." });
    }

    try {
        const db = await openDb();

        // Verifica se há estoque no posto correspondente
        const estoque = await db.get(
            'SELECT quantidade FROM estoque_postos WHERE id_posto = ? AND id_vacina = ?',
            [id_posto, id_vacina]
        );

        if (!estoque || estoque.quantidade <= 0) {
            return res.status(400).json({ error: "Quantidade esgotada ou sem registro de estoque para esta vacina neste posto." });
        }

        // Pega a data local do servidor formatada estritamente como YYYY-MM-DD
        const hoje = new Date();
        const dataHoje = hoje.toLocaleDateString('sv-SE'); // O formato 'sv-SE' gera nativamente YYYY-MM-DD com a data local!

        // Transação: Garante histórico inserido e estoque reduzido juntos
        await db.run(
            `INSERT INTO historico_vacinacao (id_usuario, id_vacina, data_prevista, status) 
             VALUES (?, ?, ?, 'CONCLUIDA')`,
            [id_usuario, id_vacina, dataHoje]
        );

        await db.run(
            'UPDATE estoque_postos SET quantidade = quantidade - 1 WHERE id_posto = ? AND id_vacina = ?',
            [id_posto, id_vacina]
        );

        return res.status(201).json({
            success: true,
            message: "Aplicação computada e estoque reduzido com sucesso!"
        });
    } catch (error) {
        console.error("Erro ao confirmar vacinação:", error);
        return res.status(500).json({ error: "Erro interno ao salvar vacinação de rotina." });
    }
});

module.exports = router;