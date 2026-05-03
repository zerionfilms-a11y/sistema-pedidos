function uid(){return Date.now().toString(36) + Math.random().toString(36).slice(2,8)}
function storageGet(k){return JSON.parse(localStorage.getItem(k)||'null')||[]}
function storageSet(k,v){localStorage.setItem(k, JSON.stringify(v))}
function navegar(page){document.querySelectorAll('.pagina').forEach(p=>p.style.display='none');const el=document.getElementById(page); if(el) el.style.display='block'; renderAll();}
function escapeHtml(str=''){return String(str).replace(/[&<>"]|'/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function formatMoney(v){return 'R$ ' + Number(v||0).toFixed(2).replace('.', ',')}
function normalizeDigits(v){return String(v||'').replace(/\D/g,'')}
function normalizePhone(v){let d=normalizeDigits(v); if(!d) return ''; if(d.startsWith('55')) return d; return '55' + d}
function canalLabel(c){return ({whatsapp:'WhatsApp', instagram:'Instagram', facebook:'Facebook', outro:'Outro'})[c] || 'Outro'}
function statusLabel(s){return ({pendente:'Pendente', produzindo:'Produzindo', enviado:'Enviado', finalizado:'Finalizado'})[s] || 'Pendente'}
function statusClass(s){return `badge-${s || 'pendente'}`}
function copiarTexto(texto){if(navigator.clipboard && navigator.clipboard.writeText){return navigator.clipboard.writeText(texto)} const ta=document.createElement('textarea'); ta.value=texto; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); return Promise.resolve()}
function telefoneParaWaMe(v){const d=normalizePhone(v); return d ? `https://wa.me/${d}` : ''}

async function gerarPdfA4DoHtml(html, nomeArquivo){
  const area = document.getElementById('printArea')
  area.innerHTML = html
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready } catch (_) {} }
  const canvas = await html2canvas(area, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, width: area.scrollWidth, height: area.scrollHeight, windowWidth: area.scrollWidth, windowHeight: area.scrollHeight })
  const imgData = canvas.toDataURL('image/png')
  const { jsPDF } = window.jspdf
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const usableWidth = pageWidth - (margin * 2)
  const usableHeight = pageHeight - (margin * 2)
  const imgHeight = (canvas.height * usableWidth) / canvas.width
  let heightLeft = imgHeight
  let position = margin
  pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight, undefined, 'FAST')
  heightLeft -= usableHeight
  while (heightLeft > 0) {
    position = margin - (imgHeight - heightLeft)
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight, undefined, 'FAST')
    heightLeft -= usableHeight
  }
  pdf.save(nomeArquivo)
}

function montarHtmlDocumento(tipo, numero, cliente, detalhesTopo, itens, subtotal, desconto, total, obs=''){
  const linhas = (itens || []).map(it => `
      <tr>
        <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb">
          <div style="font-weight:700">${escapeHtml(it.nome)}</div>
          ${it.obs ? `<div style="margin-top:3px;color:#555;font-size:12px">Obs.: ${escapeHtml(it.obs)}</div>` : ''}
        </td>
        <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:center">${it.qtd}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(it.preco)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:right">${formatMoney(Number(it.preco) * Number(it.qtd))}</td>
      </tr>`).join('')
  const obsHtml = obs ? `<div style="margin-top:14px"><strong>Observações:</strong><div style="margin-top:4px;white-space:pre-wrap">${escapeHtml(obs)}</div></div>` : ''
  return `
  <div style="width:794px;min-height:1123px;padding:32px 36px;box-sizing:border-box;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px">
      <div>
        <div style="font-size:28px;font-weight:700;line-height:1.1">${escapeHtml(tipo)} ${escapeHtml(numero)}</div>
        <div style="margin-top:8px;font-size:15px"><strong>Cliente:</strong> ${escapeHtml(cliente || '-')}</div>
        ${detalhesTopo ? `<div style="margin-top:4px;font-size:14px">${detalhesTopo}</div>` : ''}
      </div>
      <div style="text-align:right;font-size:13px;color:#444"><div><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</div></div>
    </div>
    <div style="border-top:1px solid #9ca3af;border-bottom:1px solid #9ca3af;padding:14px 0;margin-bottom:16px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr><th style="text-align:left;padding:8px 6px;border-bottom:2px solid #111">Produto</th><th style="text-align:center;padding:8px 6px;border-bottom:2px solid #111;width:70px">Qtd</th><th style="text-align:right;padding:8px 6px;border-bottom:2px solid #111;width:120px">Preço</th><th style="text-align:right;padding:8px 6px;border-bottom:2px solid #111;width:120px">Subtotal</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
    <div style="display:flex;justify-content:flex-end"><div style="min-width:260px"><div style="display:flex;justify-content:space-between;padding:4px 0"><span>Subtotal</span><strong>${formatMoney(subtotal)}</strong></div><div style="display:flex;justify-content:space-between;padding:4px 0"><span>Desconto</span><strong>${Number(desconto || 0).toFixed(2)}%</strong></div><div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #111;margin-top:6px;font-size:16px"><span>Total</span><strong>${formatMoney(total)}</strong></div></div></div>
    ${obsHtml}
  </div>`
}

