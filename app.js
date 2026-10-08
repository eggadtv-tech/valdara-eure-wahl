const VALDARA_MAP_ID = '58dd9430-3789-4e41-88b0-366f2678fb00';
const LOCAL_MAP_FALLBACK = 'assets/valdara-master-wegenetz.png';

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

function supabaseHeaders() {
  return {
    apikey: window.VALDARA_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${window.VALDARA_SUPABASE_ANON_KEY}`
  };
}

function hasSupabaseConfig() {
  return Boolean(window.VALDARA_SUPABASE_URL && window.VALDARA_SUPABASE_ANON_KEY);
}

async function supabaseGet(path) {
  const response = await fetch(`${window.VALDARA_SUPABASE_URL}/rest/v1/${path}`, {
    headers: supabaseHeaders()
  });
  if (!response.ok) throw new Error(`Supabase HTTP ${response.status}`);
  return response.json();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  }[char]));
}

function setMapImage(url) {
  const finalUrl = url || LOCAL_MAP_FALLBACK;
  mapImage.src = finalUrl;
  mapImage.onerror = () => {
    if (mapImage.src.endsWith(LOCAL_MAP_FALLBACK)) return;
    mapImage.src = LOCAL_MAP_FALLBACK;
  };
  document.documentElement.style.setProperty('--valdara-map-url', `url("${finalUrl.replace(/"/g, '\\"')}")`);
}

function setMapStatus(text, online = true) {
  if (!mapStatus) return;
  mapStatus.innerHTML = `<i></i> ${escapeHtml(text)}`;
  mapStatus.classList.toggle('offline', !online);
}

function renderMapMarkers(markers) {
  mapView.querySelectorAll('.map-marker').forEach(marker => marker.remove());

  markers.forEach(marker => {
    const x = Number(marker.x);
    const y = Number(marker.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `map-marker marker-${String(marker.marker_type || 'location').replace(/[^a-z0-9_-]/gi, '')}`;
    button.style.left = `${Math.max(0, Math.min(5000, x)) / 50}%`;
    button.style.top = `${Math.max(0, Math.min(5000, y)) / 50}%`;
    button.dataset.place = marker.name || 'Ort';
    button.innerHTML = `✦<span>${escapeHtml(marker.name || 'Ort')}</span>`;
    button.addEventListener('click', () => {
      alert(`${marker.name || 'Ort'}\n\nDieser Ort stammt aus dem Valdara-Kartenbestand.`);
    });
    mapView.appendChild(button);
  });
}

async function loadMapFromSupabase() {
  setMapImage(LOCAL_MAP_FALLBACK);

  if (!hasSupabaseConfig()) {
    setMapStatus('Lokale Kartenansicht', false);
    return;
  }

  try {
    const maps = await supabaseGet(
      `maps?select=id,name,image_url,coordinate_min_x,coordinate_max_x,coordinate_min_y,coordinate_max_y,is_active&id=eq.${VALDARA_MAP_ID}&is_active=eq.true&limit=1`
    );

    const map = maps[0];
    if (!map) throw new Error('Valdara-Karte wurde in Supabase nicht gefunden.');

    setMapImage(map.image_url || LOCAL_MAP_FALLBACK);

    const markers = await supabaseGet(
      `map_markers?select=id,name,description,marker_type,x,y,is_visible,is_active&map_id=eq.${VALDARA_MAP_ID}&is_visible=eq.true&is_active=eq.true&order=name.asc`
    );

    renderMapMarkers(markers);
    setMapStatus(map.image_url ? 'Welt aktiv · Supabase' : 'Welt aktiv · lokale Karte', Boolean(map.image_url));
  } catch (error) {
    console.error('Valdara-Karte konnte nicht aus Supabase geladen werden:', error);
    setMapStatus('Lokale Kartenansicht', false);
  }
}

function renderPeoples(peoples) {
  grid.innerHTML = peoples.map(p => `
    <a class="people-card" href="#">
      <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">
      <div class="people-info">
        <span class="realm">REICH · ${escapeHtml(p.realm).toUpperCase()}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.desc)}</p>
      </div>
    </a>
  `).join('');
}

async function loadPeoplesFromSupabase() {
  if (!hasSupabaseConfig()) {
    renderPeoples(fallbackPeoples);
    return;
  }

  try {
    const rows = await supabaseGet('peoples?select=name,image_url&order=name.asc');
    const fallbackByName = Object.fromEntries(fallbackPeoples.map(p => [p.name, p]));
    const peoples = rows.map(row => ({
      ...fallbackByName[row.name],
      name: row.name,
      image: row.image_url || fallbackByName[row.name]?.image
    })).filter(p => p.realm && p.image);
    renderPeoples(peoples.length ? peoples : fallbackPeoples);
  } catch (error) {
    console.error('Völker konnten nicht aus Supabase geladen werden:', error);
    renderPeoples(fallbackPeoples);
  }
}

loadMapFromSupabase();
loadPeoplesFromSupabase();

const menu = document.querySelector('#menuBtn');
const nav = document.querySelector('#mainNav');
menu.addEventListener('click',()=>nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
document.querySelectorAll('.choice-grid button').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.choice-grid button').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
}));
