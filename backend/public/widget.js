
(function () {
  "use strict";

  var current = document.currentScript;
  if (!current || document.getElementById("atlasia-root")) return;

  var widgetId = current.getAttribute("data-atlasia-widget");
  var apiBase = (current.getAttribute("data-atlasia-api") || "").replace(/\/$/, "");
  var welcomeOverride = (current.getAttribute("data-atlasia-welcome") || "").trim();
  var previewMode = current.getAttribute("data-atlasia-preview") === "true";
  var liveWelcome = welcomeOverride;

  if (!widgetId || !apiBase) {
    console.error("[AtlasIA] Faltan los atributos del widget o la API.");
    return;
  }

  var state = {
    open: false,
    busy: false,
    movable: false,
    conversationId: null,
    config: null,
  };

  function css(color) {
    return `
      #atlasia-root {
        all: initial;
        font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
        color-scheme: dark;
      }

      #atlasia-root * { box-sizing: border-box; }

      #atlasia-root button,
      #atlasia-root input { font: inherit; }

      #atlasia-fab {
        position: fixed;
        z-index: 2147483000;
        right: 92px;
        bottom: 20px;
        width: 50px;
        height: 50px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(190,145,255,.55);
        border-radius: 39px;
        color: white;
        background: linear-gradient(145deg,#8338ec,#35105f);
        box-shadow: 0 8px 35px rgba(70, 43, 222, 0.38);
        cursor: pointer;
        transition: transform .2s, box-shadow .2s;
      }

      #atlasia-fab:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 38px rgba(43, 165, 222, 0.5);
      }

      #atlasia-root[data-anchor="bottom-left"] #atlasia-fab {
        left: 20px;
        right: auto;
      }

      #atlasia-root[data-anchor="bottom-left"] #atlasia-panel {
        left: 20px;
        right: auto;
      }

      #atlasia-root[data-anchor="bottom-center"] #atlasia-fab {
        left: 50%;
        right: auto;
        transform: translateX(-50%);
      }

      #atlasia-root[data-anchor="bottom-center"] #atlasia-fab:hover {
        transform: translateX(-50%) translateY(-3px);
      }

      #atlasia-root[data-anchor="bottom-center"] #atlasia-panel {
        left: 50%;
        right: auto;
        transform: translateX(-50%);
      }

      #atlasia-fab svg { width: 30px; height: 30px; }

      #atlasia-panel {
        position: fixed;
        z-index: 2147483000;
        right: 20px;
        bottom: 92px;
        width: min(400px, calc(100vw - 24px));
        height: min(650px, calc(100dvh - 115px));
        display: none;
        flex-direction: column;
        overflow: hidden;
        color: #f5f1ff;
        background:
          radial-gradient(ellipse at 100% 0%,rgba(112,45,202,.17),transparent 42%),rgba(11, 9, 18, 0.68);
        border: 1px solid rgba(164,111,255,.38);
        border-radius: 10px;
        box-shadow: 0 22px 65px rgba(0, 0, 0, 0.37),0 0 32px rgba(122,52,255,.12);
      }

      #atlasia-panel.open { display: flex; }

      #atlasia-head {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: rgba(255, 255, 255, 0);
        /*border-bottom: 1px solid rgba(255,255,255,.08);*/
      }

      #atlasia-panel[data-movable="true"] #atlasia-head {
        cursor: grab;
        touch-action: none;
        user-select: none;
      }

      #atlasia-panel[data-dragging="true"] #atlasia-head {
        cursor: grabbing;
      }

      #atlasia-resize {
        position: relative;
        align-self: flex-end;
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        margin: 0 18px 2px 0;
        padding: 0;
        border: 0;
        background: transparent;
        cursor: pointer;
        touch-action: manipulation;
      }

      #atlasia-resize::before {
        content: "";
        position: absolute;
        top: 4px;
        right: 4px;
        width: 9px;
        height: 9px;
        border-top: 2px solid rgba(255,255,255,.5);
        border-right: 2px solid rgba(255,255,255,.5);
        border-radius: 0 3px 0 0;
      }

      #atlasia-mark {
        display: grid;
        place-items: center;
        width: 43px;
        height: 43px;
        flex-shrink: 0;
        color: white;
        background: linear-gradient(145deg,${color},#351075);
        border: 1px solid rgba(187,140,255,.4);
        border-radius: 50%;
      }

      #atlasia-mark svg { width: 23px; height: 23px; }

      #atlasia-head-copy { min-width: 0; flex: 1; }

      #atlasia-head strong {
        display: block;
        font-size: 15px;
        font-weight: 700;
      }

      #atlasia-head span {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 5px;
        color: #b8afca;
        font-size: 11px;
      }

      #atlasia-status {
        width: 7px;
        height: 7px;
        flex-shrink: 0;
        background: #55e5a0;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(85,229,160,.4);
      }

      #atlasia-close {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        flex-shrink: 0;
        color: #c9bfdc;
        background: transparent;
        border: 0;
        border-radius: 10px;
        cursor: pointer;
      }

      #atlasia-close svg { width: 18px; height: 18px; display: block; }

      #atlasia-close:hover { background: rgba(255,255,255,.08); }

      #atlasia-intro { padding: 17px 18px 10px; }

      #atlasia-eyebrow {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #b58aff;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.5px;
      }

      #atlasia-eyebrow svg { width: 12px; height: 12px; display: block; }

      #atlasia-intro h2 {
        margin: 10px 0 7px;
        color: #f7f3ff;
        font-size: 20px;
        line-height: 1.3;
        letter-spacing: -.5px;
      }

      #atlasia-intro p {
        margin: 0;
        color: #aaa1bc;
        font-size: 12px;
        line-height: 1.65;
      }

      #atlasia-messages {
        flex: 1;
        min-height: 70px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 13px;
        padding: 12px 16px;
        scrollbar-width: thin;
        scrollbar-color: #503771 transparent;
      }

      .atlasia-row {
        display: flex;
        align-items: flex-end;
        gap: 8px;
      }

      .atlasia-row.visitor { justify-content: flex-end; }

      .atlasia-avatar {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        flex-shrink: 0;
        color: white;
        background: linear-gradient(145deg,${color},#351075);
        border: 1px solid rgba(187,140,255,.35);
        border-radius: 50%;
        font-size: 13px;
      }

      .atlasia-avatar svg { width: 16px; height: 16px; display: block; }

      .atlasia-bubble {
        max-width: 84%;
        padding: 11px 13px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 15px;
        color: #eee8f8;
        font-size: 12px;
        line-height: 1.65;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .atlasia-assistant {
        background: #191624;
        border-bottom-left-radius: 4px;
      }

      .atlasia-visitor {
        background: linear-gradient(135deg,${color},#5220b6);
        border-color: rgba(190,145,255,.3);
        border-bottom-right-radius: 4px;
      }

      #atlasia-quick {
        padding: 12px 16px 14px;
        border-top: 1px solid rgba(255,255,255,.07);
      }

      #atlasia-quick-label {
        margin: 0 0 10px;
        color: #a79bbd;
        font-size: 11px;
      }

      #atlasia-actions {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 8px;
      }

      .atlasia-action {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        min-height: 41px;
        padding: 9px;
        text-align: left;
        color: #e8e0f6;
        background: rgba(255,255,255,.035);
        border: 1px solid rgba(165,119,255,.2);
        border-radius: 11px;
        font-size: 11px !important;
        cursor: pointer;
      }

      .atlasia-action span:first-child {
        color: #b58aff;
        font-size: 16px;
      }

      .atlasia-action:hover {
        background: rgba(145,76,255,.13);
        border-color: rgba(165,119,255,.6);
      }

      #atlasia-form {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 16px;
        padding: 5px 6px 5px 13px;
        background: #171321;
        border: 1px solid rgba(164,111,255,.4);
        border-radius: 14px;
      }

      #atlasia-form:focus-within {
        border-color: #ad79ff;
        box-shadow: 0 0 0 3px rgba(145,76,255,.1);
      }

      #atlasia-input {
        width: 0;
        min-width: 0;
        flex: 1;
        padding: 10px 0;
        color: white;
        background: transparent;
        border: 0;
        outline: none;
        font-size: 12px;
      }

      #atlasia-input::placeholder { color: #827991; }

      #atlasia-send {
        padding: 10px 13px;
        color: white;
        background: linear-gradient(135deg,${color},#6324d5);
        border: 0;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      #atlasia-send:disabled { opacity: .45; cursor: not-allowed; }

      #atlasia-footer {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        padding: 12px 18px 14px;
        color: #9489a8;
        font-size: 10px;
      }

      #atlasia-footer span:first-child {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      #atlasia-footer-dot {
        width: 6px;
        height: 6px;
        background: #55e5a0;
        border-radius: 50%;
      }

      @media(max-width:480px) {
        #atlasia-fab { right: 84px; bottom: 16px; width: 54px; height: 54px; }
        #atlasia-panel {
          right: 12px;
          bottom: 80px;
          width: calc(100vw - 24px);
          height: min(620px,calc(100dvh - 96px));
          border-radius: 10px;
        }
        #atlasia-intro { padding: 14px 15px 9px; }
        #atlasia-messages { padding: 10px 13px; }
        #atlasia-quick { padding: 10px 13px 12px; }
        #atlasia-footer { padding: 10px 14px 12px; }
      }

      #atlasia-panel[data-size="sm"] {
        width: min(300px, calc(100vw - 24px));
        height: min(420px, calc(100dvh - 96px));
      }

      #atlasia-panel[data-size="md"] {
        width: min(340px, calc(100vw - 24px));
        height: min(520px, calc(100dvh - 96px));
      }

      #atlasia-panel[data-size="lg"] {
        width: min(400px, calc(100vw - 24px));
        height: min(650px, calc(100dvh - 96px));
      }

      @media(prefers-reduced-motion:reduce) {
        #atlasia-fab { transition: none; }
      }
    `;
  }

  function el(tag, props, children) {
    var node = document.createElement(tag);

    if (props) {
      Object.keys(props).forEach(function (key) {
        if (key === "className") node.className = props[key];
        else if (key === "text") node.textContent = props[key];
        else if (key.slice(0, 2) === "on") {
          node.addEventListener(key.slice(2).toLowerCase(), props[key]);
        } else {
          node.setAttribute(key, props[key]);
        }
      });
    }

    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });

    return node;
  }

  var atlasMark =
    '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
    '<circle cx="16" cy="16" r="10.5" stroke="currentColor" stroke-width="1.8"/>' +
    '<ellipse cx="16" cy="16" rx="4.8" ry="10.5" stroke="currentColor" stroke-width="1.8"/>' +
    '<path d="M6.2 16h19.6M8.4 11.4h15.2M8.4 20.6h15.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    "</svg>";

  var minimizeMark =
    '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
    '<path d="M7 16h18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
    "</svg>";

  var style = el("style");
  style.textContent = css("#914cff");

  var root = el("div", { id: "atlasia-root" });
  var fab = el("button", {
    id: "atlasia-fab",
    type: "button",
    "aria-label": "Abrir chat AtlasIA",
  });
  fab.innerHTML = atlasMark;

  var panel = el("section", {
    id: "atlasia-panel",
    role: "dialog",
    "aria-label": "Chat AtlasIA",
    "aria-modal": "false",
  });

  var head = el("header", { id: "atlasia-head" });
  var mark = el("div", { id: "atlasia-mark" });
  mark.innerHTML = atlasMark;
  var headCopy = el("div", { id: "atlasia-head-copy" });
  var title = el("strong", { text: "" });
  var subtitle = el("span");
  var status = el("i", { id: "atlasia-status" });
  var close = el("button", {
    id: "atlasia-close",
    type: "button",
    "aria-label": "Minimizar chat",
  });
  close.innerHTML = minimizeMark;

  subtitle.appendChild(status);
  subtitle.appendChild(document.createTextNode("Conectando..."));
  headCopy.appendChild(title);
  headCopy.appendChild(subtitle);
  head.appendChild(mark);
  head.appendChild(headCopy);
  head.appendChild(close);

  var messages = el("div", { id: "atlasia-messages", "aria-live": "polite" });

  var form = el("form", { id: "atlasia-form" });
  var input = el("input", {
    id: "atlasia-input",
    type: "text",
    placeholder: "Escribe tu mensaje...",
    autocomplete: "off",
    "aria-label": "Escribe tu mensaje",
    maxlength: "4000",
  });
  var send = el("button", {
    id: "atlasia-send",
    type: "submit",
    text: "Enviar",
  });

  form.appendChild(input);
  form.appendChild(send);

  var footer = el("footer", { id: "atlasia-footer" });
  var footerLeft = el("span");
  footerLeft.appendChild(el("i", { id: "atlasia-footer-dot" }));
  footerLeft.appendChild(document.createTextNode("Impulsado por Nuvcore"));
  footer.appendChild(footerLeft);
  footer.appendChild(el("span", { text: "AtlasIA · AI Assistant" }));

  var resizeHandle = el("button", {
    id: "atlasia-resize",
    type: "button",
    "aria-label": "Cambiar tamaño del chat",
  });

  panel.appendChild(head);
  panel.appendChild(messages);
  panel.appendChild(resizeHandle);
  panel.appendChild(form);
  panel.appendChild(footer);

  root.appendChild(style);
  root.appendChild(panel);
  root.appendChild(fab);
  document.body.appendChild(root);

  function addBubble(role, text) {
    var row = el("div", { className: "atlasia-row " + role });

    if (role === "assistant") {
      var avatar = el("div", { className: "atlasia-avatar" });
      avatar.innerHTML = atlasMark;
      row.appendChild(avatar);
    }

    row.appendChild(el("div", {
      className: "atlasia-bubble atlasia-" + role,
      text: String(text || ""),
    }));

    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function applyLiveWelcome(text) {
    var next = String(text || "").trim().slice(0, 500);
    if (!next) return;
    liveWelcome = next;
    var bubble = messages.querySelector(".atlasia-bubble.atlasia-assistant");
    if (bubble) bubble.textContent = next;
  }

  if (previewMode) {
    window.addEventListener("message", function (event) {
      var data = event.data;
      if (!data || data.type !== "atlasia-set-welcome") return;
      applyLiveWelcome(data.welcome);
    });
  }

  function setOpen(open) {
    state.open = open;
    panel.classList.toggle("open", open);
    fab.style.display = open ? "none" : "";
    fab.setAttribute("aria-label", "Abrir chat AtlasIA");
    fab.innerHTML = atlasMark;

    if (open) {
      applySavedSize();
      applySavedPosition();
      input.focus();
    }
  }

  fab.addEventListener("click", function () {
    setOpen(!state.open);
  });

  if (current.getAttribute("data-atlasia-open") === "true") {
    setOpen(true);
  }

  close.addEventListener("click", function () {
    setOpen(false);
  });

  var positionKey = "atlasia-panel-pos:" + widgetId;
  var drag = null;

  function readSavedPosition() {
    try {
      var raw = localStorage.getItem(positionKey);
      if (!raw) return null;
      var pos = JSON.parse(raw);
      if (!pos || typeof pos.left !== "number" || typeof pos.top !== "number") {
        return null;
      }
      return pos;
    } catch (error) {
      return null;
    }
  }

  function clampPanel(left, top) {
    var width = panel.offsetWidth;
    var margin = 8;
    var maxLeft = Math.max(margin, window.innerWidth - width - margin);
    var maxTop = Math.max(margin, window.innerHeight - 64);

    return {
      left: Math.round(Math.min(Math.max(margin, left), maxLeft)),
      top: Math.round(Math.min(Math.max(margin, top), maxTop)),
    };
  }

  function placePanel(left, top, persist) {
    if (!panel.offsetWidth) return;
    var next = clampPanel(left, top);
    panel.style.left = next.left + "px";
    panel.style.top = next.top + "px";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.transform = "none";
    panel.setAttribute("data-dragged", "true");

    if (!persist) return;

    try {
      localStorage.setItem(positionKey, JSON.stringify(next));
    } catch (error) {}
  }

  function applySavedPosition() {
    if (!state.movable || drag || !state.open || !panel.offsetWidth) return;
    var saved = readSavedPosition();
    if (!saved) return;
    placePanel(saved.left, saved.top, false);
  }

  function endDrag(event) {
    if (!drag) return;
    drag = null;
    panel.removeAttribute("data-dragging");

    if (
      event &&
      head.hasPointerCapture &&
      head.hasPointerCapture(event.pointerId)
    ) {
      head.releasePointerCapture(event.pointerId);
    }

    var rect = panel.getBoundingClientRect();
    placePanel(rect.left, rect.top, true);
  }

  function applyAnchor() {
    var config = state.config;
    var position =
      config &&
      (config.position === "bottom-left" || config.position === "bottom-center")
        ? config.position
        : "bottom-right";
    var previous = null;

    try {
      previous = localStorage.getItem("atlasia-panel-anchor:" + widgetId);
    } catch (error) {}

    if (previous && previous !== position) {
      try {
        localStorage.removeItem(positionKey);
      } catch (error) {}
      panel.removeAttribute("data-dragged");
    }

    try {
      localStorage.setItem("atlasia-panel-anchor:" + widgetId, position);
    } catch (error) {}

    root.setAttribute("data-anchor", position);
    if (panel.getAttribute("data-dragged") === "true") return;

    panel.style.left = "";
    panel.style.top = "";
    panel.style.right = "";
    panel.style.bottom = "";
    panel.style.transform = "";
    fab.style.left = "";
    fab.style.right = "";
    fab.style.transform = "";
  }

  function setMovable(enabled) {
    state.movable = !!enabled;
    if (state.movable) {
      panel.setAttribute("data-movable", "true");
      applySavedPosition();
      return;
    }

    panel.removeAttribute("data-movable");
    panel.removeAttribute("data-dragging");
    drag = null;
    if (panel.getAttribute("data-dragged") !== "true") {
      applyAnchor();
      return;
    }

    panel.removeAttribute("data-dragged");
    panel.style.left = "";
    panel.style.top = "";
    panel.style.right = "";
    panel.style.bottom = "";
    panel.style.transform = "";
    applyAnchor();
  }

  head.addEventListener("pointerdown", function (event) {
    if (!state.movable) return;
    if (event.button !== 0) return;
    if (event.target.closest && event.target.closest("button")) return;

    var rect = panel.getBoundingClientRect();
    drag = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
    };
    placePanel(rect.left, rect.top, false);
    panel.setAttribute("data-dragging", "true");
    try {
      head.setPointerCapture(event.pointerId);
    } catch (error) {}
    event.preventDefault();
  });

  head.addEventListener("pointermove", function (event) {
    if (!drag) return;
    placePanel(event.clientX - drag.dx, event.clientY - drag.dy, false);
  });

  head.addEventListener("pointerup", endDrag);
  head.addEventListener("pointercancel", endDrag);

  window.addEventListener("resize", function () {
    if (panel.getAttribute("data-dragged") !== "true" || !panel.offsetWidth) return;
    var rect = panel.getBoundingClientRect();
    placePanel(rect.left, rect.top, true);
  });

  var sizeKey = "atlasia-panel-size:" + widgetId;
  var sizeOrder = ["sm", "md", "lg"];
  var sizeLabel = { sm: "Chico", md: "Mediano", lg: "Grande" };

  function readSavedSize() {
    try {
      var raw = localStorage.getItem(sizeKey);
      if (raw === "sm" || raw === "md" || raw === "lg") return raw;
      if (raw) localStorage.removeItem(sizeKey);
    } catch (error) {}
    return null;
  }

  function applyWidgetSize(size, persist) {
    if (size !== "sm" && size !== "md") size = "lg";
    panel.style.width = "";
    panel.style.height = "";
    panel.removeAttribute("data-resized");
    panel.setAttribute("data-size", size);
    resizeHandle.setAttribute(
      "aria-label",
      "Tamaño " + sizeLabel[size] + ". Cambiar tamaño"
    );
    resizeHandle.title = sizeLabel[size];
    if (!persist) return;

    try {
      localStorage.setItem(sizeKey, size);
    } catch (error) {}
  }

  function applySavedSize() {
    var saved = readSavedSize();
    if (!saved) return;
    applyWidgetSize(saved, false);
  }

  resizeHandle.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    var current = panel.getAttribute("data-size");
    var index = sizeOrder.indexOf(current);
    if (index < 0) index = 2;
    applyWidgetSize(sizeOrder[(index + 1) % sizeOrder.length], true);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendMessage(input.value);
  });

  function sendMessage(text) {
    text = String(text || "").trim();

    if (!text || state.busy) return;

    state.busy = true;
    send.disabled = true;
    input.disabled = true;
    addBubble("visitor", text);
    input.value = "";

    var payload = { message: text };

    if (state.conversationId) {
      payload.conversationId = state.conversationId;
    }

    fetch(
      apiBase + "/public/widgets/" + encodeURIComponent(widgetId) + "/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function () {
            throw new Error("HTTP " + res.status);
          });
        }

        return res.json();
      })
      .then(function (data) {
        if (data.conversationId) {
          state.conversationId = data.conversationId;
        }

        // Mantiene el contrato de respuesta utilizado por el widget actual.
        var list = Array.isArray(data.messages) ? data.messages : [];
        var last = list.length ? list[list.length - 1] : null;

        if (last && last.role === "ASSISTANT" && last.content) {
          addBubble("assistant", last.content);
        } else if (data.reply || data.response || data.answer) {
          addBubble("assistant", data.reply || data.response || data.answer);
        } else {
          throw new Error("La respuesta de la API no contiene un mensaje reconocible.");
        }
      })
      .catch(function (error) {
        console.error("[AtlasIA] Error de chat:", error);
        addBubble(
          "assistant",
          "No pude obtener una respuesta en este momento. Intenta nuevamente en unos segundos."
        );
      })
      .finally(function () {
        state.busy = false;
        send.disabled = false;
        input.disabled = false;

        if (state.open) input.focus();
      });
  }

  fetch(apiBase + "/public/widgets/" + encodeURIComponent(widgetId))
    .then(function (res) {
      if (!res.ok) throw new Error("Widget no disponible: HTTP " + res.status);
      return res.json();
    })
    .then(function (config) {
      state.config = config;

      var color = /^#[0-9a-f]{6}$/i.test(config.primaryColor || "")
        ? config.primaryColor
        : "#914cff";

      style.textContent = css(color);
      title.textContent =
        (config.agent && config.agent.company && config.agent.company.name) ||
        (config.agent && config.agent.name) ||
        "Atlas IA";

      subtitle.replaceChildren(status, document.createTextNode("En línea"));

      var welcome =
        liveWelcome ||
        config.welcomeMessage ||
        "¡Hola! ¿En qué te puedo ayudar?";

      addBubble("assistant", welcome);

      applyWidgetSize(
        readSavedSize() ||
          (config.size === "sm" || config.size === "md" ? config.size : "lg"),
        false
      );
      setMovable(config.movable !== false);
      applyAnchor();
    })
    .catch(function (error) {
      console.error("[AtlasIA] No se pudo cargar la configuración:", error);
      subtitle.replaceChildren(document.createTextNode("No disponible"));
      addBubble(
        "assistant",
        "No pude cargar la configuración del asistente. Intenta recargar la página."
      );
    });
})();
