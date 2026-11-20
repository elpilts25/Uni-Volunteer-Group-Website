import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import ChecklistOutlined from '@mui/icons-material/ChecklistOutlined';
import { MEMBER_ROLES } from './roles';

// Entries with `to` are in-app routes; others are external. `roles` limits who sees the entry.
// `id` is the label key under `usefulLinks` in the translation files. Replace the '#' placeholders with real URLs.
const usefulLinks = [
    { id: 'guide', href: '#', Icon: MenuBookOutlined },
    { id: 'calendar', to: '/calendar', roles: MEMBER_ROLES, Icon: CalendarMonthOutlined },
    { id: 'tasks', to: '/tasks', roles: MEMBER_ROLES, Icon: ChecklistOutlined },
];

export default usefulLinks;
