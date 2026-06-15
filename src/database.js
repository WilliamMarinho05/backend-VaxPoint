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

    // 1. Cria as tabelas se elas não existirem
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
            data_prevista TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'CONCLUIDA',
            FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
            FOREIGN KEY (id_pet) REFERENCES pets(id_pet) ON DELETE CASCADE,
            FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina) ON DELETE CASCADE
        );
    `);

    // 2. AUTOMÁTICO: Insere os 10 postos reais de Palmas se eles não existirem no banco
    await db.run(`INSERT OR IGNORE INTO postos (id_posto, nome_posto, endereco, horario_funcionamento) VALUES 
        (1, 'USF 307 Norte (José Luiz Otaviani)', 'Arno 33 (307 Norte), Alameda 4, APM', '07:00 às 17:00'),
        (2, 'USF 403 Norte', 'Arno 41 (403 Norte), Alameda 1, Lote 7', '07:00 às 17:00'),
        (3, 'USF 508 Norte (Arne 64)', 'Arne 64 (508 Norte), Alameda 11, APM 49', '07:00 às 19:00'),
        (4, 'USF 108 Sul (Deise de Fátima)', 'Arse 13 (108 Sul), Alameda 2, Lotes 5 e 7', '07:00 às 22:00'),
        (5, 'USF 210 Sul (Loiane Moreno)', 'Arse 24 (210 Sul), Alameda 7, APM 07', '07:00 às 17:00'),
        (6, 'USF 403 Sul (Francisco Júnior)', 'Arso 41 (403 Sul), Alameda 1, APM 02', '07:00 às 19:00'),
        (7, 'USF 1103 Sul (Satilo Alves)', 'Arso 111 (1103 Sul), Alameda 17, APM 13', '07:00 às 17:00'),
        (8, 'USF 1304 Sul', 'Arse 131 (1304 Sul), Rua 11, APM 23F e 23G', '07:00 às 19:00'),
        (9, 'USF Jardim Aureny I (Eugênio Pinheiro)', 'Jardim Aureny I, Rua Natal, APM NW 01 G', '07:00 às 17:00'),
        (10, 'USF Jardim Aureny III (Laurides Lima)', 'Jardim Aureny III, Quadra 15, Rua 2', '07:00 às 22:00')
    `);

    // 3. AUTOMÁTICO: Insere o catálogo inicial de vacinas se ele estiver vazio
    await db.run(`INSERT OR IGNORE INTO vacinas (id_vacina, nome_vacina, tipo, descricao, doses_necessarias) VALUES 
        (1, 'Antirrábica', 'PET', 'Vacina anual contra a raiva para cães e gatos', 1),
        (2, 'Quádrupla Felina (V4)', 'PET', 'Protege gatos contra panleucopenia, calicivirose, rinotraqueíte e clamidiose', 2),
        (3, 'Tríplice Viral', 'HUMANA', 'Protege contra Sarampo, Caxumba e Rubéola', 2),
        (4, 'Influenza (Gripe)', 'HUMANA', 'Vacina anual de proteção sazonal contra a gripe', 1)
    `);

    console.log("✅ Banco de dados inicializado e dados de Palmas injetados automaticamente!");
    return db;
}

module.exports = { openDb, initDb };