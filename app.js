// Helpers
function uid(){return Date.now().toString(36) + Math.random().toString(36).slice(2,8)}
function storageGet(k){try{return JSON.parse(localStorage.getItem(k)||'null')||[]}catch(e){return []}}
function storageSet(k,v){
  try{
    localStorage.setItem(k, JSON.stringify(v))
  }catch(e){
    console.error('Falha ao salvar em localStorage:', k, e)
    if (/quota/i.test(String(e?.message || '')) || String(e?.name || '').toLowerCase().includes('quota')) {
      alert('Memória do navegador cheia. Apague alguns produtos com imagem ou exporte um backup.')
    } else {
      alert('Não foi possível salvar os dados.')
    }
    throw e
  }
}
function compactarItensDocumento(itens=[]){
  return (Array.isArray(itens) ? itens : []).map(({imagem, ...rest}) => rest)
}
function compactarOrcamentosLista(orcs=[]){
  return (Array.isArray(orcs) ? orcs : []).map(o => ({
    ...o,
    itens: compactarItensDocumento(o.itens)
  }))
}
function compactarPedidosLista(pedidos=[]){
  return (Array.isArray(pedidos) ? pedidos : []).map(p => ({
    ...p,
    itens: compactarItensDocumento(p.itens)
  }))
}
function navegar(page){
  document.querySelectorAll('.pagina').forEach(p=>p.style.display='none')
  const el = document.getElementById(page)
  if (el) el.style.display='block'
  renderAll()
}
function escapeHtml(s=''){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;")
}
function normalizePhone(v=''){ return String(v).replace(/\D/g,'') }
function formatMoney(v){ return 'R$ ' + Number(v || 0).toFixed(2) }

const EMPRESA_INFO = {
  nome: 'MEMORIZE-SE',
  cnpj: '61.196.679/0001-20',
  razao: '61.196.679 ANDRE TEODORO JANDREY',
  instagram: 'memorizese_',
  whatsapp: '(55) 99994-2772'
}

