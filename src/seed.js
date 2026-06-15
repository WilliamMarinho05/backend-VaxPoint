// src/seed.js
const { openDb } = require('./database');

async function popularBanco() {
    const db = await openDb();
    
    console.log("🚀 Populando 10 postos de saúde reais de Palmas-TO...");
    
    // Deletamos para não duplicar IDs ou dar conflito ao rodar novamente
    await db.run("DELETE FROM postos"); 

    await db.run(`INSERT INTO postos (id_posto, nome_posto, endereco, horario_funcionamento) VALUES 
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

    console.log("🚀 Populando catálogo de vacinas...");
    
    await db.run("DELETE FROM vacinas");

    await db.run(`INSERT INTO vacinas (id_vacina, nome_vacina, tipo, descricao, doses_necessarias) VALUES 
        (1, 'Antirrábica', 'PET', 'Vacina anual contra a raiva para cães e gatos', 1),
        (2, 'Quádrupla Felina (V4)', 'PET', 'Protege gatos contra panleucopenia, calicivirose, rinotraqueíte e clamidiose', 2),
        (3, 'Tríplice Viral', 'HUMANA', 'Protege contra Sarampo, Caxumba e Rubéola', 2),
        (4, 'Influenza (Gripe)', 'HUMANA', 'Vacina anual de proteção sazonal contra a gripe', 1)
    `);

    console.log("✅ Banco de dados preenchido com dados reais de Palmas com sucesso!");
}

// Executa se o arquivo for chamado diretamente no terminal
if (require.main === module) {
    popularBanco();
}