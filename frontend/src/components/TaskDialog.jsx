import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Alert, Avatar, Box, Button, Checkbox, CircularProgress, Dialog, FormControlLabel, IconButton,
    MenuItem, TextField, Tooltip, Typography,
} from '@mui/material';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import RadioButtonUncheckedOutlined from '@mui/icons-material/RadioButtonUncheckedOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import api from '../axiosConfig';
import { translate, useTranslations } from '../i18n/i18n';
import timeAgo from '../utils/timeAgo';
import { PRIORITIES, STATUSES, formatDate, initials } from '../utils/taskMeta';
import TeamTag from './TeamTag';

const SECTION_BORDER = '1px solid var(--outline-strong)';

function Field({ label, children }) {
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>{label}</Typography>
            {children}
        </Box>
    );
}

Field.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node };

function TaskDialog({ taskId, currentUsername, canManage, onClose, onChanged, onEdit }) {
    const { t } = useTranslations('taskDialog');
    const { t: tc } = useTranslations('common');
    const { t: tm } = useTranslations('taskMeta');
    const [task, setTask] = useState(null);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        api.get(`/tasks/${taskId}`)
            .then((res) => { if (active) setTask(res.data); })
            .catch((err) => { if (active) setError(err.response?.data?.error ?? translate('taskDialog.loadError')); });
        return () => { active = false; };
    }, [taskId]);

    // Runs a mutation that returns the updated task, then refreshes the board behind the dialog.
    const act = async (request) => {
        try {
            const res = await request();
            setTask(res.data);
            setError('');
            onChanged();
            return true;
        } catch (err) {
            setError(err.response?.data?.error ?? t('actionError'));
            return false;
        }
    };

    const submitComment = async (e) => {
        e.preventDefault();
        if (await act(() => api.post(`/tasks/${taskId}/comments`, { content: comment }))) setComment('');
    };

    const handleDelete = async () => {
        if (!window.confirm(t('confirmDelete'))) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            onChanged();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error ?? t('deleteError'));
        }
    };

    if (!task) {
        return (
            <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    {error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}
                </Box>
            </Dialog>
        );
    }

    const isAssigned = task.assignees.some((a) => a.username === currentUsername);
    const priority = PRIORITIES[task.priority];

    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth>
            <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: SECTION_BORDER }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TeamTag team={task.team} />
                    <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
                        {t('task', { code: task.code })}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    {canManage && (
                        <>
                            <Tooltip title={tc('edit')}>
                                <IconButton size="small" aria-label={tc('edit')} onClick={() => onEdit(task)}>
                                    <EditOutlined fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={tc('delete')}>
                                <IconButton size="small" aria-label={tc('delete')} onClick={handleDelete}>
                                    <DeleteOutlined fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    <IconButton size="small" aria-label={tc('close')} onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ mt: 1, overflowWrap: 'anywhere' }}>{task.title}</Typography>
                <Typography variant="caption" color="text.secondary">{t('createdBy', { author: task.createdBy })}</Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 260px' } }}>
                <Box sx={{ p: 3, display: 'grid', gap: 3, alignContent: 'start', minWidth: 0 }}>
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>{t('description')}</Typography>
                        <Typography variant="body2" color={task.description ? 'text.primary' : 'text.secondary'}
                                    sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                            {task.description ?? t('noDescription')}
                        </Typography>
                    </Box>

                    {task.criteria.length > 0 && (
                        <Box sx={{ pt: 2, borderTop: SECTION_BORDER }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>{t('criteria')}</Typography>
                            {task.criteria.map((c, i) => (
                                <FormControlLabel
                                    key={`${i}-${c.text}`} sx={{ display: 'flex', mx: 0 }}
                                    control={
                                        <Checkbox
                                            size="small" checked={c.done}
                                            icon={<RadioButtonUncheckedOutlined />} checkedIcon={<CheckCircleOutlined />}
                                            color="success"
                                            onChange={(e) => act(() => api.patch(`/tasks/${taskId}/criteria/${i}`, { done: e.target.checked }))}
                                        />
                                    }
                                    label={<Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{c.text}</Typography>}
                                />
                            ))}
                        </Box>
                    )}

                    <Box sx={{ pt: 2, borderTop: SECTION_BORDER }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">{t('discussion')}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('commentCount', { count: task.comments.length })}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'grid', gap: 1.5, mb: 2 }}>
                            {task.comments.map((c) => (
                                <Box key={c.id}>
                                    <Typography variant="caption" color="text.secondary">
                                        <b>{c.author}</b> • {timeAgo(c.createdAt)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                                        {c.content}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                        <Box component="form" onSubmit={submitComment} sx={{ display: 'grid', gap: 1 }}>
                            <TextField
                                required multiline minRows={2} placeholder={t('commentPlaceholder')}
                                value={comment} onChange={(e) => setComment(e.target.value)}
                            />
                            <Button type="submit" variant="contained" size="small" endIcon={<SendOutlined />}
                                    sx={{ justifySelf: 'end', textTransform: 'none' }}>
                                {t('comment')}
                            </Button>
                        </Box>
                    </Box>

                    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
                </Box>

                <Box sx={{ p: 3, bgcolor: 'var(--card-alt)', borderLeft: { md: SECTION_BORDER }, borderTop: { xs: SECTION_BORDER, md: 0 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1, display: 'block', mb: 2 }}>
                        {t('info')}
                    </Typography>

                    <Field label={t('status')}>
                        <TextField
                            select size="small" fullWidth value={task.status}
                            onChange={(e) => act(() => api.patch(`/tasks/${taskId}/status`, { status: e.target.value }))}
                        >
                            {STATUSES.map((s) => <MenuItem key={s.key} value={s.key}>{tm(`statuses.${s.key}.label`)}</MenuItem>)}
                        </TextField>
                    </Field>

                    <Field label={t('assignedTo')}>
                        {task.assignees.length === 0 && (
                            <Typography variant="body2" color="text.secondary">{t('nobody')}</Typography>
                        )}
                        {task.assignees.map((a) => (
                            <Box key={a.username} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: '#3b3f7a' }}>{initials(a.fullName)}</Avatar>
                                <Typography variant="body2">{a.fullName}</Typography>
                            </Box>
                        ))}
                        <Button
                            size="small" variant="outlined" sx={{ mt: 1, textTransform: 'none' }}
                            onClick={() => act(() => (isAssigned
                                ? api.delete(`/tasks/${taskId}/claim`)
                                : api.post(`/tasks/${taskId}/claim`)))}
                        >
                            {isAssigned ? t('release') : t('claim')}
                        </Button>
                    </Field>

                    <Field label={t('dueDate')}>
                        <Typography variant="body2">
                            {formatDate(task.dueDate, { day: '2-digit', month: 'short', year: 'numeric' }) ?? '—'}
                        </Typography>
                    </Field>

                    <Field label={t('priority')}>
                        <Typography variant="body2" fontWeight={600} sx={{ color: priority.color }}>
                            {tm(`priorities.${task.priority}`)}
                        </Typography>
                    </Field>

                    <Field label={t('team')}><TeamTag team={task.team} /></Field>
                </Box>
            </Box>
        </Dialog>
    );
}

TaskDialog.propTypes = {
    taskId: PropTypes.number.isRequired,
    currentUsername: PropTypes.string,
    canManage: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onChanged: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
};

export default TaskDialog;
