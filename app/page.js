'use client';

import { useState, useEffect } from 'react';
import { Typography, Box, Grid, CircularProgress, Button, Skeleton } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import MosqueRoundedIcon from '@mui/icons-material/MosqueRounded';
import PrayerCard from '@/components/PrayerCard';
import { useToast } from '@/components/Toast';

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
        fetch('/api/analytics?days=7'),
      ]);
      setData(await ptRes.json());
      setAnalytics(await anRes.json());
    } catch {
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 60000);
    return () => clearInterval(iv);
  }, []);

  const handleTrigger = async (prayer) => {
    setTriggering(true);
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prayer }),
      });
      const r = await res.json();
      if (r.success) { showToast(`Absen ${prayer} selesai ✓`, 'success'); fetchData(); }
      else showToast(r.error || 'Gagal', 'error');
    } catch { showToast('Gagal memicu absen', 'error'); }
    finally { setTriggering(false); }
  };

  const nextLabel = () => {
    if (!data?.next_prayer) return '';
    const { label, time, tomorrow } = data.next_prayer;
    return `${label} · ${time}${tomorrow ? ' (besok)' : ''}`;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          {loading ? '' : data?.date}
        </Typography>
        <Typography variant="h2" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          Assalamu'alaikum 👋
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* ── Hero: Next Prayer ── */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 3,
              p: { xs: 3, md: 4 },
              position: 'relative',
              overflow: 'hidden',
              mb: 2.5,
            }}
          >
            {/* Decorative circle */}
            <Box sx={{
              position: 'absolute', top: -40, right: -40,
              width: 180, height: 180, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.08)',
            }} />
            <Box sx={{
              position: 'absolute', bottom: -20, right: 60,
              width: 100, height: 100, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.05)',
            }} />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MosqueRoundedIcon sx={{ fontSize: 20, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500 }}>
                  Sholat Berikutnya
                </Typography>
              </Box>

              <Typography variant="h1" sx={{ fontWeight: 800, lineHeight: 1, mb: 0.5, fontSize: { xs: '3rem', md: '3.5rem' } }}>
                {loading ? '--:--' : data?.next_prayer?.time}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, mb: 3, fontWeight: 500 }}>
                {loading ? 'Memuat...' : nextLabel()}
              </Typography>

              <Button
                variant="contained"
                disableElevation
                disabled={loading || triggering}
                onClick={() => handleTrigger(data?.next_prayer?.prayer || 'subuh')}
                startIcon={triggering ? <CircularProgress size={18} color="inherit" /> : <PlayArrowRoundedIcon />}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.18)',
                  color: 'inherit',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 2.5,
                  px: 3, py: 1.2,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
                }}
              >
                {triggering ? 'Memproses…' : 'Jalankan Absen'}
              </Button>
            </Box>
          </Box>

          {/* ── Quick Stats ── */}
          <Grid container spacing={2}>
            <Grid size={6}>
              <Box sx={{ bgcolor: 'surfaceContainerHigh.main', borderRadius: 2.5, p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <LocalFireDepartmentRoundedIcon sx={{ fontSize: 18, color: 'error.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    STREAK
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {loading ? <Skeleton width={60} /> : `${analytics?.streak?.current || 0}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">hari berturut-turut</Typography>
              </Box>
            </Grid>
            <Grid size={6}>
              <Box sx={{ bgcolor: 'surfaceContainerHigh.main', borderRadius: 2.5, p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <TrendingUpRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    SELESAI
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {loading ? <Skeleton width={60} /> : `${analytics?.stats?.rate || 0}%`}
                </Typography>
                <Typography variant="caption" color="text.secondary">7 hari terakhir</Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* ── Right: Prayer Schedule ── */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{
            bgcolor: 'surfaceContainerLow.main',
            borderRadius: 3,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, px: 1, mb: 0.5 }}>
              Jadwal Hari Ini
            </Typography>

            {loading
              ? Array.from({ length: 5 }).map((_, i) => <PrayerCard key={i} loading />)
              : data?.prayers?.filter((p) => p.key !== 'tarawih').map((p) => <PrayerCard key={p.key} prayer={p} />)
            }

            {/* Tarawih Section */}
            {!loading && data?.prayers?.find((p) => p.key === 'tarawih' && p.enabled) && (() => {
              const tp = data.prayers.find((p) => p.key === 'tarawih');
              return (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', px: 1 }}>
                    🌙 RAMADAN
                  </Typography>
                  <PrayerCard prayer={tp} />
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    disabled={triggering}
                    onClick={() => handleTrigger('tarawih')}
                    startIcon={triggering ? <CircularProgress size={16} color="inherit" /> : <PlayArrowRoundedIcon />}
                    sx={{
                      mt: 0.5,
                      borderRadius: 2,
                      py: 1,
                      bgcolor: 'secondary.main',
                      '&:hover': { bgcolor: 'secondary.dark' },
                    }}
                  >
                    {triggering ? 'Memproses…' : 'Jalankan Absen Tarawih'}
                  </Button>
                </Box>
              );
            })()}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
