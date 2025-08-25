// src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="flex items-center justify-center h-full w-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <p className="ml-4 text-lg text-gray-600">Loading...</p>
        </div>
    );
};

export default LoadingSpinner;