function downloadBlob(blob, nomeArquivo){
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function fileToArrayBuffer(file){
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(fr.result)
    fr.onerror = rej
    fr.readAsArrayBuffer(file)
  })
}
function dataUrlToArrayBuffer(dataUrl){
  const base64 = String(dataUrl).split(',')[1] || ''
  const bin = atob(base64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for(let i=0;i<len;i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}
function sanitizeDigits(v=''){ return String(v).replace(/\D/g,'') }
function inferDocumentoTipo(valor=''){
  const digits = sanitizeDigits(valor)
  if(digits.length <= 11) return 'cpf'
  return 'cnpj'
}
function aplicarMascaraCpf(v=''){
  const d = sanitizeDigits(v).slice(0,11)
  const p1 = d.slice(0,3)
  const p2 = d.slice(3,6)
  const p3 = d.slice(6,9)
  const p4 = d.slice(9,11)
  let out = p1
  if(p2) out += '.' + p2
  if(p3) out += '.' + p3
  if(p4) out += '-' + p4
  return out
}
function aplicarMascaraCnpj(v=''){
  const d = sanitizeDigits(v).slice(0,14)
  const p1 = d.slice(0,2)
  const p2 = d.slice(2,5)
  const p3 = d.slice(5,8)
  const p4 = d.slice(8,12)
  const p5 = d.slice(12,14)
  let out = p1
  if(p2) out += '.' + p2
  if(p3) out += '.' + p3
  if(p4) out += '/' + p4
  if(p5) out += '-' + p5
  return out
}
function aplicarMascaraDocumento(valor, tipo){
  return (tipo === 'cnpj') ? aplicarMascaraCnpj(valor) : aplicarMascaraCpf(valor)
}
function mascaraTelefone(el){
  const d = sanitizeDigits(el.value).slice(0,11)
  let out = ''
  if(d.length <= 2){
    out = d
  }else if(d.length <= 6){
    out = `(${d.slice(0,2)}) ${d.slice(2)}`
  }else if(d.length <= 10){
    out = `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  }else{
    out = `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`
  }
  el.value = out
}
function mascaraDocumento(el){
  const tipo = document.getElementById('pedDocTipo')?.value || inferDocumentoTipo(el.value)
  el.value = aplicarMascaraDocumento(el.value, tipo)
}
function atualizarMascaraDocumento(){
  const tipo = document.getElementById('pedDocTipo').value
  const input = document.getElementById('pedDocumento')
  const label = document.getElementById('docLabelPedido')
  if(label) label.textContent = tipo === 'cnpj' ? 'CNPJ (opcional)' : 'CPF (opcional)'
  if(input){
    input.placeholder = tipo === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'
    input.value = aplicarMascaraDocumento(input.value, tipo)
  }
}
function pegarDocumentoPedido(p){
  const tipo = (p.docTipo || inferDocumentoTipo(p.cpf || p.documento || '')).toLowerCase()
  const raw = p.documento || p.cpf || ''
  const valor = aplicarMascaraDocumento(raw, tipo)
  return { tipo, valor, label: tipo === 'cnpj' ? 'CNPJ' : 'CPF' }
}
function mostrarInfoNota(){
  const file = document.getElementById('pedNota').files[0]
  const box = document.getElementById('notaAtualInfo')
  if(!box) return
  box.textContent = file ? `Arquivo selecionado: ${file.name}` : ''
}
function mostrarNotaAtual(pedido){
  const box = document.getElementById('notaAtualInfo')
  const fileInput = document.getElementById('pedNota')
  if(fileInput) fileInput.value = ''
  if(box){
    box.textContent = pedido?.nota?.name ? `Nota atual: ${pedido.nota.name}` : ''
  }
}
function limparModalPedido(){
  const fileInput = document.getElementById('pedNota')
  if(fileInput) fileInput.value = ''
  const box = document.getElementById('notaAtualInfo')
  if(box) box.textContent = ''
}
function canalLabel(c){
  const map = { whatsapp:'WhatsApp', instagram:'Instagram', facebook:'Facebook', outro:'Outro' }
  return map[c] || 'WhatsApp'
}
function statusLabel(s){
  const map = { producao:'Produção', produzindo:'Produzindo', produzido:'Produzido', enviado:'Enviado', finalizado:'Finalizado', pendente:'Pendente' }
  return map[s] || s || '-'
}
function statusClass(s){
  return (s || 'pendente').toLowerCase()
}
async function copiarTexto(texto){
  try{
    await navigator.clipboard.writeText(texto)
    alert('Mensagem copiada!')
  }catch(e){
    const ta = document.createElement('textarea')
    ta.value = texto
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    alert('Mensagem copiada!')
  }
}


// Helper PDF

// Helper PDF
const PDF_PAGE_WIDTH = 794
const PDF_PAGE_HEIGHT = 1123
const PDF_PAGE_RESERVED_BOTTOM_FIRST = 140
const PDF_PAGE_RESERVED_BOTTOM_OTHER = 110

function criarHostPdfTemporario(){
  const host = document.createElement('div')
  host.id = 'pdfMeasureHost'
  host.style.position = 'fixed'
  host.style.left = '-100000px'
  host.style.top = '0'
  host.style.width = PDF_PAGE_WIDTH + 'px'
  host.style.visibility = 'hidden'
  host.style.pointerEvents = 'none'
  host.style.zIndex = '-1'
  document.body.appendChild(host)
  return host
}

function aplicarExtrasDaPaginaPdf(pageEl, mostrarExtras){
  const extras = pageEl.querySelectorAll('.pdf-observacoes, .pdf-footer')
  extras.forEach(el => {
    el.style.display = mostrarExtras ? '' : 'none'
  })
}

function removerCabecalhoResumoDaPagina(pageEl){
  const seletores = ['.pdf-cabecalho', '.pdf-resumo', '.pdf-topo', '.pdf-head', '.pdf-header', '.pdf-summary']
  let removidos = 0

  seletores.forEach(sel => {
    pageEl.querySelectorAll(sel).forEach(el => {
      if (el && el.parentNode) {
        el.remove()
        removidos++
      }
    })
  })

  if (removidos === 0) {
    const filhos = Array.from(pageEl.children)
    if (filhos[0]) filhos[0].remove()
    if (filhos[0]) filhos[0].remove()
  }
}

function inserirCabecalhoContinuacao(pageEl){
  const tableWrapper = pageEl.querySelector('.pdf-table')
  if (!tableWrapper) return

  const banner = document.createElement('div')
  banner.style.margin = '0 0 12px'
  banner.style.padding = '10px 12px'
  banner.style.border = '1px solid #e5e7eb'
  banner.style.borderRadius = '12px'
  banner.style.background = '#f8fafc'
  banner.style.color = '#334155'
  banner.style.fontSize = '12px'
  banner.style.lineHeight = '1.35'
  banner.innerHTML = '<strong>Continuação do documento</strong>'
  pageEl.insertBefore(banner, tableWrapper)
}

function construirPaginaPdfBase(root, rows, opts={}){
  const { primeiro=false, ultimo=false } = opts
  const page = root.cloneNode(true)
  page.style.width = PDF_PAGE_WIDTH + 'px'
  page.style.height = 'auto'
  page.style.minHeight = '0px'
  page.style.overflow = 'visible'
  page.style.background = '#fff'
  page.style.boxSizing = 'border-box'

  const tbody = page.querySelector('.pdf-table tbody')
  if (tbody) {
    tbody.innerHTML = ''
    rows.forEach(row => tbody.appendChild(row.cloneNode(true)))
  }

  if (!primeiro) {
    // Remove qualquer bloco de topo/resumo antes de inserir a continuação
    removerCabecalhoResumoDaPagina(page)
    inserirCabecalhoContinuacao(page)
  }

  if (!ultimo) {
    const obs = page.querySelector('.pdf-observacoes')
    if (obs) obs.remove()
    const footer = page.querySelector('.pdf-footer')
    if (footer) footer.remove()
  }

  aplicarExtrasDaPaginaPdf(page, ultimo)
  return page
}

function montarPaginasPdfEstruturadas(root){
  const rows = Array.from(root.querySelectorAll('.pdf-item-row'))
  if (!rows.length) return [root.cloneNode(true)]

  const host = criarHostPdfTemporario()
  const paginas = []
  let idx = 0

  while (idx < rows.length) {
    const currentRows = []
    const primeiro = paginas.length === 0
    const limite = PDF_PAGE_HEIGHT - (primeiro ? PDF_PAGE_RESERVED_BOTTOM_FIRST : PDF_PAGE_RESERVED_BOTTOM_OTHER)

    while (idx < rows.length) {
      currentRows.push(rows[idx])

      const testPage = construirPaginaPdfBase(root, currentRows, { primeiro, ultimo:false })
      host.innerHTML = ''
      host.appendChild(testPage)
      const altura = testPage.scrollHeight

      if (altura > limite) {
        currentRows.pop()
        if (!currentRows.length) {
          currentRows.push(rows[idx])
          idx++
        }
        break
      }

      idx++
    }

    const ultimo = idx >= rows.length
    paginas.push(construirPaginaPdfBase(root, currentRows, { primeiro, ultimo }))
  }

  host.remove()
  return paginas
}

async function gerarPdfBytesDoHtml(html){
  const area = document.getElementById('printArea')
  const previous = area.innerHTML
  area.innerHTML = html

  try {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready } catch (_) {}
    }

    const root = area.firstElementChild
    const structured = root && root.querySelector && root.querySelector('.pdf-item-row')
    const { jsPDF } = window.jspdf
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const usableWidth = pageWidth - (margin * 2)
    const usableHeight = pageHeight - (margin * 2)

    const renderPageToPdf = async (pageEl, firstPage=false) => {
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: pageEl.scrollWidth,
        height: pageEl.scrollHeight,
        windowWidth: pageEl.scrollWidth,
        windowHeight: pageEl.scrollHeight
      })
      const imgData = canvas.toDataURL('image/png')
      const imgHeight = (canvas.height * usableWidth) / canvas.width
      if (!firstPage) pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, margin, usableWidth, Math.min(imgHeight, usableHeight), undefined, 'FAST')
    }

    if (structured) {
      const paginas = montarPaginasPdfEstruturadas(root)
      for (let i = 0; i < paginas.length; i++) {
        area.innerHTML = ''
        area.appendChild(paginas[i])
        await renderPageToPdf(paginas[i], i === 0)
      }
      return pdf.output('arraybuffer')
    }

    const canvas = await html2canvas(area, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: area.scrollWidth,
      height: area.scrollHeight,
      windowWidth: area.scrollWidth,
      windowHeight: area.scrollHeight
    })
    const imgData = canvas.toDataURL('image/png')
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
    return pdf.output('arraybuffer')
  } finally {
    area.innerHTML = previous
  }
}
async function gerarPdfA4DoHtml(html, nomeArquivo){
  const bytes = await gerarPdfBytesDoHtml(html)
  downloadBlob(new Blob([bytes], {type:'application/pdf'}), nomeArquivo)
}
function getEmpresaFooterHtml(){
  return `
    <div class="pdf-footer" style="margin-top:26px;border-top:1px solid #d1d5db;padding-top:12px;font-size:11px;color:#374151;line-height:1.45">
      <div style="font-weight:700;font-size:12px;color:#111827">${escapeHtml(EMPRESA_INFO.nome)}</div>
      <div>CNPJ: ${escapeHtml(EMPRESA_INFO.cnpj)} • Razão social: ${escapeHtml(EMPRESA_INFO.razao)}</div>
      <div>Instagram: @${escapeHtml(EMPRESA_INFO.instagram)} • WhatsApp: ${escapeHtml(EMPRESA_INFO.whatsapp)}</div>
    </div>
  `
}

function montarHtmlPedidoPdf(p){
  const doc = pegarDocumentoPedido(p)
  const freteTipo = p.freteTipo || 'Outro'
  const freteValor = Number(p.freteValor || 0)
  const subtotal = Number(p.subtotal || 0)
  const total = Number(p.total || 0)
  const itens = (p.itens || []).map(it => `
      <tr class="pdf-item-row">
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top">
          <div style="font-weight:700">${escapeHtml(it.nome)}</div>
          ${it.obs ? `<div style="margin-top:3px;color:#4b5563;font-size:12px">Obs.: ${escapeHtml(it.obs)}</div>` : ''}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;vertical-align:top">${Number(it.qtd || 0)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top">R$ ${Number(it.preco || 0).toFixed(2)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top">R$ ${(Number(it.preco || 0) * Number(it.qtd || 0)).toFixed(2)}</td>
      </tr>`).join('')
  const notaInfo = p.nota?.name ? `<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#ecfeff;color:#155e75;border:1px solid #a5f3fc;margin-left:8px;font-size:12px">Nota anexada</span>` : ''
  return `
    <div class="pdf-root" style="width:794px;min-height:1123px;padding:28px 34px;box-sizing:border-box;background:#fff;color:#111827;font-family:Arial,Helvetica,sans-serif">
      <div class="pdf-cabecalho" style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px">
        <div style="display:flex;gap:14px;align-items:center">
          <div style="width:72px;height:72px;border-radius:18px;overflow:hidden;background:#f3f4f6;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;flex:0 0 auto">
            <img src="logo.png" alt="Logo" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.style.display='none'">
          </div>
          <div>
            <div style="font-size:28px;font-weight:800;line-height:1.05;color:#0f172a">${escapeHtml(EMPRESA_INFO.nome)}</div>
            <div style="margin-top:4px;font-size:13px;color:#475569">Comprovante do pedido</div>
            <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">
              <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;font-size:12px">#${escapeHtml(p.numero)}</span>
              <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;font-size:12px">${escapeHtml(statusLabel(p.status))}</span>
              ${notaInfo}
            </div>
          </div>
        </div>
        <div style="text-align:right;font-size:12px;color:#475569;min-width:170px">
          <div><strong>Data:</strong> ${new Date(p.data || Date.now()).toLocaleDateString('pt-BR')}</div>
          <div style="margin-top:4px"><strong>Canal:</strong> ${escapeHtml(canalLabel(p.canal))}</div>
        </div>
      </div>

      <div class="pdf-resumo" style="display:grid;grid-template-columns:1.3fr 1fr;gap:12px;margin-bottom:16px">
        <div style="border:1px solid #e5e7eb;border-radius:16px;padding:14px;background:#fafafa">
          <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:8px">Cliente</div>
          <div style="font-size:18px;font-weight:700">${escapeHtml(p.cliente || '-')}</div>
          <div style="margin-top:8px;font-size:13px;color:#334155;line-height:1.55">
            ${p.telefone ? `<div><strong>Telefone:</strong> ${escapeHtml(p.telefone)}</div>` : ''}
            ${p.instagram ? `<div><strong>Instagram:</strong> ${escapeHtml(p.instagram)}</div>` : ''}
            ${p.endereco ? `<div><strong>Endereço:</strong> ${escapeHtml(p.endereco)}</div>` : ''}
            ${p.rastreio ? `<div><strong>Rastreio:</strong> ${escapeHtml(p.rastreio)}</div>` : ''}
            ${p.rastreioObs ? `<div><strong>Obs. rastreio:</strong> ${escapeHtml(p.rastreioObs)}</div>` : ''}
          </div>
        </div>
        <div style="display:grid;gap:10px">
          <div style="border:1px solid #e5e7eb;border-radius:16px;padding:14px;background:#ffffff">
            <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px">Documento</div>
            <div style="font-size:18px;font-weight:700">${doc.label}: ${escapeHtml(doc.valor || '-')}</div>
          </div>
          <div style="border:1px solid #e5e7eb;border-radius:16px;padding:14px;background:#ffffff">
            <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px">Frete</div>
            <div style="font-size:18px;font-weight:700">${escapeHtml(freteTipo)} • ${formatMoney(freteValor)}</div>
            ${p.freteObs ? `<div style="margin-top:4px;font-size:12px;color:#475569">${escapeHtml(p.freteObs)}</div>` : ''}
          </div>
        </div>
      </div>

      <div class="pdf-table" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#0f172a;color:#fff">
              <th style="text-align:left;padding:12px 10px">Produto</th>
              <th style="text-align:center;padding:12px 10px;width:70px">Qtd</th>
              <th style="text-align:right;padding:12px 10px;width:120px">Preço</th>
              <th style="text-align:right;padding:12px 10px;width:130px">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itens}
          </tbody>
        </table>
      </div>

      ${p.obs ? `<div class="pdf-observacoes" style="margin-top:16px;border:1px dashed #cbd5e1;border-radius:16px;padding:12px;background:#fff"><strong>Observações:</strong><div style="margin-top:4px;white-space:pre-wrap;line-height:1.5">${escapeHtml(p.obs)}</div></div>` : ''}

      ${getEmpresaFooterHtml()}
    </div>
  `
}
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
  if(file){ imagemData = await fileToDataURL(file) }
  let produtos = storageGet(KEYS.PROD)
  if(editingProductId){
    produtos = produtos.map(p=> p.id===editingProductId ? {...p,nome,descricao,custo,preco,estoque,categoria,imagem:imagemData||p.imagem} : p)
  }else{
    produtos.push({id:uid(), nome, descricao, custo, preco, estoque, categoria, imagem:imagemData})
  }
  storageSet(KEYS.PROD, produtos)
  fecharModalProduto(); renderAll()
}
function fileToDataURL(file){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(file) }) }
function renderProdutos(){
  const container=document.getElementById('produtosList'); container.innerHTML=''
  const produtos = storageGet(KEYS.PROD)
  if(produtos.length===0){container.innerHTML='<p class="small">Nenhum produto cadastrado</p>'; return}
  produtos.forEach(p=>{
    const div=document.createElement('div'); div.className='product-card'
    div.innerHTML = `<div>
        <strong>${escapeHtml(p.nome)}</strong>
        <div class="small">${escapeHtml(p.descricao||'')}</div>
        <div class="small">Venda: ${formatMoney(p.preco)} • Custo: ${formatMoney(p.custo)} • Estoque: ${Number(p.estoque || 0)}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
        <button onclick='editarProd("${p.id}")'>Editar</button>
        <button onclick='excluirProd("${p.id}")'>Excluir</button>
      </div>`
    container.appendChild(div)
  })
}
function editarProd(id){ const prod = storageGet(KEYS.PROD).find(p=>p.id===id); if(prod) abrirModalProduto(prod) }
function excluirProd(id){ if(!confirm('Excluir produto?')) return; let produtos = storageGet(KEYS.PROD).filter(p=>p.id!==id); storageSet(KEYS.PROD, produtos); renderAll() }

// ------------------ ORÇAMENTOS ------------------
let itensTempOrc = []
function abrirModalOrcamento(){
  itensTempOrc = []
  document.getElementById('modalOrcamento').style.display='flex'
  document.getElementById('oCliente').value=''
  document.getElementById('oTelefone').value=''
  document.getElementById('oValidade').value=''
  document.getElementById('oObs').value=''
  document.getElementById('oDesconto').value='0'
  document.getElementById('oItemObs').value=''
  renderProdutoSelect('oProdutoSelect')
  renderItensTempOrc()
}
function fecharModalOrcamento(){document.getElementById('modalOrcamento').style.display='none'}
function renderProdutoSelect(selectId){
  const sel = document.getElementById(selectId)
  if(!sel) return
  sel.innerHTML=''
  const produtos = storageGet(KEYS.PROD)
  produtos.forEach(p=>{
    const opt = document.createElement('option')
    opt.value=p.id
    opt.textContent=`${p.nome} — ${formatMoney(p.preco)}`
    sel.appendChild(opt)
  })
  if(produtos.length===0){ sel.innerHTML='<option value="">Sem produtos</option>' }
}
function adicionarItemTempOrcamento(){
  const pid=document.getElementById('oProdutoSelect').value
  const qtd=parseInt(document.getElementById('oQtd').value)||1
  const obs=document.getElementById('oItemObs').value.trim()
  const prod = storageGet(KEYS.PROD).find(p=>p.id===pid)
  if(!prod){alert('Selecione um produto'); return}
  itensTempOrc.push({produto:prod,qtd,obs})
  document.getElementById('oItemObs').value=''
  renderItensTempOrc()
}
function renderItensTempOrc(){
  const tbody = document.querySelector('#itensTempOrc tbody'); tbody.innerHTML=''
  itensTempOrc.forEach((it,idx)=>{
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${escapeHtml(it.produto.nome)}</td><td>${it.qtd}</td><td>${escapeHtml(it.obs||'')}</td><td>${formatMoney(it.produto.preco)}</td><td>${formatMoney(it.produto.preco*it.qtd)}</td><td><button onclick="removerItemTempOrc(${idx})">Remover</button></td>`
    tbody.appendChild(tr)
  })
}
function removerItemTempOrc(i){ itensTempOrc.splice(i,1); renderItensTempOrc() }
function calcularTotalItensOrc(){ return itensTempOrc.reduce((s,it)=>s + it.produto.preco * it.qtd, 0) }
function salvarOrcamento(){
  try{
    if(itensTempOrc.length===0){alert('Adicione ao menos 1 item'); return}
    const cliente=document.getElementById('oCliente').value.trim()
    const telefone=document.getElementById('oTelefone').value.trim()
    const validade=document.getElementById('oValidade').value
    const obs=document.getElementById('oObs').value
    const desconto=parseFloat(document.getElementById('oDesconto').value)||0
    const subtotal = calcularTotalItensOrc()
    const total = +(subtotal * (1 - desconto/100)).toFixed(2)
    const orc = {
      id: uid(),
      numero: gerarNumero('ORC'),
      cliente, telefone, validade, obs, desconto, subtotal, total,
      canal: 'whatsapp',
      status:'pendente',
      itens: itensTempOrc.map(i=>({produtoId:i.produto.id, nome:i.produto.nome, preco:i.produto.preco, custo:i.produto.custo, qtd:i.qtd, obs:i.obs||''})),
      data:new Date().toISOString()
    }
    const orcs = storageGet(KEYS.ORC); orcs.push(orc); storageSet(KEYS.ORC, orcs)
    fecharModalOrcamento(); renderAll()
    alert('Orçamento salvo!')
  }catch(err){
    console.error('Falha ao salvar orçamento:', err)
    alert(err?.message || 'Erro ao salvar orçamento')
  }
}

// ------------------ PEDIDOS ------------------

let itensTempPed = []
let pedidoEnvioAtualId = null
let pedidoEditandoId = null

function gerarNumero(prefix){
  const now=new Date()
  const y=now.getFullYear().toString().slice(-2)
  const s = Math.floor(Math.random()*9000)+1000
  return `${prefix}-${y}${s}`
}
function abrirModalPedido(pedido=null){
  pedidoEditandoId = pedido?.id || null
  itensTempPed = pedido?.itens ? JSON.parse(JSON.stringify(pedido.itens)) : []
  document.getElementById('modalPedido').style.display='flex'
  document.getElementById('pedidoModalTitle').textContent = pedido ? 'Editar Pedido' : 'Novo Pedido'
  document.getElementById('btnSalvarPedido').textContent = pedido ? 'Salvar Alterações' : 'Salvar Pedido'
  document.getElementById('pedCliente').value = pedido?.cliente || ''
  document.getElementById('pedTelefone').value = pedido?.telefone || ''
  document.getElementById('pedInstagram').value = pedido?.instagram || ''
  document.getElementById('pedDocTipo').value = pedido?.docTipo || inferDocumentoTipo(pedido?.documento || pedido?.cpf || '')
  document.getElementById('pedDocumento').value = aplicarMascaraDocumento(pedido?.documento || pedido?.cpf || '', document.getElementById('pedDocTipo').value)
  document.getElementById('pedEndereco').value = pedido?.endereco || ''
  document.getElementById('pedObs').value = pedido?.obs || ''
  document.getElementById('pedCanal').value = pedido?.canal || 'whatsapp'
  document.getElementById('pedStatusInicial').value = pedido?.status || 'produzindo'
  document.getElementById('pedItemObs').value = ''
  document.getElementById('pedFreteTipo').value = pedido?.freteTipo || 'PAC'
  document.getElementById('pedFreteValor').value = pedido?.freteValor ?? ''
  document.getElementById('pedFreteObs').value = pedido?.freteObs || ''
  atualizarCamposCanal()
  atualizarMascaraDocumento()
  renderProdutoSelect('pedProdutoSelect')
  renderItensTempPedido()
  mostrarNotaAtual(pedido || null)
}
function fecharModalPedido(){
  pedidoEditandoId = null
  document.getElementById('modalPedido').style.display='none'
  limparModalPedido()
}
function atualizarCamposCanal(){
  const canal = document.getElementById('pedCanal').value
  document.getElementById('campoInstagramPedido').style.display = canal === 'instagram' ? 'block' : 'none'
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
  const tbody = document.querySelector('#itensTempPed tbody')
  tbody.innerHTML=''
  itensTempPed.forEach((it,idx)=>{
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${escapeHtml(it.produto.nome)}</td><td>${it.qtd}</td><td>${escapeHtml(it.obs||'')}</td><td>${formatMoney(it.produto.preco)}</td><td>${formatMoney(it.produto.preco*it.qtd)}</td><td><button onclick="removerItemTempPedido(${idx})">Remover</button></td>`
    tbody.appendChild(tr)
  })
}
function removerItemTempPedido(i){
  itensTempPed.splice(i,1)
  renderItensTempPedido()
}
function calcularTotalItensPed(){
  return itensTempPed.reduce((s,it)=>s + Number(it.produto.preco || 0) * Number(it.qtd || 0), 0)
}
function getPedidoDoModal(){
  const cliente=document.getElementById('pedCliente').value.trim()
  const canal=document.getElementById('pedCanal').value
  const telefone=document.getElementById('pedTelefone').value.trim()
  const instagram=document.getElementById('pedInstagram').value.trim()
  const docTipo=document.getElementById('pedDocTipo').value
  const documento=document.getElementById('pedDocumento').value.trim()
  const endereco=document.getElementById('pedEndereco').value.trim()
  const obs=document.getElementById('pedObs').value.trim()
  const status=document.getElementById('pedStatusInicial').value || 'produzindo'
  const freteTipo=document.getElementById('pedFreteTipo').value || 'Outro'
  const freteValor=parseFloat(document.getElementById('pedFreteValor').value) || 0
  const freteObs=document.getElementById('pedFreteObs').value.trim()
  return { cliente, canal, telefone, instagram, docTipo, documento, endereco, obs, status, freteTipo, freteValor, freteObs }
}
async function salvarPedido(){
  const dados = getPedidoDoModal()
  if(!dados.cliente){ alert('Nome do cliente é obrigatório'); return }
  if(itensTempPed.length===0){ alert('Adicione ao menos 1 item'); return }

  const notaFile = document.getElementById('pedNota').files[0]
  const notaNova = notaFile ? { name: notaFile.name, type: notaFile.type, dataUrl: await fileToDataURL(notaFile) } : null
  const subtotal = calcularTotalItensPed()
  const frete = Number(dados.freteValor || 0)
  const total = +(subtotal + frete).toFixed(2)

  const pedidos = storageGet(KEYS.PED)
  if(pedidoEditandoId){
    const idx = pedidos.findIndex(x=>x.id===pedidoEditandoId)
    if(idx < 0){ alert('Pedido não encontrado'); return }
    const atual = pedidos[idx]

    let produtos = storageGet(KEYS.PROD)
    ;(atual.itens || []).forEach(it=>{
      const p = produtos.find(x=>x.id===it.produtoId)
      if(p) p.estoque = Number(p.estoque || 0) + Number(it.qtd || 0)
    })
    ;(itensTempPed || []).forEach(it=>{
      const p = produtos.find(x=>x.id===it.produto.id)
      if(p) p.estoque = Math.max(0, Number(p.estoque || 0) - Number(it.qtd || 0))
    })
    storageSet(KEYS.PROD, produtos)

    pedidos[idx] = {
      ...atual,
      cliente: dados.cliente,
      telefone: dados.telefone,
      instagram: dados.instagram,
      docTipo: dados.docTipo,
      documento: dados.documento,
      cpf: dados.documento,
      endereco: dados.endereco,
      canal: dados.canal,
      obs: dados.obs,
      status: dados.status || atual.status || 'produzindo',
      freteTipo: dados.freteTipo,
      freteValor: frete,
      freteObs: dados.freteObs,
      subtotal,
      desconto: 0,
      total,
      itens: itensTempPed.map(i=>({produtoId:i.produto.id, nome:i.produto.nome, preco:i.produto.preco, custo:i.produto.custo, qtd:i.qtd, obs:i.obs||''})),
      nota: notaNova || atual.nota || null,
      atualizadoEm: new Date().toISOString()
    }
    storageSet(KEYS.PED, pedidos)
    pedidoEditandoId = null
    fecharModalPedido()
    renderAll()
    alert('Pedido atualizado!')
    return
  }

  const pedido = {
    id: uid(),
    numero: gerarNumero('PED'),
    cliente: dados.cliente,
    telefone: dados.telefone,
    instagram: dados.instagram,
    docTipo: dados.docTipo,
    documento: dados.documento,
    cpf: dados.documento,
    endereco: dados.endereco,
    canal: dados.canal,
    obs: dados.obs,
    freteTipo: dados.freteTipo,
    freteValor: frete,
    freteObs: dados.freteObs,
    subtotal,
    desconto: 0,
    total,
    data:new Date().toISOString(),
    status:dados.status,
    rastreio:'',
    rastreioObs:'',
    nota: notaNova,
    itens: itensTempPed.map(i=>({produtoId:i.produto.id, nome:i.produto.nome, preco:i.produto.preco, custo:i.produto.custo, qtd:i.qtd, obs:i.obs||''}))
  }
  pedidos.push(pedido)
  storageSet(KEYS.PED, pedidos)

  let produtos = storageGet(KEYS.PROD)
  pedido.itens.forEach(it=>{
    const p = produtos.find(x=>x.id===it.produtoId)
    if(p) p.estoque = Math.max(0, p.estoque - it.qtd)
  })
  storageSet(KEYS.PROD, produtos)
  pedidoEditandoId = null
  fecharModalPedido()
  renderAll()
  alert('Pedido salvo!')
}

function renderPedidos(){
  const container=document.getElementById('pedidosList')
  container.innerHTML=''
  const pedidos = storageGet(KEYS.PED)
  if(pedidos.length===0){container.innerHTML='<p class="small">Nenhum pedido</p>'; return}
  pedidos.slice().reverse().forEach(p=>{
    const badge = `<span class="badge ${statusClass(p.status)}">${statusLabel(p.status)}</span>`
    const canal = canalLabel(p.canal)
    const contato = p.canal === 'instagram'
      ? (p.instagram ? p.instagram : 'Instagram não informado')
      : (p.telefone ? p.telefone : 'Telefone não informado')
    const doc = pegarDocumentoPedido(p)
    const itensResumo = (p.itens || []).map(i => `${i.qtd}x ${i.nome}${i.obs ? ` (${i.obs})` : ''}`).join(' • ')
    const notaChip = p.nota?.name ? `<span class="badge pendente">Nota anexada</span>` : ''
    const div=document.createElement('div')
    div.className='product-card'
    div.innerHTML = `<div>
      <div><strong>${escapeHtml(p.numero)}</strong>${badge} ${notaChip}</div>
      <div class="small">${escapeHtml(p.cliente)} • ${escapeHtml(new Date(p.data).toLocaleString('pt-BR'))}</div>
      <div class="order-meta">
        <span>${escapeHtml(canal)}</span>
        <span>${escapeHtml(contato)}</span>
        <span>${escapeHtml(doc.label + ': ' + (doc.valor || '-'))}</span>
        <span>${escapeHtml(formatMoney(p.total))}</span>
      </div>
      <div class="small" style="margin-top:6px">${escapeHtml(itensResumo || '')}</div>
      ${p.freteTipo ? `<div class="small" style="margin-top:4px">Frete: ${escapeHtml(p.freteTipo)} • ${formatMoney(p.freteValor || 0)}${p.freteObs ? ' • ' + escapeHtml(p.freteObs) : ''}</div>` : ''}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
      <button onclick='visualizarPedido("${p.id}")'>Ver</button>
      <button onclick='editarPedido("${p.id}")'>Editar</button>
      <button onclick='pdfPedido("${p.id}")'>Baixar pedido</button>
      ${p.nota?.name ? `<button onclick='baixarNotaPedido("${p.id}")'>Baixar nota</button>` : ''}
      ${p.nota?.name ? `<button onclick='baixarPedidoComNota("${p.id}")'>Baixar os dois</button>` : ''}
      <button onclick='copiarMensagemPedido("${p.id}")'>Copiar mensagem</button>
      <button onclick='acaoPedido("${p.id}", "produzindo")'>Pedido produzido</button>
      <button onclick='abrirRastreioPedido("${p.id}")'>Enviado</button>
      <button onclick='finalizarPedido("${p.id}")'>Finalizar</button>
      <button onclick='excluirPedido("${p.id}")'>Excluir</button>
    </div>`
    container.appendChild(div)
  })
}
function buildMensagemPedido(p, etapa, rastreio=''){
  const primeiroNome = (p.cliente || 'cliente').split(' ')[0]
  if(etapa === 'produzindo'){
    return `Oi, ${primeiroNome}! Passando para te avisar que seu pedido já está em produção. Assim que ficar pronto, eu sigo com o próximo passo por aqui 🤍`
  }
  if(etapa === 'enviado'){
    const base = `Oi, ${primeiroNome}! Seu pedido já foi enviado 🚚`
    const cod = rastreio ? `
Código de rastreio: ${rastreio}` : ''
    const extra = p.rastreioObs ? `
${p.rastreioObs}` : ''
    return base + cod + extra + `
Se precisar de qualquer coisa, é só me chamar por aqui.`
  }
  if(etapa === 'finalizado'){
    return `Oi, ${primeiroNome}! Seu pedido foi finalizado por aqui. Obrigado pela confiança 💛`
  }
  return `Oi, ${primeiroNome}!`
}
async function copiarMensagemPedido(id, etapa='produzindo'){
  const p = storageGet(KEYS.PED).find(x=>x.id===id)
  if(!p) return
  const msg = buildMensagemPedido(p, etapa, p.rastreio || '')
  await copiarTexto(msg)
}
function editarPedido(id){
  const p = storageGet(KEYS.PED).find(x=>x.id===id)
  if(!p) return alert('Pedido não encontrado')
  abrirModalPedido(p)
}
function visualizarPedido(id){
  const p = storageGet(KEYS.PED).find(x=>x.id===id)
  if(!p) return alert('Pedido não encontrado')
  const html = montarHtmlPedidoPdf(p)
  const win = window.open('', '_blank')
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
  } else {
    alert('O navegador bloqueou a visualização em nova aba.')
  }
}
async function pdfPedido(id){
  const p = storageGet(KEYS.PED).find(x=>x.id===id)
  if(!p) return alert('Pedido não encontrado')
  const html = montarHtmlPedidoPdf(p)
  try{
    await gerarPdfA4DoHtml(html, `${p.numero}.pdf`)
  }catch(e){
    console.error(e)
    alert('Erro ao gerar PDF')
  }
}
async function baixarNotaPedido(id){
  const p = storageGet(KEYS.PED).find(x=>x.id===id)
  if(!p || !p.nota?.dataUrl) return alert('Pedido sem nota anexada')
  const nome = p.nota.name || `${p.numero}-nota`
  const a = document.createElement('a')
  a.href = p.nota.dataUrl
  a.download = nome
  a.click()
}
async function baixarPedidoComNota(id){
  const p = storageGet(KEYS.PED).find(x=>x.id===id)
  if(!p) return alert('Pedido não encontrado')
  const orderBytes = await gerarPdfBytesDoHtml(montarHtmlPedidoPdf(p))
  const { PDFDocument, rgb } = window.PDFLib
  const combined = await PDFDocument.create()
  const orderDoc = await PDFDocument.load(orderBytes)
  const orderPages = await combined.copyPages(orderDoc, orderDoc.getPageIndices())
  orderPages.forEach(page => combined.addPage(page))

  if(p.nota?.dataUrl){
    if((p.nota.type || '').includes('pdf')){
      const noteBytes = dataUrlToArrayBuffer(p.nota.dataUrl)
      const noteDoc = await PDFDocument.load(noteBytes)
      const notePages = await combined.copyPages(noteDoc, noteDoc.getPageIndices())
      notePages.forEach(page => combined.addPage(page))
    }else if((p.nota.type || '').startsWith('image/')){
      const imgBytes = dataUrlToArrayBuffer(p.nota.dataUrl)
      const img = (p.nota.type.includes('png') ? await combined.embedPng(imgBytes) : await combined.embedJpg(imgBytes))
      const page = combined.addPage([595.28, 841.89])
      const { width, height } = page.getSize()
      const margin = 24
      const maxW = width - margin*2
      const maxH = height - margin*2
      const scale = Math.min(maxW / img.width, maxH / img.height)
      const drawW = img.width * scale
      const drawH = img.height * scale
      const x = (width - drawW) / 2
      const y = (height - drawH) / 2
      page.drawText('Nota / comprovante', { x: margin, y: height - 24, size: 14, color: rgb(0.07,0.1,0.17) })
      page.drawImage(img, { x, y, width: drawW, height: drawH })
    }
  }
  const out = await combined.save()
  downloadBlob(new Blob([out], {type:'application/pdf'}), `${p.numero}-pedido+nota.pdf`)
}
function abrirRastreioPedido(id){
  pedidoEnvioAtualId = id
  document.getElementById('rastreioCodigo').value = ''
  document.getElementById('rastreioObs').value = ''
  document.getElementById('modalRastreio').style.display='flex'
}
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
  fecharModalRastreio()
  renderAll()
  acaoPedido(p.id, 'enviado', codigo)
}
function finalizarPedido(id){
  const pedidos = storageGet(KEYS.PED)
  const p = pedidos.find(x=>x.id===id)
  if(!p) return
  p.status = 'finalizado'
  storageSet(KEYS.PED, pedidos)
  renderAll()
  const msg = buildMensagemPedido(p, 'finalizado')
  if((p.canal || 'whatsapp') === 'whatsapp'){
    abrirWhatsApp(p, msg) || copiarTexto(msg)
  }else{
    copiarTexto(msg)
    alert('Mensagem de finalização copiada.')
  }
}
function excluirPedido(id){
  if(!confirm('Excluir pedido?')) return
  let pedidos = storageGet(KEYS.PED).filter(x=>x.id!==id)
  storageSet(KEYS.PED, pedidos)
  renderAll()
}



