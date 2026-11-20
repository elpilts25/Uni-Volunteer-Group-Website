import { useLayoutEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ThemeModeContext } from '../hooks/themeModeContext';
import { buildTheme } from '../theme';

const STORAGE_KEY = 'themeMode';

function ThemeModeProvider({ children }) {
    const [mode, setMode] = useState(() => (localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'));

    // data-theme switches the CSS variables in index.css.
    useLayoutEffect(() => {
        document.documentElement.dataset.theme = mode;
        localStorage.setItem(STORAGE_KEY, mode);
    }, [mode]);

    const theme = useMemo(() => buildTheme(mode), [mode]);
    const value = useMemo(
        () => ({ mode, toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')) }),
        [mode],
    );

    return (
        <ThemeModeContext.Provider value={value}>
            <ThemeProvider theme={theme}>
                <CssBaseline enableColorScheme />
                {children}
            </ThemeProvider>
        </ThemeModeContext.Provider>
    );
}

ThemeModeProvider.propTypes = { children: PropTypes.node };

export default ThemeModeProvider;
