const APP_META = {
  notepad: { title: 'Notepad', width: 520, height: 420 },
  files: { title: 'Files', width: 700, height: 460 },
  browser: { title: 'Browser', width: 760, height: 500 },
  terminal: { title: 'Terminal', width: 620, height: 420 },
  calculator: { title: 'Calculator', width: 360, height: 420 }
};

const state = {
  windows: [],
  nextId: 1,
  activeApp: null,
  browserUrl: 'https://example.com',
  fileSystem: {
    'Home/Welcome.txt': 'Vítejte ve Web OS!\n\nToto je zjednodušený online desktopový pracovní prostor.\n\n- otevřete soubory\n- zapište poznámky\n- použijte kalkulačku\n- prozkoumejte terminál',
    'Documents/Projekt.txt': 'Návrh Web OS\n\n1. UI desktopu\n2. Plocha pro aplikace\n3. Start menu\n4. Systémová lišta',
    'Documents/Idea.md': '# Idea\n\nVytvořit jednoduchý online počítač pro práci v prohlížeči.',
    'Pictures/Wallpapers.txt': 'Web OS wallpaper concept\n\n- neon modrá\n- tmavý design\n- elegantní taskbar'
  },
  selectedFile: 'Home/Welcome.txt'
};

const desktopIcons = document.getElementById('desktop-icons');
const windowsLayer = document.getElementById('windows-layer');
const taskbarApps = document.getElementById('taskbar-apps');
const startMenu = document.getElementById('start-menu');
const startButton = document.getElementById('start-button');
const clock = document.getElementById('clock');

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

setInterval(updateClock, 1000);
updateClock();

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast visible';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 220);
  }, 1500);
}

function desktopIcon(name, app, emoji) {
  const el = document.createElement('button');
  el.className = 'desktop-icon';
  el.type = 'button';
  el.innerHTML = `
    <div class="icon">${emoji}</div>
    <div class="label">${name}</div>
  `;
  el.addEventListener('click', () => openApp(app));
  desktopIcons.appendChild(el);
}

function buildDesktopIcons() {
  desktopIcon('Notepad', 'notepad', '✎');
  desktopIcon('Files', 'files', '📁');
  desktopIcon('Browser', 'browser', '🌐');
  desktopIcon('Terminal', 'terminal', '⌨');
  desktopIcon('Calculator', 'calculator', '🧮');
}

function openApp(app) {
  const existing = state.windows.find((win) => win.type === app);
  if (existing) {
    const element = document.getElementById(existing.id);
    if (element && existing.minimized) {
      element.style.display = 'block';
      existing.minimized = false;
    }
    focusWindow(existing.id);
    return;
  }

  const meta = APP_META[app];
  const id = `window-${state.nextId++}`;
  const win = {
    id,
    type: app,
    title: meta.title,
    x: 100 + (state.windows.length * 28),
    y: 80 + (state.windows.length * 22),
    width: meta.width,
    height: meta.height,
    z: state.windows.length + 10,
    minimized: false,
    maximized: false
  };

  state.windows.push(win);
  renderWindow(win);
  renderTaskbar();
  focusWindow(id);
}

