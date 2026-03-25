import { createTheme } from '@mui/material/styles'

export function createAppTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#2563eb',
      },
      secondary: {
        main: '#16a34a',
      },
      background: {
        default: mode === 'dark' ? '#020617' : '#f3f7fb',
        paper: mode === 'dark' ? '#0f172a' : '#ffffff',
      },
    },
    shape: {
      borderRadius: 24,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Segoe UI", sans-serif',
    },
  })
}
