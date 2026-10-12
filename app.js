const VALDARA_MAP_ID = '58dd9430-3789-4e41-88b0-366f2678fb00';
const VALDARA_MAP_PUBLIC_URL = 'https://vunvrgopzcbbxcxyjnxp.supabase.co/storage/v1/object/public/valdara-media/maps/continents/Valdara_Master_Map_Wegenetz_v4_Siedlungsnetz.png';

const fallbackPeoples = [
  {name:'Meren',realm:'Valmeris',image:'assets/valdara-meren.jpg',desc:'Handel, Landwirtschaft und Diplomatie'},
  {name:'Elarin',realm:'Aelvaris',image:'assets/valdara-elarin.jpg',desc:'Natur, Wissen und Heilkunst'},
  {name:'Durn',realm:'Durnakhar',image:'assets/valdara-durn.jpg',desc:'Bergbau, Metallverarbeitung und Handwerk'},
  {name:'Urakai',realm:'Gorvath',image:'assets/valdara-urakai.jpg',desc:'Gemeinschaft, Baukunst und Naturverbundenheit'},
  {name:'Dravari',realm:'Zarveth',image:'assets/valdara-dravari.jpg',desc:'Handel, Forschung und Anpassungsfähigkeit'},
  {name:'Kharai',realm:'Kharuun',image:'assets/valdara-kharai.jpg',desc:'Jagd, Freiheit und Gemeinschaft'}
];

const grid = document.querySelector('#peopleGrid');
const mapView = document.querySelector('#mapView');
const mapImage = document.querySelector('#valdaraMap');
const mapZoomModal = document.querySelector('#mapZoomModal');
const mapZoomCanvas = document.querySelector('#mapZoomCanvas');
const mapZoomTitle = document.querySelector('#mapZoomTitle');
const mapZoomClose = document.querySelector('#mapZoomClose');
const mapZoomBack = document.querySelector('#mapZoomBack');
let mapViewPlaceholder = null;
const mapStatus = document.querySelector('#mapStatus');
const peopleModal = document.querySelector('#peopleModal');
const peopleModalContent = document.querySelector('#peopleModalContent');
const mapDetailModal = document.querySelector('#mapDetailModal');
const mapDetailContent = document.querySelector('#mapDetailContent');
const weatherToggle = document.querySelector('#weatherToggle');
const weatherLegend = document.querySelector('#weatherLegend');

const detailSections = [
  ['overview','Überblick'],
  ['appearance','Aussehen'],
  ['culture','Gesellschaft & Lebensweise'],
  ['strengths','Stärken'],
  ['weaknesses','Schwächen'],
  ['relationships','Beziehungen zu den Reichen'],
  ['special_property','Besondere Eigenschaft']
];

function supabaseHeaders() {
  return {
    apikey: window.VALDARA_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${window.VALDARA_SUPABASE_ANON_KEY}`
  };
}
function hasSupabaseConfig() { return Boolean(window.VALDARA_SUPABASE_URL && window.VALDARA_SUPABASE_ANON_KEY); }
async function supabaseGet(path) {
  const response = await fetch(`${window.VALDARA_SUPABASE_URL}/rest/v1/${path}`, {headers:supabaseHeaders()});
  if (!response.ok) throw new Error(`Supabase HTTP ${response.status}`);
  return response.json();
}
function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
function formatText(value='') { return escapeHtml(value).replace(/\n/g,'<br>'); }

function setMapImage(url) {
  const finalUrl = url || VALDARA_MAP_PUBLIC_URL;
  mapImage.src = finalUrl;
  mapImage.onerror = () => {
    if (mapImage.src !== VALDARA_MAP_PUBLIC_URL) mapImage.src = VALDARA_MAP_PUBLIC_URL;
  };
  document.documentElement.style.setProperty('--valdara-map-url', `url("${finalUrl.replace(/"/g,'\\"')}")`);
}
function setMapStatus(text, online=true) {
  if (!mapStatus) return;
  mapStatus.innerHTML = `<i></i> ${escapeHtml(text)}`;
  mapStatus.classList.toggle('offline', !online);
}

