import { getLocale } from '../i18n/i18n';

// Display text for teams, statuses and priorities lives under `taskMeta` in the translation files.
export const TEAMS = {
    DESIGN: { color: '#8b5cf6' },
    PR: { color: '#38bdf8' },
    FR: { color: '#f59e0b' },
    BOARD: { color: '#22c55e' },
};

export const STATUSES = [
    { key: 'AVAILABLE', color: '#2f5bff' },
    { key: 'DOING', color: '#f59e0b' },
    { key: 'FEEDBACK', color: '#8b5cf6' },
    { key: 'DONE', color: '#22c55e' },
];

export const PRIORITIES = {
    LOW: { color: '#22c55e' },
    MEDIUM: { color: '#f59e0b' },
    HIGH: { color: '#ef4444' },
};

// "Eleni K." from "Eleni Konstantinou".
export const shortName = (fullName) => {
    const [first, ...rest] = fullName.trim().split(/\s+/);
    return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
};

export const initials = (fullName) =>
    fullName.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toLocaleUpperCase(getLocale());

export const formatDate = (iso, options = { day: '2-digit', month: 'short' }) =>
    iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(getLocale(), options) : null;

export const isOverdue = (iso) => Boolean(iso) && iso < new Date().toLocaleDateString('sv-SE');
