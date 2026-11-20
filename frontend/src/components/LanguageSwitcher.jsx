import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { LANGUAGES, setLanguage, useTranslations } from '../i18n/i18n';

function LanguageSwitcher() {
    const { t, language } = useTranslations('languageSwitcher');

    return (
        <ToggleButtonGroup
            exclusive size="small" color="primary" value={language} aria-label={t('label')}
            onChange={(_, value) => value && setLanguage(value)}
        >
            {LANGUAGES.map((code) => (
                <ToggleButton key={code} value={code} sx={{ px: 1.25, py: 0.25, fontSize: 12 }}>
                    {t(code)}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}

export default LanguageSwitcher;
