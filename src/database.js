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

    // Habilita chaves estrangeiras e cria tabelas bem relacionadas
    await db.exec(`
        PRAGMA foreign_keys = ON;

        -- 1. USUÁRIOS
        CREATE TABLE IF NOT EXISTS usuarios (
            id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0
        );

        -- 3. DICIONÁRIO DE VACINAS (Catálogo centralizado)
        CREATE TABLE IF NOT EXISTS vacinas (
            id_vacina INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_vacina TEXT NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('Humano', 'Cachorro', 'Gato')), -- Amarração do público da vacina
            descricao TEXT,
            doses_necessarias INTEGER DEFAULT 1
        );

        -- 4. POSTOS DE SAÚDE
        CREATE TABLE IF NOT EXISTS postos (
            id_posto INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_posto TEXT NOT NULL,
            endereco TEXT NOT NULL,
            horario_funcionamento TEXT NOT NULL,
            lat REAL,
            lng REAL,
            alerta_instabilidade INTEGER DEFAULT 0
        );

        -- 5. ESTOQUE DOS POSTOS (N:M entre Postos e Vacinas)
        CREATE TABLE IF NOT EXISTS estoque_postos (
            id_posto INTEGER NOT NULL,
            id_vacina INTEGER NOT NULL,
            quantidade INTEGER DEFAULT 0,
            PRIMARY KEY (id_posto, id_vacina),
            FOREIGN KEY (id_posto) REFERENCES postos(id_posto) ON DELETE CASCADE,
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina) ON DELETE CASCADE
        );

        -- 6. CAMPANHAS (Agora vinculada a uma vacina específica do catálogo)
        CREATE TABLE IF NOT EXISTS campanhas (
            id_campanha INTEGER PRIMARY KEY AUTOINCREMENT,
            id_vacina INTEGER NOT NULL, -- Essencial para o sistema saber o que será aplicado
            titulo TEXT NOT NULL,
            publico TEXT NOT NULL CHECK(publico IN ('Humano', 'Cachorro', 'Gato')),
            periodo TEXT,
            descricao TEXT,
            imagem_url TEXT,
            destaque INTEGER DEFAULT 0,
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina) ON DELETE CASCADE
        );

        -- 7. CAMPANHA_POSTOS (Tabela Pivô N:M - Ajustada com as chaves corretas id_campanha e id_posto)
        CREATE TABLE IF NOT EXISTS campanha_postos (
            id_campanha INTEGER NOT NULL,
            id_posto INTEGER NOT NULL,
            PRIMARY KEY (id_campanha, id_posto),
            FOREIGN KEY (id_campanha) REFERENCES campanhas(id_campanha) ON DELETE CASCADE,
            FOREIGN KEY (id_posto) REFERENCES postos(id_posto) ON DELETE CASCADE
        );

        -- 8. HISTÓRICO DE VACINAÇÃO (Aplicações já realizadas)
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

        -- 9. INTENÇÕES DE VACINAÇÃO (Onde tudo se junta de forma inteligente)
        CREATE TABLE IF NOT EXISTS intencoes_vacinacao (
            id_intencao INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            id_posto INTEGER NOT NULL,       -- Onde o cidadão escolheu ir buscar a dose
            id_vacina INTEGER NOT NULL,      -- Qual vacina ele deseja
            id_campanha INTEGER,             -- NULL se for vacinação de rotina no posto; Preenchido se veio de uma campanha
            id_pet INTEGER,                  -- NULL se for para o próprio Humano logado
            data_registro TEXT NOT NULL,
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
            FOREIGN KEY (id_posto) REFERENCES postos(id_posto) ON DELETE CASCADE,
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina) ON DELETE CASCADE,
            FOREIGN KEY (id_campanha) REFERENCES campanhas(id_campanha) ON DELETE CASCADE,
            FOREIGN KEY (id_pet) REFERENCES pets(id_pet) ON DELETE CASCADE
        );

        -- 1. TABELA DE RAÇAS FIXAS
        CREATE TABLE IF NOT EXISTS racas (
            id_raca INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_raca TEXT NOT NULL,
            especie TEXT NOT NULL CHECK(especie IN ('Cachorro', 'Gato'))
        );

        -- 2. TABELA DE PETS ATUALIZADA
        CREATE TABLE IF NOT EXISTS pets (
            id_pet INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            especie TEXT NOT NULL CHECK(especie IN ('Cachorro', 'Gato')),
            id_raca INTEGER NOT NULL,
            porte TEXT NOT NULL CHECK(porte IN ('Pequeno', 'Médio', 'Grande')),
            peso REAL NOT NULL,
            sexo TEXT NOT NULL CHECK(sexo IN ('Macho', 'Fêmea')),
            data_nascimento TEXT NOT NULL, -- Guardado como YYYY-MM
            numero_microchip TEXT,         -- Opcional
            foto_url TEXT,                 -- String base64 ou link de imagem
            id_usuario INTEGER,            -- Dono do pet (se houver login)
            FOREIGN KEY (id_raca) REFERENCES racas(id_raca)
        );

        -- 3. HISTÓRICO REAL DE VACINAÇÃO (A união perfeita!)
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
    `);

    console.log("📐 Estrutura do banco de dados verificada/criada com relacionamentos estritos!");
    return db;
}

module.exports = { openDb, initDb };