async function openMapMarker(marker) {
  if (!mapDetailModal || !mapDetailContent) return;
  const isRealm = marker.marker_type === 'custom' && marker.realm_id;
  mapDetailContent.innerHTML = `<div class="map-detail-loading"><span class="eyebrow">VALDARA</span><h2>${escapeHtml(marker.name || 'Ort')}</h2><p>Daten werden geladen …</p></div>`;
  mapDetailModal.classList.add('open');
  document.body.classList.add('modal-open');
  mapDetailModal.setAttribute('aria-hidden','false');

  try {
    if (!hasSupabaseConfig()) throw new Error('Supabase-Konfiguration fehlt.');
    if (isRealm) {
      const rows = await supabaseGet(`realms?select=id,name,description,overview,geography,culture,economy,strengths,weaknesses,political_structure,relationships,special_property&id=eq.${encodeURIComponent(marker.realm_id)}&limit=1`);
      const realm = rows[0];
      if (!realm) throw new Error('Reich nicht gefunden.');
      const fields = [
        ['overview','Überblick'],['geography','Geografie'],['culture','Kultur & Lebensweise'],['economy','Wirtschaft'],
        ['strengths','Stärken'],['weaknesses','Schwächen'],['political_structure','Politische Struktur'],
        ['relationships','Beziehungen'],['special_property','Besondere Eigenschaft']
      ];
      const sections = fields.filter(([key]) => realm[key] && String(realm[key]).trim()).map(([key,label],i)=>`
        <details class="lore-accordion" ${i===0?'open':''}><summary><span>${escapeHtml(label)}</span><span class="accordion-icon">+</span></summary><div class="lore-content">${formatText(realm[key])}</div></details>`).join('');
      mapDetailContent.innerHTML = `<div class="map-detail-head"><div><span class="eyebrow">REICH</span><h2 id="mapDetailTitle">${escapeHtml(realm.name)}</h2><p>${escapeHtml(realm.description || '')}</p></div></div><div class="lore-accordions">${sections || '<p class="empty-lore">Für dieses Reich sind noch keine weiteren Abschnitte hinterlegt.</p>'}</div>`;
      return;
    }

    if (marker.location_id) {
      const maps = await supabaseGet(`maps?select=id,name,image_url,map_type,description,location_id,is_active&location_id=eq.${encodeURIComponent(marker.location_id)}&is_active=eq.true&order=map_type.asc`);
      const detailMap = maps.find(m => m.image_url);
      const image = detailMap?.image_url ? `<div class="map-detail-image"><img src="${escapeHtml(detailMap.image_url)}" alt="${escapeHtml(marker.name || 'Ort')}"></div>` : '';
      mapDetailContent.innerHTML = `<div class="map-detail-head"><div><span class="eyebrow">ORT</span><h2 id="mapDetailTitle">${escapeHtml(marker.name || 'Ort')}</h2><p>${escapeHtml(marker.description || 'Dieser Ort ist mit der Valdara-Welt verknüpft.')}</p></div></div>${image}<div class="map-detail-note">${detailMap ? 'Detailkarte dieses Ortes' : 'Für diesen Ort ist noch keine separate Detailkarte hinterlegt.'}</div>`;
      return;
    }
    throw new Error('Keine verknüpfte Location gefunden.');
  } catch (error) {
    console.error('Marker-Ziel konnte nicht geladen werden:', error);
    mapDetailContent.innerHTML = `<div class="map-detail-head"><div><span class="eyebrow">VALDARA</span><h2 id="mapDetailTitle">${escapeHtml(marker.name || 'Ort')}</h2><p>${escapeHtml(marker.description || 'Dieser Marker ist mit der Valdara-Welt verknüpft.')}</p></div></div><div class="map-detail-note">Die Detaildaten konnten gerade nicht geladen werden.</div>`;
  }
}

let markerStyles = {};

function resolveMarkerStyle(marker) {
  const locationType = Array.isArray(marker.locations) ? marker.locations[0]?.location_type : marker.locations?.location_type;
  let code = marker.marker_type || 'custom';

  // Realm-Marker bleiben custom + realm_id.
  if (marker.realm_id && !marker.location_id) code = 'realm';
  else if (locationType) code = locationType;

  if (markerStyles[code]) return markerStyles[code];
  if (markerStyles[marker.marker_type]) return markerStyles[marker.marker_type];

  // Robuste Fallbacks: bestehende Marker funktionieren auch ohne marker_styles.
  const fallback = {
    city: {color:'#F2C94C', border_color:'#6f5310', size:10, icon:'', render_mode:'point', opacity:1},
    village: {color:'#8B5A2B', border_color:'#5C3718', size:5, icon:'', render_mode:'point', opacity:1},
    custom: {color:'#D7AD58', border_color:'#222', size:11, icon:'', render_mode:'point', opacity:1},
    realm: {color:'#D7AD58', border_color:'#222', size:12, icon:'', render_mode:'point', opacity:1}
  };
  return fallback[code] || fallback[marker.marker_type] || fallback.custom;
}

