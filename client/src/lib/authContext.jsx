import { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => setUser(data?.user || null))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}