function renderWindow(win) {
  const wrapper = document.createElement('div');
  wrapper.className = 'window';
  wrapper.id = win.id;
  wrapper.style.width = `${win.width}px`;
  wrapper.style.height = `${win.height}px`;
  wrapper.style.left = `${win.x}px`;
  wrapper.style.top = `${win.y}px`;
  wrapper.style.zIndex = win.z;

  wrapper.innerHTML = `
    <div class="window-header">
      <div class="window-title">${win.title}</div>
      <div class="window-controls">
        <button class="control-btn minimize" data-action="minimize" data-id="${win.id}" aria-label="Minimize"></button>
        <button class="control-btn maximize" data-action="maximize" data-id="${win.id}" aria-label="Maximize"></button>
        <button class="control-btn close" data-action="close" data-id="${win.id}" aria-label="Close"></button>
      </div>
    </div>
    <div class="window-content"></div>
  `;

  if (win.type === 'notepad') {
    const content = wrapper.querySelector('.window-content');
    content.innerHTML = `
      <div class="app-content notepad-content">
        <textarea id="note-${win.id}" class="notepad-editor">${state.fileSystem['Home/Welcome.txt'] || ''}</textarea>
        <div class="secondary-bar">
          <button class="secondary-btn" data-save="${win.id}">Uložit</button>
        </div>
      </div>
    `;

    const textarea = document.getElementById(`note-${win.id}`);
    textarea.addEventListener('input', () => {
      state.fileSystem['Home/Welcome.txt'] = textarea.value;
    });

    const saveButton = content.querySelector('[data-save]');
    saveButton.addEventListener('click', () => {
      localStorage.setItem('web-os-note', textarea.value);
      showToast('Poznámka uložena');
    });
  }

  if (win.type === 'files') {
    wrapper.querySelector('.window-content').innerHTML = `
      <div class="app-content files-content">
        <div class="files-layout">
          <div class="file-list">
            <ul id="file-list-${win.id}"></ul>
          </div>
          <div class="file-preview">
            <h3 id="file-name-${win.id}"></h3>
            <pre id="file-content-${win.id}"></pre>
          </div>
        </div>
      </div>
    `;
    renderFileExplorer(win.id);
  }

  if (win.type === 'browser') {
    wrapper.querySelector('.window-content').innerHTML = `
      <div class="app-content browser-content">
        <div class="browser-bar">
          <input id="browser-url-${win.id}" value="${state.browserUrl}" />
          <button class="primary-btn" data-browser-go="${win.id}">Go</button>
        </div>
        <div class="browser-page" id="browser-page-${win.id}">
          <h2>Vítejte ve Web Browseru</h2>
          <p>Tohle je jednoduchá webová aplikace pro prohlížení stránek v rámci vašeho virtuálního operačního systému.</p>
          <p>Prozkoumejte například stránky jako:</p>
          <ul>
            <li>https://example.com</li>
            <li>https://github.com</li>
            <li>https://developer.mozilla.org</li>
          </ul>
        </div>
      </div>
    `;

    const input = document.getElementById(`browser-url-${win.id}`);
    const page = document.getElementById(`browser-page-${win.id}`);
    const go = wrapper.querySelector('[data-browser-go]');

    go.addEventListener('click', () => {
      const url = input.value.trim();
      if (!url) return;
      state.browserUrl = url;
      const target = url.startsWith('http') ? url : `https://${url}`;
      page.innerHTML = `<h2>${target}</h2><p>Načítání obsahu...</p>`;

      fetch(`https://r.jina.ai/http://` + target.replace(/^https?:\/\//, ''))
        .then((response) => response.text())
        .then((text) => {
          page.innerHTML = `<h2>${target}</h2><pre>${escapeHtml(text.slice(0, 4000))}</pre>`;
        })
        .catch(() => {
          page.innerHTML = `<h2>${target}</h2><p>Prohlížeč nepodařilo načíst obsah, ale aplikace běží správně.</p>`;
        });
    });
  }

  if (win.type === 'terminal') {
    wrapper.querySelector('.window-content').innerHTML = `
      <div class="app-content terminal-content">
        <div class="terminal-output" id="terminal-output-${win.id}">web-os$ welcome
System ready. Type 'help' to see available commands.</div>
        <div class="terminal-input">
          <input id="terminal-input-${win.id}" placeholder="zadejte příkaz..." />
          <button class="primary-btn" data-terminal-run="${win.id}">Spustit</button>
        </div>
      </div>
    `;

    const input = document.getElementById(`terminal-input-${win.id}`);
    const output = document.getElementById(`terminal-output-${win.id}`);
    const runBtn = wrapper.querySelector('[data-terminal-run]');
    const runCommand = () => {
      const command = input.value.trim();
      if (!command) return;
      const nextLine = `web-os$ ${command}`;
      output.textContent += `\n${nextLine}`;
      input.value = '';
      const result = handleTerminalCommand(command, win.id);
      if (result) output.textContent += `\n${result}`;
      output.scrollTop = output.scrollHeight;
    };

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') runCommand();
    });
    runBtn.addEventListener('click', runCommand);
  }

  if (win.type === 'calculator') {
    wrapper.querySelector('.window-content').innerHTML = `
      <div class="app-content calculator-content">
        <div class="calc-screen" id="calc-screen-${win.id}">0</div>
        <div class="calculator-grid">
          <button class="calc-key operator" data-value="C">C</button>
          <button class="calc-key operator" data-value="/">/</button>
          <button class="calc-key operator" data-value="*">×</button>
          <button class="calc-key operator" data-value="DEL">DEL</button>

          <button class="calc-key" data-value="7">7</button>
          <button class="calc-key" data-value="8">8</button>
          <button class="calc-key" data-value="9">9</button>
          <button class="calc-key operator" data-value="-">−</button>

          <button class="calc-key" data-value="4">4</button>
          <button class="calc-key" data-value="5">5</button>
          <button class="calc-key" data-value="6">6</button>
          <button class="calc-key operator" data-value="+">+</button>

          <button class="calc-key" data-value="1">1</button>
          <button class="calc-key" data-value="2">2</button>
          <button class="calc-key" data-value="3">3</button>
          <button class="calc-key equals" data-value="=">=</button>

          <button class="calc-key" data-value="0" style="grid-column: span 3;">0</button>
          <button class="calc-key" data-value=".">.</button>
        </div>
      </div>
    `;

    const screen = document.getElementById(`calc-screen-${win.id}`);
    let display = '0';
    let currentExpression = '';

    wrapper.querySelectorAll('.calc-key').forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        if (value === 'C') {
          display = '0';
          currentExpression = '';
        } else if (value === 'DEL') {
          display = display.length > 1 ? display.slice(0, -1) : '0';
          currentExpression = currentExpression.slice(0, -1);
        } else if (value === '=') {
          try {
            const result = Function(`"use strict"; return (${currentExpression || display})`)();
            display = Number.isFinite(result) ? String(result) : 'Error';
            currentExpression = display;
          } catch {
            display = 'Error';
            currentExpression = '';
          }
        } else if (['+', '-', '*', '/'].includes(value)) {
          currentExpression += value;
          display = value;
        } else {
          currentExpression += value;
          display = display === '0' ? value : display + value;
        }
        screen.textContent = display;
      });
    });
  }

  wrapper.addEventListener('pointerdown', () => focusWindow(win.id));

  const controls = wrapper.querySelectorAll('[data-action]');
  controls.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'close') closeWindow(win.id);
      if (action === 'minimize') minimizeWindow(win.id);
      if (action === 'maximize') maximizeWindow(win.id);
    });
  });

  enableWindowDrag(wrapper, win);
  windowsLayer.appendChild(wrapper);
}

function maximizeWindow(id) {
  const win = state.windows.find((item) => item.id === id);
  if (!win) return;
  win.maximized = !win.maximized;
  const element = document.getElementById(id);
  if (!element) return;

  if (win.maximized) {
    win.previousX = win.x;
    win.previousY = win.y;
    win.previousWidth = win.width;
    win.previousHeight = win.height;
    element.style.left = '12px';
    element.style.top = '12px';
    element.style.width = `calc(100vw - 24px)`;
    element.style.height = `calc(100vh - 76px)`;
  } else {
    element.style.left = `${win.previousX || win.x}px`;
    element.style.top = `${win.previousY || win.y}px`;
    element.style.width = `${win.previousWidth || win.width}px`;
    element.style.height = `${win.previousHeight || win.height}px`;
  }
}

function minimizeWindow(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.style.display = 'none';
  const app = state.windows.find((win) => win.id === id);
  if (app) app.minimized = true;
  renderTaskbar();
}

function closeWindow(id) {
  const idx = state.windows.findIndex((win) => win.id === id);
  if (idx >= 0) {
    state.windows.splice(idx, 1);
    const element = document.getElementById(id);
    if (element) element.remove();
  }
  renderTaskbar();
}

function renderTaskbar() {
  taskbarApps.innerHTML = '';
  state.windows.forEach((win) => {
    const btn = document.createElement('button');
    btn.className = `taskbar-item ${state.activeApp === win.id ? 'active' : ''}`;
    btn.textContent = win.title;
    btn.addEventListener('click', () => {
      const element = document.getElementById(win.id);
      if (element && win.minimized) {
        element.style.display = 'block';
        win.minimized = false;
      }
      focusWindow(win.id);
    });
    taskbarApps.appendChild(btn);
  });
}

function focusWindow(id) {
  state.windows.forEach((win) => {
    const element = document.getElementById(win.id);
    if (!element) return;
    const active = win.id === id;
    element.classList.toggle('focused', active);
    if (active) {
      element.style.zIndex = String(100 + state.windows.indexOf(win));
      state.activeApp = id;
    } else {
      element.style.zIndex = String(10 + state.windows.indexOf(win));
    }
  });
  renderTaskbar();
}

function enableWindowDrag(element, win) {
  const header = element.querySelector('.window-header');
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener('pointerdown', (event) => {
    if (event.target.matches('button')) return;
    offsetX = event.clientX - element.offsetLeft;
    offsetY = event.clientY - element.offsetTop;
    element.setPointerCapture(event.pointerId);
    element.addEventListener('pointermove', onDrag);
    element.addEventListener('pointerup', stopDrag);
  });

  function onDrag(event) {
    if (win.maximized) return;
    win.x = Math.max(0, Math.min(event.clientX - offsetX, window.innerWidth - win.width));
    win.y = Math.max(0, Math.min(event.clientY - offsetY, window.innerHeight - win.height - 52));
    element.style.left = `${win.x}px`;
    element.style.top = `${win.y}px`;
  }

  function stopDrag() {
    element.removeEventListener('pointermove', onDrag);
    element.removeEventListener('pointerup', stopDrag);
  }
}

function renderFileExplorer(id) {
  const list = document.getElementById(`file-list-${id}`);
  const fileName = document.getElementById(`file-name-${id}`);
  const content = document.getElementById(`file-content-${id}`);
  const files = Object.keys(state.fileSystem);

  list.innerHTML = '';
  files.forEach((path) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.textContent = path;
    button.type = 'button';
    if (path === state.selectedFile) button.classList.add('active');
    button.addEventListener('click', () => {
      state.selectedFile = path;
      renderFileExplorer(id);
    });
    li.appendChild(button);
    list.appendChild(li);
  });

  const selected = state.fileSystem[state.selectedFile] || 'Soubor není k dispozici';
  fileName.textContent = state.selectedFile;
  content.textContent = selected;
}

function handleTerminalCommand(command, id) {
  const lower = command.toLowerCase();
  if (lower === 'help') {
    return 'Dostupné příkazy:\nhelp\nls\nopen notes\nopen files\nclear\nwhoami\nclock\nshutdown';
  }
  if (lower === 'ls') {
    return Object.keys(state.fileSystem).join('\n');
  }
  if (lower.startsWith('open ')) {
    const app = lower.replace('open ', '').trim();
    if (app === 'notes' || app === 'notepad') {
      openApp('notepad');
      return 'Notepad otevřen.';
    }
    if (app === 'files') {
      openApp('files');
      return 'Files otevřeny.';
    }
    if (app === 'browser') {
      openApp('browser');
      return 'Browser otevřen.';
    }
    if (app === 'calculator') {
      openApp('calculator');
      return 'Kalkulačka otevřena.';
    }
    return `Aplikace "${app}" nebyla nalezena.`;
  }
  if (lower === 'clear') {
    const output = document.getElementById(`terminal-output-${id}`);
    output.textContent = 'web-os$ welcome\nSystem ready. Type "help" to see commands.';
    return '';
  }
  if (lower === 'whoami') {
    return 'guest';
  }
  if (lower === 'clock') {
    return new Date().toLocaleTimeString();
  }
  if (lower === 'shutdown') {
    return 'System shutdown requested.';
  }
  return 'Neznámý příkaz.';
}

startButton.addEventListener('click', () => {
  startMenu.classList.toggle('hidden');
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('#start-button') && !event.target.closest('#start-menu')) {
    startMenu.classList.add('hidden');
  }
});

startMenu.querySelectorAll('.menu-item').forEach((button) => {
  button.addEventListener('click', () => {
    openApp(button.dataset.app);
    startMenu.classList.add('hidden');
  });
});

const savedNote = localStorage.getItem('web-os-note');
if (savedNote) {
  state.fileSystem['Home/Welcome.txt'] = savedNote;
}

buildDesktopIcons();
openApp('files');
openApp('notepad');

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
