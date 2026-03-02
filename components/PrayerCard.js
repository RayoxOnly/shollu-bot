import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import StatusBadge from './StatusBadge';
import WbTwilightRoundedIcon from '@mui/icons-material/WbTwilightRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import BedtimeRoundedIcon from '@mui/icons-material/BedtimeRounded';
import NightsStayRoundedIcon from '@mui/icons-material/NightsStayRounded';

const getIcon = (prayer) => {
  switch (prayer.toLowerCase()) {
    case 'subuh': return <WbTwilightRoundedIcon color="primary" sx={{ fontSize: 32 }} />;
    case 'dzuhur':
    case 'ashar': return <WbSunnyRoundedIcon color="warning" sx={{ fontSize: 32 }} />;
    case 'maghrib': return <BedtimeRoundedIcon color="secondary" sx={{ fontSize: 32 }} />;
    case 'isya': return <NightsStayRoundedIcon color="primary" sx={{ fontSize: 32 }} />;
    default: return <WbSunnyRoundedIcon sx={{ fontSize: 32 }} />;
  }
};

export default function PrayerCard({ prayer, loading }) {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width={100} height={24} />
            <Skeleton variant="text" width={60} height={32} />
          </Box>
          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 4 }} />
        </CardContent>
      </Card>
    );
  }

  if (!prayer) return null;

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2, 
        bgcolor: !prayer.enabled ? 'action.hover' : 'background.paper',
        opacity: !prayer.enabled ? 0.6 : 1,
        borderColor: prayer.status === 'completed' ? 'primary.main' : 'divider',
        borderWidth: prayer.status === 'completed' ? 2 : 1,
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ p: 1, bgcolor: 'surfaceVariant.main', borderRadius: 3, display: 'flex' }}>
          {getIcon(prayer.key)}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
            {prayer.label} {(!prayer.enabled) && '(Nonaktif)'}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {prayer.time}
          </Typography>
        </Box>
        <Box>
           <StatusBadge status={prayer.enabled ? prayer.status : 'skip'} />
        </Box>
      </CardContent>
    </Card>
  );
}
