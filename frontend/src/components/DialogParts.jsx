import PropTypes from 'prop-types';
import { Box, DialogTitle, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslations } from '../i18n/i18n';

// Title row shared by every dialog; `eyebrow` is an optional small line above the title.
export function DialogHeader({ title, eyebrow, onClose }) {
    const { t } = useTranslations('common');
    return (
        <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box>
                {eyebrow && (
                    <Typography variant="caption" color="primary" component="div" sx={{ letterSpacing: 1 }}>
                        {eyebrow}
                    </Typography>
                )}
                {title}
            </Box>
            <IconButton size="small" aria-label={t('close')} onClick={onClose} sx={{ mt: -0.5, mr: -1 }}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </DialogTitle>
    );
}

DialogHeader.propTypes = {
    title: PropTypes.node.isRequired,
    eyebrow: PropTypes.node,
    onClose: PropTypes.func.isRequired,
};

// Form field with its label above the input box.
export function DialogField({ label, id, labelGap = 0.75, children }) {
    return (
        <Box>
            <Typography component="label" htmlFor={id} sx={{ display: 'block', mb: labelGap, fontWeight: 500 }}>
                {label}
            </Typography>
            {children}
        </Box>
    );
}

DialogField.propTypes = {
    label: PropTypes.node.isRequired,
    id: PropTypes.string.isRequired,
    labelGap: PropTypes.number,
    children: PropTypes.node.isRequired,
};
