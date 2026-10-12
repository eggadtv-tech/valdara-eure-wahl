/* VALDARA – aufklappbarer KI-Chat */
(() => {
  if (document.getElementById('valdara-chat-widget')) return;

  const workerUrl = 'https://valdara-ki-assistent.eggad-tv.workers.dev/';
  const root = document.createElement('div');
  root.id = 'valdara-chat-widget';
  root.innerHTML = `
    <section class="valdara-chat-panel" id="valdara-chat-panel" role="dialog" aria-label="Valdara KI-Assistent" aria-modal="false" hidden>
      <header class="valdara-chat-header">
        <div class="valdara-chat-heading"><span class="valdara-chat-mark" aria-hidden="true">✦</span><span><strong>Valdara-Assistent</strong><small>Fragt die Welt</small></span></div>
        <div class="valdara-chat-controls">
          <a class="valdara-chat-popout" href="${workerUrl}" target="_blank" rel="noopener noreferrer" aria-label="Chat in neuem Tab öffnen" title="In neuem Tab öffnen">↗</a>
          <button class="valdara-chat-close" type="button" aria-label="Chat schließen" title="Schließen">×</button>
        </div>
      </header>
      <iframe class="valdara-chat-frame" title="Valdara KI-Assistent" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="clipboard-write"></iframe>
    </section>
    <button class="valdara-chat-launcher" type="button" aria-expanded="false" aria-controls="valdara-chat-panel">
      <span class="valdara-chat-launcher-icon" aria-hidden="true">✦</span><span class="valdara-chat-launcher-label">Frag Valdara</span>
    </button>`;
  document.body.appendChild(root);

  const panel = root.querySelector('#valdara-chat-panel');
  const launcher = root.querySelector('.valdara-chat-launcher');
  const close = root.querySelector('.valdara-chat-close');
  const frame = root.querySelector('.valdara-chat-frame');
  let loaded = false;

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.classList.toggle('is-open', open);
    launcher.querySelector('.valdara-chat-launcher-label').textContent = open ? 'Chat schließen' : 'Frag Valdara';
    if (open && !loaded) {
      frame.src = workerUrl;
      loaded = true;
    }
    if (open) close.focus();
    else launcher.focus();
  }

  launcher.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
})();
