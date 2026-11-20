// Order used when listing roles; OBSERVER is the default for new sign-ups.
export const ROLES = [
    'ADMIN', 'BOARD', 'COORDINATOR', 'PR_TEAM', 'DESIGN_TEAM', 'FR_TEAM', 'FULL_MEMBER', 'BABY_MEMBER', 'OBSERVER',
];

// Everyone except OBSERVER gets the calendar, tasks and member list.
export const MEMBER_ROLES = ROLES.filter((role) => role !== 'OBSERVER').map((role) => `ROLE_${role}`);
export const MANAGER_ROLES = ['ROLE_BOARD', 'ROLE_ADMIN'];

// Dot colour per role, shown next to the role name.
export const ROLE_COLORS = {
    ADMIN: '#e5534b', BOARD: '#d29922', COORDINATOR: '#3fb950', PR_TEAM: '#a371f7', DESIGN_TEAM: '#db61a2',
    FR_TEAM: '#2f81f7', FULL_MEMBER: '#56d4dd', BABY_MEMBER: '#8b949e', OBSERVER: '#6e7681',
};

// Roles are cached at login as a comma-separated list; the backend re-checks them on every request.
export const hasRole = (roles) => (localStorage.getItem('role') ?? '').split(',').some((r) => roles.includes(r));
export const isAdmin = () => hasRole(['ROLE_ADMIN']);