function applyMarkerStyle(button, style) {
  if (!style) return;
  button.style.setProperty('--marker-color', style.color || '#d7ad58');
  button.style.setProperty('--marker-size', `${Number(style.size || 14)}px`);
  button.style.setProperty('--marker-opacity', String(style.opacity ?? 1));
  button.style.setProperty('--marker-border', style.border_color || '#222');
  button.style.setProperty('--marker-border-width', '1px');
  button.dataset.renderMode = style.render_mode || 'point';
  button.dataset.icon = style.icon || '●';
}

const WEATHER_VISUALS = {
  clear: { icon: '☀', color: '#f2c94c' },
  cloudy: { icon: '☁', color: '#b8c4d1' },
  rain: { icon: '☂', color: '#65a9d8' },
  storm: { icon: '◒', color: '#8c78c6' },
  thunderstorm: { icon: 'ϟ', color: '#d6b25e' },
  snow: { icon: '❄', color: '#dcefff' },
  fog: { icon: '≋', color: '#aeb7bd' },
  heat: { icon: '♨', color: '#e8845c' },
  cold: { icon: '❅', color: '#8fd2ff' },
  magical_storm: { icon: '✦', color: '#c38cff' },
  cursed_fog: { icon: '☠', color: '#9c7fb9' },
  arcane_rain: { icon: '✧', color: '#8db8ff' }
};

function weatherVisual(key) {
  return WEATHER_VISUALS[key] || { icon: '•', color: '#d7ad58' };
}

