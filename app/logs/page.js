'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Button, IconButton,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { useToast } from '@/components/Toast';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs?limit=200');
      setLogs(await res.json());
    } catch { showToast('Tidak dapat memuat riwayat. Periksa koneksi Anda.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleClear = async () => {
    if (!window.confirm('Hapus semua riwayat absensi? Tindakan ini permanen dan tidak bisa dibatalkan.')) return;
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      const d = await res.json();
      if (d.success) { showToast('Riwayat dibersihkan', 'success'); setLogs([]); }
    } catch { showToast('Gagal menghapus riwayat. Coba lagi.', 'error'); }
  };

  const statusColor = (s) => {
    if (s === 'success') return 'primary';
    if (s === 'error') return 'error';
    return 'default';
  };

  return (
    <Box>
      <Typography className="anim-stagger stagger-1" variant="overline" color="text.secondary">Sistem</Typography>
      <Box className="anim-stagger stagger-1" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: { xs: 2, md: 3 } }}>
        <Typography variant="h2" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          Riwayat
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={fetchLogs} size="small" aria-label="Muat ulang riwayat" sx={{ bgcolor: 'surfaceContainerHigh.main' }}>
            <RefreshRoundedIcon fontSize="small" />
          </IconButton>
          <Button
            variant="text"
            color="error"
            size="small"
            startIcon={<DeleteOutlineRoundedIcon />}
            onClick={handleClear}
            disabled={loading || logs.length === 0}
          >
            Hapus Semua
          </Button>
        </Box>
      </Box>

      <Box className="anim-stagger stagger-2" sx={{ bgcolor: 'surfaceContainerLow.main', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: '72vh' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 480 }}>
            <TableHead>
              <TableRow>
                {['Waktu', 'Sholat', 'Karyawan', 'Status', 'Pesan'].map((h) => {
                  const hiddenOnMobile = h === 'Pesan';
                  return (
                    <TableCell key={h} sx={{ bgcolor: 'surfaceContainerHigh.main', color: 'text.secondary', ...(hiddenOnMobile && { display: { xs: 'none', sm: 'table-cell' } }) }}>
                      {h}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary" variant="body2">Belum ada riwayat absensi. Riwayat akan muncul setelah bot menjalankan absen.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id} hover sx={{ '&:hover': { bgcolor: 'surfaceContainer.main' } }}>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                      {new Date(l.created_at).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize', fontWeight: 500 }}>{l.prayer}</TableCell>
                    <TableCell>{l.name}</TableCell>
                    <TableCell>
                      <Chip label={l.status} size="small" color={statusColor(l.status)} variant="filled"
                        sx={{ minWidth: 60, fontSize: '0.72rem' }} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}
                      title={l.message}>
                      {l.message}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
