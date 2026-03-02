'use client';

import { useState, useEffect } from 'react';
import { Typography, Box, Grid, Card, CardContent, CircularProgress, Button } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PrayerCard from '@/components/PrayerCard';
import { useToast } from '@/components/Toast';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      const [ptRes, anRes] = await Promise.all([
        fetch('/api/prayer-times'),
        fetch('/api/analytics?days=7')
      ]);
      const ptData = await ptRes.json();
      const anData = await anRes.json();
      setData(ptData);
      setAnalytics(anData);
    } catch (err) {
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleManualTrigger = async (prayer) => {
    setTriggering(true);
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prayer })
      });
      const result = await res.json();
      if (result.success) {
        showToast(`Trigger absen ${prayer} selesai`, 'success');
        fetchData();
      } else {
        showToast(result.error || 'Trigger gagal', 'error');
      }
    } catch (err) {
      showToast('Gagal memicu absen', 'error');
    } finally {
      setTriggering(false);
    }
  };

  const getNextLabel = () => {
    if (!data?.next_prayer) return 'Memuat...';
    if (data.next_prayer.tomorrow) {
      return `Berikutnya: ${data.next_prayer.label} (Besok, ${data.next_prayer.time})`;
    }
    return `Berikutnya: ${data.next_prayer.label} (${data.next_prayer.time})`;
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary.main" gutterBottom>
            Shollu Bot
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Otomatisasi absensi sholat wajib.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Next Prayer / Status Card */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', mb: 3, position: 'relative', overflow: 'hidden' }}>
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                opacity: 0.2,
              }}
            />
            <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
              <Typography variant="h6" fontWeight={500} gutterBottom sx={{ opacity: 0.9 }}>
                {loading ? 'Memuat jadwal...' : getNextLabel()}
              </Typography>
              <Typography variant="h2" fontWeight={800} sx={{ mb: 2 }}>
                {loading ? '--:--' : data?.next_prayer?.time}
              </Typography>
              
              <Button 
                variant="contained" 
                color="secondary"
                disabled={loading || triggering}
                onClick={() => handleManualTrigger(data?.next_prayer?.prayer || 'subuh')}
                startIcon={triggering ? <CircularProgress size={20} color="inherit" /> : <PlayArrowRoundedIcon />}
                sx={{ borderRadius: 10, px: 3, py: 1 }}
              >
                {triggering ? 'Memproses...' : 'Jalankan Absen Sekarang'}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats Overview */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <LocalFireDepartmentRoundedIcon color="error" />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Streak Saat Ini</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700}>
                    {loading ? '-' : `${analytics?.streak?.current || 0} Hari`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <CheckCircleOutlineRoundedIcon color="primary" />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Tingkat Selesai</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700}>
                    {loading ? '-' : `${analytics?.stats?.rate || 0}%`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Today's Prayers List */}
        <Grid item xs={12} md={5}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Typography variant="h6" fontWeight={700}>
              Jadwal Hari Ini
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {loading ? '-' : data?.date}
            </Typography>
          </Box>
          
          {loading ? (
             Array.from({ length: 5 }).map((_, i) => <PrayerCard key={i} loading={true} />)
          ) : (
            data?.prayers?.map((prayer) => (
              <PrayerCard key={prayer.key} prayer={prayer} />
            ))
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