function weatherTemperature(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n.toFixed(1)}°` : '–';
}

let weatherVisible = true;

function applyWeatherVisibility() {
  mapView.querySelectorAll('.map-weather').forEach(el => {
    el.style.display = weatherVisible ? 'flex' : 'none';
  });
  if (weatherLegend) weatherLegend.classList.toggle('visible', weatherVisible && mapView.querySelectorAll('.map-weather').length > 0);
  if (weatherToggle) {
    weatherToggle.classList.toggle('active', weatherVisible);
    weatherToggle.setAttribute('aria-pressed', weatherVisible ? 'true' : 'false');
  }
}

function renderWeatherLayer(rows) {
  mapView.querySelectorAll('.map-weather').forEach(el => el.remove());
  if (!Array.isArray(rows)) return;

  rows.forEach(row => {
    const location = Array.isArray(row.locations) ? row.locations[0] : row.locations;
    const x = Number(location?.map_x);
    const y = Number(location?.map_y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const visual = weatherVisual(row.dominant_weather);
    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = `map-weather weather-${String(row.dominant_weather || 'unknown').replace(/[^a-z0-9_-]/gi,'')}`;
    badge.style.left = `${Math.max(0, Math.min(5000, x)) / 50}%`;
    badge.style.top = `${Math.max(0, Math.min(5000, y)) / 50}%`;
    badge.style.setProperty('--weather-color', visual.color);
    badge.setAttribute('aria-label', `${row.dominant_weather_name || 'Wetter'}, ${weatherTemperature(row.temperature)}`);
    badge.title = `${row.dominant_weather_name || 'Wetter'} · ${weatherTemperature(row.temperature)}`;
    badge.innerHTML = `<span class="weather-icon">${visual.icon}</span><span class="weather-temp">${weatherTemperature(row.temperature)}</span>`;
    badge.addEventListener('click', event => event.stopPropagation());
    mapView.appendChild(badge);
  });

  applyWeatherVisibility();
}

async function loadWeatherForMap() {
  if (!hasSupabaseConfig()) return;
  try {
    let rows;
    try {
      rows = await supabaseGet(`location_weather?select=location_id,temperature,wind_speed,precipitation,dominant_weather,dominant_weather_name,dominant_weather_score,weather_transition,locations(name,map_x,map_y,location_type)&is_active=eq.true&source=eq.interpolated`);
    } catch (embeddedError) {
      const weatherRows = await supabaseGet(`location_weather?select=location_id,temperature,wind_speed,precipitation,dominant_weather,dominant_weather_name,dominant_weather_score,weather_transition&is_active=eq.true&source=eq.interpolated`);
      const ids = [...new Set(weatherRows.map(row => row.location_id).filter(Boolean))];
      if (!ids.length) throw embeddedError;
      const locations = await supabaseGet(`locations?select=id,name,map_x,map_y,location_type&id=in.(${ids.map(id => encodeURIComponent(id)).join(',')})&is_active=eq.true`);
      const byId = Object.fromEntries(locations.map(location => [location.id, location]));
      rows = weatherRows.map(row => ({...row, locations: byId[row.location_id] || null}));
    }
    renderWeatherLayer(rows);
    if (rows.length) setMapStatus(`Welt aktiv · Wetter aktuell · ${rows.length} Orte`, true);
  } catch (error) {
    console.warn('Wetterebene konnte nicht geladen werden:', error);
    renderWeatherLayer([]);
  }
}

function renderMapMarkers(markers) {
  mapView.querySelectorAll('.map-marker').forEach(marker => marker.remove());
  markers.forEach(marker => {
    const x = Number(marker.x), y = Number(marker.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const button = document.createElement('button');
    button.type = 'button';
    const markerClass = String(marker.marker_type || 'location').replace(/[^a-z0-9_-]/gi,'');
    const locationType = Array.isArray(marker.locations) ? marker.locations[0]?.location_type : marker.locations?.location_type;
    const typeClass = String(locationType || '').replace(/[^a-z0-9_-]/gi,'');
    const style = resolveMarkerStyle(marker);
    button.className = `map-marker marker-${markerClass}${typeClass ? ` marker-${typeClass}` : ''}`;
    applyMarkerStyle(button, style);
    button.style.left = `${Math.max(0,Math.min(5000,x))/50}%`;
    button.style.top = `${Math.max(0,Math.min(5000,y))/50}%`;
    button.dataset.place = marker.name || 'Ort';
    button.innerHTML = `<span class="marker-dot" aria-hidden="true">${escapeHtml(style?.icon || '')}</span><span class="marker-label">${escapeHtml(marker.name || 'Ort')}</span>`;
    button.addEventListener('click', event => { event.stopPropagation(); openMapMarker(marker); });
    mapView.appendChild(button);
  });
}

async function loadMapFromSupabase() {
  setMapImage(VALDARA_MAP_PUBLIC_URL);
  if (!hasSupabaseConfig()) { setMapStatus('Welt aktiv · neue Masterkarte',true); return; }
  try {
    const maps = await supabaseGet(`maps?select=id,name,image_url,coordinate_min_x,coordinate_max_x,coordinate_min_y,coordinate_max_y,is_active&id=eq.${VALDARA_MAP_ID}&is_active=eq.true&limit=1`);
    const map = maps[0];
    if (!map) throw new Error('Valdara-Karte wurde in Supabase nicht gefunden.');
    setMapImage(map.image_url || VALDARA_MAP_PUBLIC_URL);
    // Marker-Styles sind eine optionale Darstellungsebene.
    // Falls die neue Tabelle/Policy noch nicht verfügbar ist, dürfen
    // die bestehenden Kartenmarker NICHT ausfallen.
    try {
      const styles = await supabaseGet(`marker_styles?select=marker_type,display_name,render_mode,color,size,icon,opacity,border_color&is_active=eq.true&order=marker_type.asc`);
      markerStyles = Object.fromEntries(styles.map(style => [style.marker_type, style]));
    } catch (styleError) {
      console.warn('Marker-Styles nicht verfügbar – verwende Fallback-Darstellung:', styleError);
      markerStyles = {};
    }

    const markers = await supabaseGet(`map_markers?select=id,name,description,marker_type,x,y,is_visible,is_active,location_id,realm_id,locations(location_type)&map_id=eq.${VALDARA_MAP_ID}&is_visible=eq.true&is_active=eq.true&order=name.asc`);
    renderMapMarkers(markers);
    setMapStatus(map.image_url ? 'Welt aktiv · Supabase' : 'Welt aktiv · neue Masterkarte',true);
    await loadWeatherForMap();
  } catch(error) {
    console.error('Valdara-Karte konnte nicht aus Supabase geladen werden:',error);
    setMapStatus('Welt aktiv · neue Masterkarte',true);
  }
}

function renderPeoples(peoples) {
  grid.innerHTML = peoples.map((p,index)=>`
    <button class="people-card" type="button" data-people-index="${index}">
      <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">
      <div class="people-info"><span class="realm">REICH · ${escapeHtml(p.realm || 'UNBEKANNT').toUpperCase()}</span><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.desc || '')}</p><span class="people-more">Volk entdecken →</span></div>
    </button>`).join('');
  grid.querySelectorAll('.people-card').forEach(card=>card.addEventListener('click',()=>openPeople(peoples[Number(card.dataset.peopleIndex)])));
}
function openPeople(person) {
  if (!peopleModal || !peopleModalContent) return;
  const sections = detailSections.filter(([key])=>person[key] && String(person[key]).trim()).map(([key,label],i)=>`<details class="lore-accordion" ${i===0?'open':''}><summary><span>${escapeHtml(label)}</span><span class="accordion-icon">+</span></summary><div class="lore-content">${formatText(person[key])}</div></details>`).join('');
  const video = person.youtube_video_id && String(person.youtube_video_id).trim() ? `<div class="people-video"><div class="people-video-label">VORSTELLUNGSVIDEO</div><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(person.youtube_video_id.trim())}" title="${escapeHtml(person.name)} – Vorstellung" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div></div>` : '';
  peopleModalContent.innerHTML = `<div class="people-detail-head"><img src="${escapeHtml(person.image)}" alt="${escapeHtml(person.name)}"><div><span class="eyebrow">DAS VOLK VON ${escapeHtml(person.realm || '').toUpperCase()}</span><h2 id="peopleModalTitle">${escapeHtml(person.name)}</h2><p>${escapeHtml(person.desc || '')}</p></div></div>${video}<div class="lore-accordions">${sections || '<p class="empty-lore">Für dieses Volk sind noch keine weiteren Abschnitte hinterlegt.</p>'}</div>`;
  peopleModal.classList.add('open'); document.body.classList.add('modal-open'); peopleModal.setAttribute('aria-hidden','false');
}
function closePeople(){ if(!peopleModal)return; peopleModal.classList.remove('open'); document.body.classList.remove('modal-open'); peopleModal.setAttribute('aria-hidden','true'); }
function closeMapDetail(){ if(!mapDetailModal)return; mapDetailModal.classList.remove('open'); document.body.classList.remove('modal-open'); mapDetailModal.setAttribute('aria-hidden','true'); }

