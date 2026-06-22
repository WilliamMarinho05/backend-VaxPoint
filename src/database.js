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

    await db.exec(`
        PRAGMA foreign_keys = ON;

        -- 1. USUÁRIOS
        CREATE TABLE IF NOT EXISTS usuarios (
            id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL,
            data_nascimento TEXT NOT NULL,
            sexo TEXT NOT NULL CHECK(sexo IN ('Homem', 'Mulher')),
            is_admin INTEGER DEFAULT 0
        );

        -- 2. RAÇAS
        CREATE TABLE IF NOT EXISTS racas (
            id_raca INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_raca TEXT NOT NULL,
            especie TEXT NOT NULL CHECK(especie IN ('Cachorro', 'Gato'))
        );

        -- 3. PETS
        CREATE TABLE IF NOT EXISTS pets (
            id_pet INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            especie TEXT NOT NULL CHECK(especie IN ('Cachorro', 'Gato')),
            id_raca INTEGER NOT NULL,
            porte TEXT NOT NULL CHECK(porte IN ('Pequeno', 'Médio', 'Grande')),
            peso REAL NOT NULL,
            sexo TEXT NOT NULL CHECK(sexo IN ('Macho', 'Fêmea')),
            data_nascimento TEXT NOT NULL,
            numero_microchip TEXT,
            foto_url TEXT,
            id_usuario INTEGER,

            FOREIGN KEY (id_raca) REFERENCES racas(id_raca),
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
        );

        -- 4. VACINAS
        CREATE TABLE IF NOT EXISTS vacinas (
            id_vacina INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_vacina TEXT NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('Humano', 'Cachorro', 'Gato')),
            descricao TEXT,
            doses_necessarias INTEGER DEFAULT 1
        );

        -- 5. POSTOS
        CREATE TABLE IF NOT EXISTS postos (
            id_posto INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_posto TEXT NOT NULL,
            endereco TEXT NOT NULL,
            horario_funcionamento TEXT NOT NULL,
            lat REAL,
            lng REAL,
            alerta_instabilidade INTEGER DEFAULT 0
        );

        -- 6. ESTOQUE DOS POSTOS
        CREATE TABLE IF NOT EXISTS estoque_postos (
            id_posto INTEGER NOT NULL,
            id_vacina INTEGER NOT NULL,
            quantidade INTEGER DEFAULT 0,
            PRIMARY KEY (id_posto, id_vacina),
            FOREIGN KEY (id_posto) REFERENCES postos(id_posto) ON DELETE CASCADE,
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina) ON DELETE CASCADE
        );

        -- 7. CAMPANHAS
        CREATE TABLE IF NOT EXISTS campanhas (
            id_campanha INTEGER PRIMARY KEY AUTOINCREMENT,
            id_vacina INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            publico TEXT NOT NULL CHECK(publico IN ('Humano', 'Cachorro', 'Gato')),
            periodo TEXT,
            descricao TEXT,
            imagem_url TEXT,
            destaque INTEGER DEFAULT 0,
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina) ON DELETE CASCADE
        );

        -- 8. CAMPANHA_POSTOS
        CREATE TABLE IF NOT EXISTS campanha_postos (
            id_campanha INTEGER NOT NULL,
            id_posto INTEGER NOT NULL,
            PRIMARY KEY (id_campanha, id_posto),
            FOREIGN KEY (id_campanha) REFERENCES campanhas(id_campanha) ON DELETE CASCADE,
            FOREIGN KEY (id_posto) REFERENCES postos(id_posto) ON DELETE CASCADE
        );

        -- 9. HISTÓRICO DE VACINAÇÃO HUMANA
        CREATE TABLE IF NOT EXISTS historico_vacinacao (
            id_historico INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            id_vacina INTEGER NOT NULL,
            data_prevista TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'CONCLUIDA',

            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina) ON DELETE CASCADE
        );

        -- 10. HISTÓRICO DE VACINAÇÃO PET
        CREATE TABLE IF NOT EXISTS historico_vacinas_pet (
            id_historico INTEGER PRIMARY KEY AUTOINCREMENT,
            id_pet INTEGER NOT NULL,
            id_vacina INTEGER NOT NULL,
            id_posto INTEGER NOT NULL,
            data_aplicacao TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Aplicada',

            FOREIGN KEY (id_pet) REFERENCES pets(id_pet) ON DELETE CASCADE,
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina),
            FOREIGN KEY (id_posto) REFERENCES postos(id_posto)
        );

        -- 11. INTENÇÕES DE VACINAÇÃO
        CREATE TABLE IF NOT EXISTS intencoes_vacinacao (
            id_intencao INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            id_posto INTEGER NOT NULL,
            id_vacina INTEGER NOT NULL,
            id_campanha INTEGER,
            id_pet INTEGER,
            data_registro TEXT NOT NULL,

            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
            FOREIGN KEY (id_posto) REFERENCES postos(id_posto) ON DELETE CASCADE,
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina) ON DELETE CASCADE,
            FOREIGN KEY (id_campanha) REFERENCES campanhas(id_campanha) ON DELETE CASCADE,
            FOREIGN KEY (id_pet) REFERENCES pets(id_pet) ON DELETE CASCADE
        );
    `);

    console.log("📐 Estrutura do banco de dados verificada/criada com relacionamentos estritos!");
    return db;
}

module.exports = { openDb, initDb };