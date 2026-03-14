'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, LinearProgress, CircularProgress, Skeleton } from '@mui/material';
import { useToast } from '@/components/Toast';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/analytics?days=30');
        setData(await res.json());
      } catch { showToast('Tidak dapat memuat data analitik. Periksa koneksi Anda.', 'error'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ pt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const { stats, streak } = data || {};
  const prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

  return (
    <Box>
      <Box className="anim-stagger stagger-1">
        <Typography variant="overline" color="text.secondary">Statistik</Typography>
        <Typography variant="h2" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: { xs: 2.5, md: 4 } }}>
          Analitik 30 Hari
        </Typography>
      </Box>

      {/* Summary row */}
      <Grid className="anim-stagger stagger-2" container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Tingkat Selesai', value: `${stats?.rate || 0}%`, sub: `${stats?.completed || 0} dari ${stats?.possible || 0}` },
          { label: 'Streak Saat Ini', value: `${streak?.current || 0}`, sub: 'hari berturut-turut' },
          { label: 'Rekor Terbaik', value: `${streak?.best || 0}`, sub: 'hari berturut-turut' },
        ].map((s, i) => (
          <Grid size={{ xs: 12, sm: 4 }} key={i}>
            <Box sx={{ bgcolor: 'surfaceContainerHigh.main', borderRadius: 2.5, p: { xs: 2, sm: 3 } }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                {s.label.toUpperCase()}
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, color: i === 0 ? 'primary.main' : 'text.primary', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {s.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">{s.sub}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Per-prayer bars */}
      <Box className="anim-stagger stagger-3" sx={{ bgcolor: 'surfaceContainerLow.main', borderRadius: 2.5, p: { xs: 2, sm: 3 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
          Per Waktu Sholat
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {prayers.map((p) => {
            const d = stats?.perPrayer?.[p];
            if (!d) return null;
            return (
              <Box key={p}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {p}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {d.rate}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={d.rate}
                  sx={{
                    bgcolor: 'surfaceContainerHigh.main',
                    '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, display: 'block' }}>
                  {d.completed} dari {d.total} hari
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
