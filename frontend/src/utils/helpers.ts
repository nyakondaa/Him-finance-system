export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount || 0);
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

export const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

export const getStatusBadgeVariant = (status) => {
    switch (status) {
        case 'COMPLETED':
        case 'APPROVED':
        case 'ACTIVE':
        case 'SIGNED':
            return 'bg-green-100 text-green-800';
        case 'PENDING':
        case 'DRAFT':
        case 'ON_HOLD':
        case 'IN_PROGRESS':
            return 'bg-yellow-100 text-yellow-800';
        case 'REFUNDED':
        case 'REJECTED':
        case 'CANCELLED':
        case 'TERMINATED':
        case 'EXPIRED':
        case 'DAMAGED':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'ACTIVE':
            return 'bg-green-500';
        case 'INACTIVE':
            return 'bg-red-500';
        default:
            return 'bg-gray-400';
    }
};