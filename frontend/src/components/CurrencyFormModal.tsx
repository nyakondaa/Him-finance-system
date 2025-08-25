import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

const CurrencyFormModal = ({ currency, onClose, onCreate, onUpdate, isLoading }) => {
    const [formData, setFormData] = useState({
        code: currency?.code || '',
        name: currency?.name || '',
        symbol: currency?.symbol || '',
        isActive: currency?.isActive ?? true
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.code || !formData.name) {
            return;
        }

        if (currency) {
            onUpdate({ code: currency.code, data: formData });
        } else {
            onCreate(formData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center border-b border-gray-200 p-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        {currency ? 'Edit Currency' : 'Create New Currency'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Currency Code *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. USD, EUR, ZWL"
                                value={formData.code}
                                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-green-400"
                                maxLength="3"
                                disabled={!!currency}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">3-letter ISO code</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Currency Name *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. US Dollar"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-green-400"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Symbol
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. $, €, £"
                                value={formData.symbol}
                                onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                                className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-green-400"
                                maxLength="5"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-gray-700">Active</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !formData.code || !formData.name}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
                        >
                            {isLoading ? (
                                'Processing...'
                            ) : currency ? (
                                'Update Currency'
                            ) : (
                                'Create Currency'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CurrencyFormModal;