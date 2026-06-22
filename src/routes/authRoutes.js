// src/routes/authRoutes.js - Alterações Joaby
const express = require('express');
const router = express.Router();
const { openDb } = require('../database');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const validarCampos = require('../middlewares/validacao');

// CADASTRO
router.post(
    '/cadastro',

    [
        body('nome')
            .notEmpty()
            .withMessage('Nome é obrigatório'),

        body('email')
            .isEmail()
            .withMessage('Email inválido'),

        body('senha')
            .isLength({ min: 8 })
            .withMessage('Senha deve ter no mínimo 8 caracteres')
    ],

    validarCampos,
    async (req, res) => {
        const { nome, email, senha } = req.body;

        try {
            const db = await openDb();
            const saltRounds = 10;
            const senhaCriptografada =
                await bcrypt.hash(
                    senha,
                    saltRounds
                );
            const result = await db.run(
                `
                INSERT INTO usuarios
                (
                    nome,
                    email,
                    senha
                )
                VALUES
                (
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    nome,
                    email,
                    senhaCriptografada
                ]
            );
            res.status(201).json({
                success: true,
                message: 'Usuário criado com segurança!',
                id_usuario: result.lastID
            });

        } catch (error) {
            console.error(error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// LOGIN
router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Email inválido'),

        body('senha')
            .isLength({ min: 8 })
            .withMessage('Senha deve ter no mínimo 8 caracteres')
    ],
    validarCampos,
    async (req, res) => {
        const { email, senha } = req.body;
        try {
            const db = await openDb();
            const usuario = await db.get(
                `
                SELECT
                    id_usuario,
                    nome,
                    email,
                    senha,
                    is_admin
                FROM usuarios
                WHERE email = ?
                `,
                [email]
            );
            if (!usuario) {
                return res.status(401).json({
                    auth: false,
                    message: 'E-mail ou senha inválidos'
                });
            }
            const senhaCorreta =
                await bcrypt.compare(
                    senha,
                    usuario.senha
                );
            if (!senhaCorreta) {
                return res.status(401).json({
                    auth: false,
                    message: 'E-mail ou senha inválidos'
                });
            }
            delete usuario.senha;
            res.status(200).json({
                auth: true,
                usuario
            });
        } catch (error) {

            console.error(error);

            res.status(500).json({
                auth: false,
                message: error.message
            });
        }
    }
);

module.exports = router;