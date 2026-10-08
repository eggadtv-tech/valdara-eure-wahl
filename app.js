const VALDARA_MAP_ID = '58dd9430-3789-4e41-88b0-366f2678fb00';
const VALDARA_MAP_PUBLIC_URL = 'https://vunvrgopzcbbxcxyjnxp.supabase.co/storage/v1/object/public/valdara-media/maps/continents/Valdara_Master_Map_Wegenetz_v3_hellbraun.png';

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
const mapStatus = document.querySelector('#mapStatus');
const peopleModal = document.querySelector('#peopleModal');
const peopleModalContent = document.querySelector('#peopleModalContent');
const mapDetailModal = document.querySelector('#mapDetailModal');
const mapDetailContent = document.querySelector('#mapDetailContent');

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

function renderMapMarkers(markers) {
  mapView.querySelectorAll('.map-marker').forEach(marker => marker.remove());
  markers.forEach(marker => {
    const x = Number(marker.x), y = Number(marker.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const button = document.createElement('button');
    button.type = 'button';
    const markerClass = String(marker.marker_type || 'location').replace(/[^a-z0-9_-]/gi,'');
    button.className = `map-marker marker-${markerClass}`;
    button.style.left = `${Math.max(0,Math.min(5000,x))/50}%`;
    button.style.top = `${Math.max(0,Math.min(5000,y))/50}%`;
    button.dataset.place = marker.name || 'Ort';
    button.innerHTML = `<span class="marker-dot" aria-hidden="true"></span><span class="marker-label">${escapeHtml(marker.name || 'Ort')}</span>`;
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
    const markers = await supabaseGet(`map_markers?select=id,name,description,marker_type,x,y,is_visible,is_active,location_id,realm_id&map_id=eq.${VALDARA_MAP_ID}&is_visible=eq.true&is_active=eq.true&order=name.asc`);
    renderMapMarkers(markers);
    setMapStatus(map.image_url ? 'Welt aktiv · Supabase' : 'Welt aktiv · neue Masterkarte',true);
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

const menu=document.querySelector('#menuBtn'); const nav=document.querySelector('#mainNav');
menu?.addEventListener('click',()=>nav?.classList.toggle('open'));
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
document.querySelectorAll('.choice-grid button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.choice-grid button').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');}));
document.querySelector('#peopleModalClose')?.addEventListener('click',closePeople);
document.querySelector('#mapDetailClose')?.addEventListener('click',closeMapDetail);
peopleModal?.addEventListener('click',e=>{if(e.target===peopleModal)closePeople();});
mapDetailModal?.addEventListener('click',e=>{if(e.target===mapDetailModal)closeMapDetail();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePeople();closeMapDetail();}});
