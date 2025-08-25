import React from 'react';
import { Plus, Search, Folder, Users, FileText } from 'lucide-react';

const EmptyState = ({
                        title,
                        description,
                        iconName = 'default',
                        actionText,
                        onAction,
                        showAction = true
                    }) => {
    // Icon mapping
    const icons = {
        default: <Folder className="w-12 h-12 text-gray-400" />,
        search: <Search className="w-12 h-12 text-gray-400" />,
        project: <FileText className="w-12 h-12 text-gray-400" />,
        member: <Users className="w-12 h-12 text-gray-400" />,
    };

    // Default values based on iconName if title/description not provided
    const defaultTitles = {
        default: 'No data available',
        search: 'No results found',
        project: 'No projects yet',
        member: 'No members yet',
    };

    const defaultDescriptions = {
        default: 'Get started by creating your first item',
        search: 'Try adjusting your search or filter to find what you\'re looking for',
        project: 'Create your first project to get started',
        member: 'Add your first member to begin',
    };

    const displayTitle = title || defaultTitles[iconName] || defaultTitles.default;
    const displayDescription = description || defaultDescriptions[iconName] || defaultDescriptions.default;
    const displayIcon = icons[iconName] || icons.default;

    return (
        <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gray-100">
                {displayIcon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{displayTitle}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{displayDescription}</p>
            {showAction && onAction && (
                <button
                    onClick={onAction}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-lg flex items-center gap-2 mx-auto hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" />
                    {actionText || 'Create New'}
                </button>
            )}
        </div>
    );
};

export default EmptyState;