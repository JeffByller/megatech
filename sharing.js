// O compartilhamento envia um resumo em texto; PDF continua no fluxo de impressão.
function orderText(order) {
  return [`${order.status === 'Orçamento' ? 'ORÇAMENTO' : 'ORDEM DE SERVIÇO'} #${order.id}`, `Data: ${order.date.split('-').reverse().join('/')}`, `Cliente: ${order.name}`, `Serviço: ${order.title}`, `Endereço: ${[order.street, order.number, order.district, order.city, order.state, order.zip].filter(Boolean).join(', ')}`, '', ...order.items.map((i, n) => `${n + 1}. ${i.desc} — ${i.qty} × ${money(i.price)} = ${money(i.qty * i.price)}`), '', `Total: ${money(sum(order))}`].join('\n');
}
function whatsappShare(text) { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer'); }
async function shareOrder(alreadySaved = false) {
  if (!alreadySaved && (!document.querySelector('#form').reportValidity() || !save(false))) return;
  const text = orderText(draft);
  if (navigator.share) {
    try { await navigator.share({ title: `Atendimento #${draft.id}`, text }); return; }
    catch (error) { if (error.name === 'AbortError') return; }
  }
  whatsappShare(text);
}
function printOrShare() {
  if (window.matchMedia('(max-width: 700px)').matches) shareOrder(true);
  else window.print();
}
