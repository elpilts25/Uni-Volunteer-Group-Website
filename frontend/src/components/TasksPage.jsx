import { useEffect, useState } from 'react';
import {
    Alert, Box, Button, LinearProgress, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import { translate, useTranslations } from '../i18n/i18n';
import { cardSx } from '../theme';
import { MANAGER_ROLES, hasRole } from '../utils/roles';
import { STATUSES, TEAMS } from '../utils/taskMeta';
import TaskCard from './TaskCard';
import TaskDialog from './TaskDialog';
import TaskFormDialog from './TaskFormDialog';

function TasksPage() {
    const { t, locale } = useTranslations('tasksPage');
    const { t: tc } = useTranslations('common');
    const { t: tm } = useTranslations('taskMeta');
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [team, setTeam] = useState('ALL');
    const [openId, setOpenId] = useState(null);
    const [form, setForm] = useState(null); // { task } while the create/edit form is open
    const [dragOver, setDragOver] = useState(null);
    const [version, setVersion] = useState(0); // bump to refetch after a change
    const canManage = hasRole(MANAGER_ROLES);

    useEffect(() => {
        api.get('/me').then((res) => setUsername(res.data.username)).catch(() => {});
    }, []);

    useEffect(() => {
        let active = true;
        api.get('/tasks')
            .then((res) => {
                if (!active) return;
                setTasks(res.data);
                setError('');
            })
            .catch((err) => {
                if (active) setError(err.response?.data?.error ?? translate('tasksPage.loadError'));
            });
        return () => { active = false; };
    }, [version]);

    const reload = () => setVersion((v) => v + 1);

    const doneCount = tasks.filter((task) => task.status === 'DONE').length;
    const percent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

    const query = search.trim().toLocaleLowerCase(locale);
    const visible = tasks.filter((task) =>
        (team === 'ALL' || task.team === team) && task.title.toLocaleLowerCase(locale).includes(query));

    const moveTask = async (id, status) => {
        const task = tasks.find((x) => x.id === id);
        if (!task || task.status === status) return;
        setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
        try {
            await api.patch(`/tasks/${id}/status`, { status });
        } catch (err) {
            setError(err.response?.data?.error ?? t('moveError'));
        }
        reload();
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            <Box>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ textTransform: 'none', mb: 1 }}>
                    {tc('backToForum')}
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                        <Typography component="h1" variant="h4" fontWeight="bold">{t('title')}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('subtitle')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ minWidth: 170 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
                                    {t('cycleProgress')}
                                </Typography>
                                <Typography variant="caption" fontWeight="bold">
                                    {doneCount}/{tasks.length} • {percent}%
                                </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={percent} sx={{ mt: 0.5, height: 4, borderRadius: 2 }} />
                        </Box>
                        {canManage && (
                            <Button variant="contained" startIcon={<AddIcon />} sx={{ textTransform: 'none' }}
                                    onClick={() => setForm({ task: null })}>
                                {t('newTask')}
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                    size="small" placeholder={t('searchPlaceholder')} value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ minWidth: 240 }}
                    slotProps={{
                        input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> },
                        htmlInput: { 'aria-label': t('searchLabel') },
                    }}
                />
                <ToggleButtonGroup
                    exclusive size="small" color="primary" value={team}
                    onChange={(_, value) => value && setTeam(value)}
                >
                    <ToggleButton value="ALL" sx={{ textTransform: 'none' }}>{t('allTeams')}</ToggleButton>
                    {Object.keys(TEAMS).map((key) => (
                        <ToggleButton key={key} value={key} sx={{ textTransform: 'none' }}>{tm(`teams.${key}`)}</ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

            <Box
                sx={{
                    display: 'grid', gap: 2, alignItems: 'start',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
                }}
            >
                {STATUSES.map((status) => {
                    const column = visible.filter((task) => task.status === status.key);
                    return (
                        <Paper
                            key={status.key} elevation={0}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(status.key); }}
                            onDragLeave={() => setDragOver((current) => (current === status.key ? null : current))}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(null);
                                moveTask(Number(e.dataTransfer.getData('text/plain')), status.key);
                            }}
                            sx={{
                                ...cardSx, p: 1.5, minHeight: 160,
                                ...(dragOver === status.key && { border: `1px solid ${status.color}` }),
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 8, height: 8, bgcolor: status.color, borderRadius: 0.5 }} />
                                    <Box>
                                        <Typography variant="body2" fontWeight="bold">{tm(`statuses.${status.key}.label`)}</Typography>
                                        <Typography variant="caption" color="text.secondary">{tm(`statuses.${status.key}.hint`)}</Typography>
                                    </Box>
                                </Box>
                                <Typography variant="caption" sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: 'var(--card-alt)' }}>
                                    {column.length}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'grid', gap: 1.5 }}>
                                {column.map((task) => <TaskCard key={task.id} task={task} onOpen={setOpenId} />)}
                                {column.length === 0 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                        {t('noTasks')}
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    );
                })}
            </Box>

            {openId !== null && (
                <TaskDialog
                    key={openId}
                    taskId={openId}
                    currentUsername={username}
                    canManage={canManage}
                    onClose={() => setOpenId(null)}
                    onChanged={reload}
                    onEdit={(task) => {
                        setOpenId(null);
                        setForm({ task });
                    }}
                />
            )}

            {form && (
                <TaskFormDialog
                    key={form.task?.id ?? 'new'}
                    task={form.task}
                    onClose={() => setForm(null)}
                    onSaved={(saved) => {
                        setForm(null);
                        reload();
                        setOpenId(saved.id);
                    }}
                />
            )}
        </Box>
    );
}

export default TasksPage;
