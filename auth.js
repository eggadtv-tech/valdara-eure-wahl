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
  const sitePeopleThemes = {
    Dravari:{accent:'#e05245',soft:'rgba(224,82,69,.14)',border:'rgba(224,82,69,.55)',glow:'rgba(224,82,69,.22)'},
    Durn:{accent:'#9aabbe',soft:'rgba(154,171,190,.14)',border:'rgba(154,171,190,.52)',glow:'rgba(154,171,190,.20)'},
    Elarin:{accent:'#55d68a',soft:'rgba(85,214,138,.13)',border:'rgba(85,214,138,.52)',glow:'rgba(85,214,138,.20)'},
    Kharai:{accent:'#f0bd45',soft:'rgba(240,189,69,.14)',border:'rgba(240,189,69,.52)',glow:'rgba(240,189,69,.20)'},
    Meren:{accent:'#35c8f0',soft:'rgba(53,200,240,.14)',border:'rgba(53,200,240,.52)',glow:'rgba(53,200,240,.20)'},
    Urakai:{accent:'#d58aff',soft:'rgba(213,138,255,.14)',border:'rgba(213,138,255,.52)',glow:'rgba(213,138,255,.22)'}
  };
  function applySitePeopleTheme(name) {
    const theme = sitePeopleThemes[name];
    if (!theme) { document.body.removeAttribute('data-people-theme'); return; }
    document.body.dataset.peopleTheme = name.toLowerCase();
    const root = document.documentElement;
    root.style.setProperty('--people-accent', theme.accent);
    root.style.setProperty('--people-soft', theme.soft);
    root.style.setProperty('--people-border', theme.border);
    root.style.setProperty('--people-glow', theme.glow);
  }
  async function initSitePeopleTheme() {
    if (!client) return;
    try {
      const {data:{session}} = await client.auth.getSession();
      if (!session?.user) return;
      const {data:profile,error} = await client.from('profiles').select('people_id').eq('id',session.user.id).maybeSingle();
      if (error || !profile?.people_id) return;
      const {data:person, error:peopleError} = await client.from('peoples').select('name').eq('id',profile.people_id).maybeSingle();
      if (!peopleError && person?.name) applySitePeopleTheme(person.name);
    } catch (error) { console.warn('Volksdesign konnte nicht geladen werden:', error); }
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
      $('#memberGreeting').textContent=profile.display_name||user.email?.split('@')[0]||'Reisende:r';
      if(profile.people_id){const savedPeople=await client.from('peoples').select('name').eq('id',profile.people_id).maybeSingle();if(!savedPeople.error&&savedPeople.data?.name)applySitePeopleTheme(savedPeople.data.name);}$('#profileDisplayName').value=profile.display_name||'';$('#profileEmail').value=user.email||'';
      const [peopleRes,variantsRes,groupRes,areaRes]=await Promise.all([
        client.from('peoples').select('id,name').order('name'),
        client.from('avatar_variants').select('id,people_id,name,description,image_url').eq('is_active',true),
        client.from('group_members').select('group_id,is_active').eq('user_id',user.id).eq('is_active',true),
        client.from('game_area_members').select('game_area_id,is_active').eq('user_id',user.id).eq('is_active',true)
      ]);
      const people=peopleRes.error?[]:(peopleRes.data||[]);const variants=variantsRes.error?[]:(variantsRes.data||[]);
      const sel=$('#memberPeople');sel.innerHTML='<option value="">Noch kein Volk ausgewählt</option>'+people.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');sel.value=profile.people_id||'';
      const changed=profile.people_changed_at?new Date(profile.people_changed_at):null;const next=changed?new Date(changed.getTime()+7*86400000):null;const allowed=!changed||Date.now()>=next.getTime();sel.disabled=!allowed&&Boolean(profile.people_id);$('#savePeople').disabled=!allowed&&Boolean(profile.people_id);$('#peopleHint').textContent=profile.people_id&&!allowed?`Ein Wechsel ist wieder ab ${next.toLocaleDateString('de-DE')} möglich.`:'Die Auswahl wird in deinem Profil gespeichert. Nach einer Änderung gilt eine Wartezeit von sieben Tagen.';
      const peopleColors={Dravari:{accent:'#e05245',soft:'rgba(224,82,69,.22)',border:'rgba(224,82,69,.82)',glow:'rgba(224,82,69,.30)',sigil:'◈'},Durn:{accent:'#b7c1ce',soft:'rgba(112,130,151,.24)',border:'rgba(154,171,190,.82)',glow:'rgba(112,130,151,.28)',sigil:'◇'},Elarin:{accent:'#55d68a',soft:'rgba(45,166,99,.22)',border:'rgba(85,214,138,.82)',glow:'rgba(45,166,99,.30)',sigil:'✧'},Kharai:{accent:'#f0bd45',soft:'rgba(240,189,69,.22)',border:'rgba(240,189,69,.82)',glow:'rgba(240,189,69,.30)',sigil:'☼'},Meren:{accent:'#35c8f0',soft:'rgba(27,145,201,.24)',border:'rgba(53,200,240,.82)',glow:'rgba(27,145,201,.32)',sigil:'≈'},Urakai:{accent:'#d58aff',soft:'rgba(145,58,190,.25)',border:'rgba(213,138,255,.84)',glow:'rgba(145,58,190,.34)',sigil:'✦'}};
      const confirmModal=$('#peopleConfirmModal');let pendingPeopleId=null;
      function applyPeopleTheme(){const selected=people.find(p=>p.id===sel.value);const name=selected?.name||'';const t=peopleColors[name]||{accent:'#d7ad58',soft:'rgba(215,173,88,.12)',border:'rgba(215,173,88,.55)',glow:'rgba(215,173,88,.16)',sigil:'✧'};confirmModal.dataset.peopleTheme=name.toLowerCase();const dialog=confirmModal.querySelector('.people-confirm-dialog');if(dialog)dialog.dataset.peopleTheme=name.toLowerCase();confirmModal.style.setProperty('--people-accent',t.accent);confirmModal.style.setProperty('--people-soft',t.soft);confirmModal.style.setProperty('--people-border',t.border);confirmModal.style.setProperty('--people-glow',t.glow);$('#peopleConfirmSigil').textContent=t.sigil;$('#peopleConfirmText').textContent=`Du möchtest dich dem Volk der ${name||'gewählten'} anschließen.`;}
      function closePeopleConfirm(){confirmModal.hidden=true;confirmModal.setAttribute('aria-hidden','true');document.body.classList.remove('people-confirm-open');pendingPeopleId=null;}
      function openPeopleConfirm(){const id=sel.value||null;if(profile.people_id===id){message($('#peopleMessage'),'Es hat sich nichts geändert.');return;}if(!allowed&&profile.people_id){message($('#peopleMessage'),'Ein Wechsel ist noch nicht möglich.','error');return;}if(!id){message($('#peopleMessage'),'Bitte wähle zuerst eines der sechs Völker aus.','error');return;}pendingPeopleId=id;applyPeopleTheme();message($('#peopleConfirmMessage'),'');confirmModal.hidden=false;confirmModal.setAttribute('aria-hidden','false');document.body.classList.add('people-confirm-open');$('#peopleConfirmCancel').focus();}
      sel.addEventListener('change',applyPeopleTheme);$('#savePeople').addEventListener('click',openPeopleConfirm);$('#peopleConfirmClose').addEventListener('click',closePeopleConfirm);$('#peopleConfirmCancel').addEventListener('click',closePeopleConfirm);confirmModal.addEventListener('click',ev=>{if(ev.target===confirmModal)closePeopleConfirm();});document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!confirmModal.hidden)closePeopleConfirm();});
      $('#peopleConfirmAccept').addEventListener('click',async()=>{if(!pendingPeopleId)return;const btn=$('#peopleConfirmAccept');btn.disabled=true;message($('#peopleConfirmMessage'),'Deine Auswahl wird gespeichert …');try{const {error}=await client.from('profiles').update({people_id:pendingPeopleId,updated_at:new Date().toISOString()}).eq('id',user.id);if(error)throw error;const chosen=people.find(p=>p.id===pendingPeopleId);if(chosen)applySitePeopleTheme(chosen.name);message($('#peopleMessage'),'Deine Auswahl wurde gespeichert.','success');closePeopleConfirm();location.reload();}catch(error){message($('#peopleConfirmMessage'),friendly(error),'error');}finally{btn.disabled=false;}});
      const avatarBox=$('#avatarChoices');
      const filtered=variants.filter(v=>Boolean(profile.people_id)&&v.people_id===profile.people_id);
      const characterRes=await client.from('characters').select('id,user_id,people_id,avatar_variant_id,display_name').eq('user_id',user.id).maybeSingle();
      let currentCharacter=characterRes.error?null:characterRes.data;
      if(variantsRes.error){avatarBox.innerHTML='<p class="member-muted">Avatar-Varianten konnten nicht geladen werden. Bitte lade die Seite neu.</p>';message($('#avatarMessage'),friendly(variantsRes.error),'error');}
      else if(!profile.people_id){avatarBox.innerHTML='<p class="member-muted">Wähle zuerst dein Volk aus. Danach erscheinen die passenden Avatar-Varianten.</p>';}
      else if(!filtered.length){avatarBox.innerHTML='<p class="member-muted">Für dein Volk sind noch keine aktiven Avatar-Varianten hinterlegt.</p>';}
      else {
        if(currentCharacter?.people_id!==profile.people_id) currentCharacter=null;
        avatarBox.innerHTML=filtered.map(v=>`<button class="avatar-choice${currentCharacter?.avatar_variant_id===v.id?' selected':''}" type="button" data-avatar-id="${esc(v.id)}" aria-pressed="${currentCharacter?.avatar_variant_id===v.id?'true':'false'}" title="${esc(v.description||v.name)}">${v.image_url?`<img src="${esc(v.image_url)}" alt="" loading="lazy">`:'<span class="avatar-placeholder">✧</span>'}<span>${esc(v.name)}</span>${currentCharacter?.avatar_variant_id===v.id?'<small class="avatar-selected-label">Ausgewählt</small>':''}</button>`).join('');
        avatarBox.querySelectorAll('[data-avatar-id]').forEach(button=>button.addEventListener('click',async()=>{
          const variant=filtered.find(v=>v.id===button.dataset.avatarId);if(!variant)return;
          if(button.dataset.saving==='true')return;
          avatarBox.querySelectorAll('button').forEach(b=>b.disabled=true);button.dataset.saving='true';message($('#avatarMessage'),'Avatar wird gespeichert …');
          try {
            const payload={user_id:user.id,people_id:profile.people_id,avatar_variant_id:variant.id,display_name:(profile.display_name||user.email?.split('@')[0]||'Reisende:r').slice(0,40),updated_at:new Date().toISOString()};
            let saveResult;
            if(currentCharacter?.id){saveResult=await client.from('characters').update({people_id:payload.people_id,avatar_variant_id:payload.avatar_variant_id,updated_at:payload.updated_at}).eq('user_id',user.id).select('id,user_id,people_id,avatar_variant_id,display_name').single();}
            else {saveResult=await client.from('characters').upsert(payload,{onConflict:'user_id'}).select('id,user_id,people_id,avatar_variant_id,display_name').single();}
            if(saveResult.error)throw saveResult.error;
            currentCharacter=saveResult.data;
            avatarBox.querySelectorAll('[data-avatar-id]').forEach(b=>{const selected=b.dataset.avatarId===variant.id;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));const old=b.querySelector('.avatar-selected-label');if(old)old.remove();if(selected){const label=document.createElement('small');label.className='avatar-selected-label';label.textContent='Ausgewählt';b.appendChild(label);}});
            message($('#avatarMessage'),`Dein Avatar „${variant.name}“ wurde gespeichert.`,'success');
          } catch(error) {console.error('Avatar konnte nicht gespeichert werden:',error);message($('#avatarMessage'),friendly(error),'error');}
          finally {avatarBox.querySelectorAll('button').forEach(b=>b.disabled=false);delete button.dataset.saving;}
        }));
        if(characterRes.error) message($('#avatarMessage'),'Deine gespeicherte Avatar-Auswahl konnte nicht geladen werden. Eine neue Auswahl ist trotzdem möglich.','error');
        else if(currentCharacter) message($('#avatarMessage'),'Dein aktuell gespeicherter Avatar ist markiert.');
      }
      const groupIds=(groupRes.data||[]).map(x=>x.group_id);const areaIds=(areaRes.data||[]).map(x=>x.game_area_id);let rows=[];
      if(groupIds.length){const r=await client.from('groups').select('id,name,description').in('id',groupIds);if(!r.error)rows.push(...(r.data||[]).map(x=>({...x,kind:'Gruppe'})));}
      if(areaIds.length){const r=await client.from('game_areas').select('id,name,description').in('id',areaIds);if(!r.error)rows.push(...(r.data||[]).map(x=>({...x,kind:'Spielbereich'})));}
      $('#memberGroups').innerHTML=rows.length?rows.map(r=>`<div class="member-list-item"><span>${esc(r.kind)}</span><strong>${esc(r.name)}</strong><small>${esc(r.description||'')}</small></div>`).join(''):'<p class="member-muted">Du bist aktuell noch keiner Gruppe und keinem Spielbereich zugeordnet.</p>';
      $('#profileForm').addEventListener('submit',async ev=>{ev.preventDefault();const name=$('#profileDisplayName').value.trim();if(!name){message($('#profileMessage'),'Bitte gib einen Anzeigenamen ein.','error');return;}const {error}=await client.from('profiles').update({display_name:name,updated_at:new Date().toISOString()}).eq('id',user.id);message($('#profileMessage'),error?friendly(error):'Dein Profil wurde gespeichert.',error?'error':'success');if(!error)$('#memberGreeting').textContent=name;});
      $('#logoutButton').addEventListener('click',async()=>{const {error}=await client.auth.signOut();if(error){message($('#memberError'),friendly(error),'error');return;}location.href='index.html';});
      loading.hidden=true;$('#memberContent').hidden=false;
    }catch(e){console.error(e);loading.hidden=true;message($('#memberError'),friendly(e),'error');}
  }
  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  document.addEventListener('DOMContentLoaded',()=>{initAuthPage();initMemberPage();initSitePeopleTheme();if(client)client.auth.onAuthStateChange((_event,session)=>{updateAccountLink(session);if(session) initSitePeopleTheme();else applySitePeopleTheme('');});});
})();
