'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, TextField, Button, Switch,
  FormControlLabel, MenuItem, IconButton, Table, TableBody,
  TableCell, TableContainer, TableRow, CircularProgress, Divider,
  InputAdornment, Tooltip,
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import { useToast } from '@/components/Toast';

function Section({ title, id, children }) {
  return (
    <Box
      role="region"
      aria-labelledby={id}
      sx={{
        bgcolor: 'surfaceContainerLow.main',
        borderRadius: 2.5,
        p: { xs: 2, sm: 3 },
        border: '1px solid',
        borderColor: 'divider',
        transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Typography
        id={id}
        variant="subtitle1"
        sx={{ fontWeight: 700, mb: 2.5, letterSpacing: '-0.005em' }}
      >
        {title}
      </Typography>
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
          control={
            <Switch
              checked={s.bot_enabled === '1'}
              onChange={(e) => set('bot_enabled', e.target.checked ? '1' : '0')}
              inputProps={{ 'aria-label': 'Aktifkan atau nonaktifkan bot' }}
            />
          }
          label={<Typography variant="body2" fontWeight={600}>Bot Aktif</Typography>}
          labelPlacement="start"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="anim-stagger stagger-2" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Section title="Akun Shollu" id="section-akun">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Username"
                  value={s.username || ''}
                  onChange={(e) => set('username', e.target.value)}
                  autoComplete="username"
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={s.password || s.password_masked || ''}
                  onChange={(e) => set('password', e.target.value)}
                  autoComplete="off"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          size="small"
                          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        >
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
                  autoComplete="off"
                  helperText="Digunakan sebagai X-API-Key saat absen (env SHOLLU_API_KEY akan diutamakan)"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowApiKey((v) => !v)}
                          edge="end"
                          size="small"
                          aria-label={showApiKey ? 'Sembunyikan API key' : 'Tampilkan API key'}
                        >
                          {showApiKey ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Section>

            <Section title="Mesin & Jaringan" id="section-mesin">
              <Grid container spacing={2}>
                <Grid size={6}><TextField fullWidth label="Event ID" value={s.event_id || ''} onChange={(e) => set('event_id', e.target.value)} /></Grid>
                <Grid size={6}><TextField fullWidth label="Mesin ID" value={s.mesin_id || ''} onChange={(e) => set('mesin_id', e.target.value)} /></Grid>
                <Grid size={12}>
                  <TextField fullWidth type="number" label="Jeda (detik)" value={s.delay_seconds || '3'} onChange={(e) => set('delay_seconds', e.target.value)}
                    helperText="Jeda antar scan QR setiap karyawan" />
                </Grid>
              </Grid>
            </Section>

            <Section title="Sumber Jadwal" id="section-jadwal">
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

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={save}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />}
              sx={{
                borderRadius: 3,
                py: 1.4,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,107,94,0.25)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              }}
            >
              {saving ? 'Menyimpan…' : 'Simpan Pengaturan'}
            </Button>

            <Section title="Data" id="section-data">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cadangkan atau pulihkan data absensi.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadRoundedIcon />}
                  onClick={handleExport}
                  sx={{
                    flex: 1,
                    borderRadius: 3,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primaryContainer.main', color: 'primaryContainer.contrastText' },
                  }}
                >
                  Ekspor
                </Button>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<FileUploadRoundedIcon />}
                  sx={{
                    flex: 1,
                    borderRadius: 3,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primaryContainer.main', color: 'primaryContainer.contrastText' },
                  }}
                >
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
            <Section title="Jadwal & Aktivasi" id="section-aktivasi">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Atur waktu manual. Bot akan absen 5 menit setelah waktu.
              </Typography>
              {['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].map((p) => (
                <Box key={p} sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  transition: 'background-color 0.15s ease',
                  '&:hover': { bgcolor: 'action.hover' },
                }}>
                  <Switch
                    size="small"
                    checked={s[`${p}_enabled`] === '1'}
                    onChange={(e) => set(`${p}_enabled`, e.target.checked ? '1' : '0')}
                    inputProps={{ 'aria-label': `Aktifkan ${p}` }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600, width: 62, flexShrink: 0, textTransform: 'capitalize' }}>{p}</Typography>
                  <TextField
                    type="time"
                    size="small"
                    value={s[`${p}_time`] || ''}
                    onChange={(e) => set(`${p}_time`, e.target.value)}
                    disabled={s[`${p}_enabled`] === '0'}
                    inputProps={{ 'aria-label': `Waktu ${p}` }}
                    sx={{
                      width: 130,
                      flexShrink: 0,
                      transition: 'opacity 0.2s ease',
                      opacity: s[`${p}_enabled`] === '0' ? 0.5 : 1,
                    }}
                  />
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                🌙 Ramadan
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 0.5,
                borderRadius: 2,
                transition: 'background-color 0.15s ease',
                '&:hover': { bgcolor: 'action.hover' },
              }}>
                <Switch
                  size="small"
                  checked={s.tarawih_enabled === '1'}
                  onChange={(e) => set('tarawih_enabled', e.target.checked ? '1' : '0')}
                  inputProps={{ 'aria-label': 'Aktifkan tarawih' }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600, width: 62, flexShrink: 0 }}>Tarawih</Typography>
                <TextField
                  type="time"
                  size="small"
                  value={s.tarawih_time || '20:00'}
                  onChange={(e) => set('tarawih_time', e.target.value)}
                  disabled={s.tarawih_enabled === '0'}
                  inputProps={{ 'aria-label': 'Waktu tarawih' }}
                  sx={{
                    width: 130,
                    flexShrink: 0,
                    transition: 'opacity 0.2s ease',
                    opacity: s.tarawih_enabled === '0' ? 0.5 : 1,
                  }}
                />
              </Box>
            </Section>

            <Section title={`QR Code (${qrcodes.length})`} id="section-qr">
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mb: 2 }}>
                <TextField
                  label="Nama"
                  value={newQrName}
                  onChange={(e) => setNewQrName(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Data QR"
                  value={newQrCode}
                  onChange={(e) => setNewQrCode(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Tooltip title="Tambah QR" arrow>
                  <IconButton
                    onClick={addQr}
                    color="primary"
                    aria-label="Tambah QR code baru"
                    sx={{
                      bgcolor: 'primaryContainer.main',
                      borderRadius: 3,
                      px: 1.5,
                      alignSelf: { xs: 'flex-end', sm: 'auto' },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <AddRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {qrcodes.length === 0 ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 5,
                  gap: 1.5,
                }}>
                  <QrCode2RoundedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Belum ada QR code.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', opacity: 0.7 }}>
                    Tambahkan nama dan data QR di atas untuk memulai.
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 280 }}>
                  <Table size="small">
                    <TableBody>
                      {qrcodes.map((qr) => (
                        <TableRow
                          key={qr.id}
                          sx={{
                            transition: 'opacity 0.2s ease, background-color 0.15s ease',
                            opacity: qr.enabled ? 1 : 0.45,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <TableCell sx={{ pl: 0, py: 1 }}>
                            <Switch
                              size="small"
                              checked={!!qr.enabled}
                              onChange={() => toggleQr(qr.id)}
                              inputProps={{ 'aria-label': `Toggle ${qr.name}` }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{qr.name}</TableCell>
                          <TableCell sx={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: '0.72rem',
                            color: 'text.secondary',
                            display: { xs: 'none', sm: 'table-cell' },
                            letterSpacing: '0.02em',
                          }}>
                            {qr.qr_code.slice(0, 12)}…
                          </TableCell>
                          <TableCell align="right" sx={{ pr: 0 }}>
                            <Tooltip title="Hapus QR" arrow>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteQr(qr.id)}
                                aria-label={`Hapus ${qr.name}`}
                                sx={{
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    bgcolor: 'errorContainer.main',
                                    transform: 'scale(1.1)',
                                  },
                                }}
                              >
                                <DeleteRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Section>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
