import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Alert, Box, Button, Dialog, DialogActions, DialogContent, MenuItem, TextField,
} from '@mui/material';
import api from '../axiosConfig';
import { useTranslations } from '../i18n/i18n';
import { TaskShape } from '../lib/interfaces';
import { PRIORITIES, TEAMS } from '../utils/taskMeta';
import { DialogField, DialogHeader } from './DialogParts';

// Create (task === null) or edit a task; remount with a new `key` to reset the form.
function TaskFormDialog({ task, onClose, onSaved }) {
    const { t } = useTranslations('taskForm');
    const { t: tc } = useTranslations('common');
    const { t: tm } = useTranslations('taskMeta');
    const [form, setForm] = useState({
        team: task?.team ?? 'DESIGN',
        title: task?.title ?? '',
        description: task?.description ?? '',
        priority: task?.priority ?? 'MEDIUM',
        dueDate: task?.dueDate ?? '',
        criteria: task?.criteria.map((c) => c.text).join('\n') ?? '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const payload = {
            ...form,
            dueDate: form.dueDate || null,
            criteria: form.criteria.split('\n').map((line) => line.trim()).filter(Boolean),
        };
        try {
            const res = task
                ? await api.put(`/tasks/${task.id}`, payload)
                : await api.post('/tasks', payload);
            onSaved(res.data);
        } catch (err) {
            setError(err.response?.data?.error ?? tc('serverError'));
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <Box component="form" onSubmit={handleSubmit}>
                <DialogHeader title={task ? t('editTitle') : t('newTitle')} onClose={onClose} />
                <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '8px !important' }}>
                    <DialogField label={t('title')} id="task-title">
                        <TextField
                            id="task-title" name="title" required autoFocus fullWidth
                            value={form.title} onChange={handleChange}
                        />
                    </DialogField>
                    <DialogField label={t('description')} id="task-description">
                        <TextField
                            id="task-description" name="description" fullWidth multiline minRows={3}
                            value={form.description} onChange={handleChange}
                        />
                    </DialogField>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' } }}>
                        <DialogField label={t('team')} id="task-team">
                            <TextField select id="task-team" name="team" fullWidth value={form.team} onChange={handleChange}>
                                {Object.keys(TEAMS).map((key) => (
                                    <MenuItem key={key} value={key}>{tm(`teams.${key}`)}</MenuItem>
                                ))}
                            </TextField>
                        </DialogField>
                        <DialogField label={t('priority')} id="task-priority">
                            <TextField
                                select id="task-priority" name="priority" fullWidth
                                value={form.priority} onChange={handleChange}
                            >
                                {Object.keys(PRIORITIES).map((key) => (
                                    <MenuItem key={key} value={key}>{tm(`priorities.${key}`)}</MenuItem>
                                ))}
                            </TextField>
                        </DialogField>
                        <DialogField label={t('dueDate')} id="task-due-date">
                            <TextField
                                id="task-due-date" name="dueDate" type="date" fullWidth
                                value={form.dueDate} onChange={handleChange}
                            />
                        </DialogField>
                    </Box>
                    <DialogField label={t('criteria')} id="task-criteria">
                        <TextField
                            id="task-criteria" name="criteria" fullWidth multiline minRows={3}
                            value={form.criteria} onChange={handleChange}
                        />
                    </DialogField>
                    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} sx={{ textTransform: 'none' }}>{tc('cancel')}</Button>
                    <Button type="submit" variant="contained" sx={{ textTransform: 'none' }}>{tc('save')}</Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}

TaskFormDialog.propTypes = {
    task: TaskShape,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired,
};

export default TaskFormDialog;