const mapSectorNames = ['Nordwesten','Nord-Nordwest','Norden','Nord-Nordost','Nordosten','West-Nord','Nordmitte','Nordost-Mitte','Ost-Nord','Ost-Nordost','Westen','Westmitte','Zentrum','Ostmitte','Osten','West-Süd','Südwest-Mitte','Südmitte','Südost-Mitte','Ost-Süd','Südwesten','Süd-Südwest','Süden','Süd-Südost','Südosten'];
function openMapZoom(sector) {
  if (!mapZoomModal || !mapZoomCanvas || !mapView) return;
  const index = Math.max(0, Math.min(24, Number(sector) || 0));
  const col = index % 5;
  const row = Math.floor(index / 5);
  if (!mapViewPlaceholder) {
    mapViewPlaceholder = document.createComment('Valdara map view placeholder');
    mapView.parentNode.insertBefore(mapViewPlaceholder, mapView);
  }
  mapZoomCanvas.style.setProperty('--sector-x', `${-col * 20}%`);
  mapZoomCanvas.style.setProperty('--sector-y', `${-row * 20}%`);
  mapZoomTitle.textContent = `VALDARA · ${mapSectorNames[index].toUpperCase()}`;
  mapView.classList.add('map-zoomed-view');
  mapZoomCanvas.appendChild(mapView);
  mapZoomModal.classList.add('open');
  mapZoomModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  mapZoomClose?.focus();
}
function closeMapZoom() {
  if (!mapZoomModal || !mapViewPlaceholder || !mapView) return;
  mapView.classList.remove('map-zoomed-view');
  mapViewPlaceholder.parentNode?.insertBefore(mapView, mapViewPlaceholder.nextSibling);
  mapZoomModal.classList.remove('open');
  mapZoomModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

async function loadPeoplesFromSupabase() {
  if (!hasSupabaseConfig()) { renderPeoples(fallbackPeoples); return; }
  try {
    const fields='name,image_url,description,overview,appearance,culture,strengths,weaknesses,relationships,special_property,youtube_video_id';
    const rows=await supabaseGet(`peoples?select=${fields}&order=name.asc`);
    const fallbackByName=Object.fromEntries(fallbackPeoples.map(p=>[p.name,p]));
    const peoples=rows.map(row=>({...fallbackByName[row.name],...row,name:row.name,realm:fallbackByName[row.name]?.realm,desc:row.description||fallbackByName[row.name]?.desc||'',image:row.image_url||fallbackByName[row.name]?.image})).filter(p=>p.realm&&p.image);
    renderPeoples(peoples.length?peoples:fallbackPeoples);
  } catch(error){ console.error('Völker konnten nicht aus Supabase geladen werden:',error); renderPeoples(fallbackPeoples); }
}

loadMapFromSupabase();
loadPeoplesFromSupabase();

weatherToggle?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  weatherVisible = !weatherVisible;
  applyWeatherVisibility();
});

const mapGridToggle = document.querySelector('#mapGridToggle');
mapGridToggle?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  const enabled = !mapView?.classList.contains('grid-enabled');
  mapView?.classList.toggle('grid-enabled', enabled);
  mapGridToggle.classList.toggle('active', enabled);
  mapGridToggle.setAttribute('aria-pressed', String(enabled));
  mapGridToggle.textContent = enabled ? '⌕ Lupe deaktivieren' : '⌕ Lupe aktivieren';
});

