// Helpers
function uid(){return Date.now().toString(36) + Math.random().toString(36).slice(2,8)}
function storageGet(k){try{return JSON.parse(localStorage.getItem(k)||'null')||[]}catch(e){return []}}
function storageSet(k,v){localStorage.setItem(k, JSON.stringify(v))}
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
const PDF_PAGE_WIDTH = 794
const PDF_PAGE_HEIGHT = 1123
const PDF_PAGE_RESERVED_BOTTOM = 130

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

function esconderSecoesDaContinuacao(pageEl){
  const secs = pageEl.querySelectorAll('.pdf-header, .pdf-summary')
  secs.forEach(el => {
    el.style.display = 'none'
  })
}

function construirPaginaPdfBase(root, rows, mostrarExtras, continuacao=false){
  const page = root.cloneNode(true)
  page.style.width = PDF_PAGE_WIDTH + 'px'
  page.style.minHeight = '0px'
  page.style.height = 'auto'
  page.style.background = '#fff'
  page.style.paddingTop = continuacao ? '16px' : '28px'
  page.style.paddingBottom = '28px'
  if (continuacao) {
    page.classList.add('pdf-continuacao')
    esconderSecoesDaContinuacao(page)
  } else {
    page.classList.add('pdf-primeira')
  }
  const tbody = page.querySelector('.pdf-table tbody')
  if (tbody) {
    tbody.innerHTML = ''
    rows.forEach(row => tbody.appendChild(row.cloneNode(true)))
  }
  aplicarExtrasDaPaginaPdf(page, mostrarExtras)
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
    const isFirst = paginas.length === 0

    while (idx < rows.length) {
      currentRows.push(rows[idx])

      const pageEl = construirPaginaPdfBase(root, currentRows, false, !isFirst)
      host.innerHTML = ''
      host.appendChild(pageEl)

      if (pageEl.scrollHeight > (PDF_PAGE_HEIGHT - PDF_PAGE_RESERVED_BOTTOM)) {
        currentRows.pop()

        if (!currentRows.length) {
          currentRows.push(rows[idx])
          idx++
        }
        break
      }

      idx++
    }

    const isLast = idx >= rows.length
    let finalPage = construirPaginaPdfBase(root, currentRows, isLast, !isFirst)

    // proteção extra: se o rodapé/observações empurrar a página para fora,
    // tira o último item e deixa para a próxima página.
    host.innerHTML = ''
    host.appendChild(finalPage)
    while (finalPage.scrollHeight > PDF_PAGE_HEIGHT && currentRows.length > 1) {
      const removed = currentRows.pop()
      idx--
      finalPage = construirPaginaPdfBase(root, currentRows, idx >= rows.length, !isFirst)
      host.innerHTML = ''
      host.appendChild(finalPage)
      if (!removed) break
    }

    paginas.push(finalPage)
  }

  host.remove()
  return paginas
}

async function gerarPdfBytesDoHtml(html){
  const area = document.getElementById('printArea')
  area.innerHTML = html
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
    area.innerHTML = ''
    return pdf.output('arraybuffer')
  }

  // Fallback antigo para HTMLs não estruturados
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
    <div class="pdf-root" data-pdf-kind="pedido" style="width:794px;min-height:1123px;padding:28px 34px;box-sizing:border-box;background:#fff;color:#111827;font-family:Arial,Helvetica,sans-serif">
      <div class="pdf-header" style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px">
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

      <div class="pdf-summary" style="display:grid;grid-template-columns:1.3fr 1fr;gap:12px;margin-bottom:16px">
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

      <div class="pdf-footer" style="margin-top:26px;border-top:1px solid #d1d5db;padding-top:12px;font-size:11px;color:#374151;line-height:1.45">
        <div style="font-weight:700;font-size:12px;color:#111827">${escapeHtml(EMPRESA_INFO.nome)}</div>
        <div>CNPJ: ${escapeHtml(EMPRESA_INFO.cnpj)} • Razão social: ${escapeHtml(EMPRESA_INFO.razao)}</div>
        <div>Instagram: @${escapeHtml(EMPRESA_INFO.instagram)} • WhatsApp: ${escapeHtml(EMPRESA_INFO.whatsapp)}</div>
      </div>
    </div>
  `
}

function montarHtmlDocumento(titulo, numero, cliente, extraInfoHtml, itens, subtotal, desconto, total, observacoes=''){
  const itensHtml = (itens || []).map(it => {
    const imagem = getImagemProdutoDoItem(it)
    const imgHtml = imagem ? `
      <div style="width:54px;height:54px;border-radius:12px;overflow:hidden;background:#f3f4f6;border:1px solid #e5e7eb;flex:0 0 auto">
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
  const kind = String(titulo || '').toLowerCase().includes('orçamento') ? 'orcamento' : 'pedido'

  return `
    <div class="pdf-root" data-pdf-kind="${kind}" style="width:794px;min-height:1123px;padding:28px 34px;box-sizing:border-box;background:#fff;color:#111827;font-family:Arial,Helvetica,sans-serif">
      <div class="pdf-header" style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px">
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

      <div class="pdf-summary" style="display:grid;grid-template-columns:1.3fr 1fr;gap:12px;margin-bottom:16px">
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

      <div class="pdf-footer" style="margin-top:26px;border-top:1px solid #d1d5db;padding-top:12px;font-size:11px;color:#374151;line-height:1.45">
        <div style="font-weight:700;font-size:12px;color:#111827">${escapeHtml(EMPRESA_INFO.nome)}</div>
        <div>CNPJ: ${escapeHtml(EMPRESA_INFO.cnpj)} • Razão social: ${escapeHtml(EMPRESA_INFO.razao)}</div>
        <div>Instagram: @${escapeHtml(EMPRESA_INFO.instagram)} • WhatsApp: ${escapeHtml(EMPRESA_INFO.whatsapp)}</div>
      </div>
    </div>
  `
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
      imagem: i.imagem || getImagemProdutoDoItem(i),
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
      const obj = JSON.parse(ev.target.result)
      storageSet(KEYS.PROD, obj.produtos||[])
      storageSet(KEYS.ORC, obj.orcamentos||[])
      storageSet(KEYS.PED, obj.pedidos||[])
      storageSet(KEYS.DESP, obj.despesas||[])
      alert('Backup importado')
      renderAll()
    }catch(err){
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
  if(!localStorage.getItem(KEYS.PROD)) storageSet(KEYS.PROD, [])
  if(!localStorage.getItem(KEYS.ORC)) storageSet(KEYS.ORC, [])
  if(!localStorage.getItem(KEYS.PED)) storageSet(KEYS.PED, [])
  if(!localStorage.getItem(KEYS.DESP)) storageSet(KEYS.DESP, [])
  navegar('produtos')
}
init()
