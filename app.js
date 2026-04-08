function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDateBR(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('pt-BR');
}

async function esperarImagens(container) {
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    imgs.map(
      img =>
        img.complete
          ? Promise.resolve()
          : new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            })
    )
  );
}

async function gerarPdfA4DoElemento(elemento, nomeArquivo) {
  const { jsPDF } = window.jspdf;

  const canvas = await html2canvas(elemento, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const margem = 10;
  const pageWidth = 210 - margem * 2;
  const pageHeight = 297 - margem * 2;

  const sliceHeightPx = Math.floor((canvas.width * pageHeight) / pageWidth);
  let rendered = 0;
  let pageIndex = 0;

  while (rendered < canvas.height) {
    const sliceHeight = Math.min(sliceHeightPx, canvas.height - rendered);

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;

    const ctx = pageCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      rendered,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const imgData = pageCanvas.toDataURL('image/png');
    const renderedHeightMm = (sliceHeight * pageWidth) / canvas.width;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', margem, margem, pageWidth, renderedHeightMm);

    rendered += sliceHeight;
    pageIndex += 1;
  }

  pdf.save(nomeArquivo);
}

function montarLinhasItens(itens) {
  return itens
    .map((it, idx) => {
      const zebra = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
      return `
        <tr style="background:${zebra};">
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">
            ${escapeHtml(it.nome)}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">
            ${it.qtd}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">
            ${formatMoney(it.preco)}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">
            ${formatMoney(it.preco * it.qtd)}
          </td>
        </tr>
      `;
    })
    .join('');
}

function montarHtmlDocumentoPdf({
  titulo,
  numero,
  cliente,
  telefone = '',
  validade = '',
  obs = '',
  subtotal = 0,
  desconto = 0,
  total = 0,
  itens = []
}) {
  const linhasItens = montarLinhasItens(itens);

  return `
    <div style="
      width:794px;
      min-height:1123px;
      background:#ffffff;
      color:#111827;
      font-family:Arial, Helvetica, sans-serif;
      padding:28px 32px;
      box-sizing:border-box;
    ">
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:16px;
        border-bottom:2px solid #111827;
        padding-bottom:14px;
        margin-bottom:18px;
      ">
        <div style="display:flex;align-items:center;gap:14px;">
          <img src="logo.png" alt="Logo" style="width:64px;height:64px;object-fit:contain;">
          <div>
            <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;">
              Zerion
            </div>
            <div style="font-size:28px;font-weight:700;line-height:1.1;">
              ${escapeHtml(titulo)}
            </div>
          </div>
        </div>

        <div style="text-align:right;">
          <div style="font-size:12px;color:#6b7280;">Documento</div>
          <div style="font-size:18px;font-weight:700;">${escapeHtml(numero)}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Cliente</div>
          <div style="font-size:16px;font-weight:700;">${escapeHtml(cliente || '')}</div>
          ${telefone ? `<div style="margin-top:6px;color:#374151;">Telefone: ${escapeHtml(telefone)}</div>` : ''}
          ${validade ? `<div style="margin-top:4px;color:#374151;">Validade: ${escapeHtml(validade)}</div>` : ''}
        </div>

        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#f9fafb;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Resumo</div>
          <div style="display:flex;justify-content:space-between;margin:4px 0;">
            <span>Subtotal</span>
            <strong>${formatMoney(subtotal)}</strong>
          </div>
          ${desconto ? `
            <div style="display:flex;justify-content:space-between;margin:4px 0;">
              <span>Desconto</span>
              <strong>${desconto}%</strong>
            </div>
          ` : ''}
          <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
            <span>Total</span>
            <strong style="font-size:18px;">${formatMoney(total)}</strong>
          </div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:10px 8px;background:#111827;color:#fff;font-size:13px;">Produto</th>
            <th style="text-align:center;padding:10px 8px;background:#111827;color:#fff;font-size:13px;">Qtd</th>
            <th style="text-align:right;padding:10px 8px;background:#111827;color:#fff;font-size:13px;">Preço</th>
            <th style="text-align:right;padding:10px 8px;background:#111827;color:#fff;font-size:13px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${linhasItens}
        </tbody>
      </table>

      ${obs ? `
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin-bottom:12px;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">Observações</div>
          <div style="white-space:pre-wrap;line-height:1.5;">${escapeHtml(obs)}</div>
        </div>
      ` : ''}

      <div style="font-size:11px;color:#6b7280;text-align:center;margin-top:auto;padding-top:18px;border-top:1px solid #e5e7eb;">
        Documento gerado automaticamente pelo sistema.
      </div>
    </div>
  `;
}

async function pdfOrc(id) {
  const o = storageGet(KEYS.ORC).find(x => x.id === id);
  if (!o) return alert('Orçamento não encontrado');

  const html = montarHtmlDocumentoPdf({
    titulo: 'Orçamento',
    numero: o.numero,
    cliente: o.cliente,
    telefone: o.telefone || '',
    validade: formatDateBR(o.validade),
    obs: o.obs || '',
    subtotal: o.subtotal || 0,
    desconto: o.desconto || 0,
    total: o.total || 0,
    itens: o.itens || []
  });

  const pa = document.getElementById('printArea');
  pa.innerHTML = html;
  await esperarImagens(pa);
  await gerarPdfA4DoElemento(pa, `${o.numero}.pdf`);
}

async function pdfPedido(id) {
  const p = storageGet(KEYS.PED).find(x => x.id === id);
  if (!p) return alert('Pedido não encontrado');

  const html = montarHtmlDocumentoPdf({
    titulo: 'Pedido',
    numero: p.numero,
    cliente: p.cliente,
    telefone: p.telefone || '',
    subtotal: p.subtotal || p.total || 0,
    desconto: p.desconto || 0,
    total: p.total || 0,
    itens: p.itens || []
  });

  const pa = document.getElementById('printArea');
  pa.innerHTML = html;
  await esperarImagens(pa);
  await gerarPdfA4DoElemento(pa, `${p.numero}.pdf`);
}
