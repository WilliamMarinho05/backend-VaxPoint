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
            horario_funcionamento TEXT NOT NULL,
            lat REAL,
            lng REAL,
            alerta_instabilidade INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS campanhas (
            id_campanha INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            publico TEXT,
            periodo TEXT,
            descricao TEXT,
            imagem_url TEXT,
            destaque INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS historico_vacinacao (
            id_historico INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            id_pet INTEGER, 
            id_vacina INTEGER NOT NULL,
            data_prevista TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'CONCLUIDA',
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
            FOREIGN KEY (id_pet) REFERENCES pets(id_pet) ON DELETE CASCADE,
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina) ON DELETE CASCADE
        );
    `);

    console.log("📐 Estrutura do banco de dados verificada/criada!");
    return db;
}

module.exports = { openDb, initDb };