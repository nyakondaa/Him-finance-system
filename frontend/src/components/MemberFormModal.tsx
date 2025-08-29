import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, User } from 'lucide-react';
import { getBranches } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const MemberFormModal = ({ member, onClose, onCreate, onUpdate, isLoading }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        memberNumber: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        
        branchCode: '',
        address: '',      
       // joinDate: new Date().toISOString().split('T')[0],
        isActive: true,
      
    });

    const [errors, setErrors] = useState({});

    // Fetch branches
    const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
        queryKey: ['branches'],
        queryFn: getBranches
    });

    // Age categories
  const ageCategories = [
    { value: 'CHILD', label: 'Child (0-12)' },
    { value: 'YOUTH', label: 'Youth (13-17)' },
    { value: 'ADULT', label: 'Adult (18+)' },
    { value: 'ELDERLY', label: 'Senior (65+)' }
];

    // Initialize form with member data if editing
    useEffect(() => {
        if (member) {
            setFormData({
                firstName: member.firstName || '',
                lastName: member.lastName || '',
                memberNumber: member.memberNumber || '',
                email: member.email || '',
                phoneNumber: member.phoneNumber || '',
                dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split('T')[0] : '',                
                branchCode: member.branchCode || '',
                address: member.address || '',              
                //joinDate: member.joinDate ? member.joinDate.split('T')[0] : new Date().toISOString().split('T')[0],
                isActive: member.isActive !== undefined ? member.isActive : true,
                
            });
        }
    }, [member]);

    // Calculate age category based on date of birth
    const calculateAgeCategory = (dateOfBirth) => {
        if (!dateOfBirth) return 'adult';

        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        
        // In MemberFormModal.tsx


    if (age < 13) return 'CHILD';
    if (age < 18) return 'YOUTH';
    if (age < 65) return 'ADULT';
    return 'ELDERLY';
};




    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Auto-calculate age category when date of birth changes
        if (name === 'dateOfBirth' && value) {
            const category = calculateAgeCategory(value);
            setFormData(prev => ({
                ...prev,
                ageCategory: category
            }));
        }

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        if (!formData.memberNumber.trim()) {
            newErrors.memberNumber = 'Member number is required';
        }
        if (!formData.branchCode) {
            newErrors.branchCode = 'Branch selection is required';
        }

        // Email validation
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone number validation (basic)
        if (formData.phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
            newErrors.phoneNumber = 'Please enter a valid phone number';
        }

        // Date validation
        if (formData.dateOfBirth) {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            if (birthDate > today) {
                newErrors.dateOfBirth = 'Birth date cannot be in the future';
            }
        }

        const joinDate = new Date(formData.joinDate);
        const today = new Date();
        if (joinDate > today) {
            newErrors.joinDate = 'Join date cannot be in the future';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const data = {
            ...formData,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            memberNumber: formData.memberNumber.trim(),
            email: formData.email.trim() || null,
            phoneNumber: formData.phoneNumber.trim() || null,
            address: formData.address.trim() || null,
         
        };


        if (member) {
            onUpdate({ id: member.id, data });
        } else {
            console.log("Creating member with data:", data);
            onCreate(data);
        }
    };

    if (isLoadingBranches) {
        return <LoadingSpinner />;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                            <User className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {member ? 'Edit Member' : 'Create New Member'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                                            errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter first name"
                                    />
                                    {errors.firstName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                                            errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter last name"
                                    />
                                    {errors.lastName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Member Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="memberNumber"
                                        value={formData.memberNumber}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                                            errors.memberNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter member number"
                                    />
                                    {errors.memberNumber && (
                                        <p className="mt-1 text-sm text-red-600">{errors.memberNumber}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                                            errors.dateOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.dateOfBirth && (
                                        <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                                    )}
                                </div>
                               
                                
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Contact Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                                            errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter email address"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                                            errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter phone number"
                                    />
                                    {errors.phoneNumber && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                        placeholder="Enter full address"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Organization Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                Organization Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Branch <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="branchCode"
                                        value={formData.branchCode}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                                            errors.branchCode ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(branch => (
                                            <option key={branch.code} value={branch.code}>
                                                {branch.name} ({branch.code})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.branchCode && (
                                        <p className="mt-1 text-sm text-red-600">{errors.branchCode}</p>
                                    )}
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                        Active Member
                                    </label>
                                </div>
                            </div>
                        </div>


                      
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {member ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <User className="w-4 h-4" />
                                    {member ? 'Update Member' : 'Create Member'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberFormModal;