import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Paper, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlined from '@mui/icons-material/ChatBubbleOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../axiosConfig';
import useUsername from '../hooks/useUsername';
import { translate, useTranslations } from '../i18n/i18n';
import { cardSx, colorBase } from '../theme';
import timeAgo from '../utils/timeAgo';

function CategoryPage() {
    const { t } = useTranslations('categoryPage');
    const { t: tc } = useTranslations('common');
    const { id } = useParams();
    const navigate = useNavigate();
    const username = useUsername();
    const [category, setCategory] = useState(null);
    const [topics, setTopics] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        Promise.all([api.get(`/categories/${id}`), api.get(`/categories/${id}/topics`)])
            .then(([cat, list]) => {
                if (!active) return;
                setCategory(cat.data);
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
                                onClick={() => navigate(`/categories/${id}/new`)}>
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
        </Box>
    );
}

export default CategoryPage;
