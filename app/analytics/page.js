'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, LinearProgress } from '@mui/material';
import { useToast } from '@/components/Toast';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics?days=30');
        const json = await res.json();
        setData(json);
      } catch (err) {
        showToast('Gagal memuat analitik', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  const { stats, streak } = data || {};

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Analitik (30 Hari)
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tingkat Selesai Keseluruhan
              </Typography>
              <Typography variant="h3" fontWeight={800} color="primary.main">
                {stats?.rate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.completed} dari {stats?.possible} sholat
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Streak Sholat 5 Waktu
              </Typography>
              <Typography variant="h3" fontWeight={800} color="secondary.main">
                {streak?.current} Hari
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rekor terbaik: {streak?.best} Hari
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={700} gutterBottom>
        Tingkat Selesai per Waktu
      </Typography>
      
      <Card variant="outlined">
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].map((p) => {
            const pData = stats?.perPrayer?.[p];
            if (!pData) return null;
            return (
              <Box key={p}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                    {p}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {pData.rate}% ({pData.completed}/{pData.total})
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={pData.rate} 
                  sx={{ height: 10, borderRadius: 5, bgcolor: 'surfaceVariant.main' }}
                />
              </Box>
            );
          })}
        </CardContent>
      </Card>
    </Box>
  );
}
