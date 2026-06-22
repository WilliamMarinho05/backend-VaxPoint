// src/routes/infoRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');

// 1. BUSCAR POSTOS (Apenas traz no estoque vacinas do Tipo 'Humano', filtrando pets fora)
router.get('/postos', async (req, res) => {
    try {
        const db = await openDb();

        const postos = await db.all(`
            SELECT id_posto AS id, nome_posto AS nome, endereco, horario_funcionamento AS horario, lat, lng, alerta_instabilidade AS alertaInstabilidade FROM postos
        `);
        
        const estoqueGeral = await db.all(`
            SELECT ep.id_posto, v.nome_vacina AS nome, ep.quantidade
            FROM estoque_postos ep
            JOIN vacinas v ON ep.id_vacina = v.id_vacina
            WHERE v.tipo = 'Humano'
        `);

        const postosFormatados = postos.map(posto => {
            const vacinasDoPosto = estoqueGeral
                .filter(item => item.id_posto === posto.id)
                .map(item => ({ nome: item.nome, quantidade: item.quantidade }));

            return {
                ...posto,
                alertaInstabilidade: posto.alertaInstabilidade === 1,
                linkGoogleMaps: `https://www.google.com/maps/search/?api=1&query=${posto.lat},${posto.lng}`,
                vacinas: vacinasDoPosto
            };
        });

        res.json(postosFormatados);
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao buscar postos." });
    }
});

// 2. BUSCAR CAMPANHAS (Agrupando dinamicamente os postos parceiros)
router.get('/campanhas', async (req, res) => {
    try {
        const db = await openDb();
        
        const campanhas = await db.all(`
            SELECT c.id_campanha AS id, c.titulo, c.publico, c.periodo, c.descricao, c.imagem_url AS imagemUrl, v.nome_vacina AS vacinaNome, v.id_vacina
            FROM campanhas c
            JOIN vacinas v ON c.id_vacina = v.id_vacina
        `);

        const vinculos = await db.all(`
            SELECT cp.id_campanha, p.id_posto, p.nome_posto, p.endereco 
            FROM campanha_postos cp
            JOIN postos p ON cp.id_posto = p.id_posto
        `);

        const campanhasFormatadas = campanhas.map(camp => {
            const postosDaCampanha = vinculos
                .filter(v => v.id_campanha === camp.id)
                .map(v => ({ id: v.id_posto, nome: v.nome_posto, endereco: v.endereco }));

            return {
                id: camp.id,
                titulo: camp.titulo,
                publico: camp.publico,
                periodo: camp.periodo,
                descricao: camp.descricao,
                imagemUrl: camp.imagemUrl,
                vacinaNome: camp.vacinaNome,
                id_vacina: camp.id_vacina,
                postos: postosDaCampanha
            };
        });

        res.json(campanhasFormatadas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Erro ao buscar campanhas." });
    }
});

// 3. REGISTRAR INTENÇÃO (Salva na tabela correta: intencoes_vacinacao)
router.post('/intencao', async (req, res) => {
    try {
        const { idUsuario, idPosto, idVacina, idCampanha, idPet } = req.body;
        const db = await openDb();
        const dataAtual = new Date().toISOString().split('T')[0];

        await db.run(`
            INSERT INTO intencoes_vacinacao (id_usuario, id_posto, id_vacina, id_campanha, id_pet, data_registro)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [idUsuario, idPosto, idVacina, idCampanha || null, idPet || null, dataAtual]);

        res.json({ success: true, message: "Intenção de vacinação agendada no local com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar intenção:", error);
        res.status(500).json({ success: false, message: "Erro interno ao salvar intenção. Verifique os IDs passados." });
    }
});

module.exports = router;