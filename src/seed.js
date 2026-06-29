// src/seed.js
const { openDb } = require('./database');
const bcrypt = require('bcrypt');

async function popularBanco() {
    const db = await openDb();

    try {
        console.log("🧹 Limpando tabelas antigas respeitando as restrições de chaves estrangeiras...");
        // Ordem inversa de eliminação para não violar as Foreign Keys ativas
        await db.run(`DELETE FROM intencoes_vacinacao`);
        await db.run(`DELETE FROM historico_vacinas_pet`);
        await db.run(`DELETE FROM historico_vacinacao`);
        await db.run(`DELETE FROM pets`);
        await db.run(`DELETE FROM racas`);
        await db.run(`DELETE FROM estoque_postos`);
        await db.run(`DELETE FROM campanha_postos`);
        await db.run(`DELETE FROM campanhas`);
        await db.run(`DELETE FROM postos`);
        await db.run(`DELETE FROM vacinas`);
        await db.run(`DELETE FROM usuarios`);

        // ==========================================
        // 1. POSTOS
        // ==========================================
        console.log("🏥 Inserindo postos de saúde...");
        await db.run(`
            INSERT OR IGNORE INTO postos 
            (id_posto, nome_posto, endereco, horario_funcionamento, lat, lng, alerta_instabilidade)
            VALUES 
            (1, 'USF 307 Norte (José Luiz Otaviani)', 'Arno 33, 307 Norte, Palmas - TO', '07:00 às 18:00', -10.16720890434086, -48.35150063048562, 0),
            (2, 'USF 403 Norte', 'Arno 41, 403 Norte, Palmas - TO', '07:00 às 19:00', -10.16234541070625, -48.33820329336149, 0),
            (3, 'USF 508 Norte (Arne 64)', 'Arne 64, 508 Norte, Palmas - TO', '07:00 às 18:00', -10.166015626555492, -48.30812320570881, 0),
            (4, 'USF 108 Sul (Deise de Fátima)', 'Arse 13, 108 Sul, Palmas - TO', '07:00 às 19:00', -10.186822604392301, -48.31881569140458, 0),
            (5, 'USF 210 Sul (Loiane Moreno)', 'Arse 24, 210 Sul, Palmas - TO', '08:00 às 18:00', -10.194232029698666, -48.31331569140461, 0),
            (6, 'USF 403 Sul (Francisco Júnior)', 'Arso 41, 403 Sul, Palmas - TO', '07:00 às 19:00', -10.207167778391415, -48.343063747226935, 0),
            (7, 'USF 1103 Sul (Satilo Alves)', 'Arso 111, 1103 Sul, Palmas - TO', '07:00 às 19:00', -10.251508948853703, -48.33714019325329, 0),
            (8, 'USF 1304 Sul', 'Arse 131, 1304 Sul, Palmas - TO', '07:00 às 19:00', -10.264451014474187, -48.32515661849964, 0),
            (9, 'USF 712 Sul', 'Arse 75, 712 Sul, Palmas - TO', '07:00 às 19:00', -10.225159222306452, -48.3154661085954, 0),
            (10, 'USF 806 Sul', 'Arse 82, 806 Sul, Palmas - TO', '07:00 às 18:00', -10.233026451741031, -48.319950907098246, 0),
            (11, 'USF Aureny I (Eugênio Pinheiro)', 'Jardim Aureny I, Palmas - TO', '07:00 às 18:00', -10.31461289005529, -48.30557817791117, 0),
            (12, 'USF Aureny III (Laurides Lima)', 'Jardim Aureny III, Palmas - TO', '07:00 às 18:00', -10.32796344584866, -48.319064509678974, 0),
            (13, 'USF Taquari', 'Setor Taquari, Palmas - TO', '07:00 às 19:00', -10.34594992257219, -48.332437787707164, 0),
            (14, 'USF Morada do Sol', 'Morada do Sol II, Palmas - TO', '07:00 às 19:00', -10.337027442013673, -48.28435350685494, 0),
            (15, 'USF Bela Vista', 'Setor Bela Vista, Palmas - TO', '07:00 às 19:00', -10.35036782354659, -48.296272376062475, 0)
        `);

        // ==========================================
        // 2. VACINAS
        // ==========================================
        console.log("💉 Inserindo catálogo de vacinas...");
        await db.run(`
            INSERT OR IGNORE INTO vacinas 
            (id_vacina, nome_vacina, tipo, descricao, doses_necessarias) 
            VALUES 
            (1, 'Antirrábica', 'Cachorro', 'Vacina anual contra a raiva para cães e gatos', 1),
            (2, 'Quádrupla Felina (V4)', 'Gato', 'Protege gatos contra panleucopenia, calicivirose, rinotraqueíte e clamidiose', 2),
            (3, 'Tríplice Viral', 'Humano', 'Protege contra Sarampo, Caxumba e Rubéola', 2),
            (4, 'Influenza (Gripe)', 'Humano', 'Vacina anual de proteção sazonal contra a gripe', 1)
        `);

        // ==========================================
        // 3. CAMPANHAS
        // ==========================================
        console.log("📢 Inserindo campanhas de imunização...");
        await db.run(`
            INSERT OR IGNORE INTO campanhas
            (id_campanha, id_vacina, titulo, publico, periodo, descricao, imagem_url, destaque)
            VALUES
            (1, 1, 'Campanha Antirrábica Cães 2026', 'Cachorro', '01 de Junho a 30 de Junho', 'Proteja o seu melhor amigo contra a raiva!', 'https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=1200&q=80', 0),
            (2, 4, 'Mobilização Contra a Gripe (Influenza)', 'Humano', 'Permanente', 'Campanha de imunização anual para toda a população.', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', 0),
            (3, 2, 'Campanha Antirrábica Gatos 2026', 'Gato', '15 de Julho a 31 de Agosto', 'Mantenha seu felino seguro e saudável.', 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80', 0)
        `);

        // ==========================================
        // 4. ESTOQUE DOS POSTOS
        // ==========================================
        console.log("📦 Abastecendo estoques das UBS...");
        await db.run(`
            INSERT OR IGNORE INTO estoque_postos (id_posto, id_vacina, quantidade) VALUES
            (1, 3, 50),  (1, 4, 120),
            (2, 3, 30),  (2, 4, 80),
            (3, 3, 15),  (3, 4, 200),
            (4, 3, 90),  (4, 4, 150),
            (5, 3, 40),  (5, 4, 60),
            (6, 3, 0),   (6, 4, 110),
            (7, 3, 75),  (7, 4, 95),
            (8, 3, 100), (8, 4, 130),
            (9, 3, 20),  (9, 4, 45),
            (10, 3, 65), (10, 4, 85),
            (11, 3, 110),(11, 4, 140),
            (12, 3, 55), (12, 4, 175),
            (13, 3, 40), (13, 4, 90),
            (14, 3, 25), (14, 4, 105),
            (15, 3, 85), (15, 4, 160)
        `);

        // ==========================================
        // 5. CAMPANHA_POSTOS
        // ==========================================
        console.log("🔗 Vinculando postos às campanhas...");
        await db.run(`
            INSERT OR IGNORE INTO campanha_postos (id_campanha, id_posto) VALUES
            (1, 1), (1, 2), (1, 6), (1, 11), (1, 13),
            (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10), (2, 11), (2, 12), (2, 13), (2, 14), (2, 15),
            (3, 3), (3, 4), (3, 7), (3, 12), (3, 15)
        `);

        // ==========================================
        // 6. RAÇAS
        // ==========================================
        console.log("🧬 Inserindo catálogo de raças...");
        await db.run(`
            INSERT OR IGNORE INTO racas (id_raca, nome_raca, especie) VALUES
            (1, 'Sem Raça Definida (SRD)', 'Cachorro'),
            (2, 'Vira-lata', 'Cachorro'),
            (3, 'Poodle', 'Cachorro'),
            (4, 'Pinscher', 'Cachorro'),
            (5, 'Labrador', 'Cachorro'),
            (6, 'Golden Retriever', 'Cachorro'),
            (7, 'Sem Raça Definida (SRD)', 'Gato'),
            (8, 'Persa', 'Gato'),
            (9, 'Siamês', 'Gato'),
            (10, 'Angorá', 'Gato')
        `);

        // ==========================================
        // 7. USUÁRIOS (ADMIN E NORMAL)
        // ==========================================
        console.log("👥 Semeando usuários solicitados...");
        const senhaHash = await bcrypt.hash('123456', 10);

        // Administrador
        await db.run(`
            INSERT OR IGNORE INTO usuarios (id_usuario, nome, email, senha, data_nascimento, sexo, is_admin)
            VALUES (1, 'admin', 'admin@vaxpoint.com', ?, '1985-06-06', 'Homem', 1)
        `, [senhaHash]);

        // Usuário comum
        const resUser = await db.run(`
            INSERT OR IGNORE INTO usuarios (nome, email, senha, data_nascimento, sexo, is_admin)
            VALUES ('Maria Clara', 'xxx@gmail.com', ?, '2002-04-04', 'Mulher', 0)
        `, [senhaHash]);
        const idUsuario = resUser.lastID;

        // ==========================================
        // 8. PETS
        // ==========================================
        console.log("🐶 Cadastrando pet vinculado à Maria Clara...");
        const resPet = await db.run(`
            INSERT OR IGNORE INTO pets (nome, especie, id_raca, porte, peso, sexo, data_nascimento, numero_microchip, foto_url, id_usuario)
            VALUES ('Pipoca', 'Cachorro', 2, 'Médio', 12.5, 'Macho', '2023-08', '900111000222', null, ?)
        `, [idUsuario]);
        const idPet = resPet.lastID;

        // ==========================================
        // 9. HISTÓRICO DE VACINAÇÃO HUMANA
        // ==========================================
        console.log("📊 Gerando históricos de aplicações humana...");
        // Removido o campo "id_pet" daqui, pois sua tabela historico_vacinacao não possui essa coluna física
        await db.run(`
            INSERT OR IGNORE INTO historico_vacinacao (id_usuario, id_vacina, data_prevista, status)
            VALUES (?, 3, '2025-01-15', 'CONCLUIDA')
        `, [idUsuario]);

        // ==========================================
        // 10. HISTÓRICO DE VACINAÇÃO PET
        // ==========================================
        console.log("🐱 Gerando históricos de aplicações pet...");
        await db.run(`
            INSERT OR IGNORE INTO historico_vacinas_pet (id_pet, id_vacina, id_posto, data_aplicacao, status)
            VALUES (?, 1, 1, '2025-10-20', 'Aplicada')
        `, [idPet]);

        // ==========================================
        // 11. INTENÇÕES DE VACINAÇÃO
        // ==========================================
        console.log("🗓️ Criando intenção ativa...");
        await db.run(`
            INSERT OR IGNORE INTO intencoes_vacinacao (id_usuario, id_posto, id_vacina, id_campanha, id_pet, data_registro)
            VALUES (?, 1, 1, 1, ?, '2026-06-22')
        `, [idUsuario, idPet]);

        console.log("🎉 Carga inicial (Seed) sincronizada e executada com sucesso!");
        console.log("🚀 Credenciais Prontas:\n   - Admin: admin@vaxpoint.com | 123456\n   - Normal: xxx@gmail.com | 123456");

    } catch (error) {
        console.error("❌ Erro ao rodar o seed:", error);
    }
}

if (require.main === module) {
    popularBanco().catch(err => console.error("❌ Erro ao rodar seed:", err));
}

module.exports = popularBanco;