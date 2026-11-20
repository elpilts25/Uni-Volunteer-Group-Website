import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Alert, Box, Button, Dialog, DialogActions, DialogContent, TextField, ToggleButton,
    ToggleButtonGroup, Typography,
} from '@mui/material';
import api from '../axiosConfig';
import { useTranslations } from '../i18n/i18n';

const longDate = (iso, locale) =>
    new Date(`${iso}T00:00:00`)
        .toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        .toLocaleUpperCase(locale);

// Remount with a new `key` to reset the form for another date.
function ScheduleDialog({ date, onClose, onSaved }) {
    const { t, locale } = useTranslations('scheduleDialog');
    const { t: tc } = useTranslations('common');
    const { t: te } = useTranslations('eventTypes');
    const [form, setForm] = useState({ title: '', type: 'MEETING', date, time: '18:00', location: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/calendar/events', form);
            onSaved();
        } catch (err) {
            setError(err.response?.data?.error ?? tc('serverError'));
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <Box component="form" onSubmit={handleSubmit}>
                <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                    <Typography variant="caption" color="primary" sx={{ letterSpacing: 1 }}>
                        {form.date ? longDate(form.date, locale) : t('newEvent')}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">{t('heading')}</Typography>
                </Box>
                <DialogContent sx={{ display: 'grid', gap: 2 }}>
                    <TextField
                        label={t('title')} name="title" required autoFocus fullWidth
                        placeholder={t('titlePlaceholder')}
                        value={form.title} onChange={handleChange}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <Box>
                        <Typography variant="caption" color="text.secondary">{t('type')}</Typography>
                        <ToggleButtonGroup
                            exclusive fullWidth size="small" color="primary" value={form.type}
                            onChange={(_, value) => value && setForm({ ...form, type: value })}
                            sx={{ mt: 0.5 }}
                        >
                            <ToggleButton value="MEETING" sx={{ textTransform: 'none' }}>{te('MEETING')}</ToggleButton>
                            <ToggleButton value="EVENT" sx={{ textTransform: 'none' }}>{te('EVENT')}</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                        <TextField
                            label={t('date')} name="date" type="date" required
                            value={form.date} onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                            label={t('time')} name="time" type="time" required
                            value={form.time} onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Box>
                    <TextField
                        label={t('location')} name="location" fullWidth placeholder={t('locationPlaceholder')}
                        value={form.location} onChange={handleChange}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} sx={{ textTransform: 'none' }}>{tc('cancel')}</Button>
                    <Button type="submit" variant="contained" sx={{ textTransform: 'none' }}>
                        {t('submit')}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}

ScheduleDialog.propTypes = {
    date: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired,
};

export default ScheduleDialog;