function getProdutoPorId(id){
  return storageGet(KEYS.PROD).find(p => p.id === id)
}
function getImagemProdutoDoItem(item){
  return item?.imagem || getProdutoPorId(item?.produtoId)?.imagem || ''
}

function montarHtmlDocumento(titulo, numero, cliente, extraInfoHtml, itens, subtotal, desconto, total, observacoes=''){
  const itensHtml = (itens || []).map(it => {
    const imagem = getImagemProdutoDoItem(it)
    const imgHtml = imagem ? `
      <div style="width:100px;height:100px;border-radius:12px;overflow:hidden;background:#f3f4f6;border:1px solid #e5e7eb;flex:0 0 auto">
        <img src="${escapeHtml(imagem)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">
      </div>` : `
      <div style="width:54px;height:54px;border-radius:12px;background:#f3f4f6;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:#94a3b8;font-size:11px">Sem foto</div>`
    return `
      <tr class="pdf-item-row">
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top">
          <div style="display:flex;gap:10px;align-items:flex-start">
            ${imgHtml}
            <div style="min-width:0">
              <div style="font-weight:700">${escapeHtml(it.nome)}</div>
              ${it.obs ? `<div style="margin-top:3px;color:#4b5563;font-size:12px">Obs.: ${escapeHtml(it.obs)}</div>` : ''}
            </div>
          </div>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;vertical-align:top;width:70px">${Number(it.qtd || 0)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;width:120px">R$ ${Number(it.preco || 0).toFixed(2)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;vertical-align:top;width:130px">R$ ${(Number(it.preco || 0) * Number(it.qtd || 0)).toFixed(2)}</td>
      </tr>`
  }).join('')

  const descontoNum = Number(desconto || 0)
  const itensCount = (itens || []).reduce((s, it) => s + Number(it.qtd || 0), 0)

  return `
    <div class="pdf-root" style="width:794px;min-height:1123px;padding:28px 34px;box-sizing:border-box;background:#fff;color:#111827;font-family:Arial,Helvetica,sans-serif">
      <div style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px">
        <div style="display:flex;gap:14px;align-items:center">
          <div style="width:72px;height:72px;border-radius:18px;overflow:hidden;background:#f3f4f6;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;flex:0 0 auto">
            <img src="logo.png" alt="Logo" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.style.display='none'">
          </div>
          <div>
            <div style="font-size:28px;font-weight:800;line-height:1.05;color:#0f172a">${escapeHtml(EMPRESA_INFO.nome)}</div>
            <div style="margin-top:4px;font-size:13px;color:#475569">${escapeHtml(titulo)}</div>
            <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">
              <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;font-size:12px">#${escapeHtml(numero)}</span>
              <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#f1f5f9;color:#0f172a;border:1px solid #e2e8f0;font-size:12px">${Number(itensCount)} itens</span>
            </div>
          </div>
        </div>
        <div style="text-align:right;font-size:12px;color:#475569;min-width:170px">
          <div><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
          ${extraInfoHtml ? `<div style="margin-top:4px">${extraInfoHtml}</div>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:12px;margin-bottom:16px">
        <div style="border:1px solid #e5e7eb;border-radius:16px;padding:14px;background:#fafafa">
          <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:8px">Cliente</div>
          <div style="font-size:18px;font-weight:700">${escapeHtml(cliente || '-')}</div>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:16px;padding:14px;background:#ffffff">
          <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px">Resumo</div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;color:#334155"><span>Subtotal</span><strong>${formatMoney(subtotal)}</strong></div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;color:#334155"><span>Desconto</span><strong>${descontoNum ? descontoNum.toFixed(2) + '%' : '0%'}</strong></div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid #cbd5e1;margin-top:6px;font-size:16px"><span>Total</span><strong>${formatMoney(total)}</strong></div>
        </div>
      </div>

      <div class="pdf-table" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#0f172a;color:#fff">
              <th style="text-align:left;padding:12px 10px">Produto</th>
              <th style="text-align:center;padding:12px 10px;width:70px">Qtd</th>
              <th style="text-align:right;padding:12px 10px;width:120px">Preço</th>
              <th style="text-align:right;padding:12px 10px;width:130px">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itensHtml}
          </tbody>
        </table>
      </div>

      ${observacoes ? `<div class="pdf-observacoes" style="margin-top:16px;border:1px dashed #cbd5e1;border-radius:16px;padding:12px;background:#fff"><strong>Observações:</strong><div style="margin-top:4px;white-space:pre-wrap;line-height:1.5">${escapeHtml(observacoes)}</div></div>` : ''}

      ${getEmpresaFooterHtml()}
    </div>
  `
}
function montarHtmlOrcamentoPdf(o){
  const extraHtml = [
    o.validade ? `<strong>Validade:</strong> ${escapeHtml(o.validade)}` : '',
    o.telefone ? `<div style="margin-top:4px"><strong>Telefone:</strong> ${escapeHtml(o.telefone)}</div>` : ''
  ].filter(Boolean).join('')
  const itens = o.itens || []
  return montarHtmlDocumento('Orçamento', o.numero, o.cliente, extraHtml, itens, o.subtotal, o.desconto, o.total, o.obs || '')
}
function converterParaPedido(id){
  const o = storageGet(KEYS.ORC).find(x => x.id === id)
  if(!o) return alert('Orçamento não encontrado')
  const pedidoBase = {
    id: uid(),
    numero: gerarNumero('PED'),
    cliente: o.cliente || '',
    telefone: o.telefone || '',
    instagram: '',
    docTipo: 'cpf',
    documento: '',
    cpf: '',
    endereco: '',
    canal: 'whatsapp',
    obs: o.obs || '',
    status: 'pendente',
    freteTipo: 'Outro',
    freteValor: 0,
    freteObs: '',
    subtotal: o.subtotal || 0,
    desconto: o.desconto || 0,
    total: o.total || 0,
    data: new Date().toISOString(),
    rastreio: '',
    rastreioObs: '',
    nota: null,
    itens: (o.itens || []).map(i => ({
      produtoId: i.produtoId || '',
      nome: i.nome,
      preco: i.preco,
      custo: i.custo,
      qtd: i.qtd,
      obs: i.obs || ''
    }))
  }

  const pedidos = storageGet(KEYS.PED)
  pedidos.push(pedidoBase)
  storageSet(KEYS.PED, pedidos)
  alert('Orçamento convertido em pedido!')
  renderAll()
}
function acaoPedido(id, etapa, rastreio=''){
  const p = storageGet(KEYS.PED).find(x => x.id === id)
  if(!p) return
  const msg = buildMensagemPedido(p, etapa, rastreio)
  if((p.canal || 'whatsapp') === 'whatsapp'){
    abrirWhatsApp(p, msg) || copiarTexto(msg)
  } else {
    copiarTexto(msg)
  }
}
function abrirWhatsApp(p, msg){
  const telefone = normalizePhone(p.telefone || '')
  if(!telefone) return false
  const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank')
  return true
}

// ------------------ ORÇAMENTOS RENDER ------------------
function renderOrcamentos(){
  const container=document.getElementById('orcamentosList'); container.innerHTML=''
  const orcs = storageGet(KEYS.ORC)
  if(orcs.length===0){container.innerHTML='<p class="small">Nenhum orçamento</p>'; return}
  orcs.slice().reverse().forEach(o=>{
    const div=document.createElement('div'); div.className='product-card'
    const itensResumo = (o.itens || []).map(i => `${i.qtd}x ${i.nome}${i.obs ? ` (${i.obs})` : ''}`).join(' • ')
    div.innerHTML = `<div>
      <div><strong>${escapeHtml(o.numero)}</strong> <span class="badge ${statusClass(o.status)}">${statusLabel(o.status)}</span></div>
      <div class="small">${escapeHtml(o.cliente)} • ${escapeHtml(o.telefone || '')}</div>
      <div class="small">${escapeHtml(itensResumo || '')}</div>
      <div class="small">Total: ${formatMoney(o.total)}</div>
    </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
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
  const html = montarHtmlOrcamentoPdf(o)
  const win = window.open('', '_blank')
  if (win) {
    win.document.open(); win.document.write(html); win.document.close()
  } else {
    alert('O navegador bloqueou a visualização em nova aba.')
  }
}
async function pdfOrc(id){
  const o = storageGet(KEYS.ORC).find(x=>x.id===id); if(!o) return alert('Orçamento não encontrado')
  const html = montarHtmlOrcamentoPdf(o)
  try{
    await gerarPdfA4DoHtml(html, `${o.numero}.pdf`)
  }catch(e){
    console.error(e)
    alert('Erro ao gerar PDF')
  }
}
function excluirOrc(id){ if(!confirm('Excluir orçamento?')) return; let orcs = storageGet(KEYS.ORC).filter(x=>x.id!==id); storageSet(KEYS.ORC, orcs); renderAll() }

