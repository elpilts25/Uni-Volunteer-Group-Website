import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Paper, TextField } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../axiosConfig';
import { translate, useTranslations } from '../i18n/i18n';
import { cardSx, fieldSx } from '../theme';
import { DialogField } from './DialogParts';
import RichTextEditor from './RichTextEditor';

function NewTopicPage() {
    const { t } = useTranslations('newTopicDialog');
    const { t: tt } = useTranslations('topicPage');
    const { t: tc } = useTranslations('common');
    const { id } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [form, setForm] = useState({ title: '', content: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        api.get(`/categories/${id}`)
            .then((res) => { if (active) setCategory(res.data); })
            .catch((err) => {
                if (active) setError(err.response?.data?.error ?? translate('categoryPage.loadError'));
            });
        return () => { active = false; };
    }, [id]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const goBack = () => navigate(`/categories/${id}`);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.content) {
            setError(t('contentRequired'));
            return;
        }
        setSaving(true);
        try {
            const res = await api.post(`/categories/${id}/topics`, form);
            navigate(`/topics/${res.data.id}`);
        } catch (err) {
            setError(err.response?.data?.error ?? tc('serverError'));
            setSaving(false);
        }
    };

    return (
        <Box sx={{ display: 'grid', gap: 1.5, maxWidth: 900, mx: 'auto' }}>
            <Box sx={{ mt: -1.5, mb: 1 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ textTransform: 'none' }}>
                    {category ? tt('backTo', { name: category.name }) : tc('cancel')}
                </Button>
            </Box>

            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

            {category && (
                <Paper
                    elevation={0} component="form" onSubmit={handleSubmit}
                    sx={{ ...cardSx, ...fieldSx, p: { xs: 2.5, sm: 4 }, display: 'grid', gap: 4 }}
                >
                    <DialogField
                        id="topic-title" labelGap={2.5}
                        label={(
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
                                {t('topicTitle')}
                                <Chip label={category.name} sx={{ '& .MuiChip-label': { px: 1.5 } }} />
                            </Box>
                        )}
                    >
                        <TextField
                            id="topic-title" name="title" required autoFocus fullWidth
                            placeholder={t('topicTitlePlaceholder')}
                            value={form.title} onChange={handleChange}
                        />
                    </DialogField>
                    <DialogField label={t('message')} id="topic-content" labelGap={2.5}>
                        <RichTextEditor
                            value={form.content} minHeight={280}
                            ariaLabel={t('message')} placeholder={t('messagePlaceholder')}
                            onChange={(content) => setForm((f) => ({ ...f, content }))}
                        />
                    </DialogField>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={goBack} sx={{ textTransform: 'none' }}>{tc('cancel')}</Button>
                        <Button type="submit" variant="contained" disabled={saving} sx={{ textTransform: 'none' }}>
                            {t('publish')}
                        </Button>
                    </Box>
                </Paper>
            )}
        </Box>
    );
}

export default NewTopicPage;
