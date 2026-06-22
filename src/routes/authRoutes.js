// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const bcrypt = require('bcrypt');

// =======================================================
// ROTA DE CADASTRO (Atualizada com dados de saúde)
// POST: /api/auth/cadastro
// =======================================================
router.post('/cadastro', async (req, res) => {
    // 1. Recebemos os novos campos obrigatórios vindos do Front-end
    const { nome, email, senha, data_nascimento, sexo } = req.body;

    // Validação básica de segurança no servidor
    if (!nome || !email || !senha || !data_nascimento || !sexo) {
        return res.status(400).json({ success: false, message: "Todos os campos são obrigatórios!" });
    }

    try {
        const db = await openDb();
        
        // 2. Criptografia da senha limpa
        const saltRounds = 10;
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        // 3. Inserção incluindo os campos novos: data_nascimento e sexo
        const result = await db.run(
            `INSERT INTO usuarios (nome, email, senha, data_nascimento, sexo) 
             VALUES (?, ?, ?, ?, ?)`,
            [nome, email, senhaCriptografada, data_nascimento, sexo]
        );
        
        res.status(201).json({ 
            success: true, 
            message: "Usuário criado com segurança!", 
            id_usuario: result.lastID 
        });
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        res.status(400).json({ success: false, message: "Erro ao cadastrar. E-mail já pode estar em uso." });
    }
});

// =======================================================
// ROTA DE LOGIN (Atualizada para retornar os dados completos)
// POST: /api/auth/login
// =======================================================
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ auth: false, message: "E-mail e senha são obrigatórios!" });
    }

    try {
        const db = await openDb();
        
        // 1. Buscamos o usuário trazendo os novos campos para que o front conheça o perfil do usuário
        const usuario = await db.get(
            'SELECT id_usuario, nome, email, senha, data_nascimento, sexo, is_admin FROM usuarios WHERE email = ?',
            [email]
        );

        // 2. Validação com Bcrypt
        if (usuario) {
            const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

            if (senhaCorreta) {
                // Segurança crucial: nunca devolva o hash da senha para o cliente
                delete usuario.senha; 
                res.json({ auth: true, usuario });
            } else {
                res.status(401).json({ auth: false, message: "E-mail ou senha inválidos" });
            }
        } else {
            res.status(401).json({ auth: false, message: "E-mail ou senha inválidos" });
        }
    } catch (error) {
        console.error("Erro no processo de login:", error);
        res.status(500).json({ auth: false, message: "Erro interno no servidor" });
    }
});

module.exports = router;