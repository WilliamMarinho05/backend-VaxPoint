// src/routes/infoRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const auth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/requireAdmin');


// ======================================================
// 1. POSTOS (PROTEGIDO)
// ======================================================
router.get('/postos', auth, async (req, res) => {
    try {
        const db = await openDb();

        const postos = await db.all(`
            SELECT id_posto AS id, nome_posto AS nome, endereco,
                   horario_funcionamento AS horario, lat, lng,
                   alerta_instabilidade AS alertaInstabilidade
            FROM postos
        `);

        const estoqueGeral = await db.all(`
            SELECT ep.id_posto, v.nome_vacina AS nome, ep.quantidade
            FROM estoque_postos ep
            JOIN vacinas v ON ep.id_vacina = v.id_vacina
            WHERE v.tipo = 'Humano'
        `);

        const postosFormatados = postos.map(posto => {
            const vacinasDoPosto = estoqueGeral
                .filter(i => i.id_posto === posto.id)
                .map(i => ({ nome: i.nome, quantidade: i.quantidade }));

            return {
                ...posto,
                alertaInstabilidade: posto.alertaInstabilidade === 1,
                vacinas: vacinasDoPosto
            };
        });

        res.json(postosFormatados);
    } catch (error) {
        res.status(500).json({ success: false, message: "Erro ao buscar postos." });
    }
});


// ======================================================
// 2. INTENÇÃO (PROTEGIDO — USANDO JWT)
// ======================================================
router.post('/intencao', auth, async (req, res) => {
    try {
        const id_usuario = req.user.id; // vem do token

        const { idPosto, idVacina, idCampanha, idPet } = req.body;

        const db = await openDb();
        const dataAtual = new Date().toISOString().split('T')[0];

        await db.run(`
            INSERT INTO intencoes_vacinacao 
            (id_usuario, id_posto, id_vacina, id_campanha, id_pet, data_registro)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [id_usuario, idPosto, idVacina, idCampanha || null, idPet || null, dataAtual]);

        res.json({ success: true, message: "Intenção registrada com segurança!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Erro ao registrar intenção." });
    }
});

router.get('/campanhas', auth, async (req, res) => {

    try {

        const db = await openDb();

        const campanhas = await db.all(`
            SELECT
                c.id_campanha AS id,
                c.titulo,
                c.publico,
                c.periodo,
                c.descricao,
                c.imagem_url,
                c.destaque,
                v.id_vacina,
                v.nome_vacina AS vacinaNome
            FROM campanhas c
            JOIN vacinas v
                ON c.id_vacina = v.id_vacina
        `);

        const campanhaPostos = await db.all(`
            SELECT
                cp.id_campanha,
                p.id_posto,
                p.nome_posto,
                p.endereco
            FROM campanha_postos cp
            JOIN postos p
                ON cp.id_posto = p.id_posto
        `);

        const resultado = campanhas.map(c => ({
            ...c,
            postos: campanhaPostos
                .filter(p => p.id_campanha === c.id)
                .map(p => ({
                    id: p.id_posto,
                    nome: p.nome_posto,
                    endereco: p.endereco
                }))
        }));

        res.json(resultado);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success:false,
            message:"Erro ao buscar campanhas."
        });

    }

});

router.put('/postos/:idPosto/alerta',
    auth,
    requireAdmin,
    async (req,res)=>{

    try{

        const db = await openDb();

        const {idPosto}=req.params;

        const {alertaInstabilidade}=req.body;

        await db.run(`
            UPDATE postos
            SET alerta_instabilidade=?
            WHERE id_posto=?
        `,[
            alertaInstabilidade ? 1 : 0,
            idPosto
        ]);

        res.json({
            success:true
        });

    }catch(error){
        console.error(error);

        res.status(500).json({
            success:false,
            message:"Erro ao buscar postos."
        });
    }

});

module.exports = router;