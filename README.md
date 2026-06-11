# VaxPoint - Backend 

API REST do sistema **VaxPoint**, responsável pelas regras de negócio, rotas e persistência de dados dos agendamentos de vacinas.

# Integrantes do Grupo
- Joaby Henrique
- William
- Maria Clara

---

# Tecnologias Utilizadas

- **Runtime:** Node.js (JavaScript)
- **Framework:** Express
- **Banco de Dados:** SQLite3 (Banco relacional leve em arquivo local)
- **Ferramentas:** Cors (Segurança e requisições cruzadas) e Nodemon (Auto-restart no desenvolvimento)

---

# Estrutura de Rotas Criadas

O ecossistema de arquivos do servidor foi modularizado na pasta `src/routes/` para atender às seguintes entidades:

- `usuarios.js` -> Cadastro e controle de acessos dos usuários.
- `pets.js` -> Gerenciamento dos animais vinculados aos usuários.
- `vacinas.js` -> Catálogo e lotes de vacinas disponíveis.
- `postos.js` -> Unidades físicas de atendimento/postos de saúde.
- `campanhas.js` -> Campanhas ativas de vacinação.
- `agendamentos.js` -> Solicitações e marcações de horários.
- `historico.js` -> Linha do tempo de vacinas já aplicadas.
- `notificacoes.js` -> Alertas de retornos e avisos de prazos.


# Como Executar o Backend

Certifique-se de estar dentro do diretório do Backend no seu terminal e execute:

```bash
# 1. Instalar as dependências do servidor
npm install

# 2. Iniciar o servidor em ambiente de desenvolvimento (com Nodemon)
npm run dev
