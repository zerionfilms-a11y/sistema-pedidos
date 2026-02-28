
// Helpers
function uid(){return Date.now().toString(36) + Math.random().toString(36).slice(2,8)}
function storageGet(k){return JSON.parse(localStorage.getItem(k)||'null')||[]}
function storageSet(k,v){localStorage.setItem(k, JSON.stringify(v))}
function navegar(page){document.querySelectorAll('.pagina').forEach(p=>p.style.display='none');document.getElementById(page).style.display='block';renderAll();}

// Init data keys
const KEYS = {PROD:'produtos_v2', ORC:'orcamentos_v2', PED:'pedidos_v2', DESP:'despesas_v2'}

// ------------------ PRODUTOS CRUD ------------------
let editingProductId = null
function abrirModalProduto(prod=null){
  editingProductId = prod ? prod.id : null
  document.getElementById('modalProduto').style.display='flex'
  document.getElementById('modalProdutoTitle').textContent = prod ? 'Editar Produto' : 'Novo Produto'
  document.getElementById('pNome').value = prod?.nome||''
  document.getElementById('pDescricao').value = prod?.descricao||''
  document.getElementById('pCusto').value = prod?.custo||''
  document.getElementById('pPreco').value = prod?.preco||''
  document.getElementById('pEstoque').value = prod?.estoque||0
  document.getElementById('pCategoria').value = prod?.categoria||''
  document.getElementById('pImagem').value = ''
}
function fecharModalProduto(){document.getElementById('modalProduto').style.display='none'}
async function salvarProduto(){
  const nome=document.getElementById('pNome').value.trim()
  if(!nome){alert('Nome é obrigatório');return}
  const descricao=document.getElementById('pDescricao').value.trim()
  const custo=parseFloat(document.getElementById('pCusto').value)||0
  const preco=parseFloat(document.getElementById('pPreco').value)||0
  const estoque=parseInt(document.getElementById('pEstoque').value)||0
  const categoria=document.getElementById('pCategoria').value.trim()
  const file=document.getElementById('pImagem').files[0]
  let imagemData=null
  if(file){
    imagemData = await fileToDataURL(file)
  }
  let produtos = storageGet(KEYS.PROD)
  if(editingProductId){
    produtos = produtos.map(p=> p.id===editingProductId ? {...p,nome,descricao,custo,preco,estoque,categoria,imagem:imagemData||p.imagem} : p)
  }else{
    produtos.push({id:uid(), nome, descricao, custo, preco, estoque, categoria, imagem:imagemData})
  }
  storageSet(KEYS.PROD, produtos)
  fecharModalProduto(); renderProdutos(); renderProdutoSelect(); renderAll()
}
function fileToDataURL(file){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(file) }) }
function renderProdutos(){
  const container=document.getElementById('produtosList'); container.innerHTML=''
  const produtos = storageGet(KEYS.PROD)
  if(produtos.length===0){container.innerHTML='<p class="small">Nenhum produto cadastrado</p>'; return}
  produtos.forEach(p=>{
    const div=document.createElement('div'); div.className='product-card'
    div.innerHTML = `<div>
        <strong>${p.nome}</strong>
        <div class="small">${p.descricao||''}</div>
        <div class="small">Venda: R$ ${p.preco.toFixed(2)} • Custo: R$ ${p.custo.toFixed(2)} • Estoque: ${p.estoque}</div>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick='editarProd("${p.id}")'>Editar</button>
        <button onclick='excluirProd("${p.id}")'>Excluir</button>
      </div>`
    container.appendChild(div)
  })
}
function editarProd(id){ const prod = storageGet(KEYS.PROD).find(p=>p.id===id); if(prod) abrirModalProduto(prod) }
function excluirProd(id){ if(!confirm('Excluir produto?')) return; let produtos = storageGet(KEYS.PROD).filter(p=>p.id!==id); storageSet(KEYS.PROD, produtos); renderProdutos(); renderProdutoSelect(); renderAll() }

