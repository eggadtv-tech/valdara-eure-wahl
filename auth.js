/* VALDARA account layer: Supabase Auth + existing profile schema. */
(() => {
  const cfg = () => window.supabase && window.VALDARA_SUPABASE_URL && window.VALDARA_SUPABASE_ANON_KEY;
  let client = null;
  try { if (cfg()) client = window.supabase.createClient(window.VALDARA_SUPABASE_URL, window.VALDARA_SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); } catch (e) { console.error(e); }
  const $ = (s) => document.querySelector(s);
  const message = (el, text, type='') => { if (!el) return; el.textContent=text; el.className='account-message'+(type?' '+type:''); };
  const friendly = (e) => ({'Invalid login credentials':'E-Mail-Adresse oder Passwort ist nicht korrekt.','User already registered':'Für diese E-Mail-Adresse existiert bereits ein Konto.','Password should be at least 6 characters':'Das Passwort ist zu kurz.'}[e?.message] || e?.message || 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.');
  async function updateAccountLink(session) { const link=$('#accountLink'); if(link){link.href=session?'mein-bereich.html':'login.html';link.textContent=session?'Mein Bereich':'Anmelden';} document.querySelectorAll('.login-btn').forEach(el=>{if(el.id==='accountLink')return;el.textContent=session?'Mein Bereich':'Anmelden';el.onclick=null;el.addEventListener('click',()=>location.href=session?'mein-bereich.html':'login.html');}); }
  async function ensureProfile(user, fallbackName) {
    const {data, error}=await client.from('profiles').select('id,display_name,role,people_id,people_changed_at,is_active').eq('id',user.id).maybeSingle();
    if(error) throw error;
    if(data) return data;
    // Backup if the database trigger has not been installed yet. Uses the user's own session and existing RLS.
    const display=(fallbackName || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Reisende:r').trim().slice(0,40);
    const {data:created,error:insertError}=await client.from('profiles').insert({id:user.id,display_name:display}).select('id,display_name,role,people_id,people_changed_at,is_active').single();
    if(insertError) throw insertError;
    return created;
  }
  async function initAuthPage() {
    const form=$('#authForm'); if(!form) return;
    if(!client){message($('#authMessage'),'Supabase ist nicht konfiguriert. Bitte Konfiguration prüfen.','error');return;}
    let mode='login';
    const display=$('#authDisplayName'), displayLabel=$('#displayNameLabel'), pass=$('#authPassword'), submit=$('#authSubmit'), forgot=$('#forgotPassword');
    document.querySelectorAll('[data-auth-mode]').forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.authMode;document.querySelectorAll('[data-auth-mode]').forEach(b=>b.classList.toggle('active',b===btn));const signup=mode==='signup';display.hidden=!signup;displayLabel.hidden=!signup;display.required=signup;pass.autocomplete=signup?'new-password':'current-password';submit.innerHTML=signup?'Konto erstellen <span>→</span>':'Anmelden <span>→</span>';forgot.hidden=signup;message($('#authMessage'),'');}));
    form.addEventListener('submit',async ev=>{ev.preventDefault();message($('#authMessage'),'Bitte einen Moment …');submit.disabled=true;
      try {const email=$('#authEmail').value.trim(),password=pass.value;
        if(mode==='signup'){
          const displayName=display.value.trim(); if(!displayName) throw new Error('Bitte gib einen Anzeigenamen ein.');
          const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:displayName},emailRedirectTo:location.origin+location.pathname.replace(/login\.html$/,'mein-bereich.html')}}); if(error)throw error;
          if(data.session){try{await ensureProfile(data.user,displayName);}catch(e){console.warn('Profil wird beim ersten Login vervollständigt:',e);} location.href='mein-bereich.html';return;}
          message($('#authMessage'),'Konto angelegt. Bitte bestätige deine E-Mail-Adresse über den Link in deinem Postfach. Danach kannst du dich anmelden.','success');
        } else {const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;try{await ensureProfile(data.user);}catch(e){console.error(e);message($('#authMessage'),'Du bist angemeldet, aber dein Profil konnte noch nicht geladen werden. Bitte prüfe die Profil-RLS-Regeln.','error');return;}location.href='mein-bereich.html';return;}
      } catch(e){message($('#authMessage'),friendly(e),'error');} finally{submit.disabled=false;}
    });
    forgot.addEventListener('click',async()=>{const email=$('#authEmail').value.trim();if(!email){message($('#authMessage'),'Trage zuerst deine E-Mail-Adresse ein.');return;}message($('#authMessage'),'Passwort-Link wird angefordert …');const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});message($('#authMessage'),error?friendly(error):'Falls ein Konto zu dieser Adresse existiert, erhältst du eine E-Mail zum Zurücksetzen des Passworts.',error?'error':'success');});
    const {data:{session}}=await client.auth.getSession();await updateAccountLink(session);if(session && location.pathname.endsWith('login.html')) location.href='mein-bereich.html';
  }
  async function initMemberPage(){if(!$('#memberContent'))return;if(!client){message($('#memberError'),'Supabase ist nicht konfiguriert.','error');return;}
    const loading=$('#memberLoading');
    try {const {data:{session},error:sessionError}=await client.auth.getSession();if(sessionError)throw sessionError;if(!session){location.href='login.html?return=mein-bereich.html';return;}await updateAccountLink(session);
      const user=session.user;let profile=await ensureProfile(user);if(profile.is_active===false){await client.auth.signOut();throw new Error('Dieses Konto ist deaktiviert. Bitte wende dich an die Administration.');}
      $('#memberGreeting').textContent=profile.display_name||user.email?.split('@')[0]||'Reisende:r';$('#profileDisplayName').value=profile.display_name||'';$('#profileEmail').value=user.email||'';
      const [peopleRes,variantsRes,groupRes,areaRes]=await Promise.all([
        client.from('peoples').select('id,name').order('name'),
        client.from('avatar_variants').select('id,people_id,name,description,image_url').eq('is_active',true),
        client.from('group_members').select('group_id,is_active').eq('user_id',user.id).eq('is_active',true),
        client.from('game_area_members').select('game_area_id,is_active').eq('user_id',user.id).eq('is_active',true)
      ]);
      const people=peopleRes.error?[]:(peopleRes.data||[]);const variants=variantsRes.error?[]:(variantsRes.data||[]);
      const sel=$('#memberPeople');sel.innerHTML='<option value="">Noch kein Volk ausgewählt</option>'+people.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');sel.value=profile.people_id||'';
      const changed=profile.people_changed_at?new Date(profile.people_changed_at):null;const next=changed?new Date(changed.getTime()+7*86400000):null;const allowed=!changed||Date.now()>=next.getTime();sel.disabled=!allowed&&Boolean(profile.people_id);$('#savePeople').disabled=!allowed&&Boolean(profile.people_id);$('#peopleHint').textContent=profile.people_id&&!allowed?`Ein Wechsel ist wieder ab ${next.toLocaleDateString('de-DE')} möglich.`:'Die Auswahl wird in deinem Profil gespeichert. Nach einer Änderung gilt eine Wartezeit von sieben Tagen.';
      const avatarBox=$('#avatarChoices');const filtered=variants.filter(v=>!profile.people_id||v.people_id===profile.people_id);if(variantsRes.error){avatarBox.innerHTML='<p class="member-muted">Avatar-Varianten konnten nicht geladen werden.</p>';}else if(!filtered.length){avatarBox.innerHTML='<p class="member-muted">Für die aktuelle Auswahl sind noch keine aktiven Avatar-Varianten hinterlegt.</p>';}else{avatarBox.innerHTML=filtered.map(v=>`<button class="avatar-choice" type="button" data-avatar-id="${esc(v.id)}" title="${esc(v.description||v.name)}">${v.image_url?`<img src="${esc(v.image_url)}" alt="">`:'<span class="avatar-placeholder">✧</span>'}<span>${esc(v.name)}</span></button>`).join('');avatarBox.querySelectorAll('[data-avatar-id]').forEach(b=>b.addEventListener('click',()=>{message($('#avatarMessage'),'Die Tabelle characters speichert die Avatar-Zuordnung. Eine sichere Änderung wird erst aktiviert, wenn die Character-RLS-Regeln dies für den eigenen Datensatz erlauben.');}));}
      const groupIds=(groupRes.data||[]).map(x=>x.group_id);const areaIds=(areaRes.data||[]).map(x=>x.game_area_id);let rows=[];
      if(groupIds.length){const r=await client.from('groups').select('id,name,description').in('id',groupIds);if(!r.error)rows.push(...(r.data||[]).map(x=>({...x,kind:'Gruppe'})));}
      if(areaIds.length){const r=await client.from('game_areas').select('id,name,description').in('id',areaIds);if(!r.error)rows.push(...(r.data||[]).map(x=>({...x,kind:'Spielbereich'})));}
      $('#memberGroups').innerHTML=rows.length?rows.map(r=>`<div class="member-list-item"><span>${esc(r.kind)}</span><strong>${esc(r.name)}</strong><small>${esc(r.description||'')}</small></div>`).join(''):'<p class="member-muted">Du bist aktuell noch keiner Gruppe und keinem Spielbereich zugeordnet.</p>';
      $('#profileForm').addEventListener('submit',async ev=>{ev.preventDefault();const name=$('#profileDisplayName').value.trim();if(!name){message($('#profileMessage'),'Bitte gib einen Anzeigenamen ein.','error');return;}const {error}=await client.from('profiles').update({display_name:name,updated_at:new Date().toISOString()}).eq('id',user.id);message($('#profileMessage'),error?friendly(error):'Dein Profil wurde gespeichert.',error?'error':'success');if(!error)$('#memberGreeting').textContent=name;});
      $('#savePeople').addEventListener('click',async()=>{const peopleId=sel.value||null;if(profile.people_id===peopleId){message($('#peopleMessage'),'Es hat sich nichts geändert.');return;}if(!allowed&&profile.people_id){message($('#peopleMessage'),'Ein Wechsel ist noch nicht möglich.','error');return;}const {error}=await client.from('profiles').update({people_id:peopleId,people_changed_at:peopleId?new Date().toISOString():profile.people_changed_at,updated_at:new Date().toISOString()}).eq('id',user.id);if(error){message($('#peopleMessage'),friendly(error),'error');return;}profile.people_id=peopleId;profile.people_changed_at=peopleId?new Date().toISOString():profile.people_changed_at;message($('#peopleMessage'),'Deine Auswahl wurde gespeichert.','success');location.reload();});
      $('#logoutButton').addEventListener('click',async()=>{const {error}=await client.auth.signOut();if(error){message($('#memberError'),friendly(error),'error');return;}location.href='index.html';});
      loading.hidden=true;$('#memberContent').hidden=false;
    }catch(e){console.error(e);loading.hidden=true;message($('#memberError'),friendly(e),'error');}
  }
  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  document.addEventListener('DOMContentLoaded',()=>{initAuthPage();initMemberPage();if(client)client.auth.onAuthStateChange((_event,session)=>{updateAccountLink(session);});});
})();
