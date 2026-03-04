import { Chip } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PendingRoundedIcon from '@mui/icons-material/PendingRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';

export default function StatusBadge({ status, sx = {} }) {
  let color = 'default';
  let icon = <PendingRoundedIcon />;
  let label = 'Menunggu';

  switch (status) {
    case 'completed':
    case 'success':
      color = 'primary';
      icon = <CheckCircleRoundedIcon />;
      label = 'Selesai';
      break;
    case 'missed':
    case 'error':
      color = 'error';
      icon = <CancelRoundedIcon />;
      label = status === 'error' ? 'Gagal' : 'Terlewat';
      break;
    case 'skip':
      color = 'secondary';
      icon = <BlockRoundedIcon />;
      label = 'Dilewati';
      break;
    case 'pending':
    default:
      color = 'warning';
      icon = <PendingRoundedIcon />;
      label = 'Menunggu';
      break;
  }

  return (
    <Chip
      size="small"
      icon={icon}
      label={label}
      color={color}
      variant="filled"
      sx={{ fontWeight: 600, ...sx }}
    />
  );
}
