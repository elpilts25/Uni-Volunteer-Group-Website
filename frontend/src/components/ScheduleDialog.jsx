import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Alert, Box, Button, Dialog, DialogActions, DialogContent, TextField, ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import api from '../axiosConfig';
import { useTranslations } from '../i18n/i18n';
import { DialogField, DialogHeader } from './DialogParts';

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
                <DialogHeader
                    title={t('heading')} onClose={onClose}
                    eyebrow={form.date ? longDate(form.date, locale) : t('newEvent')}
                />
                <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '8px !important' }}>
                    <DialogField label={t('title')} id="event-title">
                        <TextField
                            id="event-title" name="title" required autoFocus fullWidth
                            placeholder={t('titlePlaceholder')}
                            value={form.title} onChange={handleChange}
                        />
                    </DialogField>
                    <DialogField label={t('type')} id="event-type">
                        <ToggleButtonGroup
                            id="event-type" exclusive fullWidth size="small" color="primary" value={form.type}
                            onChange={(_, value) => value && setForm({ ...form, type: value })}
                        >
                            <ToggleButton value="MEETING" sx={{ textTransform: 'none' }}>{te('MEETING')}</ToggleButton>
                            <ToggleButton value="EVENT" sx={{ textTransform: 'none' }}>{te('EVENT')}</ToggleButton>
                        </ToggleButtonGroup>
                    </DialogField>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                        <DialogField label={t('date')} id="event-date">
                            <TextField
                                id="event-date" name="date" type="date" required fullWidth
                                value={form.date} onChange={handleChange}
                            />
                        </DialogField>
                        <DialogField label={t('time')} id="event-time">
                            <TextField
                                id="event-time" name="time" type="time" required fullWidth
                                value={form.time} onChange={handleChange}
                            />
                        </DialogField>
                    </Box>
                    <DialogField label={t('location')} id="event-location">
                        <TextField
                            id="event-location" name="location" fullWidth placeholder={t('locationPlaceholder')}
                            value={form.location} onChange={handleChange}
                        />
                    </DialogField>
                    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
                </DialogContent>
                <DialogActions>
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
