import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import { useTranslations } from '../i18n/i18n';
import { TEAMS } from '../utils/taskMeta';

function TeamTag({ team }) {
    const { t } = useTranslations('taskMeta');
    const { color } = TEAMS[team];
    return (
        <Typography
            component="span" variant="caption"
            sx={{
                px: 0.75, py: 0.25, borderRadius: 0.5, fontWeight: 700, fontSize: 10, letterSpacing: 0.5,
                color, bgcolor: `${color}26`, border: `1px solid ${color}55`,
            }}
        >
            {t(`teams.${team}`)}
        </Typography>
    );
}

TeamTag.propTypes = { team: PropTypes.oneOf(Object.keys(TEAMS)).isRequired };

export default TeamTag;
