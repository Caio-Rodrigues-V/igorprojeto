# Sistema de Solicitação de Materiais

Sistema web institucional para registrar solicitações de materiais com múltiplos produtos, armazenamento em SQLite e envio de e-mail ao administrador via Nodemailer.

## Stack utilizada

- Frontend: HTML, CSS e JavaScript puro
- Backend: Node.js com Express
- Banco de dados: SQLite
- E-mail: Nodemailer
- Configuração: dotenv

## Estrutura

```text
solicitacao-materiais/
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── server.js
├── database.js
├── package.json
├── .env.example
└── README.md
```

## Como rodar

Acesse a pasta do projeto:

```bash
cd "C:\Users\caiov\OneDrive\Desktop\PROJETOS\PROJETOS CLAUDE CODE\solicitacao-materiais"
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` com base no `.env.example`:

```bash
copy .env.example .env
```

Edite o `.env` com os dados reais do seu serviço SMTP:

```env
PORT=3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app
EMAIL_TO=destino@email.com
```

Inicie o servidor:

```bash
npm start
```

Abra no navegador:

```text
http://localhost:3000
```

## Observações sobre Gmail

Para usar Gmail com Nodemailer, normalmente é necessário criar uma senha de app na conta Google. Não use a senha normal da sua conta no `.env`.

## Banco de dados

O arquivo SQLite será criado automaticamente na primeira execução com o nome:

```text
solicitacoes.db
```

Tabelas criadas automaticamente:

- `solicitacoes`
- `solicitacao_itens`

## Endpoint principal

### POST `/solicitacao`

Exemplo de payload:

```json
{
  "nome": "João Silva",
  "setor": "Administrativo",
  "telefone": "(21) 99999-9999",
  "email": "joao@empresa.com",
  "observacao": "Solicitação para reposição do setor.",
  "itens": [
    {
      "produto": "Papel A4",
      "quantidade": 10
    },
    {
      "produto": "Caneta azul",
      "quantidade": 20
    }
  ]
}
```

## Formato do e-mail enviado

```text
Nova solicitação recebida

Nome:
Setor:
Telefone:
Email:

Itens:
- Produto 1: quantidade
- Produto 2: quantidade

Observação:

Data:
```
