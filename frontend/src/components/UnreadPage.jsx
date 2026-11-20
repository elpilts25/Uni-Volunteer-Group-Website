import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Paper, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlined from '@mui/icons-material/ChatBubbleOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import { translate, useTranslations } from '../i18n/i18n';
import { cardSx, colorBase } from '../theme';
import timeAgo from '../utils/timeAgo';

function UnreadPage() {
    const { t } = useTranslations('unreadPage');
    const { t: tp } = useTranslations('categoryPage');
    const navigate = useNavigate();
    const [topics, setTopics] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        api.get('/topics/unread')
            .then((res) => {
                if (active) setTopics(res.data);
            })
            .catch((err) => {
                if (active) setError(err.response?.data?.error ?? translate('unreadPage.loadError'));
            });
        return () => { active = false; };
    }, []);

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            <Box>
                <Button
                    startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}
                    sx={{ textTransform: 'none', mb: 2 }}
                >
                    {t('back')}
                </Button>
                <Paper elevation={0} sx={{ ...cardSx, p: { xs: 3, sm: 4 } }}>
                    <Typography component="h1" variant="h4" fontWeight="bold">{t('title')}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>{t('subtitle')}</Typography>
                </Paper>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            {topics && topics.length === 0 && (
                <Typography color="text.secondary">{t('empty')}</Typography>
            )}

            <Box sx={{ display: 'grid', gap: 1.5 }}>
                {(topics ?? []).map((topic) => (
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
                            <Typography fontWeight={800} noWrap>{topic.title}</Typography>
                            <Typography
                                variant="caption" color="text.secondary" component="div"
                                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}
                            >
                                <Chip
                                    size="small" label={topic.categoryName}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/categories/${topic.categoryId}`); }}
                                />
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <PeopleOutlined sx={{ fontSize: 14 }} />
                                    {topic.author}
                                </Box>
                                {timeAgo(topic.lastActivity)}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                            <Chip size="small" color="primary" label={tp('unread', { count: topic.unread })} />
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

export default UnreadPage;
