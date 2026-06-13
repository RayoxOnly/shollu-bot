import { Box, Typography, Skeleton } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import WbTwilightRoundedIcon from '@mui/icons-material/WbTwilightRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import NightsStayRoundedIcon from '@mui/icons-material/NightsStayRounded';

const PRAYER_ICON = {
  subuh: <WbTwilightRoundedIcon sx={{ fontSize: 22 }} />,
  dzuhur: <LightModeRoundedIcon sx={{ fontSize: 22 }} />,
  ashar: <LightModeRoundedIcon sx={{ fontSize: 22 }} />,
  maghrib: <NightsStayRoundedIcon sx={{ fontSize: 22 }} />,
  isya: <NightsStayRoundedIcon sx={{ fontSize: 22 }} />,
  tarawih: <NightsStayRoundedIcon sx={{ fontSize: 22 }} />,
};

const STATUS_CONFIG = {
  completed: { icon: <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />, label: 'Selesai', color: 'primary.main' },
  pending:   { icon: <AccessTimeRoundedIcon sx={{ fontSize: 18 }} />,  label: 'Menunggu', color: 'text.secondary' },
  error:     { icon: <ErrorRoundedIcon sx={{ fontSize: 18 }} />,       label: 'Gagal', color: 'error.main' },
  skip:      { icon: <BlockRoundedIcon sx={{ fontSize: 18 }} />,       label: 'Nonaktif', color: 'text.disabled' },
};

export default function PrayerCard({ prayer, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width={60} height={16} />
          <Skeleton width={40} height={24} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton width={60} height={20} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!prayer) return null;

  const status = !prayer.enabled ? 'skip' : (prayer.status || 'pending');
  const conf = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.5,
        px: 2,
        borderRadius: 2,
        bgcolor: status === 'completed' ? 'primaryContainer.main' : 'surfaceContainerHigh.main',
        opacity: status === 'skip' ? 0.5 : 1,
        transition: 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
        cursor: 'default',
        '&:hover': {
          bgcolor: status === 'completed' ? 'primaryContainer.main' : 'surfaceContainerHighest.main',
          transform: status !== 'skip' ? 'translateY(-2px)' : 'none',
          boxShadow: status !== 'skip' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
        },
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: status === 'completed' ? 'primary.main' : 'surfaceContainer.main',
          color: status === 'completed' ? 'primary.contrastText' : 'text.secondary',
        }}
      >
        {PRAYER_ICON[prayer.key]}
      </Box>

      {/* Name + Time */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {prayer.label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
          {prayer.time}
        </Typography>
      </Box>

      {/* Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: conf.color }}>
        {conf.icon}
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {conf.label}
        </Typography>
      </Box>
    </Box>
  );
}
