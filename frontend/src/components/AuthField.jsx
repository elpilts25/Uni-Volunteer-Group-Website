import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslations } from '../i18n/i18n';

// Labelled input with a leading icon; `password` adds a show/hide toggle.
function AuthField({ label, name, icon: Icon, password = false, required = true, htmlInput, ...rest }) {
    const [show, setShow] = useState(false);
    const { t } = useTranslations('authField');

    return (
        <Box sx={{ textAlign: 'left' }}>
            <Typography
                component="label"
                htmlFor={name}
                variant="caption"
                sx={{ display: 'block', mb: 0.75, fontWeight: 600 }}
            >
                {label}
                {required && <Box component="span" sx={{ color: 'error.main' }}> *</Box>}
            </Typography>
            <TextField
                fullWidth
                id={name}
                name={name}
                required={required}
                type={password ? (show ? 'text' : 'password') : rest.type}
                size="small"
                slotProps={{
                    htmlInput,
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <Icon fontSize="small" />
                            </InputAdornment>
                        ),
                        endAdornment: password && (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label={show ? t('hidePassword') : t('showPassword')}
                                    onClick={() => setShow((s) => !s)}
                                    onMouseDown={(e) => e.preventDefault()}
                                    edge="end"
                                    size="small"
                                >
                                    {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
                {...rest}
            />
        </Box>
    );
}

AuthField.propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    password: PropTypes.bool,
    required: PropTypes.bool,
    htmlInput: PropTypes.object,
};

export default AuthField;
