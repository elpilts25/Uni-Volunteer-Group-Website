import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './components/Login';
import RegisterForm from './components/RegisterForm';
import ForumLayout from './components/ForumLayout';
import ForumHome from './components/ForumHome';
import CategoryPage from './components/CategoryPage';
import NewTopicPage from './components/NewTopicPage';
import TopicPage from './components/TopicPage';
import UnreadPage from './components/UnreadPage';
import CalendarPage from './components/CalendarPage';
import TasksPage from './components/TasksPage';
import MembersPage from './components/MembersPage';
import { MEMBER_ROLES, hasRole } from './utils/roles';
import './App.css'

// Sends anonymous visitors to the login page.
function RequireAuth() {
    return localStorage.getItem('token') ? <Outlet /> : <Navigate to="/login" replace />;
}

// Sends logged-in users without one of `roles` back to the forum home.
function RequireRole({ roles }) {
    return hasRole(roles) ? <Outlet /> : <Navigate to="/" replace />;
}

function App() {
    // Re-renders the tree when login/logout happens.
    const [, setAuthTick] = useState(0);
    const bump = () => setAuthTick((n) => n + 1);

    return (
        <Routes>
            <Route path="/login" element={<Login onLogin={bump} />} />
            <Route path="/register" element={<RegisterForm onRegisterSuccess={bump} />} />
            <Route element={<RequireAuth />}>
                <Route element={<ForumLayout onLogout={bump} />}>
                    <Route path="/" element={<ForumHome />} />
                    <Route path="/categories/:id" element={<CategoryPage />} />
                    <Route path="/categories/:id/new" element={<NewTopicPage />} />
                    <Route path="/topics/:id" element={<TopicPage />} />
                    <Route path="/unread" element={<UnreadPage />} />
                    <Route element={<RequireRole roles={MEMBER_ROLES} />}>
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/tasks" element={<TasksPage />} />
                        <Route path="/members" element={<MembersPage />} />
                    </Route>
                </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