const menu=document.querySelector('#menuBtn'); const nav=document.querySelector('#mainNav');
menu?.addEventListener('click',()=>nav?.classList.toggle('open'));
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
document.querySelectorAll('.choice-grid button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.choice-grid button').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');}));
document.querySelector('#peopleModalClose')?.addEventListener('click',closePeople);
document.querySelector('#mapDetailClose')?.addEventListener('click',closeMapDetail);
document.querySelectorAll('#mapSectorGrid [data-sector]').forEach(button => button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); openMapZoom(button.dataset.sector); }));
mapZoomClose?.addEventListener('click', closeMapZoom);
mapZoomBack?.addEventListener('click', closeMapZoom);
mapZoomModal?.addEventListener('click', event => { if (event.target === mapZoomModal) closeMapZoom(); });
peopleModal?.addEventListener('click',e=>{if(e.target===peopleModal)closePeople();});
mapDetailModal?.addEventListener('click',e=>{if(e.target===mapDetailModal)closeMapDetail();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePeople();closeMapDetail();closeMapZoom();}});


/* Dynamische Gesamtübersicht der Valdara-Abstimmungen */
(() => {
  const list = document.querySelector('#pollOverviewList');
  const statusNode = document.querySelector('#pollOverviewStatus');
  const refreshButton = document.querySelector('#pollOverviewRefresh');
  if (!list || !statusNode || !window.VALDARA_SUPABASE_URL || !window.VALDARA_SUPABASE_ANON_KEY) return;

  const api = `${window.VALDARA_SUPABASE_URL}/rest/v1`;
  const headers = {
    apikey: window.VALDARA_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${window.VALDARA_SUPABASE_ANON_KEY}`
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
  const dateValue = value => value ? new Date(value).getTime() : 0;
  const fmtDate = value => value ? new Intl.DateTimeFormat('de-DE', {
    dateStyle:'medium', timeStyle:'short'
  }).format(new Date(value)) : '';
  async function get(path) {
    const response = await fetch(`${api}/${path}`, {headers});
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${response.status}: ${body}`);
    }
    return response.json();
  }
  function statusLabel(status) {
    return ({active:'Aktiv', closed:'Abgeschlossen', resolved:'Entschieden', cancelled:'Abgebrochen', draft:'Vorbereitung'})[status] || status || 'Unbekannt';
  }
  function renderCard(decision, options, totals, result, rolls) {
    const rows = options.map(option => {
      const votes = Number((totals.find(t => t.option_id === option.id) || {}).total_votes || 0);
      return {...option, votes};
    });
    const total = rows.reduce((sum, row) => sum + row.votes, 0);
    const max = Math.max(0, ...rows.map(row => row.votes));
    const winner = result?.winning_option_id
      ? rows.find(row => row.id === result.winning_option_id)
      : rows.find(row => row.id === decision.result_option_id);
    const wasDice = result?.resolution_method === 'w20';
    const sortedRolls = (rolls || []).slice().sort((a,b) =>
      Number(a.attempt_number)-Number(b.attempt_number) ||
      Number(a.round_number)-Number(b.round_number) ||
      new Date(a.created_at)-new Date(b.created_at));
    const optionName = id => rows.find(row => row.id === id)?.title || 'Unbekannte Option';
    const optionsHtml = rows.map(row => `
      <div class="poll-option">
        <div class="poll-option-line"><span>${esc(row.title)}</span><strong>${row.votes} ${row.votes === 1 ? 'Stimme' : 'Stimmen'}</strong></div>
        <div class="poll-progress" aria-label="${esc(row.title)}: ${row.votes} Stimmen von ${total}">
          <span style="width:${total ? (row.votes/total*100) : 0}%"></span>
        </div>
      </div>`).join('');
    let diceHtml = '';
    if (wasDice) {
      const attempts = [...new Set(sortedRolls.map(r => r.attempt_number))];
      const detail = sortedRolls.length ? sortedRolls.map(r =>
        `Versuch ${r.attempt_number}, Runde ${r.round_number}: ${esc(optionName(r.option_id))} würfelt ${r.roll_value}`
      ).join('<br>') : 'Der W20-Entscheid wurde gespeichert. Einzelne Würfe sind hier nicht verfügbar.';
      diceHtml = `<details class="poll-dice-details"><summary>⚄ Gleichstand – Entscheidung per W20</summary><p>Es wurde gewürfelt${attempts.length ? ` (Versuch ${attempts.join(', ')})` : ''}. Der höchste eindeutige Wurf entscheidet.</p><div>${detail}</div></details>`;
    }
    const dateText = decision.ends_at ? `Ende: ${fmtDate(decision.ends_at)}` : (decision.created_at ? `Erstellt: ${fmtDate(decision.created_at)}` : '');
    return `<article class="poll-overview-card">
      <div class="poll-overview-head">
        <div><div class="poll-overview-meta">${esc(dateText)}</div><h3>${esc(decision.title)}</h3></div>
        <span class="poll-status ${decision.status === 'active' ? 'active' : decision.status === 'resolved' ? 'resolved' : ''}">${esc(statusLabel(decision.status))}</span>
      </div>
      <div class="poll-options">${optionsHtml || '<p>Keine Antwortmöglichkeiten vorhanden.</p>'}</div>
      <div class="poll-overview-total"><span>Gesamtstimmen: <strong>${total}</strong></span><span>${rows.length} Antwortmöglichkeiten</span></div>
      ${winner && (decision.status === 'resolved' || result) ? `<div class="poll-winner">✦ Gewinner: <strong>${esc(winner.title)}</strong>${wasDice ? ' · durch W20 entschieden' : ' · nach Gesamtstimmen'}</div>` : ''}
      ${diceHtml}
    </article>`;
  }

  async function load() {
    refreshButton.disabled = true;
    statusNode.textContent = 'Abstimmungen werden aktualisiert …';
    try {
      const [decisions, options, totals] = await Promise.all([
        get('decisions?select=id,title,status,starts_at,ends_at,created_at,result_option_id&status=not.eq.draft'),
        get('decision_options?select=id,decision_id,title,description,sort_order,is_active&is_active=eq.true&order=sort_order.asc'),
        get('valdara_unified_vote_totals?select=decision_id,option_id,answer,total_votes')
      ]);
      let results = [], rolls = [];
      try { results = await get('decision_tiebreaker_results?select=decision_id,winning_option_id,vote_count,resolution_method,attempt_number,resolved_at'); } catch (_) {}
      try { rolls = await get('decision_tiebreaker_rolls?select=decision_id,option_id,attempt_number,round_number,roll_value,created_at'); } catch (_) {}
      const ordered = decisions.slice().sort((a,b) =>
        dateValue(b.created_at || b.starts_at || b.ends_at) - dateValue(a.created_at || a.starts_at || a.ends_at));
      const visible = ordered.filter(d => d.status !== 'draft' && d.status !== 'cancelled');
      list.innerHTML = visible.length ? visible.map(d => renderCard(
        d,
        options.filter(o => o.decision_id === d.id).sort((a,b) => Number(a.sort_order||0)-Number(b.sort_order||0)),
        totals.filter(t => t.decision_id === d.id),
        results.find(r => r.decision_id === d.id),
        rolls.filter(r => r.decision_id === d.id)
      )).join('') : '<div class="poll-overview-empty">Aktuell gibt es keine öffentlichen Abstimmungen.</div>';
      statusNode.textContent = `${visible.length} Abstimmung${visible.length === 1 ? '' : 'en'} geladen · neueste zuerst`;
    } catch (error) {
      console.error('Valdara-Abstimmungsübersicht:', error);
      statusNode.textContent = 'Die Abstimmungen konnten nicht geladen werden.';
      list.innerHTML = '<div class="poll-overview-empty">Die Ergebnisse sind momentan nicht verfügbar. Bitte später erneut versuchen.</div>';
    } finally {
      refreshButton.disabled = false;
    }
  }
  refreshButton.addEventListener('click', load);
  load();
})();