// ------------------ DESPESAS ------------------
function abrirModalDespesa(){ document.getElementById('modalDespesa').style.display='flex'; document.getElementById('dDesc').value=''; document.getElementById('dValor').value=''; document.getElementById('dData').value=new Date().toISOString().slice(0,10)}
function fecharModalDespesa(){ document.getElementById('modalDespesa').style.display='none'}
function salvarDespesa(){
  const desc=document.getElementById('dDesc').value.trim()
  const valor=parseFloat(document.getElementById('dValor').value)||0
  const data=document.getElementById('dData').value || new Date().toISOString().slice(0,10)
  const despesas=storageGet(KEYS.DESP)
  despesas.push({id:uid(), desc, valor, data})
  storageSet(KEYS.DESP, despesas)
  fecharModalDespesa(); renderAll()
}
function renderDespesas(){
  const c=document.getElementById('despesasList'); c.innerHTML=''
  const ds=storageGet(KEYS.DESP)
  if(ds.length===0){c.innerHTML='<p class="small">Nenhuma despesa</p>'; return}
  ds.slice().reverse().forEach(d=>{
    const div=document.createElement('div')
    div.className='product-card'
    div.innerHTML=`<div><strong>${escapeHtml(d.desc)}</strong><div class="small">${escapeHtml(d.data)}</div></div><div><div class="small">${formatMoney(d.valor)}</div><button onclick='excluirDesp("${d.id}")'>Excluir</button></div>`
    c.appendChild(div)
  })
}
function excluirDesp(id){ if(!confirm('Excluir despesa?')) return; let ds=storageGet(KEYS.DESP).filter(x=>x.id!==id); storageSet(KEYS.DESP, ds); renderAll() }

