import { useEffect, useState } from 'react';
import api from '../axiosConfig';

// Username of the logged-in user ('' until /me responds).
export default function useUsername() {
    const [username, setUsername] = useState('');

    useEffect(() => {
        api.get('/me').then((res) => setUsername(res.data.username)).catch(() => {});
    }, []);

    return username;
}
