const PAGE_SIZE = 10;
function pageSlice(records, requestedPage = 1) {
  const pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, requestedPage));
  const start = (page - 1) * PAGE_SIZE;
  return { items: records.slice(start, start + PAGE_SIZE), page, pages, total: records.length, start: records.length ? start + 1 : 0, end: Math.min(start + PAGE_SIZE, records.length) };
}
function renderPagination(container, data, changePage) {
  container.innerHTML = `<div class="pagination"><span role="status">${data.start}–${data.end} de ${data.total}</span><div class="pagination-controls"><button class="secondary" data-page="previous" ${data.page === 1 ? 'disabled' : ''}>Anterior</button><span>Página ${data.page} de ${data.pages}</span><button class="secondary" data-page="next" ${data.page === data.pages ? 'disabled' : ''}>Próxima</button></div></div>`;
  container.querySelector('[data-page="previous"]').onclick = () => changePage(data.page - 1);
  container.querySelector('[data-page="next"]').onclick = () => changePage(data.page + 1);
}
function mountPagedList({ records, search, list, pager, matches, renderItem, empty }) {
  let currentPage = 1;
  function render() {
    const query = searchText(search.value);
    const data = pageSlice(records.filter(record => matches(record, query)), currentPage);
    currentPage = data.page;
    list.innerHTML = data.items.map(renderItem).join('') || `<p class="dashboard-empty">${empty}</p>`;
    renderPagination(pager, data, page => { currentPage = page; render(); list.scrollIntoView({ block: 'start' }); });
  }
  search.oninput = () => { currentPage = 1; render(); };
  render();
}
