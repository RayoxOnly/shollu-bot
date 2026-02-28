// ─── API Helper ───────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (path.includes('/api/export') && res.ok) {
    return res;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── Toast ────────────────────────────────────────────
let toastTimeout;
function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.className = `toast ${type}`;
  requestAnimationFrame(() => toast.classList.add('show'));
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── XSS Escape ───────────────────────────────────────
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Theme ────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('shollu-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('shollu-theme', next);
  updateThemeIcon(next);
  // Also save to server
  api('POST', '/api/settings', { theme: next }).catch(() => {});
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ─── Navigation ───────────────────────────────────────
let currentPage = 'dashboard';

function navigateTo(page, event) {
  if (event) event.preventDefault();
  currentPage = page;

  // Update pages visibility
  document.querySelectorAll('.page').forEach((p) => {
    p.classList.remove('active');
  });
  const targetPage = document.getElementById(`page-${page}`);
  if (targetPage) targetPage.classList.add('active');

  // Update nav active states
  document.querySelectorAll('.nav-item').forEach((n) => {
    n.classList.toggle('active', n.dataset.page === page);
  });
  document.querySelectorAll('.mobile-nav-item').forEach((n) => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    analytics: 'Analitik',
    settings: 'Pengaturan',
    logs: 'Activity Log',
  };
  document.getElementById('page-title').textContent = titles[page] || 'Dashboard';

  // Load page-specific data
  if (page === 'analytics') loadAnalytics();
  if (page === 'logs') loadLogs();
  if (page === 'settings') loadSettings();

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ─── Date Display ─────────────────────────────────────
function updateDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('header-date').textContent = now.toLocaleDateString('id-ID', options);
}

// ─── Prayer Cards ─────────────────────────────────────
const PRAYER_EMOJIS = {
  subuh: '🌙',
  dzuhur: '☀️',
  ashar: '🌤️',
  maghrib: '🌅',
  isya: '🌃',
};

async function loadPrayerTimes() {
  try {
    const data = await api('GET', '/api/prayer-times');
    const grid = document.getElementById('prayer-grid');

    grid.innerHTML = data.prayers
      .map((p) => {
        const isCompleted = p.status === 'completed';
        const isNext = data.next_prayer && data.next_prayer.prayer === p.key && !data.next_prayer.tomorrow;
        return `
          <div class="prayer-card ${isCompleted ? 'completed' : ''} ${isNext ? 'active-prayer' : ''}"
               onclick="togglePrayer('${p.key}', '${data.date}')"
               title="${isCompleted ? 'Klik untuk batalkan' : 'Klik untuk tandai hadir'}">
            <span class="prayer-emoji">${PRAYER_EMOJIS[p.key] || '🕌'}</span>
            <div class="prayer-name">${esc(p.label)}</div>
            <div class="prayer-time">${esc(p.time)}</div>
            <span class="prayer-status ${p.status}">
              ${isCompleted ? '✅ Hadir' : '⏳ Belum'}
            </span>
          </div>
        `;
      })
      .join('');

    // Update next prayer badge
    const badge = document.getElementById('next-prayer-badge');
    if (data.next_prayer) {
      if (data.next_prayer.tomorrow) {
        badge.textContent = `✅ Semua sholat hari ini selesai`;
      } else {
        badge.textContent = `⏳ Berikutnya: ${data.next_prayer.label} (${data.next_prayer.time})`;
      }
    }
  } catch (err) {
    console.error('Prayer times error:', err);
  }
}

async function togglePrayer(prayer, date) {
  try {
    // Check current status
    const data = await api('GET', '/api/prayer-times');
    const current = data.prayers.find((p) => p.key === prayer);
    const action = current && current.status === 'completed' ? 'unmark' : 'mark';

    await api('POST', `/api/attendance/${prayer}`, { date, action });
    showToast(
      action === 'mark' ? `${prayer.charAt(0).toUpperCase() + prayer.slice(1)} ditandai hadir ✅` : `${prayer.charAt(0).toUpperCase() + prayer.slice(1)} dibatalkan`,
      action === 'mark' ? 'success' : 'info'
    );
    loadPrayerTimes();
    loadDashboardStats();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  }
}

// ─── Dashboard Stats ──────────────────────────────────
async function loadDashboardStats() {
  try {
    const [analytics, qrCodes] = await Promise.all([
      api('GET', '/api/analytics?days=30'),
      api('GET', '/api/qrcodes'),
    ]);

    document.getElementById('streak-count').textContent = analytics.streak.current;
    document.getElementById('completion-rate').textContent = analytics.stats.rate + '%';
    document.getElementById('active-qr-count').textContent = qrCodes.filter((q) => q.enabled).length;
  } catch (err) {
    console.error('Dashboard stats error:', err);
  }
}

// ─── Load Status ──────────────────────────────────────
async function loadStatus() {
  try {
    const s = await api('GET', '/api/status');
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    if (s.active && s.bot_enabled) {
      indicator.className = 'status-badge online';
      statusText.textContent = 'Aktif';
    } else {
      indicator.className = 'status-badge offline';
      statusText.textContent = s.bot_enabled ? 'Idle' : 'Nonaktif';
    }
  } catch (err) {
    console.error('Status error:', err);
  }
}

// ─── Settings ─────────────────────────────────────────
async function loadSettings() {
  try {
    const s = await api('GET', '/api/settings');
    document.getElementById('username').value = s.username || '';
    document.getElementById('password').value = s.password || '';
    document.getElementById('password').placeholder = s.password_masked || '••••••••';
    document.getElementById('event_id').value = s.event_id || '3';
    document.getElementById('mesin_id').value = s.mesin_id || '12';
    document.getElementById('delay_seconds').value = s.delay_seconds || '3';

    const enabled = s.bot_enabled === '1';
    document.getElementById('bot_enabled').checked = enabled;
    document.getElementById('bot-status-label').textContent = enabled ? 'Aktif' : 'Nonaktif';

    // Prayer settings
    document.getElementById('prayer_source').value = s.prayer_source || 'manual';
    document.getElementById('timezone').value = s.timezone || 'Asia/Jakarta';
    document.getElementById('calculation_method').value = s.calculation_method || '20';
    document.getElementById('subuh_time').value = s.subuh_time || '04:35';
    document.getElementById('dzuhur_time').value = s.dzuhur_time || '12:00';
    document.getElementById('ashar_time').value = s.ashar_time || '15:15';
    document.getElementById('maghrib_time').value = s.maghrib_time || '18:00';
    document.getElementById('isya_time').value = s.isya_time || '19:15';

    togglePrayerInputs();
  } catch (err) {
    console.error('Load settings error:', err);
  }
}

function togglePrayerInputs() {
  const source = document.getElementById('prayer_source').value;
  const manualSection = document.getElementById('manual-prayer-times');
  const calcMethod = document.getElementById('calc-method-group');
  if (source === 'api') {
    manualSection.style.display = 'none';
    calcMethod.style.display = '';
  } else {
    manualSection.style.display = '';
    calcMethod.style.display = 'none';
  }
}

// Save account settings
document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Menyimpan...';
  try {
    const body = {
      username: document.getElementById('username').value,
      event_id: document.getElementById('event_id').value,
      mesin_id: document.getElementById('mesin_id').value,
      delay_seconds: document.getElementById('delay_seconds').value,
      bot_enabled: document.getElementById('bot_enabled').checked ? '1' : '0',
    };
    const pw = document.getElementById('password').value;
    if (pw) body.password = pw;
    await api('POST', '/api/settings', body);
    showToast('Pengaturan disimpan!', 'success');
    loadStatus();
  } catch (err) {
    showToast('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '💾 Simpan Pengaturan';
  }
});

