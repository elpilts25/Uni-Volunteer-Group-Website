import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Alert, Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle,
    Link, Paper, Typography,
} from '@mui/material';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { useNavigate } from 'react-router-dom';
import { pageContainerStyle } from '../theme';
import api from '../axiosConfig';
import { useTranslations } from '../i18n/i18n';
import AuthField from './AuthField';
import LanguageSwitcher from './LanguageSwitcher';

const today = new Date().toISOString().split('T')[0];

const RegisterForm = ({ onRegisterSuccess }) => {
    const { t } = useTranslations('register');
    const { t: tc } = useTranslations('common');
    const [form, setForm] = useState({
        username: '', fullName: '', email: '', department: '',
        phone: '', birthDate: '', password: '', confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [passwordMismatch, setPasswordMismatch] = useState(false);
    const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (passwordMismatch && (name === 'password' || name === 'confirmPassword')) {
            setPasswordMismatch(false);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // The backend doesn't see confirmPassword, so it is checked here.
        if (form.password !== form.confirmPassword) {
            setPasswordMismatch(true);
            setError(t('passwordMismatch'));
            return;
        }

        // eslint-disable-next-line no-unused-vars
        const { confirmPassword, ...payload } = form;
        try {
            await api.post('/auth/register', payload);
            setOpenSuccessDialog(true);
            onRegisterSuccess?.();
        } catch (err) {
            setError(err.response?.data?.error ?? tc('serverError'));
        }
    };

    const handleGoToLogin = () => {
        setOpenSuccessDialog(false);
        navigate('/login');
    };

    return (
        <Box sx={pageContainerStyle}>
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <LanguageSwitcher />
            </Box>
            <Container sx={{ maxWidth: '760px !important' }}>
                <Paper elevation={6} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                    <Typography component="h1" variant="h5" fontWeight="bold" gutterBottom>
                        {t('title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('subtitle')}
                    </Typography>

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}
                    >
                        <AuthField
                            label={t('username')} name="username" icon={PersonOutlined}
                            placeholder={t('usernamePlaceholder')} autoComplete="username" autoFocus
                            value={form.username} onChange={handleChange}
                        />
                        <AuthField
                            label={t('fullName')} name="fullName" icon={PersonOutlined}
                            placeholder={t('fullNamePlaceholder')} autoComplete="name"
                            value={form.fullName} onChange={handleChange}
                        />
                        <AuthField
                            label={t('email')} name="email" type="email" icon={EmailOutlined}
                            placeholder={t('emailPlaceholder')} autoComplete="email"
                            value={form.email} onChange={handleChange}
                        />
                        <AuthField
                            label={t('department')} name="department" icon={ApartmentOutlined}
                            placeholder={t('departmentPlaceholder')}
                            value={form.department} onChange={handleChange}
                        />
                        <AuthField
                            label={t('phone')} name="phone" type="tel" icon={PhoneOutlined}
                            placeholder={t('phonePlaceholder')} autoComplete="tel"
                            value={form.phone} onChange={handleChange}
                        />
                        <AuthField
                            label={t('birthDate')} name="birthDate" type="date" icon={CalendarMonthOutlined}
                            autoComplete="bday"
                            value={form.birthDate} onChange={handleChange}
                            htmlInput={{ max: today }}
                        />
                        <AuthField
                            label={t('password')} name="password" icon={LockOutlined} password
                            placeholder={t('passwordPlaceholder')} autoComplete="new-password"
                            error={passwordMismatch}
                            value={form.password} onChange={handleChange}
                        />
                        <AuthField
                            label={t('confirmPassword')} name="confirmPassword" icon={LockOutlined} password
                            placeholder={t('confirmPasswordPlaceholder')} autoComplete="new-password"
                            error={passwordMismatch}
                            value={form.confirmPassword} onChange={handleChange}
                        />

                        {error && (
                            <Alert severity="error" onClose={() => setError('')} sx={{ gridColumn: '1 / -1' }}>
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit" variant="contained" size="large"
                            sx={{ gridColumn: '1 / -1', py: 1.25, textTransform: 'none', fontSize: '1rem' }}
                        >
                            {t('submit')}
                        </Button>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                        {t('haveAccount')}{' '}
                        <Link component="button" type="button" variant="body2" onClick={() => navigate('/login')}
                              sx={{ verticalAlign: 'baseline', fontWeight: 600 }}>
                            {t('login')}
                        </Link>
                    </Typography>
                </Paper>
            </Container>

            <Dialog open={openSuccessDialog} onClose={handleGoToLogin} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
                    <CheckCircleOutlineIcon
                        sx={{ fontSize: 60, color: 'success.main', display: 'block', margin: '0 auto', mb: 2 }}
                    />
                    <Typography variant="h5" fontWeight="bold">
                        {t('successTitle')}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        {t('successMessage')}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button onClick={handleGoToLogin} variant="contained" size="large" sx={{ px: 4, textTransform: 'none' }}>
                        {t('goToLogin')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

RegisterForm.propTypes = {
    onRegisterSuccess: PropTypes.func,
};

export default RegisterForm;
