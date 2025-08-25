import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin, logout as apiLogout, refreshToken as apiRefreshToken } from '../services/api';

interface AuthContextType {
    currentUser: any;
    loggedIn: boolean;
    loadingAuth: boolean;
    handleLogin: (username: string, password: string) => Promise<boolean>;
    handleLogout: () => Promise<void>;
    getValidToken: () => Promise<string | null>;
    hasPermission: (permission: string) => boolean;
    isAdmin: () => boolean;
    isSupervisor: () => boolean;
    isAdminOrSupervisor: () => boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Debugging logs
    const debugLog = (message: string, data?: any) => {
        console.log(`[AuthContext] ${message}`, data || '');
    };

    // Decode token and set user state
    const decodeAndSetUser = useCallback((token: string) => {
        try {
            const decoded = jwtDecode(token);
            const now = Date.now() / 1000;

            if (!decoded.exp || decoded.exp < now) {
                debugLog('Token expired or invalid');
                return false;
            }

            const userRole = (decoded as any).roleName?.toLowerCase() || '';
            setCurrentUser({
                id: (decoded as any).id,
                username: (decoded as any).username,
                role: userRole,
                isAdmin: userRole === 'admin',
                isSupervisor: userRole === 'supervisor',
                branch: (decoded as any).branch,
                branchCode: (decoded as any).branchCode || (decoded as any).branch,
                permissions: (decoded as any).permissions || []
            });
            setLoggedIn(true);
            return true;
        } catch (error) {
            debugLog('Token decode error', error);
            return false;
        }
    }, []);

    // Handle login
    const handleLogin = useCallback(async (username: string, password: string) => {
        try {
            setLoadingAuth(true);
            const response = await apiLogin(username, password);
            debugLog('Login response', response);

            if (!response?.accessToken) {
                throw new Error('No access token received');
            }

            localStorage.setItem('accessToken', response.accessToken);
            if (response.refreshToken) {
                localStorage.setItem('refreshToken', response.refreshToken);
            }

            const success = decodeAndSetUser(response.accessToken);
            if (!success) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
            return success;
        } catch (error) {
            debugLog('Login failed', error);
            throw error;
        } finally {
            setLoadingAuth(false);
        }
    }, [decodeAndSetUser]);

    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    await apiLogout(refreshToken);
                } catch (error) {
                    debugLog('Logout API error (non-critical)', error);
                }
            }
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setCurrentUser(null);
            setLoggedIn(false);
            refreshPromiseRef.current = null;
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
            debugLog('User logged out');
        }
    }, []);

    // Refresh token with race condition protection
    const refreshAccessToken = useCallback(async () => {
        if (refreshPromiseRef.current) {
            debugLog('Using existing refresh promise');
            return refreshPromiseRef.current;
        }

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            debugLog('No refresh token available');
            await handleLogout();
            return false;
        }

        try {
            debugLog('Attempting token refresh');
            const promise = apiRefreshToken(refreshToken)
                .then(response => {
                    debugLog('Refresh token response', response);
                    if (!response?.accessToken) {
                        throw new Error('No access token in response');
                    }

                    localStorage.setItem('accessToken', response.accessToken);
                    if (response.refreshToken) {
                        localStorage.setItem('refreshToken', response.refreshToken);
                    }

                    const success = decodeAndSetUser(response.accessToken);
                    if (!success) {
                        throw new Error('Failed to decode new token');
                    }
                    return true;
                })
                .catch(error => {
                    debugLog('Refresh failed', error);
                    throw error;
                })
                .finally(() => {
                    refreshPromiseRef.current = null;
                });

            refreshPromiseRef.current = promise;
            return await promise;
        } catch (error) {
            debugLog('Refresh token critical failure', error);
            await handleLogout();
            return false;
        }
    }, [decodeAndSetUser, handleLogout]);

    // Get valid token (auto-refresh if needed)
    const getValidToken = useCallback(async () => {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return null;

        try {
            const decoded = jwtDecode(accessToken);
            const now = Date.now() / 1000;
            const timeUntilExpiry = (decoded.exp || 0) - now;

            if (timeUntilExpiry < 300) { // 5 minute threshold
                debugLog('Token expiring soon, refreshing...');
                const refreshed = await refreshAccessToken();
                return refreshed ? localStorage.getItem('accessToken') : null;
            }

            return accessToken;
        } catch (error) {
            debugLog('Token validation error', error);
            return null;
        }
    }, [refreshAccessToken]);

    // Permission checks
    const hasPermission = useCallback((permission: string) => {
        return currentUser?.isAdmin || currentUser?.permissions?.includes(permission);
    }, [currentUser]);

    const isAdmin = useCallback(() => currentUser?.isAdmin === true, [currentUser]);
    const isSupervisor = useCallback(() => currentUser?.isSupervisor === true, [currentUser]);
    const isAdminOrSupervisor = useCallback(() => isAdmin() || isSupervisor(), [isAdmin, isSupervisor]);

    // Initial auth check
    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                setLoadingAuth(false);
                return;
            }

            try {
                const decoded = jwtDecode(accessToken);
                const now = Date.now() / 1000;
                const timeUntilExpiry = (decoded.exp || 0) - now;

                if (timeUntilExpiry > 60) {
                    decodeAndSetUser(accessToken);
                } else {
                    const refreshed = await refreshAccessToken();
                    if (!refreshed) {
                        await handleLogout();
                    }
                }
            } catch (error) {
                debugLog('Initial auth check failed', error);
                await handleLogout();
            } finally {
                setLoadingAuth(false);
            }
        };

        checkAuth();
    }, [decodeAndSetUser, refreshAccessToken, handleLogout]);

    // Auto-refresh logic
    useEffect(() => {
        if (!loggedIn) return;

        refreshIntervalRef.current = setInterval(async () => {
            debugLog('Running periodic token check');
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                await handleLogout();
                return;
            }

            try {
                const decoded = jwtDecode(accessToken);
                const now = Date.now() / 1000;
                if ((decoded.exp || 0) - now < 600) { // 10 minute threshold
                    await refreshAccessToken();
                }
            } catch (error) {
                debugLog('Periodic token check failed', error);
                await handleLogout();
            }
        }, 300000); // 5 minutes

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [loggedIn, refreshAccessToken, handleLogout]);

    // Context value
    const authContextValue = {
        currentUser,
        loggedIn,
        loadingAuth,
        handleLogin,
        handleLogout,
        getValidToken,
        hasPermission,
        isAdmin,
        isSupervisor,
        isAdminOrSupervisor
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};