// Save prayer settings
async function savePrayerSettings() {
  const btn = document.getElementById('save-prayer-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Menyimpan...';
  try {
    const body = {
      prayer_source: document.getElementById('prayer_source').value,
      timezone: document.getElementById('timezone').value,
      calculation_method: document.getElementById('calculation_method').value,
      subuh_time: document.getElementById('subuh_time').value,
      dzuhur_time: document.getElementById('dzuhur_time').value,
      ashar_time: document.getElementById('ashar_time').value,
      maghrib_time: document.getElementById('maghrib_time').value,
      isya_time: document.getElementById('isya_time').value,
    };
    await api('POST', '/api/settings', body);
    showToast('Waktu sholat disimpan!', 'success');
    loadPrayerTimes();
    loadStatus();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '💾 Simpan Waktu Sholat';
  }
}

// Toggle bot label
document.getElementById('bot_enabled').addEventListener('change', (e) => {
  document.getElementById('bot-status-label').textContent = e.target.checked ? 'Aktif' : 'Nonaktif';
});

function togglePassword() {
  const pw = document.getElementById('password');
  pw.type = pw.type === 'password' ? 'text' : 'password';
}

// ─── QR Codes ─────────────────────────────────────────
async function loadQrCodes() {
  try {
    const codes = await api('GET', '/api/qrcodes');
    const list = document.getElementById('qr-list');
    const activeCount = codes.filter((c) => c.enabled).length;
    document.getElementById('active-qr-count').textContent = activeCount;

    if (codes.length === 0) {
      list.innerHTML = '<div class="empty-state">Belum ada QR code. Tambahkan di atas.</div>';
      return;
    }

    list.innerHTML = codes
      .map(
        (qr) => `
        <div class="qr-item ${qr.enabled ? '' : 'disabled'}">
          <div class="qr-item-info">
            <span class="qr-item-name">${esc(qr.name)}</span>
            <span class="qr-item-code">${esc(qr.qr_code)}</span>
          </div>
          <div class="qr-item-actions">
            <label class="toggle" title="${qr.enabled ? 'Nonaktifkan' : 'Aktifkan'}">
              <input type="checkbox" ${qr.enabled ? 'checked' : ''} onchange="toggleQr(${qr.id})" />
              <span class="toggle-slider"></span>
            </label>
            <button class="btn btn-danger" onclick="deleteQr(${qr.id}, '${esc(qr.name)}')">Hapus</button>
          </div>
        </div>
      `
      )
      .join('');
  } catch (err) {
    console.error('QR load error:', err);
  }
}

document.getElementById('qr-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('qr-name').value.trim();
  const code = document.getElementById('qr-code').value.trim();
  if (!name || !code) return;
  try {
    await api('POST', '/api/qrcodes', { name, qr_code: code });
    document.getElementById('qr-name').value = '';
    document.getElementById('qr-code').value = '';
    showToast(`QR "${name}" ditambahkan!`, 'success');
    loadQrCodes();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  }
});