// ------------------ ORÇAMENTOS ------------------
let itensTemp = []
function abrirModalOrcamento(){
  itensTemp = []
  document.getElementById('modalOrcamento').style.display='flex'
  document.getElementById('oCliente').value=''; document.getElementById('oTelefone').value=''; document.getElementById('oValidade').value=''
  document.getElementById('oObs').value=''; document.getElementById('oDesconto').value='0'
  renderProdutoSelect(); renderItensTemp()
}
function fecharModalOrcamento(){document.getElementById('modalOrcamento').style.display='none'}
function renderProdutoSelect(){
  const sel = document.getElementById('oProdutoSelect'); sel.innerHTML=''
  const produtos = storageGet(KEYS.PROD)
  produtos.forEach(p=>{ const opt = document.createElement('option'); opt.value=p.id; opt.textContent=`${p.nome} — R$ ${p.preco.toFixed(2)}`; sel.appendChild(opt)})
  if(produtos.length===0){ sel.innerHTML='<option value="">Sem produtos</option>' }
}
function adicionarItemTemp(){
  const pid=document.getElementById('oProdutoSelect').value; const qtd=parseInt(document.getElementById('oQtd').value)||1
  const prod = storageGet(KEYS.PROD).find(p=>p.id===pid); if(!prod){alert('Selecione um produto'); return}
  const existing = itensTemp.find(i=>i.produto.id===pid)
  if(existing){ existing.qtd += qtd } else { itensTemp.push({produto:prod,qtd}) }
  renderItensTemp()
}
function renderItensTemp(){
  const tbody = document.querySelector('#itensTemp tbody'); tbody.innerHTML=''
  itensTemp.forEach((it,idx)=>{
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${it.produto.nome}</td><td>${it.qtd}</td><td>R$ ${it.produto.preco.toFixed(2)}</td><td>R$ ${(it.produto.preco*it.qtd).toFixed(2)}</td><td><button onclick="removerItemTemp(${idx})">Remover</button></td>`
    tbody.appendChild(tr)
  })
}
function removerItemTemp(i){ itensTemp.splice(i,1); renderItensTemp() }
function calcularTotalItens(){ return itensTemp.reduce((s,it)=>s + it.produto.preco * it.qtd, 0) }
function salvarOrcamento(){
  if(itensTemp.length===0){alert('Adicione ao menos 1 item'); return}
  const cliente=document.getElementById('oCliente').value.trim(); const telefone=document.getElementById('oTelefone').value.trim()
  const validade=document.getElementById('oValidade').value; const obs=document.getElementById('oObs').value; const desconto=parseFloat(document.getElementById('oDesconto').value)||0
  const subtotal = calcularTotalItens(); const total = +(subtotal * (1 - desconto/100)).toFixed(2)
  const orc = { id: uid(), numero: gerarNumero('ORC'), cliente, telefone, validade, obs, desconto, subtotal, total, status:'pendente', itens:itensTemp.map(i=>({produtoId:i.produto.id, nome:i.produto.nome, preco:i.produto.preco, custo:i.produto.custo, qtd:i.qtd})), data:new Date().toISOString() }
  const orcs = storageGet(KEYS.ORC); orcs.push(orc); storageSet(KEYS.ORC, orcs); fecharModalOrcamento(); renderOrcamentos(); renderAll()
}

// ------------------ PEDIDOS ------------------
function gerarNumero(prefix){ const now=new Date(); const y=now.getFullYear().toString().slice(-2); const s = Math.floor(Math.random()*9000)+1000; return `${prefix}-${y}${s}` }
function renderOrcamentos(){
  const container=document.getElementById('orcamentosList'); container.innerHTML=''
  const orcs = storageGet(KEYS.ORC)
  if(orcs.length===0){container.innerHTML='<p class="small">Nenhum orçamento</p>'; return}
  orcs.slice().reverse().forEach(o=>{
    const div=document.createElement('div'); div.className='product-card'
    div.innerHTML = `<div><strong>${o.numero}</strong> <span class="small">(${o.status})</span><div class="small">${o.cliente} • ${o.telefone||''}</div><div class="small">Total: R$ ${o.total.toFixed(2)}</div></div>
      <div style="display:flex;gap:8px">
        <button onclick='visualizarOrc("${o.id}")'>Ver</button>
        <button onclick='pdfOrc("${o.id}")'>PDF</button>
        <button onclick='converterParaPedido("${o.id}")' ${o.status==='aprovado'?'disabled':''}>Converter</button>
        <button onclick='excluirOrc("${o.id}")'>Excluir</button>
      </div>`
    container.appendChild(div)
  })
}
function visualizarOrc(id){
  const o = storageGet(KEYS.ORC).find(x=>x.id===id); if(!o) return alert('Orçamento não encontrado')
  let html = `<div style="padding:12px;font-family:Arial;color:#000;background:#fff;width:700px">
      <h2>Orçamento ${o.numero}</h2><div><strong>Cliente:</strong> ${o.cliente}</div><div><strong>Telefone:</strong> ${o.telefone||''}</div><hr>
      <table style="width:100%;border-collapse:collapse"><thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr></thead><tbody>`
  o.itens.forEach(it=>{ html += `<tr><td>${it.nome}</td><td>${it.qtd}</td><td>R$ ${it.preco.toFixed(2)}</td><td>R$ ${(it.preco*it.qtd).toFixed(2)}</td></tr>` })
  html += `</tbody></table><hr><div><strong>Subtotal:</strong> R$ ${o.subtotal.toFixed(2)}</div><div><strong>Desconto:</strong> ${o.desconto}%</div><div><strong>Total:</strong> R$ ${o.total.toFixed(2)}</div></div>`
  const pa = document.getElementById('printArea'); pa.innerHTML = html; window.open().document.write(html)
}
async function pdfOrc(id){
  const o = storageGet(KEYS.ORC).find(x=>x.id===id); if(!o) return alert('Orçamento não encontrado')
  // montar HTML para printArea
  let html = `<div style="padding:12px;font-family:Arial;color:#000;background:#fff;width:800px">
      <h2>Orçamento ${o.numero}</h2><div><strong>Cliente:</strong> ${o.cliente}</div><div><strong>Telefone:</strong> ${o.telefone||''}</div><hr>
      <table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Produto</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr></thead><tbody>`
  o.itens.forEach(it=>{ html += `<tr><td style="padding:6px 0">${it.nome}</td><td style="text-align:center">${it.qtd}</td><td style="text-align:right">R$ ${it.preco.toFixed(2)}</td><td style="text-align:right">R$ ${(it.preco*it.qtd).toFixed(2)}</td></tr>` })
  html += `</tbody></table><hr><div style="text-align:right"><div>Subtotal: R$ ${o.subtotal.toFixed(2)}</div><div>Desconto: ${o.desconto}%</div><div><strong>Total: R$ ${o.total.toFixed(2)}</strong></div></div></div>`
  const pa = document.getElementById('printArea'); pa.innerHTML = html
  await html2canvas(pa, {scale:2}).then(canvas=>{
    const imgData = canvas.toDataURL('image/jpeg', 1.0)
    const { jsPDF } = window.jspdf
    const pdf = new jsPDF({ orientation:'portrait', unit:'px', format:[canvas.width, canvas.height] })
    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${o.numero}.pdf`)
  }).catch(e=>{ console.error(e); alert('Erro ao gerar PDF') })
}

