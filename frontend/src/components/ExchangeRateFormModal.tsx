import React, { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';

const ExchangeRateFormModal = ({ rate, currencies, onClose, onCreate, onUpdate, isLoading }) => {
    const [formData, setFormData] = useState({
        fromCurrency: rate?.fromCurrency || '',
        toCurrency: rate?.toCurrency || '',
        rate: rate?.rate || '',
        effectiveDate: rate?.effectiveDate 
            ? new Date(rate.effectiveDate).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0]
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fromCurrency) {
            newErrors.fromCurrency = 'From currency is required';
        }
        
        if (!formData.toCurrency) {
            newErrors.toCurrency = 'To currency is required';
        }
        
        if (formData.fromCurrency === formData.toCurrency) {
            newErrors.toCurrency = 'From and To currencies must be different';
        }
        
        if (!formData.rate || isNaN(parseFloat(formData.rate)) || parseFloat(formData.rate) <= 0) {
            newErrors.rate = 'Rate must be a valid positive number';
        }
        
        if (!formData.effectiveDate) {
            newErrors.effectiveDate = 'Effective date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const submitData = {
            ...formData,
            rate: parseFloat(formData.rate)
        };

        if (rate) {
            onUpdate({ id: rate.id, data: submitData });
        } else {
            onCreate(submitData);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center border-b border-gray-200 p-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        {rate ? 'Edit Exchange Rate' : 'Create New Exchange Rate'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                From Currency *
                            </label>
                            <select
                                value={formData.fromCurrency}
                                onChange={(e) => handleInputChange('fromCurrency', e.target.value)}
                                className={`border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 ${
                                    errors.fromCurrency ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                            >
                                <option value="">Select from currency</option>
                                {currencies.map(currency => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.code} - {currency.name}
                                    </option>
                                ))}
                            </select>
                            {errors.fromCurrency && (
                                <p className="text-red-500 text-xs mt-1">{errors.fromCurrency}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Currency *
                            </label>
                            <select
                                value={formData.toCurrency}
                                onChange={(e) => handleInputChange('toCurrency', e.target.value)}
                                className={`border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 ${
                                    errors.toCurrency ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                            >
                                <option value="">Select to currency</option>
                                {currencies.map(currency => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.code} - {currency.name}
                                    </option>
                                ))}
                            </select>
                            {errors.toCurrency && (
                                <p className="text-red-500 text-xs mt-1">{errors.toCurrency}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Exchange Rate *
                            </label>
                            <input
                                type="number"
                                step="0.000001"
                                min="0"
                                placeholder="e.g. 1.25"
                                value={formData.rate}
                                onChange={(e) => handleInputChange('rate', e.target.value)}
                                className={`border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 ${
                                    errors.rate ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                            />
                            {errors.rate && (
                                <p className="text-red-500 text-xs mt-1">{errors.rate}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                1 {formData.fromCurrency} = {formData.rate || '?'} {formData.toCurrency}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Effective Date *
                            </label>
                            <input
                                type="date"
                                value={formData.effectiveDate}
                                onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                                className={`border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 ${
                                    errors.effectiveDate ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                            />
                            {errors.effectiveDate && (
                                <p className="text-red-500 text-xs mt-1">{errors.effectiveDate}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Date when this rate becomes effective
                            </p>
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
                            disabled={isLoading || !formData.fromCurrency || !formData.toCurrency || !formData.rate || !formData.effectiveDate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                        >
                            {isLoading ? (
                                'Processing...'
                            ) : rate ? (
                                'Update Rate'
                            ) : (
                                'Create Rate'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExchangeRateFormModal;