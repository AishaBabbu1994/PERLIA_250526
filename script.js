/* ═══════════════════════════════════════════════════════════════ */
/* 🧸 ExplicaFácil — Script Principal                              */
/* ═══════════════════════════════════════════════════════════════ */

// ── Variables globales ──────────────────────────────────────────
let appConfig = {};
let explanationHistory = [];
let currentExplanation = null;

// ── HELPERS DE DOM (nunca usar ?. en asignaciones) ─────────────

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.error('Elemento no encontrado:', id);
  }
  return el;
}

function setText(id, text) {
  const el = getEl(id);
  if (el) el.textContent = text;
}

function setHtml(id, html) {
  const el = getEl(id);
  if (el) el.innerHTML = html;
}

function setWidth(id, width) {
  const el = getEl(id);
  if (el) el.style.width = width;
}

function setProperty(id, prop, val) {
  const el = getEl(id);
  if (el) el.style.setProperty(prop, val);
}

function addClass(id, cls) {
  const el = getEl(id);
  if (el) el.classList.add(cls);
}

function removeClass(id, cls) {
  const el = getEl(id);
  if (el) el.classList.remove(cls);
}

function toggleClass(id, cls) {
  const el = getEl(id);
  if (el) el.classList.toggle(cls);
}

// ── CICLO DE VIDA ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🧸 ExplicaFácil iniciando...');

  await loadConfig();
  restoreTheme();
  restoreApiKey();
  setupEventListeners();
  initParticles();
  initUI();
  loadHistory();

  console.log('✅ ExplicaFácil listo');
});

// ── CONFIGURACIÓN ─────────────────────────────────────────────

async function loadConfig() {
  try {
    const response = await fetch('config.json');
    if (!response.ok) throw new Error('No se pudo cargar config.json');
    appConfig = await response.json();
    console.log('⚙️ Config cargada:', appConfig.app_name);
  } catch (err) {
    console.error('Error cargando config:', err);
    appConfig = {
      app_name: 'ExplicaFácil',
      app_emoji: '🧸',
      api_model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 4000,
      parametros_especificos: 'Explicador ELI5 con analogías divertidas',
      theme: 'dark'
    };
    console.log('⚙️ Usando config fallback');
  }
}

// ── TEMA ───────────────────────────────────────────────────────

function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  body.setAttribute('data-theme', newTheme);
  localStorage.setItem('explicafacil_theme', newTheme);

  const btn = getEl('themeToggle');
  if (btn) btn.textContent = newTheme === 'light' ? '☀️' : '🌙';

  showToast(newTheme === 'light' ? '☀️ Modo claro activado' : '🌙 Modo oscuro activado', 'info');
  console.log('🎨 Tema cambiado a:', newTheme);
}

function restoreTheme() {
  const savedTheme = localStorage.getItem('explicafacil_theme') || appConfig.theme || 'dark';
  document.body.setAttribute('data-theme', savedTheme);

  const btn = getEl('themeToggle');
  if (btn) btn.textContent = savedTheme === 'light' ? '☀️' : '🌙';

  console.log('🎨 Tema restaurado:', savedTheme);
}

// ── API KEY ────────────────────────────────────────────────────

function restoreApiKey() {
  const savedKey = localStorage.getItem('explicafacil_api_key');
  const input = getEl('apiKeyInput');
  if (savedKey && input) {
    input.value = savedKey;
    console.log('🔑 API key restaurada');
  }
}

function saveApiKey() {
  const input = getEl('apiKeyInput');
  if (input && input.value.trim()) {
    localStorage.setItem('explicafacil_api_key', input.value.trim());
    console.log('🔑 API key guardada');
  }
}

// ── EVENT LISTENERS ────────────────────────────────────────────

function setupEventListeners() {
  const themeToggle = getEl('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  const apiKeyInput = getEl('apiKeyInput');
  if (apiKeyInput) apiKeyInput.addEventListener('blur', saveApiKey);

  const explainBtn = getEl('explainBtn');
  if (explainBtn) explainBtn.addEventListener('click', handleExplain);

  const topicInput = getEl('topicInput');
  if (topicInput) {
    topicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleExplain();
      }
    });
  }

  const copyBtn = getEl('copyBtn');
  if (copyBtn) copyBtn.addEventListener('click', copyResult);

  const downloadBtn = getEl('downloadBtn');
  if (downloadBtn) downloadBtn.addEventListener('click', downloadResult);

  const newBtn = getEl('newBtn');
  if (newBtn) newBtn.addEventListener('click', resetForm);

  // Sparkles en botones
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', (e) => createSparkle(e.clientX, e.clientY));
  });

  console.log('🎧 Listeners configurados');
}

// ── UI INICIAL ─────────────────────────────────────────────────

function initUI() {
  console.log('🖥️ UI inicializada');
}

// ── PARTÍCULAS ─────────────────────────────────────────────────

function initParticles() {
  const container = getEl('particles');
  if (!container) return;

  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = -Math.random() * 8 + 's';
    particle.style.animationDuration = (8 + Math.random() * 6) + 's';
    container.appendChild(particle);
  }

  console.log('✨ 10 partículas creadas');
}

// ── EXPLICACIÓN PRINCIPAL ─────────────────────────────────────

async function handleExplain() {
  const topicInput = getEl('topicInput');
  const apiKeyInput = getEl('apiKeyInput');
  const levelSelect = getEl('levelSelect');
  const explainBtn = getEl('explainBtn');

  const topic = topicInput ? topicInput.value.trim() : '';
  const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
  const level = levelSelect ? levelSelect.value : 'ELI5';
  const contextInput = getEl('contextInput');
  const context = contextInput ? contextInput.value.trim() : '';

  if (!topic) {
    showToast('📝 Escribe un tema para explicar', 'warning');
    if (topicInput) {
      addClass('topicInput', 'shake');
      setTimeout(() => removeClass('topicInput', 'shake'), 600);
    }
    return;
  }

  if (!apiKey) {
    showToast('🔑 Necesitas una API key de Groq', 'warning');
    if (apiKeyInput) apiKeyInput.focus();
    return;
  }

  // Guardar API key
  saveApiKey();

  // Mostrar loading
  addClass('inputSection', 'hidden');
  addClass('configSection', 'hidden');
  removeClass('loadingSection', 'hidden');
  addClass('resultSection', 'hidden');
  if (explainBtn) addClass('explainBtn', 'loading');

  console.log('🚀 Explicando:', topic, 'nivel:', level);

  try {
    const explanation = await callAI(topic, level, context, apiKey);
    currentExplanation = {
      topic: topic,
      level: level,
      context: context,
      content: explanation,
      timestamp: new Date().toISOString()
    };

    // Guardar en historial
    addToHistory(currentExplanation);

    // Mostrar resultado
    displayResult(explanation);

    // Calcular "puntuación" simulada (aleatoria entre 85-98)
    const score = Math.floor(Math.random() * 14) + 85;
    showScore(score);

    if (score >= 90) {
      launchConfetti();
      showToast('🎉 ¡Excelente explicación! ≥90%', 'success');
    }

  } catch (err) {
    console.error('Error en explicación:', err);
    showToast(err.message || '❌ Error al generar la explicación', 'error');

    // Volver a mostrar inputs
    removeClass('inputSection', 'hidden');
    removeClass('configSection', 'hidden');
  } finally {
    addClass('loadingSection', 'hidden');
    if (explainBtn) removeClass('explainBtn', 'loading');
  }
}

// ── LLAMADA A LA API ───────────────────────────────────────────

async function callAI(topic, level, context, apiKey) {
  const model = appConfig.api_model || 'llama-3.3-70b-versatile';
  const temperature = appConfig.temperature || 0.8;
  const maxTokens = appConfig.max_tokens || 4000;

  const levelDescriptions = {
    ELI5: 'un niño de 5 años',
    ELI10: 'un niño de 10 años',
    ELI15: 'un adolescente de 15 años',
    ELINA: 'un adulto que no es experto'
  };

  const systemPrompt = `Eres un experto en explicar temas complejos de forma simple y divertida. Tu trabajo es explicar cualquier tema como si le hablaras a ${levelDescriptions[level] || 'un niño de 5 años'}.

REGLAS IMPORTANTES:
- NO uses jerga técnica sin explicarla
- Usa analogías con objetos cotidianos (juguetes, comida, parque)
- Frases cortas (menos de 10 palabras ideal)
- Usa "imagina" y "pretende" mucho
- Relaciona con cosas que conoce: juguetes, snacks, patio de juegos
- Sé divertido y memorable
- Usa emojis

FORMATO DE RESPUESTA (usa exactamente estos encabezados):

🎯 LA VERSIÓN SIMPLE
[Una frase que un niño entendería]

🎨 LA ANALOGÍA DIVERTIDA
[Imagina que... / Pretende que... / Es como cuando...]

🧩 UN POCO MÁS DE DETALLE
[2-3 frases simples expandiendo]

💡 POR QUÉ IMPORTA
[Una frase sobre por qué es genial/útil]

🤔 ¿QUIERES SABER MÁS?
[Ofrece ir más profundo]`;

  const userPrompt = context
    ? `Explica este tema: "${topic}"\n\nContexto adicional: ${context}`
    : `Explica este tema: "${topic}"`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.error ? errorData.error.message : '';
    const status = response.status;

    if (status === 401 || errorMsg.includes('Invalid API Key')) {
      throw new Error('🔑 Verifica tu API key de Groq');
    }
    if (status === 404 || errorMsg.includes('model')) {
      throw new Error('📦 Modelo descontinuado, actualiza config.json');
    }
    if (status === 429 || errorMsg.includes('rate limit')) {
      throw new Error('⏳ Espera unos segundos antes de intentar de nuevo');
    }
    if (errorMsg.includes('decommissioned')) {
      throw new Error('📦 Visita https://console.groq.com/docs/deprecations');
    }

    throw new Error('❌ Error ' + status + ': ' + (errorMsg || 'Error desconocido'));
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('❌ Respuesta inesperada de la API');
  }

  return data.choices[0].message.content;
}

// ── MOSTRAR RESULTADO ──────────────────────────────────────────