async function toggleQr(id) {
  try {
    await api('PATCH', `/api/qrcodes/${id}`);
    loadQrCodes();
  } catch (err) {
    showToast('Gagal toggle: ' + err.message, 'error');
    loadQrCodes();
  }
}

async function deleteQr(id, name) {
  if (!confirm(`Hapus QR "${name}"?`)) return;
  try {
    await api('DELETE', `/api/qrcodes/${id}`);
    showToast(`QR "${name}" dihapus`, 'info');
    loadQrCodes();
  } catch (err) {
    showToast('Gagal hapus: ' + err.message, 'error');
  }
}

// ─── Analytics ────────────────────────────────────────
async function loadAnalytics() {
  try {
    const days = parseInt(document.getElementById('analytics-days').value || '30', 10);
    const data = await api('GET', `/api/analytics?days=${days}`);

    // Summary cards
    document.getElementById('a-streak-current').textContent = data.streak.current;
    document.getElementById('a-streak-best').textContent = data.streak.best;
    document.getElementById('a-rate').textContent = data.stats.rate + '%';
    document.getElementById('a-completed').textContent = data.stats.completed;

    // Per-prayer stats
    const statsEl = document.getElementById('prayer-stats');
    const labels = { subuh: '🌙 Subuh', dzuhur: '☀️ Dzuhur', ashar: '🌤️ Ashar', maghrib: '🌅 Maghrib', isya: '🌃 Isya' };

    statsEl.innerHTML = Object.entries(data.stats.perPrayer)
      .map(
        ([key, val]) => `
        <div class="prayer-stat-item">
          <div class="prayer-stat-header">
            <span class="prayer-stat-name">${labels[key] || key}</span>
            <span class="prayer-stat-rate">${val.rate}%</span>
          </div>
          <div class="prayer-stat-bar">
            <div class="prayer-stat-fill" style="width:${val.rate}%"></div>
          </div>
          <div class="prayer-stat-detail">${val.completed} dari ${val.total} hari</div>
        </div>
      `
      )
      .join('');

    // Heatmap
    renderHeatmap(data.dailyData, days);
  } catch (err) {
    console.error('Analytics error:', err);
  }
}

function renderHeatmap(dailyData, days) {
  const container = document.getElementById('heatmap-container');
  const cells = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = dailyData[dateStr] || {};
    const completed = Object.values(dayData).filter((v) => v === 'completed').length;
    const opacity = completed === 0 ? 0.08 : (completed / 5) * 0.92 + 0.08;
    const dayName = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

    cells.push(
      `<div class="heatmap-cell" style="opacity:${opacity}" title="${dayName}: ${completed}/5 sholat"></div>`
    );
  }

  container.innerHTML = `<div class="heatmap-grid">${cells.join('')}</div>`;
}

