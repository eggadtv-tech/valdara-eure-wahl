/* VALDARA account layer: Supabase Auth + existing profile schema. */
(() => {
  const cfg = () => window.supabase && window.VALDARA_SUPABASE_URL && window.VALDARA_SUPABASE_ANON_KEY;
  let client = null;
  try { if (cfg()) client = window.supabase.createClient(window.VALDARA_SUPABASE_URL, window.VALDARA_SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); } catch (e) { console.error(e); }
  const $ = (s) => document.querySelector(s);
  const message = (el, text, type='') => { if (!el) return; el.textContent=text; el.className='account-message'+(type?' '+type:''); };
  const friendly = (e) => ({'Invalid login credentials':'E-Mail-Adresse oder Passwort ist nicht korrekt.','User already registered':'Für diese E-Mail-Adresse existiert bereits ein Konto.','Password should be at least 6 characters':'Das Passwort ist zu kurz.'}[e?.message] || e?.message || 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.');
  async function updateAccountLink(session) { const link=$('#accountLink'); if(link){link.href=session?'mein-bereich.html':'login.html';link.textContent='Anmelden';link.hidden=!!session;link.setAttribute('aria-hidden',String(!!session));} const profileNav=$('#profileNavLink'); if(profileNav) profileNav.hidden=!session; document.querySelectorAll('.login-btn').forEach(el=>{if(el.id==='accountLink')return;el.textContent=session?'Mein Bereich':'Anmelden';el.onclick=null;el.addEventListener('click',()=>location.href=session?'mein-bereich.html':'login.html');}); }
  async function ensureProfile(user, fallbackName) {
    const {data, error}=await client.from('profiles').select('id,display_name,role,people_id,people_changed_at,is_active,birth_date,age_verified_at').eq('id',user.id).maybeSingle();
    if(error) throw error;
    if(data) return data;
    // Backup if the database trigger has not been installed yet. Uses the user's own session and existing RLS.
    const display=(fallbackName || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Reisende:r').trim().slice(0,40);
    const {data:created,error:insertError}=await client.from('profiles').insert({id:user.id,display_name:display,birth_date:user.user_metadata?.birth_date||null,age_verified_at:user.user_metadata?.birth_date?new Date().toISOString():null}).select('id,display_name,role,people_id,people_changed_at,is_active').single();
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
    const display=$('#authDisplayName'), displayLabel=$('#displayNameLabel'), birth=$('#authBirthDate'), birthLabel=$('#birthDateLabel'), birthHint=$('#birthDateHint'), pass=$('#authPassword'), submit=$('#authSubmit'), forgot=$('#forgotPassword');
    const today=new Date(); birth.max=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    function ageOn(dateString){if(!dateString)return -1;const d=new Date(dateString+'T00:00:00');if(Number.isNaN(d.getTime()))return -1;let age=today.getFullYear()-d.getFullYear();if(today.getMonth()<d.getMonth()||(today.getMonth()===d.getMonth()&&today.getDate()<d.getDate()))age--;return age;}
    function showMode(nextMode){mode=nextMode;document.querySelectorAll('[data-auth-mode]').forEach(b=>b.classList.toggle('active',b.dataset.authMode===mode));const signup=mode==='signup';display.hidden=!signup;displayLabel.hidden=!signup;display.required=signup;birth.hidden=!signup;birthLabel.hidden=!signup;birthHint.hidden=!signup;birth.required=signup;pass.autocomplete=signup?'new-password':'current-password';submit.innerHTML=signup?'Konto erstellen <span>→</span>':'Anmelden <span>→</span>';forgot.hidden=signup;message($('#authMessage'),'');}
    
    document.querySelectorAll('[data-auth-mode]').forEach(btn=>btn.addEventListener('click',()=>showMode(btn.dataset.authMode)));
    showMode('login');
    form.addEventListener('submit',async ev=>{ev.preventDefault();message($('#authMessage'),'Bitte einen Moment …');submit.disabled=true;
      try {const email=$('#authEmail').value.trim(),password=pass.value;
        if(mode==='signup'){
          const displayName=display.value.trim(); if(!displayName) throw new Error('Bitte gib einen Anzeigenamen ein.');
          const birthDate=birth.value; const age=ageOn(birthDate); if(!birthDate||age<0) throw new Error('Bitte gib ein gültiges Geburtsdatum ein.'); if(age<14) throw new Error('Eine Registrierung ist erst ab 14 Jahren möglich.');
          const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:displayName,birth_date:birthDate},emailRedirectTo:location.origin+location.pathname.replace(/login\.html$/,'mein-bereich.html')}}); if(error)throw error;
          if(data.session){try{const prof=await ensureProfile(data.user,displayName);if(!prof.birth_date){const {error:ageError}=await client.rpc('save_my_birth_date',{new_birth_date:birthDate});if(ageError)throw ageError;}}catch(e){console.warn('Profil wird beim ersten Login vervollständigt:',e);} location.href='mein-bereich.html';return;}
          message($('#authMessage'),'Konto angelegt. Bitte bestätige deine E-Mail-Adresse über den Link in deinem Postfach. Danach kannst du dich anmelden.','success');
        } else {const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;try{const prof=await ensureProfile(data.user);if(data.user.user_metadata?.birth_date&&!prof.birth_date){const {error:ageError}=await client.rpc('save_my_birth_date',{new_birth_date:data.user.user_metadata.birth_date});if(ageError)console.warn('Geburtsdatum konnte noch nicht ins Profil übertragen werden:',ageError);}}catch(e){console.error(e);message($('#authMessage'),'Du bist angemeldet, aber dein Profil konnte noch nicht geladen werden. Bitte prüfe die Profil-RLS-Regeln.','error');return;}location.href='mein-bereich.html';return;}
      } catch(e){message($('#authMessage'),friendly(e),'error');} finally{submit.disabled=false;}
    });
    forgot.addEventListener('click',async()=>{const email=$('#authEmail').value.trim();if(!email){message($('#authMessage'),'Trage zuerst deine E-Mail-Adresse ein.');return;}message($('#authMessage'),'Passwort-Link wird angefordert …');const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});message($('#authMessage'),error?friendly(error):'Falls ein Konto zu dieser Adresse existiert, erhältst du eine E-Mail zum Zurücksetzen des Passworts.',error?'error':'success');});
    const {data:{session}}=await client.auth.getSession();await updateAccountLink(session);if(session && location.pathname.endsWith('login.html')) location.href='mein-bereich.html';
  }
  async function initMemberPage(){if(!$('#memberContent'))return;if(!client){message($('#memberError'),'Supabase ist nicht konfiguriert.','error');return;}
    const loading=$('#memberLoading');
    try {const {data:{session},error:sessionError}=await client.auth.getSession();if(sessionError)throw sessionError;if(!session){location.href='login.html?return=mein-bereich.html';return;}await updateAccountLink(session);
      const user=session.user;let profile=await ensureProfile(user);if(profile.is_active===false){await client.auth.signOut();throw new Error('Dieses Konto ist deaktiviert. Bitte wende dich an die Administration.');}
      // Bestehende Konten ohne Geburtsdatum müssen es beim nächsten Besuch ergänzen.
      if(!profile.birth_date){
        const ageModal=$('#birthDateModal'), ageInput=$('#existingBirthDate'), ageForm=$('#existingBirthDateForm'), ageSave=$('#saveExistingBirthDate');
        if(ageModal&&ageInput&&ageForm){
          const now=new Date();ageInput.max=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
          ageModal.hidden=false;ageModal.setAttribute('aria-hidden','false');document.body.classList.add('people-confirm-open');
          $('#memberContent').hidden=true;loading.hidden=true;
          ageForm.addEventListener('submit',async ev=>{ev.preventDefault();
            const val=ageInput.value;const dob=new Date(val+'T00:00:00');let age=now.getFullYear()-dob.getFullYear();if(now.getMonth()<dob.getMonth()||(now.getMonth()===dob.getMonth()&&now.getDate()<dob.getDate()))age--;
            if(!val||Number.isNaN(dob.getTime())||dob>now){message($('#existingBirthDateMessage'),'Bitte gib ein gültiges Geburtsdatum ein.','error');return;}
            if(age<14){message($('#existingBirthDateMessage'),'Du musst mindestens 14 Jahre alt sein, um Valdara zu nutzen.','error');return;}
            ageSave.disabled=true;message($('#existingBirthDateMessage'),'Geburtsdatum wird gespeichert …');
            try{const {error:saveError}=await client.rpc('save_my_birth_date',{new_birth_date:val});if(saveError)throw saveError;ageModal.hidden=true;ageModal.setAttribute('aria-hidden','true');document.body.classList.remove('people-confirm-open');location.reload();}
            catch(err){console.error('Geburtsdatum konnte nicht gespeichert werden:',err);message($('#existingBirthDateMessage'),err?.message||'Speichern fehlgeschlagen. Bitte versuche es erneut.','error');ageSave.disabled=false;}
          });
          return;
        }
      }
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
      function applyPeopleTheme(){const selected=people.find(p=>p.id===sel.value);const name=selected?.name||'';const t=peopleColors[name]||{accent:'#d7ad58',soft:'rgba(215,173,88,.12)',border:'rgba(215,173,88,.55)',glow:'rgba(215,173,88,.16)',sigil:'✧'};confirmModal.dataset.peopleTheme=name.toLowerCase();const dialog=confirmModal.querySelector('.people-confirm-dialog');if(dialog)dialog.dataset.peopleTheme=name.toLowerCase();confirmModal.style.setProperty('--people-accent',t.accent);confirmModal.style.setProperty('--people-soft',t.soft);confirmModal.style.setProperty('--people-border',t.border);confirmModal.style.setProperty('--people-glow',t.glow);const sigilNode=$('#peopleConfirmSigil');if(sigilNode)sigilNode.textContent=t.sigil;const confirmText=$('#peopleConfirmText');if(confirmText)confirmText.textContent=`Du möchtest dich dem Volk der ${name||'gewählten'} anschließen.`;}
      function closePeopleConfirm(){confirmModal.hidden=true;confirmModal.setAttribute('aria-hidden','true');document.body.classList.remove('people-confirm-open');pendingPeopleId=null;}
      function openPeopleConfirm(){const id=sel.value||null;if(profile.people_id===id){message($('#peopleMessage'),'Es hat sich nichts geändert.');return;}if(!allowed&&profile.people_id){message($('#peopleMessage'),'Ein Wechsel ist noch nicht möglich.','error');return;}if(!id){message($('#peopleMessage'),'Bitte wähle zuerst eines der sechs Völker aus.','error');return;}pendingPeopleId=id;applyPeopleTheme();message($('#peopleConfirmMessage'),'');confirmModal.hidden=false;confirmModal.setAttribute('aria-hidden','false');document.body.classList.add('people-confirm-open');$('#peopleConfirmCancel').focus();}
      sel.addEventListener('change',applyPeopleTheme);$('#savePeople').addEventListener('click',openPeopleConfirm);$('#peopleConfirmClose').addEventListener('click',closePeopleConfirm);$('#peopleConfirmCancel').addEventListener('click',closePeopleConfirm);confirmModal.addEventListener('click',ev=>{if(ev.target===confirmModal)closePeopleConfirm();});document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!confirmModal.hidden)closePeopleConfirm();});
      $('#peopleConfirmAccept').addEventListener('click',async()=>{if(!pendingPeopleId)return;const btn=$('#peopleConfirmAccept');btn.disabled=true;message($('#peopleConfirmMessage'),'Deine Auswahl wird gespeichert …');try{const {error}=await client.from('profiles').update({people_id:pendingPeopleId,updated_at:new Date().toISOString()}).eq('id',user.id);if(error)throw error;const chosen=people.find(p=>p.id===pendingPeopleId);if(chosen)applySitePeopleTheme(chosen.name);message($('#peopleMessage'),'Deine Auswahl wurde gespeichert.','success');closePeopleConfirm();location.reload();}catch(error){message($('#peopleConfirmMessage'),friendly(error),'error');}finally{btn.disabled=false;}});
      const avatarBox=$('#avatarChoices');
      const filtered=variants.filter(v=>Boolean(profile.people_id)&&v.people_id===profile.people_id);
      const characterRes=await client.from('characters').select('id,user_id,people_id,avatar_variant_id,custom_avatar_url,display_name,character_story').eq('user_id',user.id).maybeSingle();
      let currentCharacter=characterRes.error?null:characterRes.data;
      // Rechtefreigabe: wird als unveränderlicher, versionierter Datensatz in Supabase dokumentiert.
      const rightsOpen=$('#openCharacterRights'), rightsModal=$('#characterRightsModal'), rightsFinal=$('#characterRightsFinalModal');
      const rightsStatus=$('#characterRightsStatus');
      let rightsAlreadyGranted=false;
      let rightsGrantAcceptedAt=null;
      let activeRightsTerms=null;
      function closeRightsModal(modal){if(modal){modal.hidden=true;modal.setAttribute('aria-hidden','true');}document.body.classList.remove('people-confirm-open');}
      function openRightsModal(){
        if(rightsAlreadyGranted){message(rightsStatus,'Für diesen Charakter ist bereits eine Freigabe gespeichert.','success');return;}
        if(!currentCharacter?.id || !currentCharacter.character_story?.trim()) { message(rightsStatus,'Bitte speichere zuerst eine Charaktergeschichte.','error'); return; }
        if(!activeRightsTerms?.agreement_text){message(rightsStatus,'Die Vereinbarung konnte nicht geladen werden. Bitte später erneut versuchen.','error');return;}
        $('#rightsCharacterName').textContent=currentCharacter.display_name||profile.display_name||'Unbenannter Charakter';
        $('#rightsCharacterStory').textContent=currentCharacter.character_story;
        $('#rightsAgreementText').textContent=activeRightsTerms.agreement_text;
        $('#characterRightsCheckbox').checked=false;$('#characterRightsAccept').disabled=true;message($('#characterRightsMessage'),'');
        rightsModal.hidden=false;rightsModal.setAttribute('aria-hidden','false');document.body.classList.add('people-confirm-open');$('#characterRightsClose').focus();
      }
      if(rightsOpen){
        try{
          const [termsRes,grantRes]=await Promise.all([
            client.from('character_rights_terms').select('version,agreement_text').eq('is_active',true).maybeSingle(),
            currentCharacter?.id ? client.from('character_rights_grants').select('id,consent_version,accepted_at').eq('character_id',currentCharacter.id).maybeSingle() : Promise.resolve({data:null,error:null})
          ]);
          if(termsRes.error)throw termsRes.error;
          activeRightsTerms=termsRes.data;
          if(!activeRightsTerms?.agreement_text)throw new Error('Keine aktive Vereinbarung gefunden.');
          if(grantRes.error)throw grantRes.error;
          if(grantRes.data){rightsAlreadyGranted=true;rightsGrantAcceptedAt=grantRes.data.accepted_at;rightsOpen.disabled=true;rightsOpen.textContent='Charakter bereits für Valdara freigegeben';message(rightsStatus,`Freigabe dokumentiert am ${new Date(grantRes.data.accepted_at).toLocaleDateString('de-DE')}.`,'success');}
        }catch(err){console.error('Rechtefreigabe konnte nicht geladen werden:',err);rightsOpen.disabled=true;message(rightsStatus,'Rechtefreigabe ist noch nicht verfügbar. Bitte prüfe die Supabase-Berechtigungen und die aktive Vereinbarung.','error');}
        rightsOpen.addEventListener('click',openRightsModal);
        $('#characterRightsClose').addEventListener('click',()=>closeRightsModal(rightsModal));
        $('#characterRightsCancel').addEventListener('click',()=>closeRightsModal(rightsModal));
        $('#characterRightsCheckbox').addEventListener('change',ev=>{$('#characterRightsAccept').disabled=!ev.target.checked;});
        $('#characterRightsAccept').addEventListener('click',()=>{
          if(!$('#characterRightsCheckbox').checked)return;
          closeRightsModal(rightsModal);rightsFinal.hidden=false;rightsFinal.setAttribute('aria-hidden','false');document.body.classList.add('people-confirm-open');
        });
        $('#characterRightsFinalCancel').addEventListener('click',()=>closeRightsModal(rightsFinal));
        rightsModal.addEventListener('click',ev=>{if(ev.target===rightsModal)closeRightsModal(rightsModal);});
        document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){if(!rightsFinal.hidden)closeRightsModal(rightsFinal);else if(!rightsModal.hidden)closeRightsModal(rightsModal);}});
        $('#characterRightsFinalAccept').addEventListener('click',async()=>{
          const btn=$('#characterRightsFinalAccept');btn.disabled=true;message($('#characterRightsFinalMessage'),'Freigabe wird sicher gespeichert …');
          try{
            const {data,error}=await client.rpc('grant_valdara_character_rights',{p_character_id:currentCharacter.id,p_confirmed:true});
            if(error){if(error.code==='23505')throw new Error('Für diesen Charakter wurde bereits eine Freigabe gespeichert.');throw error;}
            if(!data)throw new Error('Die Datenbank hat keine Freigabe-ID zurückgegeben.');
            closeRightsModal(rightsFinal);rightsAlreadyGranted=true;rightsGrantAcceptedAt=new Date().toISOString();rightsOpen.disabled=true;rightsOpen.textContent='Charakter bereits für Valdara freigegeben';message(rightsStatus,'Deine Freigabe wurde gespeichert.','success');
          }catch(error){message($('#characterRightsFinalMessage'),friendly(error),'error');}
          finally{btn.disabled=false;}
        });
      }
      // Persönlicher Avatar: direkt am Charakter gespeichert, nicht als globale Variante auswählbar.
      if(currentCharacter?.custom_avatar_url){
        avatarBox.innerHTML=`<div class="avatar-choice selected" aria-label="Persönlicher Avatar"><img src="${esc(currentCharacter.custom_avatar_url)}" alt="Dein persönlicher Avatar"><span>Dein persönlicher Avatar</span><small class="avatar-selected-label">Nur für dein Konto</small></div>`;
        message($('#avatarMessage'),'Dein persönlicher Avatar ist gespeichert.','success');
      }
      const storyField=$('#characterStory');
      const storySave=$('#saveCharacterStory');
      const storyCount=$('#storyCount');
      if(storyField){storyField.value=currentCharacter?.character_story||'';storyField.addEventListener('input',()=>{if(storyCount)storyCount.textContent=`${storyField.value.length} / 12000 Zeichen`;});if(storyCount)storyCount.textContent=`${storyField.value.length} / 12000 Zeichen`;}
      const characterPage=$('#characterPage');
      const memberGrid=$('#memberGrid');
      const memberBottom=document.querySelector('.member-bottom');
      function showCharacterPage(character){
        if(!characterPage||!character||(!character.avatar_variant_id&&!character.custom_avatar_url)||!character.character_story?.trim())return;
        const avatar=variants.find(v=>v.id===character.avatar_variant_id);
        const avatarImage=character.custom_avatar_url||avatar?.image_url;
        const person=people.find(p=>p.id===character.people_id);
        characterPage.innerHTML=`<article class="character-sheet"><div class="character-sheet-heading"><span class="eyebrow">DEIN CHARAKTER IN VALDARA</span><h1>${esc(character.display_name||profile.display_name||'Dein Charakter')}</h1><p class="member-muted">${esc(person?.name||'Noch kein Volk')}</p></div><div class="character-sheet-main">${avatarImage?`<img class="character-sheet-avatar" src="${esc(avatarImage)}" alt="Avatar von ${esc(character.display_name||profile.display_name||'deinem Charakter')}">`:''}<div class="character-sheet-story"><span class="eyebrow">DEINE GESCHICHTE</span><div class="character-story-text">${esc(character.character_story).replace(/\n/g,'<br>')}</div></div></div><button id="editCharacterButton" class="glow-btn" type="button">Charakter bearbeiten <span>→</span></button></article>`;
        characterPage.hidden=false;if(memberGrid)memberGrid.hidden=true;if(memberBottom)memberBottom.hidden=true;
        $('#editCharacterButton')?.addEventListener('click',()=>{characterPage.hidden=true;if(memberGrid)memberGrid.hidden=false;if(memberBottom)memberBottom.hidden=false;window.scrollTo({top:0,behavior:'smooth'});});
      }
      if(storySave)storySave.addEventListener('click',async()=>{
        const story=storyField.value.trim();
        if(!story){message($('#storyMessage'),'Schreibe zuerst etwas über deinen Charakter.','error');storyField.focus();return;}
        if(!profile.people_id){message($('#storyMessage'),'Wähle zuerst dein Volk aus.','error');return;}
        if(!currentCharacter?.id||(!currentCharacter.custom_avatar_url&&(currentCharacter.people_id!==profile.people_id||!currentCharacter.avatar_variant_id))){message($('#storyMessage'),'Wähle zuerst einen Avatar aus.','error');return;}
        storySave.disabled=true;message($('#storyMessage'),'Deine Geschichte wird gespeichert …');
        try{const {data,error}=await client.from('characters').update({character_story:story,display_name:(profile.display_name||user.email?.split('@')[0]||'Reisende:r').slice(0,40),updated_at:new Date().toISOString()}).eq('user_id',user.id).select('id,user_id,people_id,avatar_variant_id,custom_avatar_url,display_name,character_story').single();if(error)throw error;currentCharacter=data;message($('#storyMessage'),'Deine Geschichte wurde gespeichert.','success');location.reload();}
        catch(error){console.error('Charaktergeschichte konnte nicht gespeichert werden:',error);message($('#storyMessage'),friendly(error),'error');}
        finally{storySave.disabled=false;}
      });
      if(currentCharacter?.custom_avatar_url){ /* Exklusiven persönlichen Avatar beibehalten; keine globalen Varianten anzeigen. */ }
      else if(variantsRes.error){avatarBox.innerHTML='<p class="member-muted">Avatar-Varianten konnten nicht geladen werden. Bitte lade die Seite neu.</p>';message($('#avatarMessage'),friendly(variantsRes.error),'error');}
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
            if(currentCharacter?.id){saveResult=await client.from('characters').update({people_id:payload.people_id,avatar_variant_id:payload.avatar_variant_id,updated_at:payload.updated_at}).eq('user_id',user.id).select('id,user_id,people_id,avatar_variant_id,custom_avatar_url,display_name,character_story').single();}
            else {saveResult=await client.from('characters').upsert(payload,{onConflict:'user_id'}).select('id,user_id,people_id,avatar_variant_id,custom_avatar_url,display_name,character_story').single();}
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
      if(!characterRes.error&&currentCharacter) showCharacterPage(currentCharacter);
      const groupIds=(groupRes.data||[]).map(x=>x.group_id);const areaIds=(areaRes.data||[]).map(x=>x.game_area_id);let rows=[];
      if(groupIds.length){const r=await client.from('groups').select('id,name,description').in('id',groupIds);if(!r.error)rows.push(...(r.data||[]).map(x=>({...x,kind:'Gruppe'})));}
      if(areaIds.length){const r=await client.from('game_areas').select('id,name,description').in('id',areaIds);if(!r.error)rows.push(...(r.data||[]).map(x=>({...x,kind:'Spielbereich'})));}
      $('#memberGroups').innerHTML=rows.length?rows.map(r=>`<div class="member-list-item"><span>${esc(r.kind)}</span><strong>${esc(r.name)}</strong><small>${esc(r.description||'')}</small></div>`).join(''):'<p class="member-muted">Du bist aktuell noch keiner Gruppe und keinem Spielbereich zugeordnet.</p>';
      $('#profileForm').addEventListener('submit',async ev=>{ev.preventDefault();const name=$('#profileDisplayName').value.trim();if(!name){message($('#profileMessage'),'Bitte gib einen Anzeigenamen ein.','error');return;}const {error}=await client.from('profiles').update({display_name:name,updated_at:new Date().toISOString()}).eq('id',user.id);message($('#profileMessage'),error?friendly(error):'Dein Profil wurde gespeichert.',error?'error':'success');if(!error)$('#memberGreeting').textContent=name;});
      $('#logoutButton')?.addEventListener('click',async()=>{const {error}=await client.auth.signOut();if(error){message($('#memberError'),friendly(error),'error');return;}location.href='index.html';});
      await initSocialFeatures(user,profile);
      loading.hidden=true;$('#memberContent').hidden=false;
    }catch(e){console.error(e);loading.hidden=true;message($('#memberError'),friendly(e),'error');}
  }

  async function initSocialFeatures(user, profile) {
    const $id = (id) => document.getElementById(id);
    const setStatus = (id, text, type='') => message($id(id), text, type);
    const empty = (text) => `<p class="social-empty">${esc(text)}</p>`;
    const [directoryRes] = await Promise.all([
      client.from('profiles').select('id,display_name').order('display_name').limit(250)
    ]);
    const directory = (directoryRes.error ? [] : (directoryRes.data || [])).filter(p => p.id !== user.id);
    const directoryOptions = '<option value="">Mitglied auswählen …</option>' + directory.map(p => `<option value="${esc(p.id)}">${esc(p.display_name || 'Reisende:r')}</option>`).join('');
    for (const id of ['messageRecipient','friendRecipient']) {
      const select = $id(id);
      if (!select) continue;
      select.innerHTML = directoryOptions;
      if (directoryRes.error) select.innerHTML = '<option value="">Mitgliederliste nicht verfügbar</option>';
    }
    if (directoryRes.error) {
      setStatus('privateMessageStatus', 'Die Mitgliederliste ist durch die aktuellen Profil-Berechtigungen nicht lesbar. Dafür müssen wir eine sichere Mitglieder-Suche ergänzen.', 'error');
      setStatus('friendRequestStatus', 'Die Mitgliederliste ist durch die aktuellen Profil-Berechtigungen nicht lesbar. Dafür müssen wir eine sichere Mitglieder-Suche ergänzen.', 'error');
    }

    const loadMessages = async () => {
      const box = $id('privateMessageList');
      const { data, error } = await client.from('private_messages').select('id,sender_id,recipient_id,content,created_at,read_at').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order('created_at',{ascending:false}).limit(50);
      if (error) { box.innerHTML = empty('Nachrichten konnten nicht geladen werden: ' + error.message); return; }
      const names = new Map(directory.map(p=>[p.id,p.display_name||'Reisende:r']));
      names.set(user.id,profile.display_name||user.email?.split('@')[0]||'Du');
      box.innerHTML = data?.length ? data.map(m => `<div class="social-row"><div class="social-row-main"><strong>${m.sender_id===user.id?'An: ':'Von: '}${esc(names.get(m.sender_id===user.id?m.recipient_id:m.sender_id)||'Mitglied')}</strong><small>${esc(new Date(m.created_at).toLocaleString('de-DE'))}</small><span class="social-story">${esc(m.content)}</span></div></div>`).join('') : empty('Noch keine Nachrichten vorhanden.');
    };
    $id('privateMessageForm')?.addEventListener('submit', async ev => {
      ev.preventDefault();
      const recipient = $id('messageRecipient').value;
      const content = $id('privateMessageText').value.trim();
      if (!recipient || !content) { setStatus('privateMessageStatus','Bitte Empfänger und Nachricht ausfüllen.','error'); return; }
      const btn = ev.currentTarget.querySelector('button[type="submit"]'); btn.disabled=true;
      setStatus('privateMessageStatus','Nachricht wird gesendet …');
      try {
        const {error} = await client.from('private_messages').insert({sender_id:user.id,recipient_id:recipient,content});
        if(error) throw error;
        $id('privateMessageText').value='';
        setStatus('privateMessageStatus','Nachricht wurde gesendet.','success');
        await loadMessages();
      } catch(error) { setStatus('privateMessageStatus',friendly(error),'error'); }
      finally { btn.disabled=false; }
    });
    await loadMessages();

    const loadFriends = async () => {
      const [res, profilesRes] = await Promise.all([
        client.from('friendships').select('id,requester_id,addressee_id,status,created_at').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).order('created_at',{ascending:false}).limit(100),
        client.from('profiles').select('id,display_name').limit(250)
      ]);
      const incoming=$id('friendIncomingList'), list=$id('friendList');
      if(res.error){incoming.innerHTML=empty('Anfragen konnten nicht geladen werden: '+res.error.message);list.innerHTML='';return;}
      const profiles=new Map((profilesRes.data||directory).map(p=>[p.id,p.display_name||'Reisende:r']));
      profiles.set(user.id,profile.display_name||'Du');
      const rows=res.data||[];
      const pending=rows.filter(r=>r.status==='pending'&&r.addressee_id===user.id);
      incoming.innerHTML=pending.length?pending.map(r=>`<div class="social-row"><div class="social-row-main"><strong>${esc(profiles.get(r.requester_id)||'Mitglied')}</strong><small>Freundschaftsanfrage · ${esc(new Date(r.created_at).toLocaleDateString('de-DE'))}</small></div><div class="social-row-actions"><button class="social-action" data-friend-action="accepted" data-id="${esc(r.id)}">Annehmen</button><button class="social-action" data-friend-action="declined" data-id="${esc(r.id)}">Ablehnen</button></div></div>`).join(''):empty('Keine offenen Anfragen.');
      const others=rows.filter(r=>!(r.status==='pending'&&r.addressee_id===user.id));
      list.innerHTML=others.length?others.map(r=>`<div class="social-row"><div class="social-row-main"><strong>${esc(profiles.get(r.requester_id===user.id?r.addressee_id:r.requester_id)||'Mitglied')}</strong><small>${r.status==='accepted'?'Freundschaft bestätigt':r.status==='declined'?'Anfrage abgelehnt': 'Anfrage gesendet'}</small></div></div>`).join(''):empty('Noch keine Freunde oder gesendeten Anfragen.');
      incoming.querySelectorAll('[data-friend-action]').forEach(btn=>btn.addEventListener('click',async()=>{
        btn.disabled=true;
        const status=btn.dataset.friendAction;
        const {error}=await client.from('friendships').update({status,updated_at:new Date().toISOString()}).eq('id',btn.dataset.id);
        if(error){setStatus('friendRequestStatus',friendly(error),'error');btn.disabled=false;return;}
        setStatus('friendRequestStatus',status==='accepted'?'Freundschaft angenommen.':'Anfrage abgelehnt.','success');
        await loadFriends();
      }));
    };
    $id('friendRequestForm')?.addEventListener('submit',async ev=>{
      ev.preventDefault();
      const addressee=$id('friendRecipient').value;
      if(!addressee){setStatus('friendRequestStatus','Bitte wähle ein Mitglied aus.','error');return;}
      const btn=ev.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;
      try{
        const {error}=await client.from('friendships').insert({requester_id:user.id,addressee_id:addressee,status:'pending'});
        if(error)throw error;
        setStatus('friendRequestStatus','Freundschaftsanfrage wurde gesendet.','success');
        await loadFriends();
      }catch(error){setStatus('friendRequestStatus',friendly(error),'error');}
      finally{btn.disabled=false;}
    });
    await loadFriends();

    const inventoryBox=$id('characterInventoryList');
    const charRes=await client.from('characters').select('id').eq('user_id',user.id).maybeSingle();
    if(charRes.error||!charRes.data){inventoryBox.innerHTML=empty('Lege zuerst deinen Charakter an.');return;}
    const inventoryRes=await client.from('character_inventory').select('id,item_name,description,quantity,metadata,created_at').eq('character_id',charRes.data.id).order('created_at',{ascending:false});
    if(inventoryRes.error){inventoryBox.innerHTML=empty('Inventar konnte nicht geladen werden: '+inventoryRes.error.message);return;}
    inventoryBox.innerHTML=inventoryRes.data?.length?inventoryRes.data.map(item=>`<div class="social-row"><div class="social-row-main"><strong>${esc(item.item_name)}${item.quantity>1?' × '+item.quantity:''}</strong><small>${esc(item.description||'')}</small></div></div>`).join(''):empty('Dein Inventar ist derzeit leer. Gegenstände werden später ergänzt.');
  }
  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('#globalLogoutButton').forEach(button=>button.addEventListener('click',async()=>{
      if(!client){location.href='login.html';return;}
      button.disabled=true;const oldLabel=button.textContent;button.textContent='Abmeldung …';
      try{const {error}=await client.auth.signOut();if(error)throw error;location.href='index.html';}
      catch(error){console.error('Abmeldung fehlgeschlagen:',error);button.disabled=false;button.textContent=oldLabel;alert('Abmelden war nicht möglich. Bitte versuche es erneut.');}
    }));
    initAuthPage();initMemberPage();initSitePeopleTheme();if(client)client.auth.onAuthStateChange((_event,session)=>{updateAccountLink(session);if(session) initSitePeopleTheme();else applySitePeopleTheme('');});});
})();