const KEYS = {PROD:'produtos_v2', PED:'pedidos_v2', DESP:'despesas_v2'}
let editingProductId = null
let itensTempPed = []
let pedidoEnvioAtualId = null

function abrirModalProduto(prod=null){
  editingProductId = prod ? prod.id : null
  document.getElementById('modalProduto').style.display='flex'
  document.getElementById('modalProdutoTitle').textContent = prod ? 'Editar Produto' : 'Novo Produto'
  document.getElementById('pNome').value = prod?.nome || ''
  document.getElementById('pDescricao').value = prod?.descricao || ''
  document.getElementById('pCusto').value = prod?.custo || ''
  document.getElementById('pPreco').value = prod?.preco || ''
  document.getElementById('pEstoque').value = prod?.estoque || 0
  document.getElementById('pCategoria').value = prod?.categoria || ''
  document.getElementById('pImagem').value = ''
}
function fecharModalProduto(){document.getElementById('modalProduto').style.display='none'}
function fileToDataURL(file){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(file) }) }
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
  if(file){ imagemData = await fileToDataURL(file) }
  let produtos = storageGet(KEYS.PROD)
  if(editingProductId){ produtos = produtos.map(p=> p.id===editingProductId ? {...p,nome,descricao,custo,preco,estoque,categoria,imagem:imagemData||p.imagem} : p) }
  else{ produtos.push({id:uid(), nome, descricao, custo, preco, estoque, categoria, imagem:imagemData}) }
  storageSet(KEYS.PROD, produtos)
  fecharModalProduto(); renderAll()
}
function renderProdutos(){
  const container=document.getElementById('produtosList'); container.innerHTML=''
  const produtos = storageGet(KEYS.PROD)
  if(produtos.length===0){container.innerHTML='<p class="small">Nenhum produto cadastrado</p>'; return}
  produtos.forEach(p=>{
    const div=document.createElement('div'); div.className='product-card'
    div.innerHTML = `<div><strong>${escapeHtml(p.nome)}</strong><div class="small">${escapeHtml(p.descricao||'')}</div><div class="small">Venda: ${formatMoney(p.preco)} • Custo: ${formatMoney(p.custo)} • Estoque: ${Number(p.estoque || 0)}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><button onclick='editarProd("${p.id}")'>Editar</button><button onclick='excluirProd("${p.id}")'>Excluir</button></div>`
    container.appendChild(div)
  })
}
function editarProd(id){ const prod = storageGet(KEYS.PROD).find(p=>p.id===id); if(prod) abrirModalProduto(prod) }
function excluirProd(id){ if(!confirm('Excluir produto?')) return; let produtos = storageGet(KEYS.PROD).filter(p=>p.id!==id); storageSet(KEYS.PROD, produtos); renderAll() }

function renderProdutoSelect(selectId){
  const sel = document.getElementById(selectId)
  if(!sel) return
  sel.innerHTML=''
  const produtos = storageGet(KEYS.PROD)
  produtos.forEach(p=>{ const opt=document.createElement('option'); opt.value=p.id; opt.textContent=`${p.nome} — ${formatMoney(p.preco)}`; sel.appendChild(opt) })
  if(produtos.length===0){ sel.innerHTML='<option value="">Sem produtos</option>' }
}

