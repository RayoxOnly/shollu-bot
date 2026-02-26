// ─── API Helper ───────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
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

// ─── Load Settings ────────────────────────────────────
async function loadSettings() {
  try {
    const s = await api('GET', '/api/settings');
    document.getElementById('username').value = s.username || '';
    document.getElementById('password').value = s.password || '';
    document.getElementById('password').placeholder = s.password_masked || '••••••••';
    document.getElementById('event_id').value = s.event_id || '3';
    document.getElementById('subuh_time').value = s.subuh_time || '04:35';
    document.getElementById('delay_seconds').value = s.delay_seconds || '3';
    const enabled = s.bot_enabled === '1';
    document.getElementById('bot_enabled').checked = enabled;
    document.getElementById('bot-status-label').textContent = enabled ? 'Aktif' : 'Nonaktif';
  } catch (err) {
    console.error('Load settings error:', err);
  }
}

// ─── Save Settings ────────────────────────────────────
document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Menyimpan...';
  try {
    const body = {
      username: document.getElementById('username').value,
      event_id: document.getElementById('event_id').value,
      subuh_time: document.getElementById('subuh_time').value,
      delay_seconds: document.getElementById('delay_seconds').value,
      bot_enabled: document.getElementById('bot_enabled').checked ? '1' : '0',
    };
    // Only send password if user typed something
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

// Toggle label
document.getElementById('bot_enabled').addEventListener('change', (e) => {
  document.getElementById('bot-status-label').textContent = e.target.checked ? 'Aktif' : 'Nonaktif';
});

// Toggle password visibility
function togglePassword() {
  const pw = document.getElementById('password');
  pw.type = pw.type === 'password' ? 'text' : 'password';
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
    document.getElementById('next-run').textContent = s.next_run || '--:--';
  } catch (err) {
    console.error('Status error:', err);
  }
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

// ─── Logs ─────────────────────────────────────────────
async function loadLogs() {
  try {
    const logs = await api('GET', '/api/logs?limit=100');
    const container = document.getElementById('logs-container');

    // Update last result card
    if (logs.length > 0) {
      const last = logs[0];
      const el = document.getElementById('last-result');
      el.textContent = last.status === 'success' ? '✅ OK' : last.status === 'error' ? '❌ Gagal' : '⏭️ Skip';
    }

    if (logs.length === 0) {
      container.innerHTML = '<div class="empty-state">Belum ada log.</div>';
      return;
    }

    container.innerHTML = `
      <table class="log-table">
        <thead>
          <tr>
            <th>Waktu</th>
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
  const card = document.querySelector('.action-card');
  const origHTML = card.querySelector('.stat-value').textContent;
  card.querySelector('.stat-value').innerHTML = '<span class="spinner"></span>';

  try {
    const result = await api('POST', '/api/test');
    const successCount = result.results.filter((r) => r.status === 'success').length;
    showToast(`Absen selesai! ${successCount}/${result.results.length} berhasil`, 'success');
    loadLogs();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  } finally {
    card.querySelector('.stat-value').textContent = origHTML;
  }
}

// ─── Utility ──────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Init ─────────────────────────────────────────────
async function init() {
  await Promise.all([loadSettings(), loadQrCodes(), loadLogs(), loadStatus()]);
  // Auto-refresh logs and status every 30 seconds
  setInterval(() => {
    loadLogs();
    loadStatus();
  }, 30000);
}

init();
