'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, TextField, Button, Switch,
  FormControlLabel, MenuItem, IconButton, Table, TableBody,
  TableCell, TableContainer, TableRow, CircularProgress, Divider,
  InputAdornment,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useToast } from '@/components/Toast';

function Section({ title, children, ...rest }) {
  return (
    <Box sx={{ bgcolor: 'surfaceContainerLow.main', borderRadius: 2.5, p: { xs: 2, sm: 3 }, ...rest }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2.5 }}>{title}</Typography>
      {children}
    </Box>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [qrcodes, setQrcodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newQrName, setNewQrName] = useState('');
  const [newQrCode, setNewQrCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      const [s, q] = await Promise.all([fetch('/api/settings'), fetch('/api/qrcodes')]);
      setSettings(await s.json());
      setQrcodes(await q.json());
    } catch { showToast('Gagal memuat pengaturan', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...settings };
      if (payload.password === '••••••••') delete payload.password;
      const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (d.success) { showToast('Tersimpan ✓', 'success'); fetchData(); }
      else showToast(d.error || 'Gagal', 'error');
    } catch { showToast('Gagal menyimpan', 'error'); }
    finally { setSaving(false); }
  };

  const addQr = async () => {
    if (!newQrName || !newQrCode) return showToast('Nama dan QR wajib diisi', 'warning');
    try {
      const res = await fetch('/api/qrcodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newQrName, qr_code: newQrCode }) });
      const d = await res.json();
      if (d.success) { showToast('QR ditambahkan', 'success'); setNewQrName(''); setNewQrCode(''); fetchData(); }
      else showToast(d.error || 'Gagal', 'error');
    } catch { showToast('Gagal', 'error'); }
  };

  const toggleQr = async (id) => { await fetch(`/api/qrcodes/${id}`, { method: 'PATCH' }); fetchData(); };
  const deleteQr = async (id) => { if (!confirm('Hapus QR ini?')) return; await fetch(`/api/qrcodes/${id}`, { method: 'DELETE' }); fetchData(); };

  const handleExport = () => { window.location.href = '/api/export?format=json'; };
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('Data impor akan menimpa yang ada. Lanjutkan?')) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        const res = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) });
        const d = await res.json();
        if (d.success) { showToast(`${d.imported} data diimpor`, 'success'); fetchData(); }
        else showToast(d.error, 'error');
      } catch { showToast('File tidak valid', 'error'); }
    };
    reader.readAsText(file);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;

  // Convenience
  const s = settings || {};
  const set = (k, v) => setSettings({ ...s, [k]: v });

  return (
    <Box>
      <Typography className="anim-stagger stagger-1" variant="overline" color="text.secondary">Konfigurasi</Typography>
      <Box className="anim-stagger stagger-1" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: { xs: 2.5, md: 4 } }}>
        <Typography variant="h2" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          Pengaturan
        </Typography>
        <FormControlLabel
          control={<Switch checked={s.bot_enabled === '1'} onChange={(e) => set('bot_enabled', e.target.checked ? '1' : '0')} />}
          label={<Typography variant="body2" fontWeight={600}>Bot Aktif</Typography>}
          labelPlacement="start"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="anim-stagger stagger-2" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Section title="Akun Shollu">
              <TextField fullWidth label="Username" sx={{ mb: 2 }} value={s.username || ''} onChange={(e) => set('username', e.target.value)} />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={s.password || s.password_masked || ''}
                onChange={(e) => set('password', e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small" aria-label="Toggle password visibility">
                        {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="API Key"
                type={showApiKey ? 'text' : 'password'}
                value={s.api_key || ''}
                onChange={(e) => set('api_key', e.target.value)}
                helperText="Digunakan sebagai X-API-Key saat absen (env SHOLLU_API_KEY akan diutamakan)"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowApiKey((v) => !v)} edge="end" size="small" aria-label="Toggle API key visibility">
                        {showApiKey ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Section>

            <Section title="Mesin & Jaringan">
              <Grid container spacing={2}>
                <Grid size={6}><TextField fullWidth label="Event ID" value={s.event_id || ''} onChange={(e) => set('event_id', e.target.value)} /></Grid>
                <Grid size={6}><TextField fullWidth label="Mesin ID" value={s.mesin_id || ''} onChange={(e) => set('mesin_id', e.target.value)} /></Grid>
                <Grid size={12}>
                  <TextField fullWidth type="number" label="Jeda (detik)" value={s.delay_seconds || '3'} onChange={(e) => set('delay_seconds', e.target.value)}
                    helperText="Jeda antar scan QR setiap karyawan" />
                </Grid>
              </Grid>
            </Section>

            <Section title="Sumber Jadwal">
              <TextField select fullWidth label="Sumber Waktu" value={s.prayer_source || 'manual'} onChange={(e) => set('prayer_source', e.target.value)} sx={{ mb: 2 }}>
                <MenuItem value="api">Otomatis (Aladhan API)</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
              </TextField>
              {s.prayer_source === 'api' && (
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField select fullWidth label="Zona Waktu" value={s.timezone || 'Asia/Jakarta'} onChange={(e) => set('timezone', e.target.value)}>
                      <MenuItem value="Asia/Jakarta">WIB</MenuItem>
                      <MenuItem value="Asia/Makassar">WITA</MenuItem>
                      <MenuItem value="Asia/Jayapura">WIT</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={6}>
                    <TextField select fullWidth label="Metode" value={s.calculation_method || '20'} onChange={(e) => set('calculation_method', e.target.value)}>
                      <MenuItem value="20">Kemenag RI</MenuItem>
                      <MenuItem value="11">Singapura</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              )}
            </Section>

            <Button variant="contained" size="large" onClick={save} disabled={saving} startIcon={<SaveRoundedIcon />}
              sx={{ borderRadius: 3, py: 1.4 }}>
              {saving ? 'Menyimpan…' : 'Simpan Pengaturan'}
            </Button>

            <Section title="Data">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cadangkan atau pulihkan data absensi.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={handleExport} sx={{ flex: 1, borderRadius: 3 }}>
                  Ekspor
                </Button>
                <Button variant="outlined" component="label" startIcon={<FileUploadRoundedIcon />} sx={{ flex: 1, borderRadius: 3 }}>
                  Impor
                  <input type="file" accept=".json" hidden onChange={handleImport} />
                </Button>
              </Box>
            </Section>
          </Box>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="anim-stagger stagger-3" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Section title="Jadwal & Aktivasi">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Atur waktu manual. Bot akan absen 5 menit setelah waktu.
              </Typography>
              {['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].map((p) => (
                <Box key={p} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Switch checked={s[`${p}_enabled`] === '1'} onChange={(e) => set(`${p}_enabled`, e.target.checked ? '1' : '0')} />
                  <Typography variant="body2" sx={{ fontWeight: 600, width: { xs: 52, sm: 62 }, flexShrink: 0, textTransform: 'capitalize' }}>{p}</Typography>
                  <TextField type="time" size="small" value={s[`${p}_time`] || ''} onChange={(e) => set(`${p}_time`, e.target.value)}
                    disabled={s[`${p}_enabled`] === '0'} sx={{ width: { xs: 110, sm: 130 }, flexShrink: 0 }} />
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                🌙 Ramadan
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Switch checked={s.tarawih_enabled === '1'} onChange={(e) => set('tarawih_enabled', e.target.checked ? '1' : '0')} />
                <Typography variant="body2" sx={{ fontWeight: 600, width: { xs: 52, sm: 62 }, flexShrink: 0 }}>Tarawih</Typography>
                <TextField type="time" size="small" value={s.tarawih_time || '20:00'} onChange={(e) => set('tarawih_time', e.target.value)}
                  disabled={s.tarawih_enabled === '0'} sx={{ width: { xs: 110, sm: 130 }, flexShrink: 0 }} />
              </Box>
            </Section>

            <Section title={`QR Code (${qrcodes.length})`}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mb: 2 }}>
                <TextField placeholder="Nama" value={newQrName} onChange={(e) => setNewQrName(e.target.value)} sx={{ flex: 1 }} />
                <TextField placeholder="Data QR" value={newQrCode} onChange={(e) => setNewQrCode(e.target.value)} sx={{ flex: 1 }} />
                <IconButton onClick={addQr} color="primary" sx={{ bgcolor: 'primaryContainer.main', borderRadius: 3, px: 1.5, alignSelf: { xs: 'flex-end', sm: 'auto' } }}>
                  <AddRoundedIcon />
                </IconButton>
              </Box>

              <TableContainer sx={{ maxHeight: 280 }}>
                <Table size="small">
                  <TableBody>
                    {qrcodes.map((qr) => (
                      <TableRow key={qr.id} sx={{ opacity: qr.enabled ? 1 : 0.45 }}>
                        <TableCell sx={{ pl: 0, py: 1 }}>
                          <Switch checked={!!qr.enabled} onChange={() => toggleQr(qr.id)} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{qr.name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>
                          {qr.qr_code.slice(0, 12)}…
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 0 }}>
                          <IconButton size="small" color="error" onClick={() => deleteQr(qr.id)}>
                            <DeleteRoundedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Section>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
