(() => {
  const grid = document.querySelector('#shopProducts');
  const status = document.querySelector('#shopStatus');
  const fallback = document.querySelector('#shopFallback');
  if (!grid || !status) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const shopUrl = 'https://valdara-shop.fourthwall.com/';
  async function load() {
    try {
      const base = window.VALDARA_SUPABASE_URL;
      const key = window.VALDARA_SUPABASE_ANON_KEY;
      if (!base || !key) throw new Error('Supabase-Konfiguration fehlt.');
      const response = await fetch(`${base}/functions/v1/fourthwall-products`, {headers:{apikey:key, Authorization:`Bearer ${key}`}});
      if (!response.ok) throw new Error(`Shop-Endpunkt antwortet mit ${response.status}.`);
      const payload = await response.json();
      const products = Array.isArray(payload.results) ? payload.results : Array.isArray(payload.products) ? payload.products : Array.isArray(payload) ? payload : [];
      const visible = products.filter(p => p && p.slug && (!p.state?.type || p.state.type === 'AVAILABLE') && (!p.access?.type || p.access.type === 'PUBLIC'));
      if (!visible.length) throw new Error('Der Produktkatalog ist noch leer oder nicht erreichbar.');
      grid.innerHTML = visible.map(p => {
        const image = p.images?.[0]?.url || p.variants?.[0]?.images?.[0]?.url || '';
        const priceVariant = (p.variants || []).find(v => v.unitPrice?.value != null);
        const price = priceVariant ? new Intl.NumberFormat('de-DE',{style:'currency',currency:priceVariant.unitPrice.currency || 'EUR'}).format(priceVariant.unitPrice.value) : '';
        const url = `${shopUrl}products/${encodeURIComponent(p.slug)}`;
        return `<article class="shop-product-card"><a class="shop-product-image" href="${url}" target="_blank" rel="noopener" aria-label="${esc(p.name)} ansehen">${image ? `<img loading="lazy" src="${esc(image)}" alt="${esc(p.name)}">` : '<span class="shop-image-placeholder">VALDARA</span>'}</a><div class="shop-product-copy"><span class="shop-product-kicker">VALDARA · EURE WAHL</span><h3>${esc(p.name)}</h3><p>${esc((p.description || '').replace(/<[^>]*>/g,' ').slice(0,150))}</p><div class="shop-product-bottom">${price ? `<strong>${esc(price)}</strong>` : '<span></span>'}<a href="${url}" target="_blank" rel="noopener">Ansehen ↗</a></div></div></article>`;
      }).join('');
      status.textContent = `${visible.length} ${visible.length === 1 ? 'Produkt' : 'Produkte'} aus dem Valdara-Shop`;
    } catch (error) {
      console.error('[Valdara Shop]', error);
      status.textContent = 'Die Produktliste konnte noch nicht geladen werden.';
      fallback.hidden = false;
    }
  }
  load();
})();
