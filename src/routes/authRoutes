// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const bcrypt = require('bcrypt'); // 1. Importamos o gerador de hash

// Rota de Cadastro
router.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const db = await openDb();
        
        // 2. CRIPTOGRAFIA REAL: Pegamos a senha limpa e transformamos num hash embaralhado
        const saltRounds = 10;
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        // 3. Salvamos a 'senhaCriptografada' no banco de dados
        const result = await db.run(
            'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
            [nome, email, senhaCriptografada]
        );
        
        res.status(201).json({ success: true, message: "Usuário criado com segurança!", id_usuario: result.lastID });
    } catch (error) {
        res.status(400).json({ success: false, message: "Erro ao cadastrar. E-mail pode já existir." });
    }
});

// Rota de Login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const db = await openDb();
        
        // 1. Como a senha no banco está embaralhada, não dá para fazer "WHERE senha = ?" 
        // Procuramos o usuário APENAS pelo e-mail
        const usuario = await db.get(
            'SELECT id_usuario, nome, email, senha, is_admin FROM usuarios WHERE email = ?',
            [email]
        );

        // 2. Se o usuário existir, usamos o bcrypt para comparar a senha digitada com o hash do banco
        if (usuario) {
            const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

            if (senhaCorreta) {
                // Removemos a senha do objeto antes de enviar para o Front por pura segurança
                delete usuario.senha; 
                res.json({ auth: true, usuario });
            } else {
                // Senha errada
                res.status(401).json({ auth: false, message: "E-mail ou senha inválidos" });
            }
        } else {
            // E-mail não encontrado
            res.status(401).json({ auth: false, message: "E-mail ou senha inválidos" });
        }
    } catch (error) {
        res.status(500).json({ auth: false, message: "Erro no servidor" });
    }
});

module.exports = router;