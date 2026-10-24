(function () {
  'use strict';

  var current = document.currentScript;
  if (!current) return;

  var widgetId = current.getAttribute('data-atlasia-widget');
  var apiBase = (current.getAttribute('data-atlasia-api') || '').replace(/\/$/, '');
  if (!widgetId || !apiBase) {
    console.error('[AtlasIA] Faltan data-atlasia-widget o data-atlasia-api');
    return;
  }

  var state = {
    open: false,
    busy: false,
    conversationId: null,
    config: null,
  };

  function css(color) {
    var accent = color || '#7e1c8a';
    return [
      '#atlasia-root{all:initial;font-family:Segoe UI,Helvetica Neue,sans-serif}',
      '#atlasia-root *{box-sizing:border-box}',
      '#atlasia-fab{position:fixed;z-index:2147483000;right:20px;bottom:20px;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:14px 18px;background:linear-gradient(155deg,#0b1d3f 0%,#3e0d6e 42%,' +
        accent +
        ' 100%);color:#f8f4ff;font:700 14px/1 Segoe UI,sans-serif;cursor:pointer;box-shadow:0 14px 34px rgba(16,24,32,.28)}',
      '#atlasia-panel{position:fixed;z-index:2147483000;right:20px;bottom:84px;width:min(360px,calc(100vw - 24px));height:min(520px,calc(100vh - 120px));display:none;flex-direction:column;background:#fff;border:1px solid #e4e8ee;border-radius:18px;overflow:hidden;box-shadow:0 22px 50px rgba(16,24,32,.22);color:#101820}',
      '#atlasia-panel.open{display:flex}',
      '#atlasia-head{padding:14px 16px;background:linear-gradient(155deg,#0b1d3f 0%,#3e0d6e 42%,' +
        accent +
        ' 100%);color:#f8f4ff}',
      '#atlasia-head strong{display:block;font:700 15px/1.2 Segoe UI,sans-serif}',
      '#atlasia-head span{display:block;margin-top:4px;opacity:.85;font:400 12px/1.3 Segoe UI,sans-serif}',
      '#atlasia-messages{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f7f8fa}',
      '.atlasia-bubble{max-width:85%;padding:10px 12px;border-radius:14px;font:400 13px/1.45 Segoe UI,sans-serif;white-space:pre-wrap}',
      '.atlasia-assistant{align-self:flex-start;background:#fff;border:1px solid #e4e8ee}',
      '.atlasia-visitor{align-self:flex-end;background:rgba(126,28,138,.1);border:1px solid rgba(126,28,138,.2)}',
      '#atlasia-form{display:flex;gap:8px;padding:12px;border-top:1px solid #e4e8ee;background:#fff}',
      '#atlasia-input{flex:1;border:1px solid #e4e8ee;border-radius:12px;padding:10px 12px;font:400 13px/1.3 Segoe UI,sans-serif}',
      '#atlasia-send{border:0;border-radius:12px;padding:10px 14px;background:' +
        accent +
        ';color:#fff;font:700 13px Segoe UI,sans-serif;cursor:pointer}',
      '#atlasia-send:disabled{opacity:.55;cursor:not-allowed}',
    ].join('');
  }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        if (key === 'className') node.className = props[key];
        else if (key === 'text') node.textContent = props[key];
        else if (key.slice(0, 2) === 'on') node.addEventListener(key.slice(2).toLowerCase(), props[key]);
        else node.setAttribute(key, props[key]);
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function addBubble(role, text) {
    var bubble = el('div', {
      className: 'atlasia-bubble atlasia-' + role,
      text: text,
    });
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  var style = el('style', { text: css('#7e1c8a') });
  var root = el('div', { id: 'atlasia-root' });
  var fab = el('button', {
    id: 'atlasia-fab',
    type: 'button',
    text: 'Chat',
    'aria-label': 'Abrir chat AtlasIA',
  });
  var panel = el('div', { id: 'atlasia-panel', role: 'dialog', 'aria-label': 'Chat AtlasIA' });
  var head = el('div', { id: 'atlasia-head' });
  var headTitle = el('strong', { text: 'AtlasIA' });
  var headSub = el('span', { text: 'Estamos listos para ayudarte' });
  var messages = el('div', { id: 'atlasia-messages' });
  var form = el('form', { id: 'atlasia-form' });
  var input = el('input', {
    id: 'atlasia-input',
    type: 'text',
    placeholder: 'Escribe un mensaje...',
    autocomplete: 'off',
  });
  var send = el('button', { id: 'atlasia-send', type: 'submit', text: 'Enviar' });

  head.appendChild(headTitle);
  head.appendChild(headSub);
  form.appendChild(input);
  form.appendChild(send);
  panel.appendChild(head);
  panel.appendChild(messages);
  panel.appendChild(form);
  root.appendChild(style);
  root.appendChild(panel);
  root.appendChild(fab);
  document.body.appendChild(root);

  fab.addEventListener('click', function () {
    state.open = !state.open;
    panel.classList.toggle('open', state.open);
    fab.textContent = state.open ? 'Cerrar' : 'Chat';
    if (state.open) input.focus();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var text = (input.value || '').trim();
    if (!text || state.busy) return;
    sendMessage(text);
  });

  function sendMessage(text) {
    state.busy = true;
    send.disabled = true;
    input.value = '';
    addBubble('visitor', text);

    fetch(apiBase + '/public/widgets/' + encodeURIComponent(widgetId) + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        conversationId: state.conversationId || undefined,
      }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('No se pudo enviar el mensaje');
        return res.json();
      })
      .then(function (data) {
        state.conversationId = data.conversationId || state.conversationId;
        var list = data.messages || [];
        var last = list[list.length - 1];
        if (last && last.role === 'ASSISTANT') {
          addBubble('assistant', last.content);
        } else {
          addBubble('assistant', 'Gracias. En un momento te respondemos.');
        }
      })
      .catch(function () {
        addBubble('assistant', 'No pude conectar con el asistente. Intenta de nuevo.');
      })
      .finally(function () {
        state.busy = false;
        send.disabled = false;
        input.focus();
      });
  }

  fetch(apiBase + '/public/widgets/' + encodeURIComponent(widgetId))
    .then(function (res) {
      if (!res.ok) throw new Error('Widget no disponible');
      return res.json();
    })
    .then(function (config) {
      state.config = config;
      var color = config.primaryColor || '#7e1c8a';
      style.textContent = css(color);
      headTitle.textContent = (config.agent && config.agent.name) || config.name || 'AtlasIA';
      headSub.textContent = config.welcomeMessage || '¿En qué puedo ayudarte?';
      addBubble('assistant', config.welcomeMessage || 'Hola, ¿en qué puedo ayudarte?');
      if (config.position === 'bottom-left') {
        fab.style.left = '20px';
        fab.style.right = 'auto';
        panel.style.left = '20px';
        panel.style.right = 'auto';
      }
    })
    .catch(function (error) {
      console.error('[AtlasIA]', error);
      fab.style.display = 'none';
    });
})();
