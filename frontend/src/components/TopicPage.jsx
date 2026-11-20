import { useEffect, useState } from 'react';
import {
    Alert, Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText,
    Divider, IconButton, Paper, TextField, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlined from '@mui/icons-material/ChatBubbleOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../axiosConfig';
import useUsername from '../hooks/useUsername';
import { translate, useTranslations } from '../i18n/i18n';
import { cardSx } from '../theme';
import { hasRole } from '../utils/roles';
import timeAgo from '../utils/timeAgo';
import { looksLikeHtml, sanitizeHtml, toEditorHtml } from '../utils/richText';
import { DialogField, DialogHeader } from './DialogParts';
import ReactionBar from './ReactionBar';
import RichTextEditor from './RichTextEditor';

const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

// Plain text with clickable http(s) links.
function Linkified({ text }) {
    return text.split(URL_PATTERN).map((part, i) => (i % 2 === 1
        ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-fg)' }}>{part}</a>
        : part));
}

function Message({ author, createdAt, content, label, reactions, onReact, onEdit, onDelete }) {
    const { t: tc } = useTranslations('common');
    return (
        <Paper elevation={0} sx={{ ...cardSx, overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'var(--accent-bg)', color: 'var(--accent-fg)' }}><PersonOutlined /></Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography fontWeight="bold" noWrap>{author}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {timeAgo(createdAt)}{label && ` · ${label}`}
                    </Typography>
                </Box>
                {onEdit && (
                    <Tooltip title={tc('edit')}>
                        <IconButton size="small" aria-label={tc('edit')} onClick={onEdit}>
                            <EditOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                {onDelete && (
                    <Tooltip title={tc('delete')}>
                        <IconButton size="small" aria-label={tc('delete')} onClick={onDelete}>
                            <DeleteOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            <Divider sx={{ borderColor: 'var(--outline)' }} />
            {looksLikeHtml(content) ? (
                <Box
                    className="rich-text" sx={{ p: 3 }}
                    // Sanitized to a small tag allow-list; the backend sanitizes on save as well.
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                />
            ) : (
                <Typography sx={{ p: 3, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    <Linkified text={content} />
                </Typography>
            )}
            <ReactionBar reactions={reactions} onToggle={onReact} />
        </Paper>
    );
}

// Edits a topic (title + content) or a reply (content only, `title` undefined).
function EditDialog({ target, onClose, onSaved }) {
    const { t } = useTranslations('topicPage');
    const { t: tn } = useTranslations('newTopicDialog');
    const { t: tc } = useTranslations('common');
    const [title, setTitle] = useState(target.title);
    const [content, setContent] = useState(toEditorHtml(target.content));
    const [error, setError] = useState('');
    const isTopic = target.type === 'topic';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content) {
            setError(tn('contentRequired'));
            return;
        }
        try {
            if (isTopic) {
                await api.put(`/topics/${target.id}`, { title, content });
            } else {
                await api.put(`/posts/${target.id}`, { content });
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.error ?? t('saveError'));
        }
    };

    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth>
            <Box component="form" onSubmit={handleSubmit}>
                <DialogHeader title={isTopic ? t('editTopicTitle') : t('editReplyTitle')} onClose={onClose} />
                <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '8px !important' }}>
                    {isTopic && (
                        <DialogField label={tn('topicTitle')} id="edit-title">
                            <TextField
                                id="edit-title" required fullWidth value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </DialogField>
                    )}
                    <DialogField label={tn('message')} id="edit-content">
                        <RichTextEditor
                            value={content} onChange={setContent} autoFocus minHeight={isTopic ? 200 : 120}
                            ariaLabel={tn('message')} placeholder={tn('messagePlaceholder')}
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

function TopicPage() {
    const { t } = useTranslations('topicPage');
    const { t: tc } = useTranslations('common');
    const { id } = useParams();
    const navigate = useNavigate();
    const username = useUsername();
    const isAdmin = hasRole(['ROLE_ADMIN']);
    const [topic, setTopic] = useState(null);
    const [reply, setReply] = useState('');
    const [replyKey, setReplyKey] = useState(0); // remounts the reply editor to clear it
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(null); // { type, id, title?, content }
    const [deleting, setDeleting] = useState(null); // { type, id }
    const [version, setVersion] = useState(0); // bump to refetch after a change

    useEffect(() => {
        let active = true;
        api.get(`/topics/${id}`)
            .then((res) => {
                if (!active) return;
                setTopic(res.data);
                setError('');
                // Opening the topic marks it read; a failure here is harmless.
                api.post(`/topics/${id}/read`).catch(() => {});
            })
            .catch((err) => {
                if (active) setError(err.response?.data?.error ?? translate('topicPage.loadError'));
            });
        return () => { active = false; };
    }, [id, version]);

    const reload = () => setVersion((v) => v + 1);
    const canManage = (author) => isAdmin || author === username;

    // `kind` is the API collection: 'topics' or 'posts'.
    const toggleReaction = async (kind, targetId, emoji) => {
        try {
            const res = await api.post(`/${kind}/${targetId}/reactions`, { emoji });
            setTopic((cur) => (kind === 'topics'
                ? { ...cur, reactions: res.data }
                : { ...cur, posts: cur.posts.map((p) => (p.id === targetId ? { ...p, reactions: res.data } : p)) }));
        } catch (err) {
            setError(err.response?.data?.error ?? t('reactionError'));
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!reply) {
            setError(translate('newTopicDialog.contentRequired'));
            return;
        }
        try {
            await api.post(`/topics/${id}/posts`, { content: reply });
            setReply('');
            setReplyKey((k) => k + 1);
            reload();
        } catch (err) {
            setError(err.response?.data?.error ?? t('sendError'));
        }
    };

    const handleDelete = async () => {
        const target = deleting;
        setDeleting(null);
        try {
            if (target.type === 'topic') {
                await api.delete(`/topics/${target.id}`);
                navigate(`/categories/${topic.categoryId}`);
            } else {
                await api.delete(`/posts/${target.id}`);
                reload();
            }
        } catch (err) {
            setError(err.response?.data?.error ?? t('deleteError'));
        }
    };

    if (!topic) {
        return error ? <Alert severity="error">{error}</Alert> : null;
    }

    return (
        <Box sx={{ display: 'grid', gap: 3, maxWidth: 900, mx: 'auto' }}>
            <Box>
                <Button
                    startIcon={<ArrowBackIcon />} onClick={() => navigate(`/categories/${topic.categoryId}`)}
                    sx={{ textTransform: 'none', mb: 2 }}
                >
                    {t('backTo', { name: topic.categoryName })}
                </Button>
                <Typography variant="body2" color="text.secondary">
                    {t('breadcrumb')} / {topic.categoryName}
                </Typography>
                <Typography component="h1" variant="h4" fontWeight="bold" sx={{ overflowWrap: 'anywhere', mt: 0.5 }}>
                    {topic.title}
                </Typography>
            </Box>

            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

            <Message
                author={topic.author} createdAt={topic.createdAt} content={topic.content}
                label={t('initialPost')} reactions={topic.reactions}
                onReact={(emoji) => toggleReaction('topics', topic.id, emoji)}
                onEdit={canManage(topic.author)
                    ? () => setEditing({ type: 'topic', id: topic.id, title: topic.title, content: topic.content })
                    : undefined}
                onDelete={canManage(topic.author) ? () => setDeleting({ type: 'topic', id: topic.id }) : undefined}
            />

            <Typography
                variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <ChatBubbleOutlined color="primary" fontSize="small" />
                {t('replies')}
                <Typography component="span" variant="body2" color="text.secondary">({topic.posts.length})</Typography>
            </Typography>

            {topic.posts.map((post) => (
                <Message
                    key={post.id} author={post.author} createdAt={post.createdAt} content={post.content}
                    reactions={post.reactions}
                    onReact={(emoji) => toggleReaction('posts', post.id, emoji)}
                    onEdit={canManage(post.author)
                        ? () => setEditing({ type: 'post', id: post.id, content: post.content })
                        : undefined}
                    onDelete={canManage(post.author) ? () => setDeleting({ type: 'post', id: post.id }) : undefined}
                />
            ))}

            <Paper elevation={0} component="form" onSubmit={handleReply} sx={{ ...cardSx, p: 2.5, display: 'grid', gap: 2 }}>
                <Typography fontWeight="bold">{t('writeReply')}</Typography>
                <RichTextEditor
                    key={replyKey} value="" onChange={setReply} minHeight={120}
                    ariaLabel={t('writeReply')} placeholder={t('replyPlaceholder')}
                />
                <Button
                    type="submit" variant="contained" startIcon={<SendOutlined />}
                    sx={{ justifySelf: 'end', textTransform: 'none' }}
                >
                    {t('reply')}
                </Button>
            </Paper>

            {editing && (
                <EditDialog
                    key={`${editing.type}-${editing.id}`} target={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); reload(); }}
                />
            )}

            <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} maxWidth="xs" fullWidth>
                <DialogHeader
                    title={deleting?.type === 'topic' ? t('deleteTopicTitle') : t('deleteReplyTitle')}
                    onClose={() => setDeleting(null)}
                />
                <DialogContent>
                    <DialogContentText>
                        {deleting?.type === 'topic' ? t('deleteTopicConfirm') : t('deleteReplyConfirm')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleting(null)} sx={{ textTransform: 'none' }}>{tc('cancel')}</Button>
                    <Button color="error" variant="contained" onClick={handleDelete} sx={{ textTransform: 'none' }}>
                        {tc('delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TopicPage;
