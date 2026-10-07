const fallbackPeoples = [
  {name:'Meren',realm:'Valmeris',image:'assets/valdara-meren.jpg',desc:'Handel, Landwirtschaft und Diplomatie'},
  {name:'Elarin',realm:'Aelvaris',image:'assets/valdara-elarin.jpg',desc:'Natur, Wissen und Heilkunst'},
  {name:'Durn',realm:'Durnakhar',image:'assets/valdara-durn.jpg',desc:'Bergbau, Metallverarbeitung und Handwerk'},
  {name:'Urakai',realm:'Gorvath',image:'assets/valdara-urakai.jpg',desc:'Gemeinschaft, Baukunst und Naturverbundenheit'},
  {name:'Dravari',realm:'Zarveth',image:'assets/valdara-dravari.jpg',desc:'Handel, Forschung und Anpassungsfähigkeit'},
  {name:'Kharai',realm:'Kharuun',image:'assets/valdara-kharai.jpg',desc:'Jagd, Freiheit und Gemeinschaft'}
];

const grid = document.querySelector('#peopleGrid');

function renderPeoples(peoples) {
  grid.innerHTML = peoples.map(p => `
    <a class="people-card" href="#">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <div class="people-info">
        <span class="realm">REICH · ${p.realm.toUpperCase()}</span>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
      </div>
    </a>
  `).join('');
}

async function loadPeoplesFromSupabase() {
  if (!window.VALDARA_SUPABASE_URL || !window.VALDARA_SUPABASE_ANON_KEY) {
    console.warn('Supabase-Konfiguration fehlt. Die lokale Fallback-Darstellung wird verwendet.');
    renderPeoples(fallbackPeoples);
    return;
  }

  try {
    const url = `${window.VALDARA_SUPABASE_URL}/rest/v1/peoples?select=name,image_url&order=name.asc`;
    const response = await fetch(url, {
      headers: {
        apikey: window.VALDARA_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${window.VALDARA_SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase HTTP ${response.status}`);
    }

    const rows = await response.json();
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

loadPeoplesFromSupabase();

const menu = document.querySelector('#menuBtn');
const nav = document.querySelector('#mainNav');
menu.addEventListener('click',()=>nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
document.querySelectorAll('.choice-grid button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.choice-grid button').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected')}));
document.querySelectorAll('.map-marker').forEach(m=>m.addEventListener('click',()=>{alert(`${m.dataset.place}\n\nDieser Marker ist im Frontend bereits vorbereitet. Die Daten kommen später direkt aus Supabase.`)}));
