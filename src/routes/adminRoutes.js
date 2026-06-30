const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); 
const requireAdmin = require('../middlewares/requireAdmin'); 
const { openDb } = require('../database'); 

// Aplica os middlewares em TODAS as rotas deste arquivo
router.use(auth, requireAdmin);

// ROTA 1: Obter Métricas dos Cards (Total aplicadas, Estoque, etc.)
router.get('/metrics', async (req, res) => {
    try {
        const { regiao } = req.query; 
        const db = await openDb();

        // Lógica de filtro geográfico para usar nas queries
        let postoFilter = "";
        let params = [];
        if (regiao === 'Norte' || regiao === 'Sul') {
            postoFilter = "WHERE postos.endereco LIKE ?";
            params.push(`%${regiao}%`);
        } else if (regiao && !isNaN(regiao)) { // É um ID de posto específico
            postoFilter = "WHERE postos.id_posto = ?";
            params.push(Number(regiao));
        }

        // 1. Total de usuários ativos (Geral, independe de posto)
        const usuariosData = await db.get(`SELECT COUNT(*) as total FROM usuarios`);

        // 2. Doses aplicadas (Usando histórico pet que possui id_posto)
        // Nota: O histórico humano no seu DB atual não salva id_posto. Usaremos o pet + intenções ou apenas pet como exemplo local.
        const dosesPet = await db.get(`
            SELECT COUNT(*) as total 
            FROM historico_vacinas_pet hvp
            LEFT JOIN postos ON hvp.id_posto = postos.id_posto
            ${postoFilter}
        `, params);

        // 3. Alertas de Estoque (Vacinas com menos de 20 doses)
        const alertas = await db.get(`
            SELECT COUNT(*) as total 
            FROM estoque_postos ep
            LEFT JOIN postos ON ep.id_posto = postos.id_posto
            ${postoFilter ? postoFilter + " AND " : "WHERE "} ep.quantidade < 20
        `, params);

        res.json({
            totalAplicadas: dosesPet.total, 
            totalUsuarios: usuariosData.total,
            alertasFaltaEstoque: alertas.total,
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar métricas" });
    }
});

// ROTA 2: Obter dados do Gráfico de Vacinas (Quantidades aplicadas por tipo)
router.get('/chart/vacinas', async (req, res) => {
    try {
        const { regiao } = req.query;
        const db = await openDb();

        let postoFilter = "";
        let params = [];
        if (regiao === 'Norte' || regiao === 'Sul') {
            postoFilter = "AND p.endereco LIKE ?";
            params.push(`%${regiao}%`);
        } else if (regiao && !isNaN(regiao)) {
            postoFilter = "AND p.id_posto = ?";
            params.push(Number(regiao));
        }

        // Busca o total por vacina
        const dadosVacinas = await db.all(`
            SELECT v.nome_vacina as nome, COUNT(hvp.id_historico) as quantidade
            FROM vacinas v
            LEFT JOIN historico_vacinas_pet hvp ON v.id_vacina = hvp.id_vacina
            LEFT JOIN postos p ON hvp.id_posto = p.id_posto
            WHERE 1=1 ${postoFilter}
            GROUP BY v.id_vacina
            ORDER BY quantidade DESC
        `, params);

        // Calcula a porcentagem para o frontend
        const totalGeral = dadosVacinas.reduce((acc, curr) => acc + curr.quantidade, 0);
        const cores = ["#10b981", "#007bff", "#f59e0b", "#ec4899"]; // Cores do seu front

        const respostaFormatada = dadosVacinas.map((item, index) => ({
            nome: item.nome,
            quantidade: item.quantidade,
            porcentagem: totalGeral > 0 ? Math.round((item.quantidade / totalGeral) * 100) : 0,
            cor: cores[index % cores.length]
        }));

        res.json(respostaFormatada);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar dados do gráfico" });
    }
});

// ROTA 3: Atualizar Estoque
router.post('/estoque', async (req, res) => {
    try {
        const { id_posto, id_vacina, quantidade } = req.body;
        const db = await openDb();

        // Insere ou atualiza (Upsert) a quantidade
        await db.run(`
            INSERT INTO estoque_postos (id_posto, id_vacina, quantidade)
            VALUES (?, ?, ?)
            ON CONFLICT(id_posto, id_vacina) 
            DO UPDATE SET quantidade = quantidade + excluded.quantidade
        `, [id_posto, id_vacina, quantidade]);

        res.json({ message: "Estoque atualizado com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar estoque" });
    }
});

// ROTA 4: Obter dados do Gráfico de Conversão (Intenção vs Aplicação)
router.get('/chart/conversao', async (req, res) => {
    try {
        const { regiao } = req.query;
        const db = await openDb();

        let postoFilter = "";
        let params = [];

        if (regiao === 'Norte' || regiao === 'Sul') {
            postoFilter = "AND p.endereco LIKE ?";
            params.push(`%${regiao}%`);
        } else if (regiao && !isNaN(regiao)) {
            postoFilter = "AND p.id_posto = ?";
            params.push(Number(regiao));
        }

        // 🔥 AGORA SÓ USAMOS APLICAÇÕES (DADOS CONFIÁVEIS)
        const dados = await db.all(`
            SELECT 
                v.nome_vacina as nome,
                COUNT(hvp.id_historico) as aplicacoes
            FROM vacinas v
            LEFT JOIN historico_vacinas_pet hvp ON v.id_vacina = hvp.id_vacina
            LEFT JOIN postos p ON hvp.id_posto = p.id_posto
            WHERE 1=1 ${postoFilter}
            GROUP BY v.id_vacina
            HAVING aplicacoes > 0
            ORDER BY aplicacoes DESC
            LIMIT 6
        `, params);

        // 📊 formato simples pro front
        const resposta = dados.map(v => ({
            nome: v.nome,
            aplicacoes: v.aplicacoes
        }));

        res.json(resposta);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar conversão" });
    }
});

// ROTA 5: Buscar todos os Postos (Para o Select do formulário)
router.get('/postos', async (req, res) => {
    try {
        const db = await openDb();
        const postos = await db.all(`SELECT id_posto, nome_posto FROM postos ORDER BY nome_posto ASC`);
        res.json(postos);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar postos" });
    }
});



// ROTA 6: Buscar todas as Vacinas (Para o Select do formulário)
router.get('/vacinas', async (req, res) => {
    try {
        const db = await openDb();
        const vacinas = await db.all(`SELECT id_vacina, nome_vacina, tipo FROM vacinas ORDER BY nome_vacina ASC`);
        res.json(vacinas);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar vacinas" });
    }
});

// ROTA 7: Criar Nova Campanha Relacional (Tabelas: campanhas e campanha_postos)
router.post('/campanha', async (req, res) => {
    try {
        const { id_vacina, titulo, publico, periodo, descricao, imagem_url, destaque, ids_postos } = req.body;
        const db = await openDb();

        // Validações de consistência do banco
        if (!id_vacina || !titulo || !publico || !ids_postos || !Array.isArray(ids_postos) || ids_postos.length === 0) {
            return res.status(400).json({ error: "Campos obrigatórios ausentes ou nenhum posto selecionado." });
        }

        // 1. Insere a campanha principal
        const result = await db.run(`
            INSERT INTO campanhas (id_vacina, titulo, publico, periodo, descricao, imagem_url, destaque)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [id_vacina, titulo, publico, periodo, descricao, imagem_url, destaque ? 1 : 0]);

        const id_campanha = result.lastID; // Captura o ID gerado automaticamente

        // 2. Insere os vínculos com múltiplos postos na tabela intermediária
        for (const id_posto of ids_postos) {
            await db.run(`
                INSERT INTO campanha_postos (id_campanha, id_posto)
                VALUES (?, ?)
            `, [id_campanha, Number(id_posto)]);
        }

        res.json({ message: "Campanha e postos associados com sucesso!", id_campanha });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao publicar campanha e seus postos" });
    }
});

module.exports = router;