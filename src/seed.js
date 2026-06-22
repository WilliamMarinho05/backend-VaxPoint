// src/seed.js
const { openDb } = require('./database');

async function popularBanco() {
    const db = await openDb();

    // =========================
    // POSTOS (ATUALIZADO COM LAT/LNG)
    // =========================
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

    // =========================
    // VACINAS (INALTERADO)
    // =========================
    await db.run(`
        INSERT OR IGNORE INTO vacinas 
        (id_vacina, nome_vacina, tipo, descricao, doses_necessarias) 
        VALUES 
        (1, 'Antirrábica', 'PET', 'Vacina anual contra a raiva para cães e gatos', 1),
        (2, 'Quádrupla Felina (V4)', 'PET', 'Protege gatos contra panleucopenia, calicivirose, rinotraqueíte e clamidiose', 2),
        (3, 'Tríplice Viral', 'HUMANA', 'Protege contra Sarampo, Caxumba e Rubéola', 2),
        (4, 'Influenza (Gripe)', 'HUMANA', 'Vacina anual de proteção sazonal contra a gripe', 1)
    `);

    // =========================
    // CAMPANHAS (INALTERADO)
    // =========================
    await db.run(`
        INSERT OR IGNORE INTO campanhas
        (id_campanha, titulo, publico, periodo, descricao, imagem_url, destaque)
        VALUES
        (
            1,
            'Campanha Antirrábica 2026',
            '🐶 Cães e Gatos',
            '01 de Junho a 30 de Junho',
            'Proteja o seu melhor amigo!',
            'https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=1200&q=80',
            1
        ),
        (
            2,
            'Mobilização Nacional Contra a Gripe',
            '👥 População Geral',
            'Permanente',
            'Campanha de imunização anual.',
            'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
            1
        ),
        (
            3,
            'Vacinação Infantil',
            '👶 Crianças',
            '15 de Julho a 31 de Agosto',
            'Atualização da caderneta infantil.',
            'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
            1
        )
    `);

    console.log("🌱 Carga inicial (Seed) atualizada com sucesso!");
}

module.exports = popularBanco;