// ─── Logs ─────────────────────────────────────────────
async function loadLogs() {
  try {
    const logs = await api('GET', '/api/logs?limit=100');
    const container = document.getElementById('logs-container');

    if (logs.length === 0) {
      container.innerHTML = '<div class="empty-state">Belum ada log.</div>';
      return;
    }

    container.innerHTML = `
      <table class="log-table">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Sholat</th>
            <th>Nama</th>
            <th>Status</th>
            <th>Pesan</th>
          </tr>
        </thead>
        <tbody>
          ${logs
            .map(
              (log) => `
            <tr>
              <td style="white-space:nowrap;font-size:0.78rem;color:var(--text-muted)">${esc(log.created_at)}</td>
              <td><span style="text-transform:capitalize;font-weight:500">${esc(log.prayer || 'subuh')}</span></td>
              <td><strong>${esc(log.name)}</strong><br><span style="font-size:0.72rem;color:var(--text-muted);font-family:monospace">${esc(log.qr_code)}</span></td>
              <td><span class="log-status ${log.status}">${log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⏭️'} ${esc(log.status)}</span></td>
              <td><span class="log-message" title="${esc(log.message)}">${esc(log.message)}</span></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error('Logs error:', err);
  }
}

async function clearLogs() {
  if (!confirm('Hapus semua log?')) return;
  try {
    await api('DELETE', '/api/logs');
    showToast('Log dihapus', 'info');
    loadLogs();
  } catch (err) {
    showToast('Gagal hapus log: ' + err.message, 'error');
  }
}

// ─── Manual Trigger ───────────────────────────────────
async function manualTrigger() {
  const label = document.getElementById('trigger-label');
  const origText = label.textContent;
  label.innerHTML = '<span class="spinner"></span>';

  try {
    const result = await api('POST', '/api/test', { prayer: 'subuh' });
    const successCount = result.results.filter((r) => r.status === 'success').length;
    showToast(`Absen selesai! ${successCount}/${result.results.length} berhasil`, 'success');
    loadLogs();
    loadPrayerTimes();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  } finally {
    label.textContent = origText;
  }
}

// ─── Export / Import ──────────────────────────────────
async function exportData(format) {
  try {
    const res = await fetch(`/api/export?format=${format}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shollu-data.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Data diekspor sebagai ${format.toUpperCase()}`, 'success');
  } catch (err) {
    showToast('Gagal ekspor: ' + err.message, 'error');
  }
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    await api('POST', '/api/import', data);
    showToast(`Data berhasil diimpor! (${data.attendance ? data.attendance.length : 0} record)`, 'success');
    loadPrayerTimes();
    loadDashboardStats();
  } catch (err) {
    showToast('Gagal impor: ' + err.message, 'error');
  }
  event.target.value = '';
}

// ─── Onboarding ───────────────────────────────────────
let onboardingStep = 1;

async function checkOnboarding() {
  try {
    const s = await api('GET', '/api/settings');
    if (s.onboarding_complete !== '1') {
      document.getElementById('onboarding-modal').style.display = '';
    }
  } catch (err) {
    console.error('Onboarding check error:', err);
  }
}

function nextOnboarding() {
  document.querySelector(`.onboarding-step[data-step="${onboardingStep}"]`).style.display = 'none';
  onboardingStep++;
  document.querySelector(`.onboarding-step[data-step="${onboardingStep}"]`).style.display = '';
}

function prevOnboarding() {
  document.querySelector(`.onboarding-step[data-step="${onboardingStep}"]`).style.display = 'none';
  onboardingStep--;
  document.querySelector(`.onboarding-step[data-step="${onboardingStep}"]`).style.display = '';
}

async function finishOnboarding() {
  try {
    const timezone = document.getElementById('ob-timezone').value;
    const source = document.getElementById('ob-prayer-source').value;
    await api('POST', '/api/settings', {
      timezone,
      prayer_source: source,
      onboarding_complete: '1',
    });
    document.getElementById('onboarding-modal').style.display = 'none';
    showToast('Selamat datang! 🕌', 'success');
    loadPrayerTimes();
    loadSettings();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  }
}

// ─── Init ─────────────────────────────────────────────
async function init() {
  initTheme();
  updateDate();

  await Promise.all([
    loadPrayerTimes(),
    loadQrCodes(),
    loadStatus(),
    loadDashboardStats(),
    checkOnboarding(),
  ]);

  // Auto-refresh every 60 seconds
  setInterval(() => {
    loadPrayerTimes();
    loadStatus();
    if (currentPage === 'dashboard') loadDashboardStats();
  }, 60000);
}

init();
