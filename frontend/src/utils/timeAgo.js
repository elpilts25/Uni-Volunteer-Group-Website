import { getLocale, translate } from '../i18n/i18n';

const UNITS = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
];

// "2 hours ago"-style label for an ISO timestamp.
export default function timeAgo(iso) {
    if (!iso) return translate('timeAgo.noActivity');
    const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'always' });
    const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
    for (const [unit, size] of UNITS) {
        if (Math.abs(seconds) >= size) return rtf.format(Math.trunc(seconds / size), unit);
    }
    return translate('timeAgo.justNow');
}
