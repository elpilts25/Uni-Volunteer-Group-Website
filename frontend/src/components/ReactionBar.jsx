import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Chip, IconButton, Popover, Tooltip } from '@mui/material';
import AddReactionOutlined from '@mui/icons-material/AddReactionOutlined';
import { useTranslations } from '../i18n/i18n';
import { REACTION_EMOJIS } from '../utils/emojis';

// Existing reactions as toggle chips plus a picker for adding a new one.
function ReactionBar({ reactions, onToggle }) {
    const { t } = useTranslations('topicPage');
    const [anchor, setAnchor] = useState(null);
    const [busy, setBusy] = useState(false);

    const toggle = async (emoji) => {
        if (busy) return;
        setBusy(true);
        try {
            await onToggle(emoji);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box sx={{ px: 3, pb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            {reactions.map(({ emoji, count, reacted, users }) => (
                <Tooltip key={emoji} title={users.join(', ')}>
                    <Chip
                        clickable size="small" label={`${emoji} ${count}`} onClick={() => toggle(emoji)}
                        variant={reacted ? 'filled' : 'outlined'}
                        sx={{
                            fontSize: 14,
                            borderColor: reacted ? 'var(--accent-fg)' : 'var(--outline-strong)',
                            bgcolor: reacted ? 'var(--accent-bg)' : 'transparent',
                            color: reacted ? 'var(--accent-fg)' : 'inherit',
                        }}
                    />
                </Tooltip>
            ))}
            <Tooltip title={t('addReaction')}>
                <IconButton size="small" aria-label={t('addReaction')} onClick={(e) => setAnchor(e.currentTarget)}>
                    <AddReactionOutlined fontSize="small" />
                </IconButton>
            </Tooltip>
            <Popover
                open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Box sx={{ display: 'flex', p: 0.5 }}>
                    {REACTION_EMOJIS.map((emoji) => (
                        <IconButton
                            key={emoji} aria-label={emoji} sx={{ fontSize: 22 }}
                            onClick={() => { setAnchor(null); toggle(emoji); }}
                        >
                            {emoji}
                        </IconButton>
                    ))}
                </Box>
            </Popover>
        </Box>
    );
}

ReactionBar.propTypes = {
    reactions: PropTypes.arrayOf(PropTypes.shape({
        emoji: PropTypes.string.isRequired,
        count: PropTypes.number.isRequired,
        reacted: PropTypes.bool.isRequired,
        users: PropTypes.arrayOf(PropTypes.string).isRequired,
    })).isRequired,
    onToggle: PropTypes.func.isRequired,
};

export default ReactionBar;
