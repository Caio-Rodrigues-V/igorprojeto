const form = document.getElementById('form-solicitacao');
const listaProdutos = document.getElementById('lista-produtos');
const btnAdicionar = document.getElementById('btn-adicionar');
const btnEnviar = document.getElementById('btn-enviar');
const mensagem = document.getElementById('mensagem');

function criarLinhaProduto(produto = '', quantidade = '', unidade = '') {
  const linha = document.createElement('div');
  linha.className = 'produto-linha';

  linha.innerHTML = `
    <div class="campo">
      <label>Produto *</label>
      <input type="text" class="produto" placeholder="Ex: Papel A4" value="${produto}" required>
    </div>

    <div class="campo">
      <label>Quantidade *</label>
      <input type="number" class="quantidade" min="1" step="1" placeholder="Ex: 10" value="${quantidade}" required>
    </div>

    <div class="campo">
      <label>Unidade *</label>
      <select class="unidade" required>
        <option value="">Selecione</option>
        <option value="Unidade" ${unidade === 'Unidade' ? 'selected' : ''}>Unidade</option>
        <option value="Caixa" ${unidade === 'Caixa' ? 'selected' : ''}>Caixa</option>
        <option value="Pacote" ${unidade === 'Pacote' ? 'selected' : ''}>Pacote</option>
        <option value="Resma" ${unidade === 'Resma' ? 'selected' : ''}>Resma</option>
        <option value="Metro" ${unidade === 'Metro' ? 'selected' : ''}>Metro</option>
        <option value="Litro" ${unidade === 'Litro' ? 'selected' : ''}>Litro</option>
        <option value="Kg" ${unidade === 'Kg' ? 'selected' : ''}>Kg</option>
        <option value="Par" ${unidade === 'Par' ? 'selected' : ''}>Par</option>
      </select>
    </div>

    <button type="button" class="btn btn-remover">Remover</button>
  `;

  linha.querySelector('.btn-remover').addEventListener('click', () => {
    if (listaProdutos.children.length === 1) {
      exibirMensagem('A solicitação precisa ter pelo menos um produto.', 'erro');
      return;
    }

    linha.remove();
  });

  listaProdutos.appendChild(linha);
}

function exibirMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
}

function limparMensagem() {
  mensagem.textContent = '';
  mensagem.className = 'mensagem';
}

function obterItens() {
  const linhas = Array.from(document.querySelectorAll('.produto-linha'));

  return linhas.map((linha) => ({
    produto: linha.querySelector('.produto').value.trim(),
    quantidade: Number(linha.querySelector('.quantidade').value),
    unidade: linha.querySelector('.unidade').value
  }));
}

function validarFormulario(dados) {
  const erros = [];

  if (!dados.nome) erros.push('Informe o nome do solicitante.');
  if (!dados.setor) erros.push('Informe o setor.');
  if (!dados.telefone) erros.push('Informe o telefone.');
  if (!dados.email) erros.push('Informe o e-mail.');

  if (!dados.itens.length) {
    erros.push('Adicione pelo menos um produto.');
  }

  dados.itens.forEach((item, index) => {
    if (!item.produto) {
      erros.push(`Informe o produto do item ${index + 1}.`);
    }

    if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
      erros.push(`Informe uma quantidade válida para o item ${index + 1}.`);
    }

    if (!item.unidade) {
      erros.push(`Informe a unidade de medida do item ${index + 1}.`);
    }
  });

  return erros;
}

function montarDadosFormulario() {
  return {
    nome: document.getElementById('nome').value.trim(),
    setor: document.getElementById('setor').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    email: document.getElementById('email').value.trim(),
    observacao: document.getElementById('observacao').value.trim(),
    itens: obterItens()
  };
}

function resetarFormulario() {
  form.reset();
  listaProdutos.innerHTML = '';
  criarLinhaProduto();
}

btnAdicionar.addEventListener('click', () => {
  limparMensagem();
  criarLinhaProduto();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  limparMensagem();

  const dados = montarDadosFormulario();
  const erros = validarFormulario(dados);

  if (erros.length > 0) {
    exibirMensagem(erros[0], 'erro');
    return;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = 'Enviando...';

  try {
    const resposta = await fetch('/solicitacao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (!resposta.ok || !resultado.sucesso) {
      const erro = resultado.erros?.[0] || resultado.mensagem || 'Erro ao enviar solicitação.';
      throw new Error(erro);
    }

    exibirMensagem(resultado.mensagem, 'sucesso');
    resetarFormulario();
  } catch (error) {
    exibirMensagem(error.message || 'Não foi possível enviar a solicitação.', 'erro');
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar solicitação';
  }
});

criarLinhaProduto();