const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); 
const requireAdmin = require('../middlewares/requireAdmin'); 
const { openDb } = require('../database'); 

// Aplica os middlewares em TODAS as rotas deste arquivo
router.use(auth, requireAdmin);

function montarFiltroRegiao(regiao, alias = "postos") {
    let filtro = "";
    let params = [];

    if (regiao === "Norte") {
        filtro = `AND ${alias}.id_posto IN (1,2,3)`;
    }
    else if (regiao === "Sul") {
        filtro = `AND ${alias}.id_posto IN (4,5,6,7,8,9,10,11,12,13,14,15)`;
    }
    else if (regiao && !isNaN(regiao)) {
        filtro = `AND ${alias}.id_posto = ?`;
        params.push(Number(regiao));
    }

    return { filtro, params };
}

// ROTA 1: Obter Métricas dos Cards (Total aplicadas, Estoque, etc.)
router.get('/metrics', async (req, res) => {
    try {
        const { regiao } = req.query; 
        const db = await openDb();

        const { filtro, params } = montarFiltroRegiao(regiao, "postos");

        // 1. Total de usuários ativos (Geral, independe de posto)
        const usuariosData = await db.get(`SELECT COUNT(*) as total FROM usuarios`);

        // 2. Doses aplicadas (Usando histórico pet que possui id_posto)
        const dosesPet = await db.get(`
            SELECT COUNT(*) as total 
            FROM historico_vacinas_pet hvp
            LEFT JOIN postos ON hvp.id_posto = postos.id_posto
            WHERE 1=1
            ${filtro}
        `, params);

        // 3. Alertas de Estoque (Vacinas com menos de 20 doses)
        const alertas = await db.get(`
            SELECT COUNT(*) as total 
            FROM estoque_postos ep
            LEFT JOIN postos ON ep.id_posto = postos.id_posto
            WHERE 1=1
            ${filtro}
            AND ep.quantidade < 20
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

router.get('/chart/vacinas', async (req, res) => {
    try {
        const db = await openDb();

        const dados = await db.all(`
            SELECT 
                v.id_vacina,
                v.nome_vacina AS nome,

                COALESCE(estoque.total_estoque, 0) AS estoque,
                COALESCE(aplicacoes.total_aplicadas, 0) AS aplicadas

            FROM vacinas v

            LEFT JOIN (
                SELECT id_vacina, SUM(quantidade) AS total_estoque
                FROM estoque_postos
                GROUP BY id_vacina
            ) estoque ON estoque.id_vacina = v.id_vacina

            LEFT JOIN (
                SELECT id_vacina, COUNT(*) AS total_aplicadas
                FROM historico_vacinas_pet
                GROUP BY id_vacina
            ) aplicacoes ON aplicacoes.id_vacina = v.id_vacina

            WHERE v.tipo IN ('Cachorro', 'Gato')

            ORDER BY estoque DESC
        `);

        const cores = ["#10b981", "#007bff", "#f59e0b", "#ec4899"];

        const resposta = dados.map((item, index) => ({
            nome: item.nome,
            estoque: Number(item.estoque),
            aplicadas: Number(item.aplicadas),
            cor: cores[index % cores.length]
        }));

        res.json(resposta);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar estoque" });
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

// ROTA 4: Buscar todos os Postos (Para o Select do formulário)
router.get('/postos', async (req, res) => {
    try {
        const db = await openDb();
        const postos = await db.all(`SELECT id_posto, nome_posto FROM postos ORDER BY nome_posto ASC`);
        res.json(postos);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar postos" });
    }
});



// ROTA 5: Buscar todas as Vacinas (Para o Select do formulário)
router.get('/vacinas', async (req, res) => {
    try {
        const db = await openDb();
        const vacinas = await db.all(`SELECT id_vacina, nome_vacina, tipo FROM vacinas ORDER BY nome_vacina ASC`);
        res.json(vacinas);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar vacinas" });
    }
});

// ROTA 6: Criar Nova Campanha Relacional (Tabelas: campanhas e campanha_postos)
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