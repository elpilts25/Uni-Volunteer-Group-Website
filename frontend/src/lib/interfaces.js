import PropTypes from 'prop-types';

// Shared data shapes returned by the backend; components reuse these instead of declaring their own.

export const CategoryShape = PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
    icon: PropTypes.string,
    allowedRoles: PropTypes.arrayOf(PropTypes.string),
});

export const AssigneeShape = PropTypes.shape({
    username: PropTypes.string,
    fullName: PropTypes.string,
});

export const CriterionShape = PropTypes.shape({
    text: PropTypes.string,
    done: PropTypes.bool,
});

// Task as listed on the board.
export const TaskSummaryShape = PropTypes.shape({
    id: PropTypes.number.isRequired,
    team: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    dueDate: PropTypes.string,
    commentCount: PropTypes.number,
    criteriaDone: PropTypes.number,
    criteriaTotal: PropTypes.number,
    assignees: PropTypes.arrayOf(AssigneeShape).isRequired,
});

// Task as edited in the form.
export const TaskShape = PropTypes.shape({
    id: PropTypes.number,
    team: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    priority: PropTypes.string,
    dueDate: PropTypes.string,
    criteria: PropTypes.arrayOf(CriterionShape),
});
