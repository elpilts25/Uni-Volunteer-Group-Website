// Shared style tokens used by the auth pages.
import { createTheme } from '@mui/material/styles';

export const colorBase = '#2f5bff';

// Wraps the whole auth page (centered, full-height).
export const pageContainerStyle = {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    py: 6,
};

// Slate card used across the forum pages.
export const cardSx = {
    bgcolor: 'var(--card-bg)',
    backgroundImage: 'none',
    border: '1px solid var(--outline)',
    borderRadius: 2,
};

export const buildTheme = (mode) => createTheme({
    palette: {
        mode,
        primary: { main: colorBase },
        background: mode === 'dark'
            ? { default: '#3a3a3a', paper: '#18181b' }
            : { default: '#f3f5fa', paper: '#ffffff' },
    },
    shape: { borderRadius: 8 },
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: mode === 'dark'
                    ? { backgroundColor: '#232326', '& fieldset': { borderColor: '#2f2f33' } }
                    : { backgroundColor: '#ffffff', '& fieldset': { borderColor: '#cfd6e4' } },
            },
        },
    },
});
