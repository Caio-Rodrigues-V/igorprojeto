require('dotenv').config();

const express = require('express');
const path = require('path');
const { Resend } = require('resend');
const { initDatabase, criarSolicitacao } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function textoObrigatorio(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function validarSolicitacao(body) {
  const erros = [];

  if (!textoObrigatorio(body.nome)) erros.push('Nome do solicitante é obrigatório.');
  if (!textoObrigatorio(body.setor)) erros.push('Setor é obrigatório.');
  if (!textoObrigatorio(body.telefone)) erros.push('Telefone é obrigatório.');
  if (!textoObrigatorio(body.email)) erros.push('E-mail é obrigatório.');

  if (!Array.isArray(body.itens) || body.itens.length === 0) {
    erros.push('Informe pelo menos um produto.');
  } else {
    body.itens.forEach((item, index) => {
      if (!textoObrigatorio(item.produto)) {
        erros.push(`Produto do item ${index + 1} é obrigatório.`);
      }

      const quantidade = Number(item.quantidade);
      if (!Number.isInteger(quantidade) || quantidade <= 0) {
        erros.push(`Quantidade do item ${index + 1} deve ser um número inteiro maior que zero.`);
      }
    });
  }

  return erros;
}

function normalizarSolicitacao(body) {
  return {
    nome: body.nome.trim(),
    setor: body.setor.trim(),
    telefone: body.telefone.trim(),
    email: body.email.trim(),
    observacao: typeof body.observacao === 'string' ? body.observacao.trim() : '',
    itens: body.itens.map((item) => ({
      produto: item.produto.trim(),
      quantidade: Number(item.quantidade),
      unidade: typeof item.unidade === 'string' ? item.unidade.trim() : ''
    }))
  };
}


function montarTextoEmail(solicitacao, dataFormatada) {
  const itensTexto = solicitacao.itens
    .map((item) => `- ${item.produto}: ${item.quantidade} ${item.unidade}`)
    .join('\n');

  return `Nova solicitação recebida

Nome: ${solicitacao.nome}
Setor: ${solicitacao.setor}
Telefone: ${solicitacao.telefone}
Email: ${solicitacao.email}

Itens:
${itensTexto}

Observação:
${solicitacao.observacao || 'Sem observação.'}

Data: ${dataFormatada}`;
}

async function enviarEmailAdministrador(solicitacao, dataFormatada) {
  const camposEmail = [
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'EMAIL_TO'
  ];

  const faltando = camposEmail.filter((campo) => !process.env[campo]);

  if (faltando.length > 0) {
    console.warn('E-mail não enviado. Variáveis ausentes:', faltando.join(', '));
    return false;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const texto = montarTextoEmail(solicitacao, dataFormatada);

  await resend.emails.send({
    from: `Sistema de Solicitação <${process.env.EMAIL_FROM}>`,
    to: process.env.EMAIL_TO.split(',').map((email) => email.trim()),
    subject: 'Nova solicitação de materiais recebida',
    text: texto
  });

  return true;
}

app.post('/solicitacao', async (req, res) => {
  try {
    const erros = validarSolicitacao(req.body);

    if (erros.length > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Dados inválidos.',
        erros
      });
    }

    const solicitacao = normalizarSolicitacao(req.body);
    const registro = await criarSolicitacao(solicitacao);

    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date());

    const emailEnviado = await enviarEmailAdministrador(solicitacao, dataFormatada);

    return res.status(201).json({
      sucesso: true,
      mensagem: emailEnviado
        ? 'Solicitação enviada com sucesso.'
        : 'Solicitação salva com sucesso, mas o e-mail não foi enviado. Verifique as configurações SMTP.',
      solicitacao_id: registro.id,
      criado_em: registro.criado_em,
      email_enviado: emailEnviado
    });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);

    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao processar a solicitação.'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao inicializar banco de dados:', error);
    process.exit(1);
  });
