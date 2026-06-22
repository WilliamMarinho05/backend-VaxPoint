// src/database.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function openDb() {
    return open({
        filename: './database.db',
        driver: sqlite3.Database
    });
}

async function initDb() {
    const db = await openDb();

    // Cria as tabelas APENAS se elas não existirem
    await db.exec(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS usuarios (
            id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS pets (
            id_pet INTEGER PRIMARY KEY AUTOINCREMENT,
            id_dono INTEGER NOT NULL,
            nome TEXT NOT NULL,
            especie TEXT NOT NULL,
            raca TEXT,
            data_nascimento TEXT,
            FOREIGN KEY (id_dono) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS vacinas (
            id_vacina INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_vacina TEXT NOT NULL,
            tipo TEXT NOT NULL,
            descricao TEXT,
            doses_necessarias INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS postos (
            id_posto INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_posto TEXT NOT NULL,
            endereco TEXT NOT NULL,
            horario_funcionamento TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS campanhas (
            id_campanha INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descricao TEXT,
            data_inicio TEXT NOT NULL,
            data_fim TEXT NOT NULL,
            id_posto INTEGER,
            FOREIGN KEY (id_posto) REFERENCES postos(id_posto) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS historico_vacinacao (
            id_historico INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            id_pet INTEGER,
            id_vacina INTEGER NOT NULL,
            id_posto INTEGER NOT NULL,
            data_prevista TEXT NOT NULL,
            data_aplicacao TEXT,
            dose_atual INTEGER DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'PLANEJADA',
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
            FOREIGN KEY (id_pet) REFERENCES pets(id_pet),
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina),
            FOREIGN KEY (id_posto) REFERENCES postos(id_posto)
        );

        // Tabela para controle de estoque de vacinas nos postos - Joaby

        CREATE TABLE IF NOT EXISTS estoque_vacinas (
            id_estoque INTEGER PRIMARY KEY AUTOINCREMENT,
            id_posto INTEGER NOT NULL,
            id_vacina INTEGER NOT NULL,
            quantidade_disponivel INTEGER DEFAULT 0,
            data_atualizacao TEXT NOT NULL,
            FOREIGN KEY (id_posto) REFERENCES postos(id_posto),
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina)
        );
    `);

    console.log("Estrutura do banco de dados verificada/criada!");
    return db;
}

module.exports = { openDb, initDb };