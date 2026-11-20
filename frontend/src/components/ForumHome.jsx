import { useEffect, useState } from 'react';
import {
    Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    IconButton, Paper, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import ForumOutlined from '@mui/icons-material/ForumOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import ChatBubbleOutlined from '@mui/icons-material/ChatBubbleOutlined';
import PublicOutlined from '@mui/icons-material/PublicOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import { translate, useTranslations } from '../i18n/i18n';
import { cardSx, colorBase } from '../theme';
import { getCategoryIcon } from '../utils/categoryIcons';
import { hasRole, MEMBER_ROLES } from '../utils/roles';
import timeAgo from '../utils/timeAgo';
import usefulLinks from '../utils/usefulLinks';
import CategoryDialog from './CategoryDialog';

const gridSx = (min) => ({
    display: 'grid',
    gap: 2,
    gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`,
});

function StatCard({ icon: Icon, label, value, to }) {
    return (
        <Paper
            elevation={0}
            {...(to && { component: RouterLink, to })}
            sx={{
                ...cardSx, p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                ...(to && { color: 'inherit', textDecoration: 'none', '&:hover': { borderColor: colorBase } }),
            }}
        >
            <Icon color="primary" />
            <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>{value}</Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
        </Paper>
    );
}

function ForumHome() {
    const { t } = useTranslations('forumHome');
    const { t: tc } = useTranslations('common');
    const { t: tl } = useTranslations('usefulLinks');
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    const [dialog, setDialog] = useState(null); // { category } while the create/edit form is open
    const [toDelete, setToDelete] = useState(null);
    const [version, setVersion] = useState(0); // bump to refetch after a change
    const navigate = useNavigate();
    const isAdmin = hasRole(['ROLE_ADMIN']);
    const visibleLinks = usefulLinks.filter((link) => !link.roles || hasRole(link.roles));

    useEffect(() => {
        let active = true;
        Promise.all([api.get('/categories'), api.get('/stats')])
            .then(([cats, st]) => {
                if (!active) return;
                setCategories(cats.data);
                setStats(st.data);
                setError('');
            })
            .catch((err) => {
                if (active) setError(err.response?.data?.error ?? translate('forumHome.loadError'));
            });
        return () => { active = false; };
    }, [version]);

    const reload = () => setVersion((v) => v + 1);

    const handleSaved = () => {
        setDialog(null);
        reload();
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/categories/${toDelete.id}`);
            setToDelete(null);
            reload();
        } catch (err) {
            setToDelete(null);
            setError(err.response?.data?.error ?? t('deleteError'));
        }
    };

    return (
        <Box sx={{ display: 'grid', gap: 4 }}>
            <Paper
                elevation={0}
                sx={{
                    ...cardSx, p: { xs: 3, sm: 6 },
                    background: `linear-gradient(135deg, ${colorBase}66 0%, var(--hero-end) 70%)`,
                }}
            >
                <Typography component="h1" variant="h4" fontWeight="bold">{t('welcome')}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {t('welcomeSubtitle')}
                </Typography>
            </Paper>

            {stats && (
                <Box sx={gridSx(220)}>
                    <StatCard
                        icon={PeopleOutlined} label={t('members')} value={stats.members}
                        to={hasRole(MEMBER_ROLES) ? '/members' : undefined}
                    />
                    <StatCard icon={ForumOutlined} label={t('topics')} value={stats.topics} />
                    <StatCard icon={ChatBubbleOutlined} label={t('newMessages')} value={stats.newMessages} />
                </Box>
            )}

            {visibleLinks.length > 0 && (
                <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>{t('usefulLinks')}</Typography>
                    <Box sx={gridSx(220)}>
                        {visibleLinks.map(({ id, href, to, Icon }) => (
                            <Paper
                                key={id} elevation={0}
                                {...(to
                                    ? { component: RouterLink, to }
                                    : { component: 'a', href, target: '_blank', rel: 'noopener noreferrer' })}
                                sx={{
                                    ...cardSx, p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                                    color: 'inherit', textDecoration: 'none',
                                    '&:hover': { borderColor: colorBase },
                                }}
                            >
                                <Icon color="primary" fontSize="small" />
                                <Typography variant="body2" fontWeight={600}>{tl(id)}</Typography>
                            </Paper>
                        ))}
                    </Box>
                </Box>
            )}

            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold">{t('categories')}</Typography>
                    {isAdmin && (
                        <Button
                            variant="contained" startIcon={<AddIcon />} sx={{ textTransform: 'none' }}
                            onClick={() => setDialog({ category: null })}
                        >
                            {t('newCategory')}
                        </Button>
                    )}
                </Box>

                {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

                {categories.length === 0 && !error && (
                    <Typography color="text.secondary">
                        {isAdmin ? t('emptyAdmin') : t('empty')}
                    </Typography>
                )}

                <Box sx={gridSx(300)}>
                    {categories.map((category) => {
                        const Icon = getCategoryIcon(category.icon);
                        return (
                            <Paper
                                key={category.id} elevation={0}
                                sx={{ ...cardSx, position: 'relative', '&:hover': { borderColor: colorBase } }}
                            >
                                <Box
                                    role="link" tabIndex={0}
                                    onClick={() => navigate(`/categories/${category.id}`)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/categories/${category.id}`); }}
                                    sx={{ p: 2, display: 'flex', gap: 1.5, cursor: 'pointer', pr: isAdmin ? 10 : 2 }}
                                >
                                    <Box
                                        sx={{
                                            width: 40, height: 40, borderRadius: 2, bgcolor: '#3b3f7a', flexShrink: 0,
                                            display: 'grid', placeItems: 'center',
                                        }}
                                    >
                                        <Icon fontSize="small" />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography fontWeight="bold" noWrap>{category.name}</Typography>
                                            {category.unreadCount > 0 && (
                                                <Chip
                                                    size="small" color="primary"
                                                    label={t('unread', { count: category.unreadCount })}
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" component="div">
                                            {t('topicCount', { count: category.topicCount })}
                                            {' • '}{timeAgo(category.lastActivity)}
                                        </Typography>
                                        {category.description && (
                                            <Typography variant="caption" color="text.secondary" component="div" noWrap>
                                                {category.description}
                                            </Typography>
                                        )}
                                        <Typography
                                            variant="caption" color="primary" component="div"
                                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                                        >
                                            <PublicOutlined sx={{ fontSize: 12 }} /> {t('allMembers')}
                                        </Typography>
                                    </Box>
                                </Box>

                                {isAdmin && (
                                    <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                                        <Tooltip title={tc('edit')}>
                                            <IconButton size="small" aria-label={tc('edit')} onClick={() => setDialog({ category })}>
                                                <EditOutlined fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={tc('delete')}>
                                            <IconButton size="small" aria-label={tc('delete')} onClick={() => setToDelete(category)}>
                                                <DeleteOutlined fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Paper>
                        );
                    })}
                </Box>
            </Box>

            {dialog && (
                <CategoryDialog
                    key={dialog.category?.id ?? 'new'}
                    category={dialog.category}
                    onClose={() => setDialog(null)}
                    onSaved={handleSaved}
                />
            )}

            <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
                <DialogTitle>{t('deleteTitle')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('deleteConfirm', { name: toDelete?.name })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setToDelete(null)} sx={{ textTransform: 'none' }}>{tc('cancel')}</Button>
                    <Button color="error" variant="contained" onClick={handleDelete} sx={{ textTransform: 'none' }}>
                        {tc('delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default ForumHome;