function converterParaPedido(id){
  const orcs = storageGet(KEYS.ORC); const orc = orcs.find(x=>x.id===id); if(!orc) return
  // criar pedido
  const pedidos = storageGet(KEYS.PED)
  const pedido = { id:uid(), numero:gerarNumero('PED'), cliente:orc.cliente, telefone:orc.telefone, itens: JSON.parse(JSON.stringify(orc.itens)), subtotal:orc.subtotal, desconto:orc.desconto, total:orc.total, data:new Date().toISOString(), status:'pendente' }
  pedidos.push(pedido); storageSet(KEYS.PED, pedidos)
  // marcar orçamento aprovado
  orc.status='aprovado'; storageSet(KEYS.ORC, orcs)
  // diminuir estoque
  let produtos = storageGet(KEYS.PROD)
  pedido.itens.forEach(it=>{ const p = produtos.find(x=>x.id===it.produtoId); if(p) p.estoque = Math.max(0, p.estoque - it.qtd) })
  storageSet(KEYS.PROD, produtos)
  renderOrcamentos(); renderPedidos(); renderProdutos(); renderAll(); alert('Orçamento convertido em pedido!')
}
function excluirOrc(id){ if(!confirm('Excluir orçamento?')) return; let orcs = storageGet(KEYS.ORC).filter(x=>x.id!==id); storageSet(KEYS.ORC, orcs); renderOrcamentos(); renderAll() }
function renderPedidos(){
  const container=document.getElementById('pedidosList'); container.innerHTML=''
  const pedidos = storageGet(KEYS.PED)
  if(pedidos.length===0){container.innerHTML='<p class="small">Nenhum pedido</p>'; return}
  pedidos.slice().reverse().forEach(p=>{
    const div=document.createElement('div'); div.className='product-card'
    div.innerHTML = `<div><strong>${p.numero}</strong><div class="small">${p.cliente} • ${new Date(p.data).toLocaleString()}</div><div class="small">Total: R$ ${p.total.toFixed(2)}</div></div>
    <div style="display:flex;gap:8px">
      <button onclick='verPedido("${p.id}")'>Ver</button>
      <button onclick='pdfPedido("${p.id}")'>PDF</button>
      <button onclick='excluirPedido("${p.id}")'>Excluir</button>
    </div>`
    container.appendChild(div)
  })
}
function verPedido(id){
  const p = storageGet(KEYS.PED).find(x=>x.id===id); if(!p) return alert('Pedido não encontrado')
  let s = `Pedido ${p.numero}\\nCliente: ${p.cliente}\\nItens:\\n`
  p.itens.forEach(it=> s += `${it.nome} x${it.qtd} — R$ ${it.preco.toFixed(2)}\\n`)
  s += `Total: R$ ${p.total.toFixed(2)}`
  alert(s)
}
async function pdfPedido(id){
  const p = storageGet(KEYS.PED).find(x=>x.id===id); if(!p) return alert('Pedido não encontrado')
  let html = `<div style="padding:12px;font-family:Arial;color:#000;background:#fff;width:800px"><h2>Pedido ${p.numero}</h2><div><strong>Cliente:</strong> ${p.cliente}</div><hr><table style="width:100%"><thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr></thead><tbody>`
  p.itens.forEach(it=> html += `<tr><td>${it.nome}</td><td style="text-align:center">${it.qtd}</td><td style="text-align:right">R$ ${it.preco.toFixed(2)}</td><td style="text-align:right">R$ ${(it.preco*it.qtd).toFixed(2)}</td></tr>`)
  html += `</tbody></table><hr><div style="text-align:right"><strong>Total: R$ ${p.total.toFixed(2)}</strong></div></div>`
  const pa = document.getElementById('printArea'); pa.innerHTML = html
  await html2canvas(pa, {scale:2}).then(canvas=>{
    const imgData = canvas.toDataURL('image/jpeg', 1.0)
    const { jsPDF } = window.jspdf
    const pdf = new jsPDF({ orientation:'portrait', unit:'px', format:[canvas.width, canvas.height] })
    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${p.numero}.pdf`)
  }).catch(e=>{ console.error(e); alert('Erro ao gerar PDF') })
}
function excluirPedido(id){ if(!confirm('Excluir pedido?')) return; let pedidos = storageGet(KEYS.PED).filter(x=>x.id!==id); storageSet(KEYS.PED, pedidos); renderPedidos(); renderAll() }

// ------------------ DESPESAS ------------------
function abrirModalDespesa(){ document.getElementById('modalDespesa').style.display='flex'; document.getElementById('dDesc').value=''; document.getElementById('dValor').value=''; document.getElementById('dData').value=new Date().toISOString().slice(0,10)}
function fecharModalDespesa(){ document.getElementById('modalDespesa').style.display='none'}
function salvarDespesa(){ const desc=document.getElementById('dDesc').value.trim(); const valor=parseFloat(document.getElementById('dValor').value)||0; const data=document.getElementById('dData').value || new Date().toISOString().slice(0,10); const despesas=storageGet(KEYS.DESP); despesas.push({id:uid(), desc, valor, data}); storageSet(KEYS.DESP, despesas); fecharModalDespesa(); renderDespesas(); renderAll() }
function renderDespesas(){ const c=document.getElementById('despesasList'); c.innerHTML=''; const ds=storageGet(KEYS.DESP); if(ds.length===0){c.innerHTML='<p class="small">Nenhuma despesa</p>'; return} ds.slice().reverse().forEach(d=>{ const div=document.createElement('div'); div.className='product-card'; div.innerHTML=`<div><strong>${d.desc}</strong><div class="small">${d.data}</div></div><div><div class="small">R$ ${d.valor.toFixed(2)}</div><button onclick='excluirDesp("${d.id}")'>Excluir</button></div>`; c.appendChild(div) }) }
function excluirDesp(id){ if(!confirm('Excluir despesa?')) return; let ds=storageGet(KEYS.DESP).filter(x=>x.id!==id); storageSet(KEYS.DESP, ds); renderDespesas(); renderAll() }

// ------------------ DASHBOARD ------------------
function renderDashboard(){
  const pedidos = storageGet(KEYS.PED); const despesas = storageGet(KEYS.DESP); const orcs = storageGet(KEYS.ORC)
  const fatur = pedidos.reduce((s,p)=>s + (p.total||0), 0)
  const totalDesp = despesas.reduce((s,d)=>s + (d.valor||0), 0)
  const lucro = fatur - totalDesp
  document.getElementById('cardFaturamento').textContent = 'R$ ' + fatur.toFixed(2)
  document.getElementById('cardDespesa').textContent = 'R$ ' + totalDesp.toFixed(2)
  document.getElementById('cardLucro').textContent = 'R$ ' + lucro.toFixed(2)
  document.getElementById('cardOrcPend').textContent = orcs.filter(o=>o.status==='pendente').length
  // chart: vendas por mês (simples)
  const months = {}; pedidos.forEach(p=>{ const m = new Date(p.data).toLocaleString('pt-BR',{month:'short',year:'numeric'}); months[m] = (months[m]||0) + p.total })
  const labels = Object.keys(months); const data = Object.values(months)
  const ctx = document.getElementById('chartVendas'); if(window._chart) window._chart.destroy()
  window._chart = new Chart(ctx, { type:'bar', data:{ labels, datasets:[{ label:'Vendas', data }] }, options:{ responsive:true } })
}

// ------------------ BACKUP ------------------
function exportarBackup(){
  const data = { produtos: storageGet(KEYS.PROD), orcamentos: storageGet(KEYS.ORC), pedidos: storageGet(KEYS.PED), despesas: storageGet(KEYS.DESP) }
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'})
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='backup_sistema.json'; a.click(); URL.revokeObjectURL(url)
}
function importarBackup(e){
  const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = (ev)=>{ try{ const obj = JSON.parse(ev.target.result); storageSet(KEYS.PROD, obj.produtos||[]); storageSet(KEYS.ORC, obj.orcamentos||[]); storageSet(KEYS.PED, obj.pedidos||[]); storageSet(KEYS.DESP, obj.despesas||[]); alert('Backup importado'); renderAll() }catch(err){ alert('Arquivo inválido') } }; reader.readAsText(file)
}

// ------------------ RENDER / INIT ------------------
function renderAll(){ renderProdutos(); renderOrcamentos(); renderPedidos(); renderDespesas(); renderDashboard(); renderProdutoSelect() }
function init(){
  // ensure keys exist
  if(!localStorage.getItem(KEYS.PROD)) storageSet(KEYS.PROD, [])
  if(!localStorage.getItem(KEYS.ORC)) storageSet(KEYS.ORC, [])
  if(!localStorage.getItem(KEYS.PED)) storageSet(KEYS.PED, [])
  if(!localStorage.getItem(KEYS.DESP)) storageSet(KEYS.DESP, [])
  navegar('produtos')
}
init()
