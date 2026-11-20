import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import { AppBar, Box, Container, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import ForumOutlined from '@mui/icons-material/ForumOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import api from '../axiosConfig';
import useLogout from '../hooks/useLogout';
import { useThemeMode } from '../hooks/themeModeContext';
import { useTranslations } from '../i18n/i18n';
import LanguageSwitcher from './LanguageSwitcher';

const PAGE_WIDTH = '1100px !important';

function ForumLayout({ onLogout }) {
    const [username, setUsername] = useState('');
    const logout = useLogout(onLogout);
    const { t } = useTranslations('layout');
    const { mode, toggle } = useThemeMode();

    useEffect(() => {
        api.get('/me').then((res) => setUsername(res.data.username)).catch(() => {});
    }, []);

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'var(--app-bg)' }}>
            <AppBar
                position="static" elevation={0} color="inherit"
                sx={{
                    bgcolor: 'var(--header-bg)', color: 'text.primary', backgroundImage: 'none',
                    borderBottom: '1px solid var(--outline)',
                }}
            >
                <Toolbar sx={{ width: '100%', px: { xs: 2, sm: 4 }, gap: 1 }}>
                    <ForumOutlined color="primary" />
                    <Typography
                        component={RouterLink} to="/" variant="h6" fontWeight="bold"
                        sx={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        {t('productName')}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <LanguageSwitcher />
                    <Tooltip title={mode === 'dark' ? t('lightMode') : t('darkMode')}>
                        <IconButton
                            color="inherit" onClick={toggle}
                            aria-label={mode === 'dark' ? t('lightMode') : t('darkMode')}
                        >
                            {mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
                        </IconButton>
                    </Tooltip>
                    <PersonOutlined fontSize="small" />
                    <Typography variant="body2" sx={{ mr: 1 }}>{username}</Typography>
                    <Tooltip title={t('logout')}>
                        <IconButton color="inherit" onClick={logout} aria-label={t('logout')}>
                            <LogoutOutlined />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <Container sx={{ maxWidth: PAGE_WIDTH, flex: 1, py: 4 }}>
                <Outlet />
            </Container>

            <Box
                component="footer"
                sx={{ bgcolor: 'var(--header-bg)', borderTop: '1px solid var(--outline)', py: 2, textAlign: 'center' }}
            >
                <Typography variant="caption" color="text.secondary">
                    {t('footer', { year: new Date().getFullYear() })}
                </Typography>
            </Box>
        </Box>
    );
}

ForumLayout.propTypes = { onLogout: PropTypes.func };

export default ForumLayout;
