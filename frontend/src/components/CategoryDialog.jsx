import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Alert, Box, Button, Dialog, DialogActions, DialogContent, MenuItem, TextField,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import api from '../axiosConfig';
import { useTranslations } from '../i18n/i18n';
import { CategoryShape } from '../lib/interfaces';
import { categoryIcons } from '../utils/categoryIcons';
import { ROLES } from '../utils/roles';
import { DialogField, DialogHeader } from './DialogParts';

// Stands for "no restriction" in the access dropdown; the API receives an empty list instead.
const ALL = 'ALL';

// Reserves the check-mark column so selected and unselected rows line up.
function Check({ on }) {
    return <CheckIcon fontSize="small" sx={{ visibility: on ? 'visible' : 'hidden' }} />;
}

Check.propTypes = { on: PropTypes.bool.isRequired };

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

    const handleAccessChange = (e) => {
        const picked = e.target.value;
        // Choosing "All members" clears the roles; choosing a role replaces the "All members" state.
        const roles = picked.includes(ALL) && form.allowedRoles.length > 0
            ? []
            : picked.filter((r) => r !== ALL);
        setForm({ ...form, allowedRoles: roles });
    };
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
                <DialogHeader title={category ? t('editTitle') : t('newTitle')} onClose={onClose} />
                <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '8px !important' }}>
                    <DialogField label={t('name')} id="category-name">
                        <TextField
                            id="category-name" name="name" required autoFocus fullWidth
                            value={form.name} onChange={handleChange}
                        />
                    </DialogField>
                    <DialogField label={t('description')} id="category-description">
                        <TextField
                            id="category-description" name="description" fullWidth multiline minRows={2}
                            value={form.description} onChange={handleChange}
                        />
                    </DialogField>
                    <DialogField label={t('icon')} id="category-icon">
                        <TextField
                            select id="category-icon" name="icon" fullWidth
                            value={form.icon} onChange={handleChange}
                        >
                            {Object.entries(categoryIcons).map(([key, { Icon }]) => (
                                <MenuItem key={key} value={key} sx={{ gap: 1.5 }}>
                                    <Icon fontSize="small" /> {ti(key)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </DialogField>
                    <DialogField label={t('access')} id="category-access">
                        <TextField
                            select id="category-access" fullWidth
                            value={form.allowedRoles.length === 0 ? [ALL] : form.allowedRoles}
                            onChange={handleAccessChange}
                            slotProps={{
                                select: {
                                    multiple: true,
                                    renderValue: (selected) => (selected.includes(ALL)
                                        ? t('allMembers')
                                        : ROLES.filter((r) => selected.includes(r)).map((r) => tr(r)).join(', ')),
                                },
                            }}
                        >
                            <MenuItem value={ALL} sx={{ gap: 1 }}>
                                <Check on={form.allowedRoles.length === 0} /> {t('allMembers')}
                            </MenuItem>
                            {ROLES.map((role) => (
                                <MenuItem key={role} value={role} sx={{ gap: 1 }}>
                                    <Check on={form.allowedRoles.includes(role)} /> {tr(role)}
                                </MenuItem>
                            ))}
                        </TextField>
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

CategoryDialog.propTypes = {
    category: CategoryShape,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired,
};

export default CategoryDialog;
