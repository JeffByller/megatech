// Cadastros independentes das cópias históricas salvas nas ordens.
function readCatalog(key, seed) {
  try { const data = JSON.parse(localStorage.getItem(key)); if (Array.isArray(data)) return data; } catch {}
  return seed;
}
const catalogs = {
  clients: readCatalog('megatech-clients-v1', orders.map((o, n) => ({ id: n + 1, ...Object.fromEntries(fields.map(([key]) => [key, o[key] || ''])) }))),
  materials: readCatalog('megatech-materials-v1', [
    { id: 1, name: 'Câmera IP', sku: 'CAM-001', unit: 'un', stock: 12, price: 280 },
    { id: 2, name: 'Cabo de rede', sku: 'CAB-001', unit: 'm', stock: 305, price: 3.5 },
    { id: 3, name: 'Conector RJ45', sku: 'CON-001', unit: 'un', stock: 100, price: 2.5 }
  ]),
  services: readCatalog('megatech-services-v1', [
    { id: 1, name: 'Instalação de câmera IP', unit: 'un', price: 175 },
    { id: 2, name: 'Revisão da rede', unit: 'serviço', price: 180 },
    { id: 3, name: 'Atualização de firmware', unit: 'serviço', price: 120 }
  ])
};
const catalogLabels = { clients: 'Clientes', materials: 'Estoque de materiais', services: 'Mão de obra' };
function writeCatalog(type, next) {
  try { localStorage.setItem(`megatech-${type}-v1`, JSON.stringify(next)); catalogs[type] = next; return true; }
  catch { alert('Não foi possível salvar o cadastro neste navegador.'); return false; }
}
function catalog(type) {
  app.innerHTML = `<div class="top"><div><div class="muted">CADASTROS</div><h1>${catalogLabels[type]}</h1></div><button onclick="catalogEdit('${type}')">+ Cadastrar</button></div><p>${type === 'materials' ? 'Cadastre preços e ajuste o saldo disponível. Vincular à OS não dá baixa automática no estoque.' : 'Cadastre uma vez e selecione nos próximos atendimentos.'}</p><input id="catalogSearch" placeholder="Buscar cadastro…" aria-label="Buscar cadastro"><p id="catalogCount" class="catalog-count" role="status"></p><div class="cards" id="catalogCards"></div><div id="catalogPager"></div>`;
  let currentPage = 1;
  const render = () => {
    const q = searchText(document.querySelector('#catalogSearch').value);
    const matches = catalogs[type].filter(r => searchText(`${r.name} ${r.sku || ''} ${r.phone || ''} ${r.whatsapp || ''} ${r.city || ''} ${r.email || ''}`).includes(q));
    document.querySelector('#catalogCount').textContent = `${matches.length} de ${catalogs[type].length} cadastros`;
    const page = pageSlice(matches,currentPage);currentPage=page.page;
    renderPagination(document.querySelector('#catalogPager'),page,next=>{currentPage=next;render();document.querySelector('#catalogCards').scrollIntoView({block:'start'})});
    document.querySelector('#catalogCards').innerHTML = page.items.map(r => `<article class="catalog-row"><div class="catalog-info"><h3>${esc(r.name)}</h3><p>${type === 'clients' ? esc([r.phone, r.city].filter(Boolean).join(' · ')) : `${money(r.price)} / ${esc(r.unit)}${type === 'materials' ? ` · Saldo: ${r.stock} ${esc(r.unit)}` : ''}`}</p></div><div class="actions"><button class="secondary" onclick="catalogEdit('${type}',${r.id})">Editar</button><button class="secondary delete-action" onclick="removeCatalog('${type}',${r.id})">Excluir</button></div></article>`).join('') || '<p>Nenhum cadastro encontrado.</p>';
  };
  document.querySelector('#catalogSearch').oninput = () => { currentPage=1;render(); }; render(); window.scrollTo(0, 0);
}
function removeCatalog(type, id) {
  if (confirm('Excluir este cadastro? Os dados já registrados nas ordens serão preservados.') && writeCatalog(type, catalogs[type].filter(r => r.id !== id))) catalog(type);
}
function catalogEdit(type, id) {
  const record = catalogs[type].find(r => r.id === id) || {};
  const schema = type === 'clients' ? fields : [['name', 'Descrição'], ...(type === 'materials' ? [['sku', 'Código'], ['stock', 'Saldo em estoque']] : []), ['unit', 'Unidade (un, m, hora, serviço)'], ['price', 'Valor unitário (R$)']];
  app.innerHTML = `<button class="secondary" onclick="catalog('${type}')">Voltar</button><h1 style="margin-top:24px">${id ? 'Editar cadastro' : 'Novo cadastro'}</h1><form id="catalogForm"><section><div class="grid">${schema.map(([key, label]) => `<label>${label}<input name="${key}" value="${esc(record[key] ?? '')}" ${['name', 'price', 'stock', 'unit'].includes(key) ? 'required' : ''} type="${['price', 'stock'].includes(key) ? 'number' : key === 'email' ? 'email' : ['phone', 'whatsapp'].includes(key) ? 'tel' : 'text'}" ${['price', 'stock'].includes(key) ? 'min="0" step="0.01"' : ''}></label>`).join('')}</div></section><button>Salvar cadastro</button></form>`;
  document.querySelector('#catalogForm').onsubmit = e => {
    e.preventDefault(); const data = Object.fromEntries(new FormData(e.target));
    for (const key of ['price', 'stock']) if (key in data) data[key] = Number(data[key]);
    data.id = id || Math.max(0, ...catalogs[type].map(r => r.id)) + 1;
    const next = catalogs[type].filter(r => r.id !== data.id); next.push(data);
    if (writeCatalog(type, next)) { catalog(type); toast('Cadastro salvo'); }
  };
}
const baseEdit = edit;
edit = function(id) {
  baseEdit(id);
  const sections = document.querySelectorAll('#form section');
  sections[1].insertAdjacentHTML('afterbegin', `<div class="picker"><label>Buscar cliente cadastrado<input id="clientSearch" list="clientOptions" placeholder="Digite o nome ou telefone"><datalist id="clientOptions">${catalogs.clients.map(c => `<option value="${esc(c.name)} · #${c.id}">${esc(c.phone)}</option>`).join('')}</datalist></label><button type="button" class="secondary" style="margin-top:8px" onclick="applyClient()">Preencher cliente</button></div>`);
  for (const [index, type] of [[2, 'materials'], [3, 'services']]) {
    sections[index].insertAdjacentHTML('afterbegin', `<div class="picker"><label>Buscar ${type === 'materials' ? 'material' : 'serviço'} cadastrado<input id="${type}Search" list="${type}Options" placeholder="Digite para buscar"><datalist id="${type}Options">${catalogs[type].map(r => `<option value="${esc(r.name)} · #${r.id}">${money(r.price)} / ${esc(r.unit)}</option>`).join('')}</datalist></label><button type="button" class="secondary" style="margin-top:8px" onclick="applyItem('${type}')">Vincular à OS</button></div>`);
  }
  const actions = document.querySelector('#form .actions');
  actions.innerHTML = `<button type="submit">Salvar atendimento</button><button type="button" class="secondary" onclick="downloadOrderPdf()">Baixar PDF</button><button type="button" class="secondary" onclick="shareOrder()">Compartilhar PDF / WhatsApp</button>`;
};
function applyClient() {
  const value = document.querySelector('#clientSearch').value;
  const client = catalogs.clients.find(c => `${c.name} · #${c.id}` === value);
  if (!client) return toast('Selecione um cliente da lista');
  draft.clientId = client.id;
  for (const [key] of fields) document.querySelector(`#form [name="${key}"]`).value = client[key] || '';
  toast('Dados do cliente preenchidos');
}
function applyItem(type) {
  const value = document.querySelector(`#${type}Search`).value;
  const record = catalogs[type].find(r => `${r.name} · #${r.id}` === value);
  if (!record) return toast('Selecione um cadastro da lista');
  draft.items.push({ catalogId: record.id, type: type === 'services' ? 'service' : 'material', desc: `${record.name} (${record.unit})`, qty: 1, price: record.price });
  items(); document.querySelector(`#${type}Search`).value = ''; toast('Item vinculado');
}