// ------------------ DASHBOARD ------------------
function renderDashboard(){
  const pedidos = storageGet(KEYS.PED)
  const despesas = storageGet(KEYS.DESP)
  const orcs = storageGet(KEYS.ORC)
  const fatur = pedidos.reduce((s,p)=>s + (Number(p.total)||0), 0)
  const totalDesp = despesas.reduce((s,d)=>s + (Number(d.valor)||0), 0)
  const lucro = fatur - totalDesp
  document.getElementById('cardFaturamento').textContent = formatMoney(fatur)
  document.getElementById('cardDespesa').textContent = formatMoney(totalDesp)
  document.getElementById('cardLucro').textContent = formatMoney(lucro)
  document.getElementById('cardOrcPend').textContent = orcs.filter(o=>o.status==='pendente').length

  const months = {}
  pedidos.forEach(p=>{
    const m = new Date(p.data).toLocaleString('pt-BR',{month:'short',year:'numeric'})
    months[m] = (months[m]||0) + (Number(p.total)||0)
  })
  const labels = Object.keys(months)
  const data = Object.values(months)
  const ctx = document.getElementById('chartVendas')
  if(!ctx) return
  if(window._chart) window._chart.destroy()
  window._chart = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ label:'Vendas', data }] },
    options:{ responsive:true }
  })
}

