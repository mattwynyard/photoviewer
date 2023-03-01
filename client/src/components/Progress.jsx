import { React } from 'react';
import Box from '@mui/material/Box';
import { LinearProgress, CircularProgress, Typography } from '@mui/material';

export const ProgressBar = (props) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

export const ProgressSpinner = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <CircularProgress />
    </Box>
  );
}

export const ProgressBarIndeterminate = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '40px' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="indeterminate"/>
      </Box>
    </Box>
  );
}