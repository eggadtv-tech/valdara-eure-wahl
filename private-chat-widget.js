/* VALDARA v46 – globaler privater Chat. Speichert nur minimierten Zustand und ausgewählte Kontakt-ID lokal. */
(() => {
  if (document.getElementById('valdara-private-chat')) return;
  const cfg = () => window.supabase && window.VALDARA_SUPABASE_URL && window.VALDARA_SUPABASE_ANON_KEY;
  if (!cfg()) return;
  let client;
  try { client = window.supabase.createClient(window.VALDARA_SUPABASE_URL, window.VALDARA_SUPABASE_ANON_KEY, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}); } catch (_) { return; }
  const root = document.createElement('aside'); root.id = 'valdara-private-chat'; root.className = 'vpc-root';
  root.innerHTML = `
    <section class="vpc-panel" id="vpcPanel" hidden aria-label="Private Nachrichten">
      <header class="vpc-header"><div><strong id="vpcTitle">Valdara-Nachrichten</strong><small id="vpcSubtitle">Wähle einen Freund aus</small></div><div class="vpc-controls"><button type="button" id="vpcMinimize" aria-label="Chat minimieren" title="Minimieren">−</button><button type="button" id="vpcClose" aria-label="Chat schließen" title="Schließen">×</button></div></header>
      <div class="vpc-body"><aside class="vpc-friends"><label for="vpcSearch">Freunde</label><input id="vpcSearch" type="search" placeholder="Neue Freunde suchen …" minlength="2"><div id="vpcFriendList"><p class="vpc-muted">Freundesliste wird geladen …</p></div><div id="vpcSearchResults" class="vpc-search-results"></div><a href="mein-bereich.html?view=friends">Freunde verwalten ↗</a></aside>
      <section class="vpc-conversation"><div id="vpcMessages" class="vpc-messages"><p class="vpc-muted">Wähle links einen Freund aus.</p></div><form id="vpcSendForm"><textarea id="vpcText" rows="2" maxlength="4000" placeholder="Nachricht schreiben …" required></textarea><button type="submit" aria-label="Nachricht senden">➤</button></form><p id="vpcStatus" class="vpc-status" role="status"></p></section></div>
    </section>
    <button type="button" class="vpc-launcher" id="vpcLauncher" aria-expanded="false"><span>✉</span><b>Nachrichten</b><i id="vpcUnread" hidden></i></button>`;
  document.body.appendChild(root);
  // Gemeinsames Dropdown unter „Mein Bereich“ auf allen Seiten.
  const accountLink=document.getElementById('accountLink');
  if(accountLink && !document.getElementById('valdara-account-menu')){
    const wrap=document.createElement('div'); wrap.id='valdara-account-menu'; wrap.className='vam-wrap';
    accountLink.parentNode.insertBefore(wrap,accountLink); wrap.appendChild(accountLink);
    const menuButton=document.createElement('button'); menuButton.type='button'; menuButton.className='vam-toggle'; menuButton.setAttribute('aria-label','Mein Bereich öffnen'); menuButton.setAttribute('aria-expanded','false'); menuButton.textContent='⌄'; wrap.appendChild(menuButton);
    const menu=document.createElement('div'); menu.className='vam-menu'; menu.hidden=true; menu.innerHTML='<a href="mein-bereich.html">Profil & Charakter</a><a href="mein-bereich.html?view=friends">Freunde</a><button type="button" data-open-vpc>Nachrichten öffnen</button><a href="mein-bereich.html?view=inventory">Inventar</a><a href="community.html">Forum</a>'; wrap.appendChild(menu);
    menuButton.addEventListener('click',()=>{menu.hidden=!menu.hidden;menuButton.setAttribute('aria-expanded',String(!menu.hidden));});
    menu.querySelector('[data-open-vpc]').addEventListener('click',()=>{menu.hidden=true;const launch=document.getElementById('vpcLauncher');if(launch)launch.click();});
    document.addEventListener('click',ev=>{if(!wrap.contains(ev.target)){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');}});
  }
  const $ = id => root.querySelector('#'+id);
  const panel=$('vpcPanel'), launcher=$('vpcLauncher');
  const stateKey='valdara.privateChat.v2'; let currentUser=null, selected=null, friends=[], nameById=new Map(), pollTimer=null;
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const saved = (()=>{try{return JSON.parse(localStorage.getItem(stateKey)||'{}')}catch(_){return {}}})();
  selected = saved.selected || null;
  let minimized = saved.minimized !== false;
  const persist=()=>{try{localStorage.setItem(stateKey,JSON.stringify({selected,minimized}))}catch(_){}};
  const status=(text)=>{$('vpcStatus').textContent=text||''};
  function setOpen(open){panel.hidden=!open;launcher.hidden=open;launcher.setAttribute('aria-expanded',String(open));minimized=!open;persist();if(open&&selected)loadConversation();}
  $('vpcMinimize').addEventListener('click',()=>setOpen(false));
  $('vpcClose').addEventListener('click',()=>{selected=null;persist();$('vpcMessages').innerHTML='<p class="vpc-muted">Wähle links einen Freund aus.</p>';setOpen(false)});
  launcher.addEventListener('click',()=>setOpen(true));
  function renderFriends(){
    const box=$('vpcFriendList');
    if(!friends.length){box.innerHTML='<p class="vpc-muted">Noch keine bestätigten Freunde gefunden.</p>';return;}
    box.innerHTML=friends.map(f=>`<button type="button" class="vpc-friend ${selected===f.id?'active':''}" data-contact="${esc(f.id)}"><span class="vpc-avatar">${esc((f.display_name||'R').slice(0,1).toUpperCase())}</span><span>${esc(f.display_name||'Reisende:r')}</span></button>`).join('');
    box.querySelectorAll('[data-contact]').forEach(btn=>btn.addEventListener('click',()=>{selected=btn.dataset.contact;persist();renderFriends();$('vpcTitle').textContent=nameById.get(selected)||'Nachrichten';$('vpcSubtitle').textContent='Privater Chat';$('vpcMessages').innerHTML='<p class="vpc-muted">Nachrichten werden geladen …</p>';setOpen(true);loadConversation();}));
  }
  async function loadFriends(){
    const {data:{session}}=await client.auth.getSession(); currentUser=session?.user||null;
    if(!currentUser){root.hidden=true;return;} root.hidden=false;
    const {data,error}=await client.rpc('list_my_friends');
    if(error){$('vpcFriendList').innerHTML='<p class="vpc-muted">Freundesliste wird nach der Datenbank-Freigabe verfügbar.</p>';return;}
    friends=(data||[]).map(x=>({id:x.id,display_name:x.display_name})); nameById=new Map(friends.map(x=>[x.id,x.display_name]));renderFriends();
    if(selected&&!nameById.has(selected)) selected=null;
    if(!minimized) setOpen(true); else {panel.hidden=true;launcher.hidden=false;}
  }
  async function loadConversation(){
    if(!currentUser||!selected)return;
    const {data,error}=await client.from('private_messages').select('id,sender_id,recipient_id,content,created_at').or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${selected}),and(sender_id.eq.${selected},recipient_id.eq.${currentUser.id})`).order('created_at',{ascending:true}).limit(100);
    const box=$('vpcMessages');
    if(error){box.innerHTML='<p class="vpc-muted">Nachrichten konnten nicht geladen werden. Prüfe die Freundschafts- und Altersregeln.</p>';return;}
    box.innerHTML=data?.length?data.map(m=>`<div class="vpc-bubble ${m.sender_id===currentUser.id?'mine':'theirs'}"><span>${esc(m.content)}</span><small>${esc(new Date(m.created_at).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}))}</small></div>`).join(''):'<p class="vpc-muted">Noch keine Nachrichten. Schreib den ersten Gruß!</p>';
    box.scrollTop=box.scrollHeight;
  }
  $('vpcSendForm').addEventListener('submit',async ev=>{ev.preventDefault();const content=$('vpcText').value.trim();if(!currentUser||!selected||!content){status('Wähle zuerst einen Freund aus.');return;}const btn=ev.currentTarget.querySelector('button');btn.disabled=true;status('Nachricht wird gesendet …');try{const {error}=await client.from('private_messages').insert({sender_id:currentUser.id,recipient_id:selected,content});if(error)throw error;$('vpcText').value='';status('');await loadConversation();}catch(e){status(e?.message||'Nachricht konnte nicht gesendet werden.');}finally{btn.disabled=false;}});
  let searchDelay; $('vpcSearch').addEventListener('input',()=>{clearTimeout(searchDelay);const term=$('vpcSearch').value.trim();const box=$('vpcSearchResults');if(term.length<2){box.innerHTML='';return;}box.innerHTML='<p class="vpc-muted">Suche …</p>';searchDelay=setTimeout(async()=>{const {data,error}=await client.rpc('search_friend_candidates',{search_text:term});if(error){box.innerHTML='<p class="vpc-muted">Suche derzeit nicht verfügbar.</p>';return;}const results=(data||[]).filter(x=>!friends.some(f=>f.id===x.id));box.innerHTML=results.length?results.map(x=>`<div class="vpc-search-result"><span>${esc(x.display_name)}</span><button type="button" data-search-contact="${esc(x.id)}" data-search-name="${esc(x.display_name)}">Anfrage ↗</button></div>`).join(''):'<p class="vpc-muted">Keine neuen passenden Mitglieder.</p>';box.querySelectorAll('[data-search-contact]').forEach(btn=>btn.addEventListener('click',async()=>{btn.disabled=true;btn.textContent='Sende …';try{const target=btn.dataset.searchContact;if(!currentUser)throw new Error('Bitte melde dich an.');const {error}=await client.from('friendships').insert({requester_id:currentUser.id,addressee_id:target,status:'pending'});if(error){if(String(error.code)==='23505')throw new Error('Eine Anfrage besteht bereits.');throw error;}btn.textContent='Anfrage gesendet';btn.disabled=true;}catch(err){btn.disabled=false;btn.textContent='Erneut versuchen';status(err?.message||'Anfrage konnte nicht gesendet werden.');}}));},250);});
  client.auth.onAuthStateChange(()=>{loadFriends();});
  loadFriends();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&selected&&!panel.hidden)loadConversation()});
  pollTimer=setInterval(()=>{if(selected&&!panel.hidden)loadConversation()},12000);
  if(!minimized){panel.hidden=false;launcher.hidden=true;launcher.setAttribute('aria-expanded','true');}
})();
