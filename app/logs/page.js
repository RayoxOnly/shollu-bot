'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Button } from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useToast } from '@/components/Toast';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const { showToast } = useToast();

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs?limit=200');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      showToast('Gagal memuat log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClear = async () => {
    if (!window.confirm('Hapus semua log secara permanen?')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Log berhasil dibersihkan', 'success');
        setLogs([]);
      } else {
        showToast('Gagal menghapus log', 'error');
      }
    } catch (err) {
      showToast('Gagal menghapus log', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={800}>
          Riwayat Sistem
        </Typography>
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<DeleteOutlineRoundedIcon />}
          onClick={handleClear}
          disabled={loading || clearing || logs.length === 0}
          sx={{ borderRadius: 2 }}
        >
          Bersihkan
        </Button>
      </Box>

      <Card variant="outlined">
        <TableContainer sx={{ maxHeight: '70vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Waktu</TableCell>
                <TableCell>Sholat</TableCell>
                <TableCell>Karyawan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Pesan</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">Tidak ada riwayat</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{log.prayer}</TableCell>
                    <TableCell>{log.name}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={log.status} 
                        color={log.status === 'success' ? 'success' : log.status === 'error' ? 'error' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message}>
                      {log.message}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
