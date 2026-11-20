import { useEffect, useState } from 'react';
import {
    Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlined from '@mui/icons-material/ChatBubbleOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../axiosConfig';
import useUsername from '../hooks/useUsername';
import { translate, useTranslations } from '../i18n/i18n';
import { cardSx, colorBase } from '../theme';
import timeAgo from '../utils/timeAgo';

function NewTopicDialog({ categoryId, onClose, onCreated }) {
    const { t } = useTranslations('newTopicDialog');
    const { t: tc } = useTranslations('common');
    const [form, setForm] = useState({ title: '', content: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post(`/categories/${categoryId}/topics`, form);
            onCreated(res.data);
        } catch (err) {
            setError(err.response?.data?.error ?? tc('serverError'));
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <Box component="form" onSubmit={handleSubmit}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {t('title')}
                    <IconButton size="small" onClick={onClose} aria-label={tc('close')}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
                    <TextField
                        label={t('topicTitle')} name="title" required autoFocus fullWidth
                        placeholder={t('topicTitlePlaceholder')}
                        value={form.title} onChange={handleChange}
                    />
                    <TextField
                        label={t('message')} name="content" required fullWidth multiline minRows={4}
                        placeholder={t('messagePlaceholder')}
                        value={form.content} onChange={handleChange}
                    />
                    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} sx={{ textTransform: 'none' }}>{tc('cancel')}</Button>
                    <Button type="submit" variant="contained" sx={{ textTransform: 'none' }}>{t('publish')}</Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}

function CategoryPage() {
    const { t } = useTranslations('categoryPage');
    const { t: tc } = useTranslations('common');
    const { id } = useParams();
    const navigate = useNavigate();
    const username = useUsername();
    const [category, setCategory] = useState(null);
    const [topics, setTopics] = useState([]);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        let active = true;
        Promise.all([api.get('/categories'), api.get(`/categories/${id}/topics`)])
            .then(([cats, list]) => {
                if (!active) return;
                setCategory(cats.data.find((c) => String(c.id) === id) ?? null);
                setTopics(list.data);
                setError('');
            })
            .catch((err) => {
                if (active) setError(err.response?.data?.error ?? translate('categoryPage.loadError'));
            });
        return () => { active = false; };
    }, [id]);

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            <Box>
                <Button
                    startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}
                    sx={{ textTransform: 'none', mb: 2 }}
                >
                    {t('back')}
                </Button>
                <Paper
                    elevation={0}
                    sx={{
                        ...cardSx, p: { xs: 3, sm: 4 }, display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: 2, flexWrap: 'wrap',
                    }}
                >
                    <Box>
                        <Typography component="h1" variant="h4" fontWeight="bold">{category?.name ?? ''}</Typography>
                        {category?.description && (
                            <Typography color="text.secondary" sx={{ mt: 0.5 }}>{category.description}</Typography>
                        )}
                    </Box>
                    {category && (
                        <Button variant="contained" startIcon={<AddIcon />} sx={{ textTransform: 'none' }}
                                onClick={() => setCreating(true)}>
                            {t('newTopic')}
                        </Button>
                    )}
                </Paper>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            {category && topics.length === 0 && (
                <Typography color="text.secondary">{t('empty')}</Typography>
            )}

            <Box sx={{ display: 'grid', gap: 1.5 }}>
                {topics.map((topic) => (
                    <Paper
                        key={topic.id} elevation={0} role="link" tabIndex={0}
                        onClick={() => navigate(`/topics/${topic.id}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/topics/${topic.id}`); }}
                        sx={{
                            ...cardSx, p: 2, cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', gap: 2, '&:hover': { borderColor: colorBase },
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={topic.unread > 0 ? 800 : 'bold'} noWrap>{topic.title}</Typography>
                            <Typography
                                variant="caption" color="text.secondary"
                                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}
                            >
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <PeopleOutlined sx={{ fontSize: 14 }} />
                                    {topic.author === username ? tc('you') : topic.author}
                                </Box>
                                {timeAgo(topic.createdAt)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, alignSelf: 'flex-start' }}>
                            {topic.unread > 0 && (
                                <Chip size="small" color="primary" label={t('unread', { count: topic.unread })} />
                            )}
                            <Typography
                                variant="body2" color="text.secondary"
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                            >
                                <ChatBubbleOutlined sx={{ fontSize: 16 }} /> {topic.replyCount}
                            </Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {creating && (
                <NewTopicDialog
                    categoryId={id}
                    onClose={() => setCreating(false)}
                    onCreated={(topic) => navigate(`/topics/${topic.id}`)}
                />
            )}
        </Box>
    );
}

export default CategoryPage;
