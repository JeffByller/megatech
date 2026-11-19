// Os indicadores são recalculados sempre que o painel é aberto.
function dashboardData(records, data) {
  const stages = ['Orçamento', 'Aprovado', 'Em execução', 'Concluído'].map(name => {
    const list = records.filter(order => order.status === name);
    return { name, count: list.length, value: list.reduce((total, order) => total + sum(order), 0) };
  });
  return {
    stages,
    total: records.length,
    open: records.filter(order => order.status !== 'Concluído').length,
    value: records.reduce((total, order) => total + sum(order), 0),
    completedValue: stages.find(stage => stage.name === 'Concluído').value,
    clients: data.clients.length,
    materials: data.materials.length,
    services: data.services.length,
    lowStock: data.materials.filter(item => Number(item.stock) <= 5).sort((a, b) => a.stock - b.stock),
    recent: [...records].sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id)
  };
}
function dashboardOrders(stage = 'Todos') { filter = stage; query = ''; dateFrom = ''; dateTo = ''; home(); }
function dashboard() {
  const data = dashboardData(orders, catalogs);
  const stat = (label, value, action, detail) => `<button class="dashboard-stat" onclick="${action}"><span>${label}</span><strong>${value}</strong><small>${detail}</small></button>`;
  app.innerHTML = `<div class="top"><div><div class="muted">VISÃO GERAL</div><h1>Dashboard</h1><p style="margin:4px 0">Seu trabalho em um só lugar.</p></div><button onclick="edit()">+ Novo orçamento</button></div>
    <div class="dashboard-stats">
      ${stat('Atendimentos em aberto', data.open, 'dashboardOrders()', `${data.total} atendimentos no total`)}
      ${stat('Valor total registrado', money(data.value), 'dashboardOrders()', 'Soma de todas as etapas')}
      ${stat('Serviços concluídos', money(data.completedValue), "dashboardOrders('Concluído')", 'Valor das ordens concluídas')}
      ${stat('Clientes', data.clients, "catalog('clients')", 'Cadastros disponíveis')}
      ${stat('Materiais', data.materials, "catalog('materials')", 'Itens cadastrados no estoque')}
      ${stat('Serviços', data.services, "catalog('services')", 'Tipos de mão de obra')}
    </div>
    <div class="dashboard-columns"><section class="dashboard-section"><div class="row"><h2>Atendimentos por etapa</h2><span class="muted">Quantidade e valor</span></div>
      ${data.stages.map((stage, index) => `<button class="stage-row" onclick="dashboardOrders('${stage.name}')"><div class="row"><strong>${stage.name}</strong><span>${stage.count} <span class="muted">· ${money(stage.value)}</span></span></div><div class="stage-track"><span class="stage-fill stage-${index}" style="width:${data.total ? stage.count / data.total * 100 : 0}%"></span></div></button>`).join('')}
      <p class="dashboard-note">Valores registrados nas ordens. Não representam pagamentos recebidos.</p></section>
    <section class="dashboard-section"><div class="row"><h2>Atenção ao estoque</h2><button class="text-action" onclick="catalog('materials')">Ver estoque</button></div><p class="dashboard-note">Materiais com saldo de até 5 na unidade cadastrada. Ajuste manual do estoque.</p>
      <input id="stockSearch" aria-label="Pesquisar alertas de estoque" placeholder="Pesquisar material…"><div id="stockList"></div><div id="stockPager"></div>
    </section></div>
    <section class="dashboard-section"><div class="row"><h2>Atendimentos recentes</h2><button class="text-action" onclick="dashboardOrders()">Ver todos</button></div>
      <input id="recentSearch" aria-label="Pesquisar atendimentos no dashboard" placeholder="Pesquisar cliente, número ou serviço…"><div class="recent-list" id="recentList"></div><div id="recentPager"></div>
    </section><div class="notice">Dados deste navegador · Visão geral de todos os registros, sem filtro de período.</div>`;
  mountPagedList({records:data.lowStock,search:document.querySelector('#stockSearch'),list:document.querySelector('#stockList'),pager:document.querySelector('#stockPager'),matches:(item,q)=>searchText(item.name).includes(q),renderItem:item=>`<button class="stock-alert" onclick="catalogEdit('materials',${item.id})"><span>${esc(item.name)}</span><strong class="stock-badge">${Number(item.stock)} ${esc(item.unit)}</strong></button>`,empty:'Nenhum material com saldo baixo encontrado.'});
  mountPagedList({records:data.recent,search:document.querySelector('#recentSearch'),list:document.querySelector('#recentList'),pager:document.querySelector('#recentPager'),matches:(order,q)=>searchText(`${order.name} ${order.id} ${order.title}`).includes(q),renderItem:order=>`<button class="recent-row" onclick="edit(${order.id})"><div class="recent-info"><strong>${esc(order.name)}</strong><span>#${order.id} · ${esc(order.title)}</span><small>${esc(String(order.date).split('-').reverse().join('/'))}</small></div><div class="recent-value"><span class="badge">${esc(order.status)}</span><strong>${money(sum(order))}</strong></div></button>`,empty:'Nenhum atendimento encontrado.'});
  window.scrollTo(0, 0);
}
// Mantém a navegação selecionada mesmo ao entrar por atalhos do painel.
function selectMainTab(name) {
  document.querySelectorAll('.main-nav button').forEach(button => {
    const selected = button.textContent === name;
    button.classList.toggle('active', selected);
    if (selected) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
}
for (const [fn, label] of [['dashboard', 'Dashboard'], ['home', 'Ordens'], ['edit', 'Ordens']]) {
  const original = window[fn];
  window[fn] = function(...args) { const result = original(...args); selectMainTab(label); return result; };
}
const originalCatalog = catalog;
catalog = function(type) { originalCatalog(type); selectMainTab({ clients:'Clientes', materials:'Estoque', services:'Serviços' }[type]); };
const originalCatalogEdit = catalogEdit;
catalogEdit = function(type, id) { originalCatalogEdit(type, id); selectMainTab({ clients:'Clientes', materials:'Estoque', services:'Serviços' }[type]); };
selectMainTab('Ordens');
