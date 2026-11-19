// PDF vetorial gerado no aparelho, sem envio de dados para um servidor.
const documentStages = {
  'Orçamento': { title: 'Proposta e orçamento', note: 'Proposta para avaliação do cliente. Valores referentes aos materiais e serviços discriminados neste documento.' },
  'Aprovado': { title: 'Ordem de serviço aprovada', note: 'Orçamento aprovado. Materiais e serviços previstos para execução conforme o atendimento registrado.' },
  'Em execução': { title: 'Serviço em execução', note: 'Atendimento em andamento. Materiais, serviços e valores refletem o registro atual e podem ser atualizados até a conclusão.' },
  'Concluído': { title: 'Serviço concluído', note: 'Atendimento registrado como concluído. Confira abaixo os materiais e serviços informados. Este documento não comprova pagamento.' }
};
function pdfHex(value) {
  const extra = { '€':128, '–':150, '—':151, '’':146, '“':147, '”':148, '…':133 };
  return Array.from(String(value).normalize('NFC')).map(c => (extra[c] || (c.charCodeAt(0) <= 255 ? c.charCodeAt(0) : 63)).toString(16).padStart(2, '0')).join('');
}
function pdfWrap(value, width, size = 10) {
  // Conservative Helvetica width prevents clipping, including unbroken identifiers.
  const max = Math.max(1, Math.floor(width / (size * .6)));
  const lines = [];
  for (const paragraph of String(value || '-').split(/\r?\n/)) {
    let line = '';
    for (let word of paragraph.split(/\s+/)) {
      if (line && line.length + word.length + 1 > max) { lines.push(line); line = ''; }
      while (word.length > max) { if (line) { lines.push(line); line = ''; } lines.push(word.slice(0, max)); word = word.slice(max); }
      if (word) line += (line ? ' ' : '') + word;
    }
    lines.push(line || '');
  }
  return lines;
}
function createOrderPdf(order) {
  const stage = documentStages[order.status] || documentStages['Orçamento'];
  const pages = []; let commands = [], y = 0;
  const text = (value, x, top, size = 10, bold = false, color = '.13 .16 .24') => commands.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${color} rg 1 0 0 1 ${x} ${842 - top} Tm <${pdfHex(value)}> Tj ET`);
  const rule = top => commands.push(`.88 .90 .94 RG .6 w 42 ${842 - top} m 553 ${842 - top} l S`);
  function page() {
    if (commands.length) pages.push(commands.join('\n'));
    commands = []; text('MEGATECH', 42, 48, 21, true, '.21 .35 .81');
    text(stage.title, 42, 77, 16, true); text(`#${order.id}  |  ${order.status}`, 42, 98, 10);
    text(`Data: ${String(order.date || '').split('-').reverse().join('/')}`, 420, 48, 10);
    rule(113); y = 136;
  }
  const ensure = height => { if (y + height > 770) page(); };
  function paragraph(value, bold = false, size = 10, width = 511) {
    for (const line of pdfWrap(value, width, size)) { ensure(size + 7); text(line, 42, y, size, bold); y += size + 6; }
  }
  page();
  paragraph('CLIENTE', true, 10); paragraph(order.name, true, 12);
  const contact = [order.phone && `Telefone: ${order.phone}`, order.whatsapp && `WhatsApp: ${order.whatsapp}`, order.email].filter(Boolean).join(' | ');
  if (contact) paragraph(contact);
  const address = [order.street, order.number, order.district, order.city, order.state, order.zip].filter(Boolean).join(', ');
  if (address) paragraph(address);
  y += 12; paragraph('ATENDIMENTO', true); paragraph(order.title); y += 16;
  function tableHeader(title) {
    ensure(55); text(title, 42, y, 12, true); y += 24;
    text('Descrição', 42, y, 9, true); text('Qtd.', 340, y, 9, true); text('Unitário', 400, y, 9, true); text('Total', 485, y, 9, true);
    y += 9; rule(y); y += 18;
  }
  for (const [type, title] of [['material', 'MATERIAIS E EQUIPAMENTOS'], ['service', 'MÃO DE OBRA']]) {
    const rows = order.items.filter(i => (i.type || 'material') === type);
    if (!rows.length) continue;
    tableHeader(title);
    rows.forEach((item, index) => {
      const lines = pdfWrap(`${index + 1}. ${item.desc}`, 278, 10);
      lines.forEach((line, n) => {
        if (y + 19 > 770) { page(); tableHeader(`${title} (continuação)`); }
        text(line, 42, y);
        if (n === 0) { text(String(item.qty), 340, y, 9); text(money(item.price), 400, y, 9); text(money(item.qty * item.price), 485, y, 9); }
        y += 16;
      });
      rule(y - 6); y += 10;
    }); y += 14;
  }
  ensure(100);
  const materials = order.items.filter(i => i.type !== 'service').reduce((s, i) => s + i.qty * i.price, 0);
  text('Materiais', 320, y, 10); text(money(materials), 470, y, 10); y += 22;
  text('Mão de obra', 320, y, 10); text(money(sum(order) - materials), 470, y, 10); y += 28;
  text('TOTAL', 320, y, 12, true); text(money(sum(order)), 455, y, 13, true, '.21 .35 .81'); y += 36;
  paragraph(stage.note, false, 9); y += 10; paragraph('Documento de atendimento. Não substitui nota fiscal.', false, 9);
  pages.push(commands.join('\n'));
  const objects = [null, '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
  const pageIds = [];
  pages.forEach((content, index) => {
    const footer = `\nBT /F1 9 Tf .45 .49 .57 rg 1 0 0 1 42 28 Tm <${pdfHex('Megatech | ' + stage.title)}> Tj ET\nBT /F1 9 Tf 1 0 0 1 480 28 Tm <${pdfHex(`${index + 1} / ${pages.length}`)}> Tj ET`;
    content += footer;
    const streamId = objects.length + 1; objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageId = objects.length + 1; pageIds.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`);
  });
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  let output = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(output.length); output += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([new TextEncoder().encode(output)], { type: 'application/pdf' });
}
function orderPdfFile(order) {
  const title = (documentStages[order.status] || documentStages['Orçamento']).title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');
  return new File([createOrderPdf(order)], `megatech-${title}-${order.id}.pdf`, { type: 'application/pdf' });
}
function downloadPdf(file) {
  const url = URL.createObjectURL(file), anchor = document.createElement('a');
  anchor.href = url; anchor.download = file.name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function prepareOrderPdf(alreadySaved) {
  if (!alreadySaved && (!document.querySelector('#form').reportValidity() || !save(false))) return null;
  return orderPdfFile(draft);
}
function downloadOrderPdf() {
  try { const file = prepareOrderPdf(false); if (file) downloadPdf(file); }
  catch { toast('Não foi possível gerar o PDF. Tente novamente.'); }
}
async function shareOrder(alreadySaved = false) {
  let file;
  try { file = prepareOrderPdf(alreadySaved); if (!file) return;
    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      try { await navigator.share({ files: [file], title: `Megatech - ${draft.id}` }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    downloadPdf(file); toast('PDF baixado. Abra o WhatsApp e anexe o documento.');
  } catch { toast('Não foi possível compartilhar. Use Baixar PDF para tentar novamente.'); }
}
function printOrShare() { shareOrder(true); }
