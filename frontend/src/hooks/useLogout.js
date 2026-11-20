import { useNavigate } from 'react-router-dom';
import api from '../axiosConfig';

// Returns a logout handler: blacklists the token server-side, then clears local state.
export default function useLogout(onLogout) {
    const navigate = useNavigate();

    return async () => {
        try { await api.post('/auth/logout'); } catch { /* token is dropped locally either way */ }
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        onLogout?.();
        navigate('/login');
    };
}