// Geschichten-Seite: neueste YouTube-Folge oben, vollständiges Archiv darunter.
async function loadStoryYouTubeVideos() {
  const list = document.querySelector('#storyVideosList');
  const status = document.querySelector('#storyVideosStatus');
  const currentTitle = document.querySelector('#currentEpisodeTitle');
  const currentDescription = document.querySelector('#currentEpisodeDescription');
  const currentLink = document.querySelector('#currentEpisodeLink');
  if (!list || !status) return;

  const channelUrl = 'https://www.youtube.com/@ValdaraEureWahl';
  const read = (row, keys) => {
    for (const key of keys) {
      const value = row?.[key];
      if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
    }
    return '';
  };
  const getVideoId = row => read(row, ['youtube_video_id','video_id','external_video_id','youtube_id','videoId','external_id']);
  const getDate = row => read(row, ['published_at','publishedAt','published_date','release_date','created_at','createdAt']);
  const getTitle = row => read(row, ['title','video_title','name','headline']) || 'Valdara – Eure Wahl';
  const getDescription = row => read(row, ['description','summary','caption']);
  const getUrl = row => {
    const direct = read(row, ['video_url','youtube_url','url','watch_url','post_url']);
    if (direct && /^https?:\/\//i.test(direct)) return direct;
    const id = getVideoId(row);
    if (id && !/^[0-9]+$/.test(id) && !id.includes(' ')) return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    return channelUrl;
  };
  const getThumbnail = row => {
    const thumb = read(row, ['thumbnail_url','thumbnail','thumbnailUrl','image_url','preview_url']);
    if (thumb && /^https?:\/\//i.test(thumb)) return thumb;
    const id = getVideoId(row);
    if (id && !/^[0-9]+$/.test(id) && !id.includes(' ')) return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
    return '';
  };
  const formatDate = value => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('de-DE', {day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
  };
  try {
    if (!hasSupabaseConfig()) throw new Error('Supabase ist nicht konfiguriert.');
    // Select * vermeidet eine harte Bindung an einzelne Spaltennamen des vorhandenen Masters.
    const rows = await supabaseGet('youtube_videos?select=*&limit=200');
    const videos = (Array.isArray(rows) ? rows : []).filter(row => {
      const active = read(row, ['is_active','active','published','is_published']);
      const statusValue = read(row, ['status','visibility']).toLowerCase();
      return active.toLowerCase() !== 'false' && !['draft','deleted','private','unlisted'].includes(statusValue) && Boolean(getVideoId(row) || read(row, ['video_url','youtube_url','url','watch_url','post_url']));
    });
    videos.sort((a,b) => {
      const da = new Date(getDate(a) || 0).getTime() || 0;
      const db = new Date(getDate(b) || 0).getTime() || 0;
      return db - da;
    });
    if (!videos.length) {
      status.textContent = 'Noch keine YouTube-Videos in der Tabelle „youtube_videos“ gefunden.';
      list.innerHTML = '<p class="story-videos-empty">Sobald die Videos in Supabase hinterlegt sind, erscheinen sie hier automatisch.</p>';
      if (currentTitle) currentTitle.textContent = 'Noch keine Folge hinterlegt';
      if (currentDescription) currentDescription.textContent = 'Die aktuelle Folge wird automatisch angezeigt, sobald ein veröffentlichtes Video in Supabase vorhanden ist.';
      if (currentLink) currentLink.href = channelUrl;
      return;
    }
    const newest = videos[0];
    if (currentTitle) currentTitle.textContent = getTitle(newest);
    if (currentDescription) currentDescription.textContent = getDescription(newest) || (formatDate(getDate(newest)) ? `Veröffentlicht am ${formatDate(getDate(newest))}.` : 'Die neueste veröffentlichte Folge auf YouTube.');
    if (currentLink) currentLink.href = getUrl(newest);
    // Archiv in chronologischer Reihenfolge: Folge 1 bis zur neuesten Folge.
    const archive = [...videos].reverse();
    list.innerHTML = archive.map((video, index) => {
      const title = getTitle(video);
      const date = formatDate(getDate(video));
      const thumbnail = getThumbnail(video);
      const description = getDescription(video);
      return `<article class="story-video-card"><a class="story-video-thumb" href="${escapeHtml(getUrl(video))}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(title)} auf YouTube ansehen">${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="" loading="lazy">` : '<span class="story-video-play">▶</span>'}<span class="story-video-number">Folge ${index + 1}</span><span class="story-video-play">▶</span></a><div class="story-video-copy"><span class="eyebrow">${date ? escapeHtml(date) : 'VALDARA · EURE WAHL'}</span><h3>${escapeHtml(title)}</h3>${description ? `<p>${escapeHtml(description)}</p>` : ''}<a href="${escapeHtml(getUrl(video))}" target="_blank" rel="noopener noreferrer">Auf YouTube ansehen →</a></div></article>`;
    }).join('');
    status.textContent = `${videos.length} ${videos.length === 1 ? 'Folge' : 'Folgen'} gefunden · neueste Folge oben separat angezeigt`;
  } catch (error) {
    console.warn('YouTube-Folgen konnten nicht geladen werden:', error);
    status.textContent = 'Die YouTube-Folgen konnten nicht aus Supabase geladen werden.';
    list.innerHTML = `<p class="story-videos-empty">Bitte prüft, ob die Tabelle „youtube_videos“ öffentlich lesbar ist und die Videos dort eingetragen sind. <a href="${channelUrl}" target="_blank" rel="noopener noreferrer">Zum YouTube-Kanal →</a></p>`;
  }
}
loadStoryYouTubeVideos();
