import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getBranches, getCurrencies } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';

const ProjectFormModal = ({ project, onClose, onCreate, onUpdate, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        targetAmount: '',
        currencyCode: 'USD',
        branchCode: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true
    });

    // Fetch branches and currencies
    const { data: branchesData, isLoading: isLoadingBranches } = useQuery({
        queryKey: ['branches'],
        queryFn: getBranches
    });

    const { data: currenciesData, isLoading: isLoadingCurrencies } = useQuery({
        queryKey: ['currencies'],
        queryFn: getCurrencies
    });

    const branches = branchesData?.branches || [];
    const currencies = currenciesData?.currencies || [];

    // Initialize form with project data if editing
    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name,
                description: project.description || '',
                targetAmount: parseFloat(project.targetAmount).toFixed(2),
                currencyCode: project.currencyCode,
                branchCode: project.branchCode,
                startDate: project.startDate.split('T')[0],
                endDate: project.endDate ? project.endDate.split('T')[0] : '',
                isActive: project.isActive
            });
        }
    }, [project]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            targetAmount: parseFloat(formData.targetAmount)
        };

        if (project) {
            onUpdate({ id: project.id, data });
        } else {
            onCreate(data);
        }
    };

    if (isLoadingBranches || isLoadingCurrencies) {
        return <LoadingSpinner />;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {project ? 'Edit Project' : 'Create New Project'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name*</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch*</label>
                                <select
                                    name="branchCode"
                                    value={formData.branchCode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(branch => (
                                        <option key={branch.code} value={branch.code}>
                                            {branch.name} ({branch.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount*</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="targetAmount"
                                        value={formData.targetAmount}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        <select
                                            name="currencyCode"
                                            value={formData.currencyCode}
                                            onChange={handleChange}
                                            className="bg-transparent border-none focus:ring-0 text-sm"
                                        >
                                            {currencies.map(currency => (
                                                <option key={currency.code} value={currency.code}>
                                                    {currency.code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    min={formData.startDate}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                    Active Project
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    {project ? 'Updating...' : 'Creating...'}
                                </div>
                            ) : (
                                project ? 'Update Project' : 'Create Project'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectFormModal;