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

// Tinted, rounded inputs used inside dialogs and on full-page forms.
export const fieldSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'var(--card-alt)', borderRadius: 3,
        '& fieldset': { borderColor: 'var(--outline-strong)' },
    },
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
        // Every dialog and dropdown shares the slate card surface.
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'var(--card-bg)', backgroundImage: 'none',
                    border: '1px solid var(--outline)', borderRadius: 16,
                },
                root: fieldSx,
            },
        },
        MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700 } } },
        // Keeps an icon and its text on one line in the closed dropdown.
        MuiSelect: { styleOverrides: { select: { display: 'flex', alignItems: 'center', gap: 12 } } },
        MuiDialogActions: { styleOverrides: { root: { padding: '8px 24px 20px' } } },
        MuiPopover: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'var(--card-bg)', backgroundImage: 'none',
                    border: '1px solid var(--outline-strong)', borderRadius: 12, marginTop: 4,
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    '&.Mui-selected': { backgroundColor: 'transparent', fontWeight: 600 },
                    '&.Mui-selected:hover': { backgroundColor: 'var(--card-hover)' },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: mode === 'dark'
                    ? { backgroundColor: '#232326', '& fieldset': { borderColor: '#2f2f33' } }
                    : { backgroundColor: '#ffffff', '& fieldset': { borderColor: '#cfd6e4' } },
            },
        },
    },
});
