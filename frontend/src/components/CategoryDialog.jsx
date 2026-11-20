import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, ListItemText, MenuItem, TextField,
} from '@mui/material';
import api from '../axiosConfig';
import { useTranslations } from '../i18n/i18n';
import { CategoryShape } from '../lib/interfaces';
import { categoryIcons } from '../utils/categoryIcons';
import { ROLES } from '../utils/roles';

// Create (category === null) or edit a category; remount with a new `key` to reset the form.
function CategoryDialog({ category, onClose, onSaved }) {
    const { t } = useTranslations('categoryDialog');
    const { t: tc } = useTranslations('common');
    const { t: ti } = useTranslations('categoryIcons');
    const { t: tr } = useTranslations('membersPage.roles');
    const [form, setForm] = useState({
        name: category?.name ?? '',
        description: category?.description ?? '',
        icon: category?.icon ?? 'chat',
        allowedRoles: category?.allowedRoles ?? [],
    });
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (category) {
                await api.put(`/categories/${category.id}`, form);
            } else {
                await api.post('/categories', form);
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.error ?? tc('serverError'));
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
            <Box component="form" onSubmit={handleSubmit}>
                <DialogTitle>{category ? t('editTitle') : t('newTitle')}</DialogTitle>
                <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
                    <TextField
                        label={t('name')} name="name" required autoFocus fullWidth
                        value={form.name} onChange={handleChange}
                    />
                    <TextField
                        label={t('description')} name="description" fullWidth multiline minRows={2}
                        value={form.description} onChange={handleChange}
                    />
                    <TextField select label={t('icon')} name="icon" fullWidth value={form.icon} onChange={handleChange}>
                        {Object.entries(categoryIcons).map(([key, { Icon }]) => (
                            <MenuItem key={key} value={key} sx={{ gap: 1.5 }}>
                                <Icon fontSize="small" /> {ti(key)}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select label={t('access')} name="allowedRoles" fullWidth
                        value={form.allowedRoles} onChange={handleChange}
                        helperText={form.allowedRoles.length === 0 ? t('accessAll') : t('accessRestricted')}
                        slotProps={{
                            select: {
                                multiple: true,
                                displayEmpty: true,
                                renderValue: (selected) => (selected.length === 0
                                    ? t('allMembers')
                                    : ROLES.filter((r) => selected.includes(r)).map((r) => tr(r)).join(', ')),
                            },
                            inputLabel: { shrink: true },
                        }}
                    >
                        {ROLES.map((role) => (
                            <MenuItem key={role} value={role}>
                                <Checkbox size="small" checked={form.allowedRoles.includes(role)} />
                                <ListItemText primary={tr(role)} />
                            </MenuItem>
                        ))}
                    </TextField>
                    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} sx={{ textTransform: 'none' }}>{tc('cancel')}</Button>
                    <Button type="submit" variant="contained" sx={{ textTransform: 'none' }}>{tc('save')}</Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}

CategoryDialog.propTypes = {
    category: CategoryShape,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired,
};

export default CategoryDialog;
