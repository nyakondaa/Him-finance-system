// components/ExpandedPaymentMethodView.js
import React, { useState, useEffect } from 'react';
import { List, Plus, X, Search } from 'lucide-react';
import { getPaymentMethodCurrencies } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const ExpandedPaymentMethodView = ({
                                       paymentMethodId,
                                       currencies,
                                       onToggleCurrency,
                                       onRemoveCurrency,
                                       onAddCurrency
                                   }) => {
    const [paymentMethodCurrencies, setPaymentMethodCurrencies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadCurrencies = async () => {
            setIsLoading(true);
            try {
                const currencies = await getPaymentMethodCurrencies(paymentMethodId);
                setPaymentMethodCurrencies(currencies);
            } catch (error) {
                console.error('Failed to load currencies:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadCurrencies();
    }, [paymentMethodId]);

    const handleAddAllCurrencies = () => {
        filteredAvailableCurrencies.forEach(currency => {
            onAddCurrency(paymentMethodId, currency.code);
        });
    };

    const filteredAvailableCurrencies = currencies.filter(currency => {
        if (paymentMethodCurrencies.some(allowedCurrency => allowedCurrency.code === currency.code)) {
            return false;
        }

        return currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            currency.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (isLoading) {
        return <div className="text-center py-4"><LoadingSpinner size="small" /></div>;
    }

    return (
        <>
            <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Allowed Currencies for Payment Method
                </h4>

                {paymentMethodCurrencies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paymentMethodCurrencies.map(currency => (
                            <div key={currency.code} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{currency.code} - {currency.name}</p>
                                    {currency.symbol && (
                                        <p className="text-xs text-gray-500 mt-1">Symbol: {currency.symbol}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={currency.isActive}
                                            onChange={(e) => onToggleCurrency(
                                                paymentMethodId,
                                                currency.code,
                                                e.target.checked
                                            )}
                                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-gray-700">
                                            {currency.isActive ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </label>
                                    <button
                                        onClick={() => onRemoveCurrency(paymentMethodId, currency.code)}
                                        className="p-1 text-red-500 hover:text-red-700 transition duration-200"
                                        title="Remove"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No currencies configured for this payment method.</p>
                )}
            </div>

            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Currency
                    </h4>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <div className="relative flex-grow">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search currencies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full"
                            />
                        </div>

                        <button
                            onClick={handleAddAllCurrencies}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition duration-200 text-sm flex items-center gap-1 whitespace-nowrap"
                            disabled={filteredAvailableCurrencies.length === 0}
                        >
                            <Plus className="w-4 h-4" />
                            Add All Filtered
                        </button>
                    </div>
                </div>

                {filteredAvailableCurrencies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAvailableCurrencies.map(currency => (
                            <div key={currency.code} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{currency.code} - {currency.name}</p>
                                    {currency.symbol && (
                                        <p className="text-xs text-gray-500 mt-1">Symbol: {currency.symbol}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => onAddCurrency(paymentMethodId, currency.code)}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition duration-200 text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">
                        {searchTerm ? 'No matching currencies found.' : 'No currencies available to add.'}
                    </p>
                )}
            </div>
        </>
    );
};

export default ExpandedPaymentMethodView;