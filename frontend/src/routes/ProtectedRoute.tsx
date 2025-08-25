// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

const ProtectedRoute = ({ allowedRoles }) => {
    const { loggedIn, currentUser, loadingAuth } = useAuth();

    if (loadingAuth) {
        return <LoadingSpinner />; // Show a loading spinner while checking auth status
    }

    if (!loggedIn) {
        return <Navigate to="/login" replace />; // Redirect to login if not authenticated
    }

    // If roles are specified, check if the user has one of the allowed roles
    if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
        // Optionally, navigate to an unauthorized page or display a message
        return <Navigate to="/unauthorized" replace />; // You might create an UnauthorizedPage
    }

    return <Outlet />; // Render child routes if authenticated and authorized
};

export default ProtectedRoute;