function abrirModalPedido(){
  itensTempPed = []
  document.getElementById('modalPedido').style.display='flex'
  document.getElementById('pedCliente').value=''
  document.getElementById('pedTelefone').value=''
  document.getElementById('pedInstagram').value=''
  document.getElementById('pedCpf').value=''
  document.getElementById('pedEndereco').value=''
  document.getElementById('pedObs').value=''
  document.getElementById('pedCanal').value='whatsapp'
  document.getElementById('pedStatusInicial').value='produzindo'
  document.getElementById('pedItemObs').value=''
  atualizarCamposCanal(); renderProdutoSelect('pedProdutoSelect'); renderItensTempPedido()
}
function fecharModalPedido(){document.getElementById('modalPedido').style.display='none'}
function atualizarCamposCanal(){
  const canal = document.getElementById('pedCanal').value
  document.getElementById('campoInstagramPedido').style.display = canal === 'instagram' ? 'block' : 'none'
  document.getElementById('campoTelefonePedido').style.display = canal === 'whatsapp' ? 'block' : 'block'
  document.getElementById('pedTelefone').placeholder = canal === 'whatsapp' ? '(55) 99999-9999' : 'Número opcional'
  document.querySelector('#campoTelefonePedido label, #campoTelefonePedido').style.display = 'block'
}
function adicionarItemTempPedido(){
  const pid=document.getElementById('pedProdutoSelect').value
  const qtd=parseInt(document.getElementById('pedQtd').value)||1
  const obs=document.getElementById('pedItemObs').value.trim()
  const prod = storageGet(KEYS.PROD).find(p=>p.id===pid)
  if(!prod){alert('Selecione um produto'); return}
  itensTempPed.push({produto:prod,qtd,obs})
  document.getElementById('pedItemObs').value=''
  renderItensTempPedido()
}
function renderItensTempPedido(){
  const tbody = document.querySelector('#itensTempPed tbody'); tbody.innerHTML=''
  itensTempPed.forEach((it,idx)=>{
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${escapeHtml(it.produto.nome)}</td><td>${it.qtd}</td><td>${escapeHtml(it.obs||'')}</td><td>${formatMoney(it.produto.preco)}</td><td>${formatMoney(it.produto.preco*it.qtd)}</td><td><button onclick="removerItemTempPedido(${idx})">Remover</button></td>`
    tbody.appendChild(tr)
  })
}
function removerItemTempPedido(i){ itensTempPed.splice(i,1); renderItensTempPedido() }
function calcularTotalItensPed(){ return itensTempPed.reduce((s,it)=>s + Number(it.produto.preco) * Number(it.qtd), 0) }
function buildMensagemPedido(p, etapa, rastreio=''){
  const primeiroNome = (p.cliente || 'cliente').split(' ')[0]
  if(etapa === 'produzindo') return `Oi, ${primeiroNome}! Seu pedido já foi produzido e está aguardando envio. Vou te manter por aqui com as atualizações.`
  if(etapa === 'enviado'){
    const base = `Oi, ${primeiroNome}! Seu pedido foi enviado 🚚`
    const cod = rastreio ? `\nCódigo de rastreio: ${rastreio}` : ''
    const extra = p.rastreioObs ? `\n${p.rastreioObs}` : ''
    return base + cod + extra + `\nAcompanhe por aqui.`
  }
  if(etapa === 'finalizado') return `Oi, ${primeiroNome}! Seu pedido foi finalizado. Obrigado pela confiança 🙌`
  return `Oi, ${primeiroNome}!`
}
function abrirWhatsApp(p, texto){
  const tel = normalizePhone(p.telefone)
  if(!tel) return false
  window.open(`${telefoneParaWaMe(p.telefone)}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer')
  return true
}
async function salvarPedido(){
  const cliente=document.getElementById('pedCliente').value.trim()
  if(!cliente){ alert('Nome do cliente é obrigatório'); return }
  if(itensTempPed.length===0){ alert('Adicione ao menos 1 item'); return }
  const canal=document.getElementById('pedCanal').value
  const telefone=document.getElementById('pedTelefone').value.trim()
  const instagram=document.getElementById('pedInstagram').value.trim()
  const cpf=document.getElementById('pedCpf').value.trim()
  const endereco=document.getElementById('pedEndereco').value.trim()
  const obs=document.getElementById('pedObs').value.trim()
  const status=document.getElementById('pedStatusInicial').value || 'produzindo'
  const subtotal = calcularTotalItensPed()
  const pedido = {
    id: uid(),
    numero: `PED-${new Date().getFullYear().toString().slice(-2)}${Math.floor(Math.random()*9000)+1000}`,
    cliente, telefone, instagram, cpf, endereco, canal, obs,
    subtotal, desconto:0, total:subtotal,
    status,
    rastreio:'', rastreioObs:'',
    data:new Date().toISOString(),
    itens: itensTempPed.map(i=>({produtoId:i.produto.id, nome:i.produto.nome, preco:i.produto.preco, custo:i.produto.custo, qtd:i.qtd, obs:i.obs||''}))
  }
  const pedidos = storageGet(KEYS.PED)
  pedidos.push(pedido)
  storageSet(KEYS.PED, pedidos)
  fecharModalPedido(); renderAll(); alert('Pedido salvo!')
}
function renderPedidos(){
  const container=document.getElementById('pedidosList'); container.innerHTML=''
  const pedidos = storageGet(KEYS.PED)
  if(pedidos.length===0){container.innerHTML='<p class="small">Nenhum pedido</p>'; return}
  pedidos.slice().reverse().forEach(p=>{
    const badge = `<span class="badge ${statusClass(p.status)}">${statusLabel(p.status)}</span>`
    const canal = canalLabel(p.canal)
    const contato = p.canal === 'instagram' ? (p.instagram || 'Instagram não informado') : (p.telefone || 'Telefone não informado')
    const itensResumo = (p.itens || []).map(i => `${i.qtd}x ${i.nome}${i.obs ? ` (${i.obs})` : ''}`).join(' • ')
    const div=document.createElement('div')
    div.className='product-card'
    div.innerHTML = `<div>
      <div><strong>${escapeHtml(p.numero)}</strong>${badge}</div>
      <div class="small">${escapeHtml(p.cliente)} • ${escapeHtml(new Date(p.data).toLocaleString('pt-BR'))}</div>
      <div class="order-meta"><span>${escapeHtml(canal)}</span><span>${escapeHtml(contato)}</span><span>${formatMoney(p.total)}</span></div>
      <div class="small" style="margin-top:6px">${escapeHtml(itensResumo || '')}</div>
      ${p.rastreio ? `<div class="small" style="margin-top:6px"><strong>Rastreio:</strong> ${escapeHtml(p.rastreio)}</div>` : ''}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
      <button onclick='visualizarPedido("${p.id}")'>Ver</button>
      <button onclick='pdfPedido("${p.id}")'>PDF</button>
      <button onclick='copiarMensagemPedido("${p.id}")'>Copiar mensagem</button>
      <button onclick='acaoPedido("${p.id}", "produzindo")'>Pedido produzido</button>
      <button onclick='abrirRastreioPedido("${p.id}")'>Enviado</button>
      <button onclick='finalizarPedido("${p.id}")'>Finalizar</button>
      <button onclick='excluirPedido("${p.id}")'>Excluir</button>
    </div>`
    container.appendChild(div)
  })
}
async function acaoPedido(id, etapa, rastreio=''){
  const pedidos = storageGet(KEYS.PED)
  const idx = pedidos.findIndex(x=>x.id===id)
  if(idx < 0) return
  const p = pedidos[idx]
  p.status = etapa
  if(etapa === 'enviado' && rastreio) p.rastreio = rastreio
  storageSet(KEYS.PED, pedidos)
  renderAll()
  const mensagem = buildMensagemPedido(p, etapa, rastreio || p.rastreio || '')
  if((p.canal || 'whatsapp') === 'whatsapp'){
    const abriu = abrirWhatsApp(p, mensagem)
    if(!abriu) await copiarTexto(mensagem)
  } else {
    await copiarTexto(mensagem)
    alert(`Pedido marcado como ${statusLabel(etapa)}. Mensagem copiada para enviar no ${canalLabel(p.canal)}.`)
  }
}
async function copiarMensagemPedido(id, etapa='produzindo'){
  const p = storageGet(KEYS.PED).find(x=>x.id===id)
  if(!p) return
  const msg = buildMensagemPedido(p, etapa, p.rastreio || '')
  await copiarTexto(msg)
  alert('Mensagem copiada!')
}
function visualizarPedido(id){
  const p = storageGet(KEYS.PED).find(x=>x.id===id); if(!p) return alert('Pedido não encontrado')
  const topo = `
    <div><strong>Canal:</strong> ${escapeHtml(canalLabel(p.canal))}</div>
    ${p.telefone ? `<div style="margin-top:4px"><strong>Telefone:</strong> ${escapeHtml(p.telefone)}</div>` : ''}
    ${p.instagram ? `<div style="margin-top:4px"><strong>Instagram:</strong> ${escapeHtml(p.instagram)}</div>` : ''}
    ${p.cpf ? `<div style="margin-top:4px"><strong>CPF:</strong> ${escapeHtml(p.cpf)}</div>` : ''}
    ${p.endereco ? `<div style="margin-top:4px"><strong>Endereço:</strong> ${escapeHtml(p.endereco)}</div>` : ''}
    <div style="margin-top:4px"><strong>Status:</strong> ${escapeHtml(statusLabel(p.status))}</div>
    ${p.rastreio ? `<div style="margin-top:4px"><strong>Rastreio:</strong> ${escapeHtml(p.rastreio)}</div>` : ''}
  `
  const html = montarHtmlDocumento('Pedido', p.numero, p.cliente, topo, p.itens, p.subtotal, p.desconto || 0, p.total, p.obs || '')
  const win = window.open('', '_blank')
  if (win) { win.document.open(); win.document.write(html); win.document.close() } else { alert('O navegador bloqueou a visualização em nova aba.') }
}
async function pdfPedido(id){
  const p = storageGet(KEYS.PED).find(x=>x.id===id); if(!p) return alert('Pedido não encontrado')
  const topo = `
    <div><strong>Canal:</strong> ${escapeHtml(canalLabel(p.canal))}</div>
    ${p.telefone ? `<div style="margin-top:4px"><strong>Telefone:</strong> ${escapeHtml(p.telefone)}</div>` : ''}
    ${p.instagram ? `<div style="margin-top:4px"><strong>Instagram:</strong> ${escapeHtml(p.instagram)}</div>` : ''}
    ${p.cpf ? `<div style="margin-top:4px"><strong>CPF:</strong> ${escapeHtml(p.cpf)}</div>` : ''}
    ${p.endereco ? `<div style="margin-top:4px"><strong>Endereço:</strong> ${escapeHtml(p.endereco)}</div>` : ''}
    <div style="margin-top:4px"><strong>Status:</strong> ${escapeHtml(statusLabel(p.status))}</div>
    ${p.rastreio ? `<div style="margin-top:4px"><strong>Rastreio:</strong> ${escapeHtml(p.rastreio)}</div>` : ''}
  `
  const html = montarHtmlDocumento('Pedido', p.numero, p.cliente, topo, p.itens, p.subtotal, p.desconto || 0, p.total, p.obs || '')
  try{ await gerarPdfA4DoHtml(html, `${p.numero}.pdf`) }catch(e){ console.error(e); alert('Erro ao gerar PDF') }
}
function abrirRastreioPedido(id){ pedidoEnvioAtualId = id; document.getElementById('rastreioCodigo').value=''; document.getElementById('rastreioObs').value=''; document.getElementById('modalRastreio').style.display='flex' }
function fecharModalRastreio(){ document.getElementById('modalRastreio').style.display='none' }
function confirmarEnvioPedido(){
  const codigo = document.getElementById('rastreioCodigo').value.trim()
  const obs = document.getElementById('rastreioObs').value.trim()
  if(!codigo){ alert('Digite o código de rastreio'); return }
  const pedidos = storageGet(KEYS.PED)
  const p = pedidos.find(x=>x.id===pedidoEnvioAtualId)
  if(!p) return
  p.rastreio = codigo
  p.rastreioObs = obs
  p.status = 'enviado'
  storageSet(KEYS.PED, pedidos)
  fecharModalRastreio(); renderAll(); acaoPedido(p.id, 'enviado', codigo)
}
function finalizarPedido(id){
  const pedidos = storageGet(KEYS.PED)
  const p = pedidos.find(x=>x.id===id)
  if(!p) return
  p.status = 'finalizado'
  storageSet(KEYS.PED, pedidos)
  renderAll()
  const msg = buildMensagemPedido(p, 'finalizado')
  if((p.canal || 'whatsapp') === 'whatsapp'){ abrirWhatsApp(p, msg) || copiarTexto(msg) }
  else{ copiarTexto(msg); alert('Mensagem de finalização copiada.') }
}
function excluirPedido(id){ if(!confirm('Excluir pedido?')) return; let pedidos = storageGet(KEYS.PED).filter(x=>x.id!==id); storageSet(KEYS.PED, pedidos); renderAll() }

function abrirModalDespesa(){ document.getElementById('modalDespesa').style.display='flex'; document.getElementById('dDesc').value=''; document.getElementById('dValor').value=''; document.getElementById('dData').value=new Date().toISOString().slice(0,10) }
function fecharModalDespesa(){ document.getElementById('modalDespesa').style.display='none' }
function salvarDespesa(){ const desc=document.getElementById('dDesc').value.trim(); const valor=parseFloat(document.getElementById('dValor').value)||0; const data=document.getElementById('dData').value || new Date().toISOString().slice(0,10); const despesas=storageGet(KEYS.DESP); despesas.push({id:uid(), desc, valor, data}); storageSet(KEYS.DESP, despesas); fecharModalDespesa(); renderAll() }
function renderDespesas(){ const c=document.getElementById('despesasList'); c.innerHTML=''; const ds=storageGet(KEYS.DESP); if(ds.length===0){c.innerHTML='<p class="small">Nenhuma despesa</p>'; return} ds.slice().reverse().forEach(d=>{ const div=document.createElement('div'); div.className='product-card'; div.innerHTML=`<div><strong>${escapeHtml(d.desc)}</strong><div class="small">${escapeHtml(d.data)}</div></div><div><div class="small">${formatMoney(d.valor)}</div><button onclick='excluirDesp("${d.id}")'>Excluir</button></div>`; c.appendChild(div) }) }
function excluirDesp(id){ if(!confirm('Excluir despesa?')) return; let ds=storageGet(KEYS.DESP).filter(x=>x.id!==id); storageSet(KEYS.DESP, ds); renderAll() }

function renderDashboard(){
  const pedidos = storageGet(KEYS.PED)
  const despesas = storageGet(KEYS.DESP)
  const fatur = pedidos.reduce((s,p)=>s + (Number(p.total)||0), 0)
  const totalDesp = despesas.reduce((s,d)=>s + (Number(d.valor)||0), 0)
  const lucro = fatur - totalDesp
  document.getElementById('cardFaturamento').textContent = formatMoney(fatur)
  document.getElementById('cardDespesa').textContent = formatMoney(totalDesp)
  document.getElementById('cardLucro').textContent = formatMoney(lucro)
  document.getElementById('cardProduzindo').textContent = pedidos.filter(p=>p.status==='produzindo').length
  const months = {}
  pedidos.forEach(p=>{ const m = new Date(p.data).toLocaleString('pt-BR',{month:'short',year:'numeric'}); months[m] = (months[m]||0) + (Number(p.total)||0) })
  const labels = Object.keys(months)
  const data = Object.values(months)
  const ctx = document.getElementById('chartVendas')
  if(!ctx) return
  if(window._chart) window._chart.destroy()
  window._chart = new Chart(ctx, { type:'bar', data:{ labels, datasets:[{ label:'Vendas', data }] }, options:{ responsive:true } })
}

function exportarBackup(){
  const data = { produtos: storageGet(KEYS.PROD), pedidos: storageGet(KEYS.PED), despesas: storageGet(KEYS.DESP) }
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url; a.download='backup_sistema.json'; a.click(); URL.revokeObjectURL(url)
}
function importarBackup(e){
  const file = e.target.files[0]; if(!file) return
  const reader = new FileReader()
  reader.onload = (ev)=>{ try{ const obj = JSON.parse(ev.target.result); storageSet(KEYS.PROD, obj.produtos||[]); storageSet(KEYS.PED, obj.pedidos||[]); storageSet(KEYS.DESP, obj.despesas||[]); alert('Backup importado'); renderAll() }catch(err){ alert('Arquivo inválido') } }
  reader.readAsText(file)
}

function renderAll(){ renderProdutos(); renderPedidos(); renderDespesas(); renderDashboard(); renderProdutoSelect('pedProdutoSelect') }
function init(){ if(!localStorage.getItem(KEYS.PROD)) storageSet(KEYS.PROD, []); if(!localStorage.getItem(KEYS.PED)) storageSet(KEYS.PED, []); if(!localStorage.getItem(KEYS.DESP)) storageSet(KEYS.DESP, []); navegar('produtos') }
init()
