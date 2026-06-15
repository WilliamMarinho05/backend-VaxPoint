# VaxPoint - Backend

API REST do sistema **VaxPoint**, responsável pelas regras de negócio, autenticação, rotas e persistência de dados do ecossistema de vacinação humana e pet de Palmas-TO.

## 👥 Integrantes do Grupo
- Joaby Henrique (Desenvolvimento Backend)
- William (Desenvolvimento Backend)
- Maria Clara (Desenvolvimento Frontend)

---

## 🛠️ Tecnologias Utilizadas

- **Runtime:** Node.js (JavaScript)
- **Framework Web:** Express
- **Banco de Dados:** SQLite (Através da biblioteca `sqlite3` e `sqlite` para suporte a Promises)
- **Segurança & Utilitários:** `cors` (Requisições cruzadas), `dotenv` (Variáveis de ambiente) e `nodemon` (Auto-restart no desenvolvimento)

---

## 📂 Estrutura de Pastas do Projeto

```text
backend-VaxPoint/
├── src/
│   ├── database.js        # Configuração e criação das tabelas SQL
│   ├── seed.js            # Carga automática de dados reais (10 USF de Palmas e vacinas)
│   ├── server.js          # Ponto de entrada do app (Inicialização integrada)
│   └── routes/            # Arquivos de rotas modularizados
│       ├── authRoutes.js
│       ├── petRoutes.js
│       ├── infoRoutes.js
│       └── historicRoutes.js
├── database.db            # O arquivo físico do banco gerado pelo SQLite
├── .env                   # Configurações de ambiente (Oculto no Git)
├── package.json           # Scripts e dependências do Node
└── README.md              # Documentação do projeto
```

# Estrutura de Rotas Criadas

O ecossistema do servidor foi modularizado na pasta src/routes/ para atender de forma limpa às entidades do MVP:

- **authRoutes.js** -> Cadastro, login e controle de acesso com segurança.
- **petRoutes.js** -> Gerenciamento dos animais vinculados aos usuários tutores.
- **infoRoutes.js** -> Consulta ao catálogo de vacinas e listagem das 10 Unidades de Saúde da Família (USF) Reais de Palmas.
- **historicRoutes.js** -> Controle da linha do tempo de vacinas agendadas e já aplicadas.


# 🚀 Como Executar o Backend

## 1. Pré-requisitos e Instalação

Certifique-se de estar dentro do diretório do Backend no seu terminal e instale as dependências:

```bash
npm install
```

## 2. Configuração do Ambiente (.env)

Crie um arquivo chamado .env na raiz do projeto backend (ele é protegido pelo .gitignore e não sobe para o GitHub) e defina as variáveis conforme o exemplo:

```bash
PORT=3000
DATABASE_URL=./database.db
````

## 3. Executando o Servidor (Com Automação Mágica)

Não é necessário rodar scripts separados para criar o banco ou popular dados. O sistema foi automatizado! Ao ligar o servidor, ele cria a estrutura de tabelas e injeta a semente de dados (seed) dinamicamente se o banco estiver limpo.

Para rodar em modo de desenvolvimento (com auto-restart do Nodemon):

```bash
npm run dev
```

Se preferir rodar de forma direta usando o Node puro:

```bash
node src/server.js
```

Ao iniciar com sucesso, você verá no terminal:

- 📐 Estrutura do banco de dados verificada/criada!
- 🌱 Carga inicial (Seed) verificada e atualizada de forma automática!
- 🚀 Servidor VaxPoint rodando na porta 3000
  

# 🛡️ Regras de Contribuição (Git & GitHub)

Para garantir a integridade do código e o sucesso do MVP, adotamos as seguintes práticas profissionais:
- **Proteção de Branch:** A branch main é blindada. É estritamente proibido dar push direto nela.
- **Feature Branching:** Cada funcionalidade nova deve ser desenvolvida em sua própria branch (Ex: feat-rotas-pets).
- **Code Review via Pull Requests:** Alterações só entram na main através de Pull Requests abertos no GitHub após a revisão e aprovação do Administrador do repositório.
