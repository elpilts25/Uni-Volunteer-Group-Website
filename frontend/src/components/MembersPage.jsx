import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Avatar, Box, Button, Checkbox, Chip, IconButton, InputAdornment, Menu, MenuItem, MenuList, Paper, Popover,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';
import { getLocale, translate, useTranslations } from '../i18n/i18n';
import { cardSx } from '../theme';
import { MANAGER_ROLES, ROLES, ROLE_COLORS, hasRole, isAdmin } from '../utils/roles';

const SORTS = {
    newest: (a, b) => (b.joinedAt ?? '').localeCompare(a.joinedAt ?? ''),
    oldest: (a, b) => (a.joinedAt ?? '￿').localeCompare(b.joinedAt ?? '￿'),
    name: (a, b) => a.fullName.localeCompare(b.fullName),
    activity: (a, b) => (b.topicCount + b.replyCount) - (a.topicCount + a.replyCount),
};
const SORT_LABELS = { newest: 'sortNewest', oldest: 'sortOldest', name: 'sortName', activity: 'sortActivity' };

function RoleDot({ role }) {
    return <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: ROLE_COLORS[role], flexShrink: 0 }} />;
}

function MembersPage() {
    const { t } = useTranslations('membersPage');
    const navigate = useNavigate();
    const canEditRoles = hasRole(MANAGER_ROLES);
    const admin = isAdmin();
    const [members, setMembers] = useState([]);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [sortKey, setSortKey] = useState('newest');
    const [sortAnchor, setSortAnchor] = useState(null);
    const [rolePicker, setRolePicker] = useState(null); // { anchor, memberId }

    useEffect(() => {
        let active = true;
        api.get('/members')
            .then((res) => {
                if (active) setMembers(res.data);
            })
            .catch((err) => {
                if (active) setError(err.response?.data?.error ?? translate('membersPage.loadError'));
            });
        return () => { active = false; };
    }, []);

    const formatDate = (iso) => (iso
        ? new Date(iso).toLocaleDateString(getLocale(), { year: 'numeric', month: 'short', day: 'numeric' })
        : t('unknownDate'));

    const handleRoleToggle = async (member, role) => {
        const roles = member.roles.includes(role) ? member.roles.filter((r) => r !== role) : [...member.roles, role];
        try {
            const res = await api.put(`/members/${member.id}/roles`, { roles });
            setMembers((list) => list.map((m) => (m.id === member.id ? res.data : m)));
            setError('');
        } catch (err) {
            setError(err.response?.data?.error ?? t('roleError'));
        }
    };

    // Board can't touch admins.
    const canEditRow = (m) => canEditRoles && (admin || !m.roles.includes('ADMIN'));

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return members
            .filter((m) => !q || m.username.toLowerCase().includes(q) || m.fullName.toLowerCase().includes(q))
            .sort(SORTS[sortKey]);
    }, [members, query, sortKey]);

    const pickerMember = members.find((m) => m.id === rolePicker?.memberId);
    const adminCount = members.filter((m) => m.roles.includes('ADMIN')).length;

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

            <Paper elevation={0} sx={{ ...cardSx, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
                    <TextField
                        size="small" value={query} onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('searchPlaceholder')} sx={{ width: { xs: '100%', sm: 320 } }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                                ),
                            },
                            htmlInput: { 'aria-label': t('searchPlaceholder') },
                        }}
                    />
                    <Button
                        variant="outlined" color="inherit" startIcon={<SwapVertIcon />}
                        sx={{ textTransform: 'none', flexShrink: 0 }}
                        onClick={(e) => setSortAnchor(e.currentTarget)}
                    >
                        {t('sort')}
                    </Button>
                    <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
                        {Object.keys(SORTS).map((key) => (
                            <MenuItem
                                key={key} selected={key === sortKey}
                                onClick={() => { setSortKey(key); setSortAnchor(null); }}
                            >
                                {t(SORT_LABELS[key])}
                            </MenuItem>
                        ))}
                    </Menu>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('member')}</TableCell>
                                <TableCell align="center">{t('joined')}</TableCell>
                                <TableCell align="center">{t('posts')}</TableCell>
                                <TableCell align="center">{t('replies')}</TableCell>
                                <TableCell>{t('role')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visible.map((m) => (
                                <TableRow key={m.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: 'var(--accent-bg)', color: 'var(--accent-fg)' }}><PersonOutlined /></Avatar>
                                            <Box>
                                                <Typography fontWeight="bold">{m.fullName}</Typography>
                                                <Typography variant="caption" color="text.secondary">{m.username}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">{formatDate(m.joinedAt)}</TableCell>
                                    <TableCell align="center">{m.topicCount}</TableCell>
                                    <TableCell align="center">{m.replyCount}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Chip
                                                size="small"
                                                label={(
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <RoleDot role={m.roles[0]} />
                                                        {t(`roles.${m.roles[0]}`, { defaultValue: m.roles[0] })}
                                                    </Box>
                                                )}
                                                sx={{ '& .MuiChip-label': { px: 1.5 } }}
                                            />
                                            {m.roles.length > 1 && (
                                                <Tooltip
                                                    title={m.roles.slice(1).map((r) => t(`roles.${r}`, { defaultValue: r })).join(', ')}
                                                >
                                                    <Chip size="small" label={`+${m.roles.length - 1}`} />
                                                </Tooltip>
                                            )}
                                            {canEditRow(m) && (
                                                <Tooltip title={t('addRoles')}>
                                                    <IconButton
                                                        size="small" aria-label={t('addRoles')}
                                                        onClick={(e) => setRolePicker({ anchor: e.currentTarget, memberId: m.id })}
                                                    >
                                                        <AddIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {visible.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>{t('empty')}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    {t('showing', { count: visible.length })}
                </Typography>
            </Paper>

            <Popover
                open={Boolean(rolePicker && pickerMember)} anchorEl={rolePicker?.anchor}
                onClose={() => setRolePicker(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <MenuList>
                    {pickerMember && ROLES.map((role) => {
                        const checked = pickerMember.roles.includes(role);
                        // Admin is admin-only, a member keeps one role, and the last admin can't lose Admin.
                        const lastAdmin = role === 'ADMIN' && checked && adminCount <= 1;
                        const disabled = (role === 'ADMIN' && !admin) || (checked && pickerMember.roles.length === 1)
                            || lastAdmin;
                        return (
                            <MenuItem
                                key={role} disabled={disabled} sx={{ gap: 1.5, minWidth: 220 }}
                                onClick={() => handleRoleToggle(pickerMember, role)}
                            >
                                <RoleDot role={role} />
                                <Box sx={{ flexGrow: 1 }}>{t(`roles.${role}`)}</Box>
                                <Checkbox edge="end" size="small" checked={checked} disabled={disabled} tabIndex={-1} disableRipple />
                            </MenuItem>
                        );
                    })}
                </MenuList>
            </Popover>
        </Box>
    );
}

export default MembersPage;