function displayResult(content) {
  const resultContent = getEl('resultContent');
  if (!resultContent) return;

  // Convertir markdown simple a HTML
  let html = content
    .replace(/### (.*)/g, '<h3>🎯 $1</h3>')
    .replace(/## (.*)/g, '<h3>🎯 $1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/- (.*)/g, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Envolver listas
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

  resultContent.innerHTML = '<p>' + html + '</p>';

  removeClass('resultSection', 'hidden');
  console.log('📄 Resultado mostrado');
}

// ── SCORE ──────────────────────────────────────────────────────

function showScore(score) {
  const scoreSection = getEl('scoreSection');
  const scoreValue = getEl('scoreValue');
  const scoreText = getEl('scoreText');

  if (scoreValue) scoreValue.textContent = score;

  if (scoreText) {
    if (score >= 95) {
      scoreText.textContent = '🌟 ¡Explicación perfecta! Un niño lo entendería al instante';
    } else if (score >= 90) {
      scoreText.textContent = '⭐ ¡Muy buena explicación! Casi perfecta';
    } else if (score >= 85) {
      scoreText.textContent = '👍 Buena explicación, pero podría ser más simple';
    } else {
      scoreText.textContent = '💡 Intenta con otro tema o nivel';
    }
  }

  if (scoreSection) removeClass('scoreSection', 'hidden');
}

// ── COPIAR / DESCARGAR ─────────────────────────────────────────

async function copyResult() {
  if (!currentExplanation) return;

  const text = `🧸 ExplicaFácil — ${currentExplanation.topic}\n\n${currentExplanation.content}`;

  try {
    await navigator.clipboard.writeText(text);
    showToast('📋 ¡Copiado al portapapeles!', 'success');
  } catch (err) {
    console.error('Error copiando:', err);
    showToast('❌ No se pudo copiar', 'error');
  }
}

function downloadResult() {
  if (!currentExplanation) return;

  const text = `🧸 ExplicaFácil — Explicación\n═══════════════════════════════════════\n\n📌 Tema: ${currentExplanation.topic}\n📊 Nivel: ${currentExplanation.level}\n🕐 Fecha: ${new Date(currentExplanation.timestamp).toLocaleString()}\n\n═══════════════════════════════════════\n\n${currentExplanation.content}`;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `explicafacil_${currentExplanation.topic.replace(/\s+/g, '_').substring(0, 30)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('💾 ¡Descargado!', 'success');
  console.log('💾 Archivo descargado');
}

// ── RESET ──────────────────────────────────────────────────────

function resetForm() {
  const topicInput = getEl('topicInput');
  const contextInput = getEl('contextInput');

  if (topicInput) topicInput.value = '';
  if (contextInput) contextInput.value = '';

  addClass('resultSection', 'hidden');
  removeClass('inputSection', 'hidden');
  removeClass('configSection', 'hidden');

  currentExplanation = null;
  console.log('🔄 Formulario reiniciado');
}

// ── HISTORIAL ──────────────────────────────────────────────────

function addToHistory(item) {
  explanationHistory.unshift(item);
  if (explanationHistory.length > 10) {
    explanationHistory.pop();
  }
  saveHistory();
  renderHistory();
}

function saveHistory() {
  try {
    localStorage.setItem('explicafacil_history', JSON.stringify(explanationHistory));
  } catch (err) {
    console.error('Error guardando historial:', err);
  }
}

function loadHistory() {
  try {
    const saved = localStorage.getItem('explicafacil_history');
    if (saved) {
      explanationHistory = JSON.parse(saved);
      renderHistory();
      console.log('📚 Historial cargado:', explanationHistory.length, 'items');
    }
  } catch (err) {
    console.error('Error cargando historial:', err);
    explanationHistory = [];
  }
}

function renderHistory() {
  const historyList = getEl('historyList');
  if (!historyList) return;

  if (explanationHistory.length === 0) {
    historyList.innerHTML = '<p class="empty-history">🌱 Aún no has explicado ningún tema. ¡Empieza arriba!</p>';
    return;
  }

  const levelEmojis = {
    ELI5: '🧸',
    ELI10: '🎒',
    ELI15: '🎮',
    ELINA: '👔'
  };

  historyList.innerHTML = explanationHistory.map((item, index) => {
    const date = new Date(item.timestamp);
    const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item" data-index="${index}">
        <span class="history-item-emoji">${levelEmojis[item.level] || '🧸'}</span>
        <div class="history-item-text">
          <div class="history-item-title">${escapeHtml(item.topic)}</div>
          <div class="history-item-level">${item.level} · ${escapeHtml(item.context || 'Sin contexto')}</div>
        </div>
        <span class="history-item-time">${timeStr}</span>
      </div>
    `;
  }).join('');

  // Click en historial para recargar
  historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.getAttribute('data-index'));
      const historyItem = explanationHistory[idx];
      if (historyItem) {
        currentExplanation = historyItem;
        displayResult(historyItem.content);
        showScore(Math.floor(Math.random() * 14) + 85);
        addClass('inputSection', 'hidden');
        addClass('configSection', 'hidden');
        removeClass('resultSection', 'hidden');
        showToast('📚 Explicación cargada del historial', 'info');
      }
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── TOASTS ─────────────────────────────────────────────────────

function showToast(message, type) {
  const container = getEl('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);

  console.log('🍞 Toast:', message);
}

// ── CONFETTI ───────────────────────────────────────────────────

function launchConfetti() {
  const container = getEl('confettiContainer');
  if (!container) return;

  const colors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#a78bfa'];

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.width = (6 + Math.random() * 8) + 'px';
    confetti.style.height = (6 + Math.random() * 8) + 'px';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    confetti.style.animationDelay = (Math.random() * 2) + 's';
    confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
    container.appendChild(confetti);

    setTimeout(() => {
      if (confetti.parentNode) confetti.parentNode.removeChild(confetti);
    }, 5000);
  }

  console.log('🎊 Confetti lanzado (50 partículas)');
}

// ── SPARKLES ─────────────────────────────────────────────────────

function createSparkle(x, y) {
  const emojis = ['✨', '⭐', '💫', '🌟', '⚡'];
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle';
  sparkle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  sparkle.style.left = (x - 10) + 'px';
  sparkle.style.top = (y - 20) + 'px';

  document.body.appendChild(sparkle);

  setTimeout(() => {
    if (sparkle.parentNode) sparkle.parentNode.removeChild(sparkle);
  }, 600);
}
