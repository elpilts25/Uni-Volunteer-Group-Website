import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Dialog, DialogActions, DialogContent, IconButton, MenuItem, Paper, TextField, Tooltip,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import { translate, useTranslations } from '../i18n/i18n';
import { cardSx, colorBase } from '../theme';
import { MANAGER_ROLES, hasRole } from '../utils/roles';
import { DialogHeader } from './DialogParts';
import ScheduleDialog from './ScheduleDialog';

const TYPES = {
    MEETING: { color: colorBase },
    EVENT: { color: '#8b5cf6' },
};
const MAX_CHIPS = 3;

const pad = (n) => String(n).padStart(2, '0');
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const capitalize = (s, locale) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
const monthLabel = (year, month, locale) =>
    capitalize(new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' }), locale);

// Monday-first grid covering the whole month, padded to full weeks.
function buildGrid(year, month) {
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => new Date(year, month, 1 - offset + i));
}

function CalendarPage() {
    const { t, locale } = useTranslations('calendar');
    const { t: tc } = useTranslations('common');
    const { t: te } = useTranslations('eventTypes');
    const navigate = useNavigate();
    const now = new Date();
    const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
    const [events, setEvents] = useState([]);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [scheduleDate, setScheduleDate] = useState(null);
    const [dayDate, setDayDate] = useState(null);
    const [version, setVersion] = useState(0); // bump to refetch after a change
    const canEdit = hasRole(MANAGER_ROLES);
    const isAdmin = hasRole(['ROLE_ADMIN']);
    const todayIso = toIso(now);

    const days = useMemo(() => buildGrid(cursor.year, cursor.month), [cursor]);
    const from = toIso(days[0]);
    const to = toIso(days[days.length - 1]);

    useEffect(() => {
        api.get('/me').then((res) => setUsername(res.data.username)).catch(() => {});
    }, []);

    useEffect(() => {
        let active = true;
        api.get('/calendar/events', { params: { from, to } })
            .then((res) => {
                if (!active) return;
                setEvents(res.data);
                setError('');
            })
            .catch((err) => {
                if (active) setError(err.response?.data?.error ?? translate('calendar.loadError'));
            });
        return () => { active = false; };
    }, [from, to, version]);

    const eventsByDate = useMemo(() => {
        const map = {};
        events.forEach((e) => { (map[e.date] ??= []).push(e); });
        return map;
    }, [events]);

    const monthPrefix = `${cursor.year}-${pad(cursor.month + 1)}`;
    const monthEvents = events.filter((e) => e.date.startsWith(monthPrefix));

    const shiftMonth = (delta) => {
        const d = new Date(cursor.year, cursor.month + delta, 1);
        setCursor({ year: d.getFullYear(), month: d.getMonth() });
    };

    const monthOptions = Array.from({ length: 25 }, (_, i) => {
        const d = new Date(cursor.year, cursor.month - 12 + i, 1);
        return { value: `${d.getFullYear()}-${d.getMonth()}`, label: monthLabel(d.getFullYear(), d.getMonth(), locale) };
    });

    const handleDelete = async (event) => {
        try {
            await api.delete(`/calendar/events/${event.id}`);
            setVersion((v) => v + 1);
        } catch (err) {
            setError(err.response?.data?.error ?? t('deleteError'));
        }
    };

    const canDelete = (event) => isAdmin || (canEdit && event.createdBy === username);

    const handleDayClick = (iso, hasEvents) => {
        if (hasEvents) setDayDate(iso);
        else if (canEdit) setScheduleDate(iso);
    };
    const dayDialogEvents = dayDate ? eventsByDate[dayDate] ?? [] : [];

    return (
        // Wider than the 1100px page container, but centered on it.
        <Box
            sx={{
                display: 'grid', gap: 3,
                width: 'min(1300px, 100vw - 64px)',
                ml: 'calc(50% - min(650px, 50vw - 32px))',
            }}
        >
            <Box>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ textTransform: 'none', mb: 1 }}>
                    {tc('backToForum')}
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                        <Typography component="h1" variant="h4" fontWeight="bold">{t('title')}</Typography>
                        <Typography variant="body2" color="text.secondary">{t('subtitle')}</Typography>
                    </Box>
                    {canEdit && (
                        <Button variant="contained" startIcon={<AddIcon />} sx={{ textTransform: 'none' }}
                                onClick={() => setScheduleDate(todayIso)}>
                            {t('schedule')}
                        </Button>
                    )}
                </Box>
            </Box>

            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

            <Box
                sx={{
                    display: 'grid', gap: 2, alignItems: 'start',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 300px' },
                }}
            >
                <Paper elevation={0} sx={{ ...cardSx, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                        <IconButton size="small" aria-label={t('previousMonth')} onClick={() => shiftMonth(-1)}>
                            <ChevronLeft />
                        </IconButton>
                        <IconButton size="small" aria-label={t('nextMonth')} onClick={() => shiftMonth(1)}>
                            <ChevronRight />
                        </IconButton>
                        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
                            {monthLabel(cursor.year, cursor.month, locale)}
                        </Typography>
                        <TextField
                            select size="small" value={`${cursor.year}-${cursor.month}`}
                            onChange={(e) => {
                                const [year, month] = e.target.value.split('-').map(Number);
                                setCursor({ year, month });
                            }}
                            sx={{ minWidth: 170 }}
                            slotProps={{ htmlInput: { 'aria-label': t('selectMonth') } }}
                        >
                            {monthOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </TextField>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                        {t('weekdays', { returnObjects: true }).map((d) => (
                            <Typography
                                key={d} variant="body2" color="text.secondary"
                                sx={{ p: 1.5, borderTop: '1px solid var(--outline-strong)', textTransform: 'uppercase', letterSpacing: 1 }}
                            >
                                {d}
                            </Typography>
                        ))}
                        {days.map((day) => {
                            const iso = toIso(day);
                            const inMonth = day.getMonth() === cursor.month;
                            const dayEvents = eventsByDate[iso] ?? [];
                            return (
                                <Box
                                    key={iso}
                                    onClick={() => handleDayClick(iso, dayEvents.length > 0)}
                                    sx={{
                                        minHeight: { xs: 88, sm: 136 }, p: 1, borderTop: '1px solid var(--outline-strong)',
                                        borderLeft: '1px solid var(--outline-strong)', minWidth: 0,
                                        '&:nth-of-type(7n + 1)': { borderLeft: 0 },
                                        opacity: inMonth ? 1 : 0.45,
                                        cursor: canEdit || dayEvents.length ? 'pointer' : 'default',
                                        '&:hover': canEdit || dayEvents.length ? { bgcolor: 'var(--card-hover)' } : undefined,
                                    }}
                                >
                                    <Typography
                                        variant="body2" fontWeight={iso === todayIso ? 'bold' : 'normal'}
                                        sx={iso === todayIso
                                            ? { bgcolor: colorBase, color: '#fff', borderRadius: '50%', width: 28, height: 28,
                                                display: 'inline-grid', placeItems: 'center' }
                                            : undefined}
                                    >
                                        {day.getDate()}
                                    </Typography>
                                    {dayEvents.slice(0, MAX_CHIPS).map((e) => (
                                        <Tooltip key={e.id} title={`${e.time.slice(0, 5)} ${e.title}`}>
                                            <Typography
                                                noWrap variant="caption" component="div"
                                                sx={{
                                                    mt: 0.5, px: 0.75, py: 0.4, borderRadius: 0.5, fontSize: 12.5,
                                                    bgcolor: `${TYPES[e.type].color}44`,
                                                    borderLeft: `2px solid ${TYPES[e.type].color}`,
                                                }}
                                            >
                                                {e.time.slice(0, 5)} {e.title}
                                            </Typography>
                                        </Tooltip>
                                    ))}
                                    {dayEvents.length > MAX_CHIPS && (
                                        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                                            {t('more', { count: dayEvents.length - MAX_CHIPS })}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>

                <Paper elevation={0} sx={{ ...cardSx, p: 2 }}>
                    <Typography variant="caption" color="primary" sx={{ letterSpacing: 1 }}>{t('thisMonth')}</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{t('upcoming')}</Typography>

                    {monthEvents.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                            {t('noEvents')}
                        </Typography>
                    )}

                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                        {monthEvents.map((e) => {
                            const date = new Date(`${e.date}T00:00:00`);
                            return (
                                <Box key={e.id} sx={{ p: 1.5, border: '1px solid var(--outline-strong)', borderRadius: 1, bgcolor: 'var(--card-alt)' }}>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <Box sx={{ textAlign: 'center', minWidth: 36 }}>
                                            <Typography variant="caption" color="text.secondary" component="div">
                                                {date.toLocaleDateString(locale, { month: 'short' }).toLocaleUpperCase(locale)}
                                            </Typography>
                                            <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1 }}>{date.getDate()}</Typography>
                                        </Box>
                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{ px: 0.75, py: 0.25, borderRadius: 0.5, bgcolor: `${TYPES[e.type].color}44` }}
                                            >
                                                {te(e.type)}
                                            </Typography>
                                            <Typography fontWeight="bold" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>{e.title}</Typography>
                                        </Box>
                                        {canDelete(e) && (
                                            <Tooltip title={tc('delete')}>
                                                <IconButton size="small" aria-label={tc('delete')} onClick={() => handleDelete(e)}
                                                            sx={{ alignSelf: 'start' }}>
                                                    <DeleteOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid var(--outline-strong)', display: 'grid', gap: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary"
                                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <AccessTimeOutlined sx={{ fontSize: 14 }} /> {e.time.slice(0, 5)}
                                        </Typography>
                                        {e.location && (
                                            <Typography variant="caption" color="text.secondary"
                                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflowWrap: 'anywhere' }}>
                                                <PlaceOutlined sx={{ fontSize: 14 }} /> {e.location}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
            </Box>

            {dayDate && (
                <Dialog open onClose={() => setDayDate(null)} maxWidth="xs" fullWidth>
                    <DialogHeader
                        title={t('dayEvents')} onClose={() => setDayDate(null)}
                        eyebrow={new Date(`${dayDate}T00:00:00`)
                            .toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                            .toLocaleUpperCase(locale)}
                    />
                    <DialogContent sx={{ display: 'grid', gap: 1.5, pt: '8px !important' }}>
                        {dayDialogEvents.length === 0 && (
                            <Typography variant="body2" color="text.secondary">{t('noEventsDay')}</Typography>
                        )}
                        {dayDialogEvents.map((e) => (
                            <Box key={e.id} sx={{ p: 1.5, border: '1px solid var(--outline-strong)', borderRadius: 1, bgcolor: 'var(--card-alt)' }}>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{ px: 0.75, py: 0.25, borderRadius: 0.5, bgcolor: `${TYPES[e.type].color}44` }}
                                        >
                                            {te(e.type)}
                                        </Typography>
                                        <Typography fontWeight="bold" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>{e.title}</Typography>
                                    </Box>
                                    {canDelete(e) && (
                                        <Tooltip title={tc('delete')}>
                                            <IconButton size="small" aria-label={tc('delete')} onClick={() => handleDelete(e)}
                                                        sx={{ alignSelf: 'start' }}>
                                                <DeleteOutlined fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid var(--outline-strong)', display: 'grid', gap: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary"
                                                sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <AccessTimeOutlined sx={{ fontSize: 14 }} /> {e.time.slice(0, 5)}
                                    </Typography>
                                    {e.location && (
                                        <Typography variant="caption" color="text.secondary"
                                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflowWrap: 'anywhere' }}>
                                            <PlaceOutlined sx={{ fontSize: 14 }} /> {e.location}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </DialogContent>
                    <DialogActions>
                        {canEdit && (
                            <Button startIcon={<AddIcon />} sx={{ textTransform: 'none' }}
                                    onClick={() => { setScheduleDate(dayDate); setDayDate(null); }}>
                                {t('addEvent')}
                            </Button>
                        )}
                        <Button onClick={() => setDayDate(null)} sx={{ textTransform: 'none' }}>{tc('close')}</Button>
                    </DialogActions>
                </Dialog>
            )}

            {scheduleDate && (
                <ScheduleDialog
                    key={scheduleDate}
                    date={scheduleDate}
                    onClose={() => setScheduleDate(null)}
                    onSaved={() => {
                        setScheduleDate(null);
                        setVersion((v) => v + 1);
                    }}
                />
            )}
        </Box>
    );
}

export default CalendarPage;
