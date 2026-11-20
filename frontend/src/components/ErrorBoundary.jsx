import { Component } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography } from '@mui/material';
import { translate } from '../i18n/i18n';

// Shows the error instead of leaving a blank page when rendering throws.
class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        return (
            <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {translate('errorBoundary.somethingWentWrong')}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2, overflowWrap: 'anywhere' }}>
                    {String(error.message ?? error)}
                </Typography>
                <Button variant="contained" onClick={() => window.location.reload()} sx={{ textTransform: 'none' }}>
                    {translate('errorBoundary.reload')}
                </Button>
            </Box>
        );
    }
}

ErrorBoundary.propTypes = { children: PropTypes.node };

export default ErrorBoundary;
