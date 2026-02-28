
function navegar(pagina) {
  document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
  document.getElementById(pagina).style.display = 'block';
  atualizarDashboard();
}

function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// PRODUTOS
function adicionarProduto() {
  const nome = document.getElementById('nomeProduto').value;
  const custo = parseFloat(document.getElementById('custoProduto').value);
  const preco = parseFloat(document.getElementById('precoProduto').value);

  const produtos = getData('produtos');
  produtos.push({ id: Date.now(), nome, custo, preco });
  setData('produtos', produtos);
  listarProdutos();
}

function listarProdutos() {
  const lista = document.getElementById('listaProdutos');
  lista.innerHTML = '';
  getData('produtos').forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.nome} - R$ ${p.preco}`;
    lista.appendChild(li);
  });
}

// ORÇAMENTOS
function criarOrcamento() {
  const cliente = document.getElementById('clienteOrc').value;
  const orcamentos = getData('orcamentos');
  orcamentos.push({ id: Date.now(), cliente, total: 0 });
  setData('orcamentos', orcamentos);
  listarOrcamentos();
}

function listarOrcamentos() {
  const lista = document.getElementById('listaOrcamentos');
  lista.innerHTML = '';
  getData('orcamentos').forEach(o => {
    const li = document.createElement('li');
    li.textContent = `ORC-${o.id} - ${o.cliente}`;
    lista.appendChild(li);
  });
}

// DESPESAS
function adicionarDespesa() {
  const desc = document.getElementById('descDespesa').value;
  const valor = parseFloat(document.getElementById('valorDespesa').value);

  const despesas = getData('despesas');
  despesas.push({ id: Date.now(), desc, valor });
  setData('despesas', despesas);
  listarDespesas();
}

function listarDespesas() {
  const lista = document.getElementById('listaDespesas');
  lista.innerHTML = '';
  getData('despesas').forEach(d => {
    const li = document.createElement('li');
    li.textContent = `${d.desc} - R$ ${d.valor}`;
    lista.appendChild(li);
  });
}

// DASHBOARD
function atualizarDashboard() {
  const pedidos = getData('pedidos');
  const despesas = getData('despesas');

  const totalVendas = pedidos.reduce((s, p) => s + p.total, 0);
  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);

  document.getElementById('totalVendas').textContent = "Total Vendas: R$ " + totalVendas;
  document.getElementById('totalDespesas').textContent = "Total Despesas: R$ " + totalDespesas;
  document.getElementById('lucroLiquido').textContent = "Lucro Líquido: R$ " + (totalVendas - totalDespesas);
}

// INIT
listarProdutos();
listarOrcamentos();
listarDespesas();
