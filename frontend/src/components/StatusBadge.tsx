import React from 'react';
import { Check, X, Clock } from 'lucide-react';

const StatusBadge = ({ status, isActive }) => {
    // If using isActive prop (boolean) for backward compatibility
    const statusValue = typeof status !== 'undefined' ? status : isActive;

    let badgeClass = '';
    let icon = null;
    let text = '';

    if (typeof statusValue === 'boolean') {
        // Boolean status (active/inactive)
        badgeClass = statusValue
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-gray-100 text-gray-600 border-gray-200';
        icon = statusValue ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />;
        text = statusValue ? 'Active' : 'Inactive';
    } else if (typeof statusValue === 'string') {
        // String status (multiple states)
        switch (statusValue.toLowerCase()) {
            case 'active':
            case 'completed':
            case 'success':
                badgeClass = 'bg-green-100 text-green-800 border-green-200';
                icon = <Check className="w-3 h-3" />;
                text = 'Active';
                break;
            case 'inactive':
            case 'cancelled':
            case 'failed':
                badgeClass = 'bg-gray-100 text-gray-600 border-gray-200';
                icon = <X className="w-3 h-3" />;
                text = 'Inactive';
                break;
            case 'pending':
            case 'processing':
                badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                icon = <Clock className="w-3 h-3" />;
                text = 'Pending';
                break;
            case 'draft':
                badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                text = 'Draft';
                break;
            default:
                badgeClass = 'bg-gray-100 text-gray-600 border-gray-200';
                text = statusValue;
        }
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeClass}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
            {text}
    </span>
    );
};

export default StatusBadge;