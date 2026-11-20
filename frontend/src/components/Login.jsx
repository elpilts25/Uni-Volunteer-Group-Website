import { useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Box, Button, Container, Link, Paper, Typography } from '@mui/material';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { pageContainerStyle } from '../theme';
import api from '../axiosConfig';
import { useTranslations } from '../i18n/i18n';
import AuthField from './AuthField';
import LanguageSwitcher from './LanguageSwitcher';

function Login({ onLogin }) {
    const { t } = useTranslations('login');
    const { t: tc } = useTranslations('common');
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login', form);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role || 'ROLE_OBSERVER');
            onLogin?.(form.email);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error ?? tc('serverError'));
        }
    };

    return (
        <Box sx={pageContainerStyle}>
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <LanguageSwitcher />
            </Box>
            <Container sx={{ maxWidth: '420px !important' }}>
                <Paper elevation={6} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                    <Typography component="h1" variant="h5" fontWeight="bold" gutterBottom>
                        {t('title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('subtitle')}
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }}>
                        <AuthField
                            label={t('email')} name="email" type="email" icon={EmailOutlined}
                            placeholder={t('emailPlaceholder')} autoComplete="email" autoFocus
                            value={form.email} onChange={handleChange}
                        />
                        <AuthField
                            label={t('password')} name="password" icon={LockOutlined} password
                            placeholder={t('passwordPlaceholder')} autoComplete="current-password"
                            value={form.password} onChange={handleChange}
                        />

                        {error && (
                            <Alert severity="error" onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit" fullWidth variant="contained" size="large"
                            sx={{ mt: 1, py: 1.25, textTransform: 'none', fontSize: '1rem' }}
                        >
                            {t('submit')}
                        </Button>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                        {t('noAccount')}{' '}
                        <Link component="button" type="button" variant="body2" onClick={() => navigate('/register')}
                              sx={{ verticalAlign: 'baseline', fontWeight: 600 }}>
                            {t('register')}
                        </Link>
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
}

Login.propTypes = { onLogin: PropTypes.func };

export default Login;
