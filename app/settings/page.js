'use client';

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Grid, TextField, Button, Switch, 
  FormControlLabel, MenuItem, Divider, IconButton, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import { useToast } from '@/components/Toast';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [qrcodes, setQrcodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New QR states
  const [newQrName, setNewQrName] = useState('');
  const [newQrCode, setNewQrCode] = useState('');

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      const [setRes, qrRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/qrcodes')
      ]);
      setSettings(await setRes.json());
      setQrcodes(await qrRes.json());
    } catch {
      showToast('Gagal memuat pengaturan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Don't send masked password if not changed
      const payload = { ...settings };
      if (payload.password === '••••••••') delete payload.password;
      
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Pengaturan berhasil disimpan', 'success');
        fetchData(); // reload specifically to get new masked passwords
      } else {
        showToast(data.error || 'Gagal menyimpan', 'error');
      }
    } catch (err) {
      showToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQr = async () => {
    if (!newQrName || !newQrCode) return showToast('Nama dan QR Code wajib diisi', 'warning');
    try {
      const res = await fetch('/api/qrcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newQrName, qr_code: newQrCode })
      });
      const data = await res.json();
      if (data.success) {
        showToast('QR Code ditambahkan', 'success');
        setNewQrName('');
        setNewQrCode('');
        fetchData();
      } else {
        showToast(data.error || 'Gagal menambahkan', 'error');
      }
    } catch (err) {
      showToast('Gagal menambahkan QR', 'error');
    }
  };

  const handleToggleQr = async (id) => {
    try {
      await fetch(`/api/qrcodes/${id}`, { method: 'PATCH' });
      fetchData();
    } catch (err) {
      showToast('Gagal mengubah status', 'error');
    }
  };

  const handleDeleteQr = async (id) => {
    if (!window.confirm('Hapus QR code ini?')) return;
    try {
      await fetch(`/api/qrcodes/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      showToast('Gagal menghapus', 'error');
    }
  };

  const handleExport = () => {
    window.location.href = '/api/export?format=json';
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('PERINGATAN: Impor data akan menimpa data absensi yang ada dengan ID yang sama. Lanjutkan?')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Berhasil mengimpor ${data.imported} riwayat absensi`, 'success');
          fetchData();
        } else {
          showToast(`Gagal mengimpor: ${data.error}`, 'error');
        }
      } catch (err) {
        showToast('Gagal memproses file konfigurasi', 'error');
      }
    };
    reader.readAsText(file);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={800}>Pengaturan</Typography>
        <FormControlLabel 
          control={<Switch checked={settings?.bot_enabled === '1'} onChange={(e) => setSettings({...settings, bot_enabled: e.target.checked ? '1' : '0'})} color="primary" />} 
          label={<Typography fontWeight={600}>Bot Aktif</Typography>} 
          labelPlacement="start"
        />
      </Box>

      <Grid container spacing={4}>
        {/* Left Column: API & Manual Settings */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Akun Shollu</Typography>
              <TextField 
                fullWidth size="small" label="Username (Email)" sx={{ mb: 2 }} 
                value={settings?.username || ''} onChange={(e) => setSettings({...settings, username: e.target.value})}
              />
              <TextField 
                fullWidth size="small" type="password" label="Password" 
                value={settings?.password || settings?.password_masked || ''} onChange={(e) => setSettings({...settings, password: e.target.value})}
              />
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Mesin & Jaringan</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Event ID" value={settings?.event_id || ''} onChange={(e) => setSettings({...settings, event_id: e.target.value})} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Mesin ID" value={settings?.mesin_id || ''} onChange={(e) => setSettings({...settings, mesin_id: e.target.value})} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" type="number" label="Jeda Absen (detik)" value={settings?.delay_seconds || '3'} onChange={(e) => setSettings({...settings, delay_seconds: e.target.value})} helperText="Jeda antara scan QR code setiap karyawan" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Metode Jadwal Sholat</Typography>
              <TextField select fullWidth size="small" label="Sumber Waktu" value={settings?.prayer_source || 'manual'} onChange={(e) => setSettings({...settings, prayer_source: e.target.value})} sx={{ mb: 2 }}>
                <MenuItem value="api">Otomatis (API Kemenag / Aladhan)</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
              </TextField>
              {settings?.prayer_source === 'api' && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField select fullWidth size="small" label="Zona Waktu" value={settings?.timezone || 'Asia/Jakarta'} onChange={(e) => setSettings({...settings, timezone: e.target.value})}>
                      <MenuItem value="Asia/Jakarta">WIB (Jakarta)</MenuItem>
                      <MenuItem value="Asia/Makassar">WITA (Makassar)</MenuItem>
                      <MenuItem value="Asia/Jayapura">WIT (Jayapura)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField select fullWidth size="small" label="Metode" value={settings?.calculation_method || '20'} onChange={(e) => setSettings({...settings, calculation_method: e.target.value})}>
                      <MenuItem value="20">Kemenag RI</MenuItem>
                      <MenuItem value="11">Majlis Ugama Islam Singapura</MenuItem>
                      <MenuItem value="1">University of Islamic Sciences, Karachi</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          <Button variant="contained" color="primary" fullWidth size="large" onClick={handleSaveSettings} disabled={saving} startIcon={<SaveRoundedIcon />} sx={{ borderRadius: 3, mb: 4 }}>
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
          
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Ekspor / Impor Data</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cadangkan seluruh data aplikasi, atau muat data dari file cadangan sebelumnya.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button variant="outlined" fullWidth startIcon={<ContentCopyRoundedIcon />} onClick={handleExport}>
                    Ekspor Data
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button variant="outlined" component="label" fullWidth startIcon={<UploadFileRoundedIcon />}>
                    Impor Data
                    <input type="file" accept=".json" hidden onChange={handleImport} />
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Time setup and QR Codes */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Jadwal Manual & Aktifasi</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Jika menggunakan API Otomatis, waktu manual akan diabaikan (tapi tetap sebagai cadangan).
              </Typography>
              {['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].map((p) => (
                <Box key={p} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                  <Switch 
                    checked={settings?.[`${p}_enabled`] === '1'} 
                    onChange={(e) => setSettings({...settings, [`${p}_enabled`]: e.target.checked ? '1' : '0'})}
                  />
                  <Typography sx={{ textTransform: 'capitalize', width: 65, fontWeight: 600 }}>{p}</Typography>
                  <TextField 
                    type="time" 
                    size="small" 
                    value={settings?.[`${p}_time`] || ''} 
                    onChange={(e) => setSettings({...settings, [`${p}_time`]: e.target.value})}
                    disabled={settings?.[`${p}_enabled`] === '0'}
                  />
                  <Typography variant="body2" color="text.secondary">absen di +5m</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>QR Code Karyawan ({qrcodes.length})</Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={5}><TextField size="small" fullWidth placeholder="Nama" value={newQrName} onChange={(e) => setNewQrName(e.target.value)} /></Grid>
                <Grid item xs={5}><TextField size="small" fullWidth placeholder="Data QR" value={newQrCode} onChange={(e) => setNewQrCode(e.target.value)} /></Grid>
                <Grid item xs={2}><Button variant="contained" fullWidth sx={{ height: '100%' }} onClick={handleAddQr}>Add</Button></Grid>
              </Grid>
              
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableBody>
                    {qrcodes.map((qr) => (
                      <TableRow key={qr.id} sx={{ opacity: qr.enabled ? 1 : 0.5 }}>
                        <TableCell>
                          <Switch size="small" checked={!!qr.enabled} onChange={() => handleToggleQr(qr.id)} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{qr.name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{qr.qr_code.slice(0, 15)}...</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleDeleteQr(qr.id)}><DeleteRoundedIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