// ------------------ BACKUP ------------------
function exportarBackup(){
  const data = {
    produtos: storageGet(KEYS.PROD),
    orcamentos: storageGet(KEYS.ORC),
    pedidos: storageGet(KEYS.PED),
    despesas: storageGet(KEYS.DESP)
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url
  a.download='backup_sistema.json'
  a.click()
  URL.revokeObjectURL(url)
}
function importarBackup(e){
  const file = e.target.files[0]
  if(!file) return
  const reader = new FileReader()
  reader.onload = (ev)=>{
    try{
      const raw = String(ev.target.result || '').replace(/^﻿/, '').trim()
      if(!raw) throw new Error('Arquivo vazio')
      const obj = JSON.parse(raw)
      const produtos = Array.isArray(obj.produtos) ? obj.produtos : (Array.isArray(obj.products) ? obj.products : [])
      const orcamentos = compactarOrcamentosLista(Array.isArray(obj.orcamentos) ? obj.orcamentos : (Array.isArray(obj['orçamentos']) ? obj['orçamentos'] : []))
      const pedidos = compactarPedidosLista(Array.isArray(obj.pedidos) ? obj.pedidos : [])
      const despesas = Array.isArray(obj.despesas) ? obj.despesas : []
      storageSet(KEYS.PROD, produtos)
      storageSet(KEYS.ORC, orcamentos)
      storageSet(KEYS.PED, pedidos)
      storageSet(KEYS.DESP, despesas)
      alert('Backup importado')
      renderAll()
    }catch(err){
      console.error('Falha ao importar backup:', err)
      alert('Arquivo inválido')
    }
  }
  reader.readAsText(file)
}

// ------------------ RENDER / INIT ------------------
function renderAll(){
  renderProdutos()
  renderOrcamentos()
  renderPedidos()
  renderDespesas()
  renderDashboard()
  renderProdutoSelect('oProdutoSelect')
  renderProdutoSelect('pedProdutoSelect')
}
function init(){
  const orcamentosLimpos = compactarOrcamentosLista(storageGet(KEYS.ORC))
  const pedidosLimpos = compactarPedidosLista(storageGet(KEYS.PED))
  try{
    if(JSON.stringify(orcamentosLimpos) !== JSON.stringify(storageGet(KEYS.ORC))) storageSet(KEYS.ORC, orcamentosLimpos)
  }catch(_){}
  try{
    if(JSON.stringify(pedidosLimpos) !== JSON.stringify(storageGet(KEYS.PED))) storageSet(KEYS.PED, pedidosLimpos)
  }catch(_){}
  if(!localStorage.getItem(KEYS.PROD)) storageSet(KEYS.PROD, [])
  if(!localStorage.getItem(KEYS.ORC)) storageSet(KEYS.ORC, [])
  if(!localStorage.getItem(KEYS.PED)) storageSet(KEYS.PED, [])
  if(!localStorage.getItem(KEYS.DESP)) storageSet(KEYS.DESP, [])
  navegar('produtos')
}
init()
