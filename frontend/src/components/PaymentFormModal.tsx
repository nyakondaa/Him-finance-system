import React, { useState } from 'react';
import { X, CreditCard, AlertCircle, Check, Info } from 'lucide-react';

const PaymentMethodFormModal = ({ paymentMethod, onClose, onCreate, onUpdate, isLoading }) => {
    const [formData, setFormData] = useState({
        name: paymentMethod?.name || '',
        description: paymentMethod?.description || '',
        isActive: paymentMethod?.isActive ?? true
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                if (!value.trim()) {
                    return 'Payment method name is required';
                }
                if (value.length < 2) {
                    return 'Name must be at least 2 characters long';
                }
                if (value.length > 50) {
                    return 'Name must be less than 50 characters';
                }
                return '';
            case 'description':
                if (value && value.length > 200) {
                    return 'Description must be less than 200 characters';
                }
                return '';
            default:
                return '';
        }
    };

    const handleInputChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const handleBlur = (name, value) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate all fields
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });

        setErrors(newErrors);
        setTouched({ name: true, description: true });

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const submitData = {
            ...formData,
            name: formData.name.trim(),
            description: formData.description.trim() || null
        };

        if (paymentMethod) {
            onUpdate({ id: paymentMethod.id, data: submitData });
        } else {
            onCreate(submitData);
        }
    };

    const isFormValid = !errors.name && !errors.description && formData.name.trim();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {paymentMethod ? 'Edit Payment Method' : 'Create New Payment Method'}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {paymentMethod ? 'Update payment method details' : 'Add a new payment method to your system'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6">
                    <div className="space-y-6">
                        {/* Payment Method Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Payment Method Name
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Credit Card, Bank Transfer, PayPal"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                onBlur={(e) => handleBlur('name', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                    errors.name && touched.name
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 focus:border-blue-500'
                                }`}
                                disabled={isLoading}
                                maxLength="50"
                            />
                            {errors.name && touched.name && (
                                <div className="flex items-center gap-2 mt-2 text-red-600">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm">{errors.name}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-500">
                                    Choose a clear, descriptive name
                                </span>
                                <span className="text-xs text-gray-400">
                                    {formData.name.length}/50
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Description
                                <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                            </label>
                            <textarea
                                placeholder="e.g. Visa, MasterCard, AMEX accepted..."
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                onBlur={(e) => handleBlur('description', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${
                                    errors.description && touched.description
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 focus:border-blue-500'
                                }`}
                                disabled={isLoading}
                                rows="3"
                                maxLength="200"
                            />
                            {errors.description && touched.description && (
                                <div className="flex items-center gap-2 mt-2 text-red-600">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm">{errors.description}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-500">
                                    Provide additional details about this payment method
                                </span>
                                <span className="text-xs text-gray-400">
                                    {formData.description.length}/200
                                </span>
                            </div>
                        </div>

                        {/* Status Toggle */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${formData.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        {formData.isActive ? (
                                            <Check className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <X className="w-5 h-5 text-gray-500" />
                                        )}
                                    </div>
                                    <div>
                                        <label className="font-semibold text-gray-800 cursor-pointer">
                                            Payment Method Status
                                        </label>
                                        <p className="text-sm text-gray-600">
                                            {formData.isActive
                                                ? 'This payment method is active and available for use'
                                                : 'This payment method is inactive and not available'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex gap-3">
                                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-blue-900 mb-1">Payment Method Tips</h4>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Use clear, recognizable names that users will understand</li>
                                        <li>• Include relevant details in the description (accepted cards, fees, etc.)</li>
                                        <li>• You can configure currency support after creating the payment method</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading || !isFormValid}
                            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                isFormValid && !isLoading
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Processing...
                                </>
                            ) : paymentMethod ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Update Payment Method
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4" />
                                    Create Payment Method
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-2xl">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">
                                {paymentMethod ? 'Updating payment method...' : 'Creating payment method...'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentMethodFormModal;