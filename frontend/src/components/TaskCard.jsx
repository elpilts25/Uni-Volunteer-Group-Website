import PropTypes from 'prop-types';
import { Avatar, Box, Paper, Typography } from '@mui/material';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import ChatBubbleOutlined from '@mui/icons-material/ChatBubbleOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import DragIndicator from '@mui/icons-material/DragIndicator';
import { cardSx, colorBase } from '../theme';
import { TaskSummaryShape } from '../lib/interfaces';
import { formatDate, initials, isOverdue, shortName } from '../utils/taskMeta';
import TeamTag from './TeamTag';

function TaskCard({ task, onOpen }) {
    const done = task.status === 'DONE';
    const overdue = !done && isOverdue(task.dueDate);
    const [first, ...others] = task.assignees;

    return (
        <Paper
            elevation={0} draggable tabIndex={0}
            onClick={() => onOpen(task.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpen(task.id); }}
            onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(task.id));
                e.dataTransfer.effectAllowed = 'move';
            }}
            sx={{
                ...cardSx, bgcolor: 'var(--card-alt)', p: 1.5, cursor: 'grab',
                '&:hover': { borderColor: colorBase },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <TeamTag team={task.team} />
                <DragIndicator fontSize="small" sx={{ color: 'text.disabled' }} />
            </Box>
            <Typography fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>{task.title}</Typography>

            <Box
                sx={{
                    mt: 1.5, pt: 1, borderTop: '1px solid var(--outline-strong)', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between', gap: 1,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                    {task.dueDate && (
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 0.5,
                                color: done ? '#22c55e' : overdue ? 'error.main' : 'inherit',
                            }}
                        >
                            {done ? <CheckCircleOutlined sx={{ fontSize: 14 }} /> : <CalendarMonthOutlined sx={{ fontSize: 14 }} />}
                            {formatDate(task.dueDate)}
                        </Typography>
                    )}
                    {task.commentCount > 0 && (
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ChatBubbleOutlined sx={{ fontSize: 14 }} /> {task.commentCount}
                        </Typography>
                    )}
                    {task.criteriaTotal > 0 && (
                        <Typography variant="caption">✓ {task.criteriaDone}/{task.criteriaTotal}</Typography>
                    )}
                </Box>

                {first && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                        <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: '#3b3f7a' }}>{initials(first.fullName)}</Avatar>
                        <Typography variant="caption" noWrap>
                            {shortName(first.fullName)}{others.length > 0 && ` +${others.length}`}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}

TaskCard.propTypes = {
    task: TaskSummaryShape.isRequired,
    onOpen: PropTypes.func.isRequired,
};

export default TaskCard;
