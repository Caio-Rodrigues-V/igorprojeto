const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'solicitacoes.db');
const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error('Erro ao conectar no SQLite:', error.message);
    return;
  }

  console.log('Banco SQLite conectado:', dbPath);
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function callback(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS solicitacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      setor TEXT,
      telefone TEXT,
      email TEXT,
      observacao TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS solicitacao_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      solicitacao_id INTEGER,
      produto TEXT,
      quantidade INTEGER,
      FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes(id)
    )
  `);
}

async function criarSolicitacao(dados) {
  const { nome, setor, telefone, email, observacao, itens } = dados;

  await run('BEGIN TRANSACTION');

  try {
    const resultado = await run(
      `
        INSERT INTO solicitacoes (nome, setor, telefone, email, observacao)
        VALUES (?, ?, ?, ?, ?)
      `,
      [nome, setor, telefone, email, observacao]
    );

    const solicitacaoId = resultado.id;

    for (const item of itens) {
      await run(
        `
          INSERT INTO solicitacao_itens (solicitacao_id, produto, quantidade)
          VALUES (?, ?, ?)
        `,
        [solicitacaoId, item.produto, item.quantidade]
      );
    }

    await run('COMMIT');

    const registros = await all(
      `
        SELECT criado_em
        FROM solicitacoes
        WHERE id = ?
      `,
      [solicitacaoId]
    );

    return {
      id: solicitacaoId,
      criado_em: registros[0]?.criado_em || new Date().toISOString()
    };
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

module.exports = {
  initDatabase,
  criarSolicitacao
};
