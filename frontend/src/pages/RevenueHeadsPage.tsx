// src/pages/RevenueHeadsPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Plus, Save, Edit, Trash2 } from 'lucide-react';
import { getRevenueHeads, addRevenueHead, updateRevenueHead, deleteRevenueHead, getBranches } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import useAuth from '../hooks/useAuth';

const RevenueHeadsPage = ({ showModal }) => {
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [newRevenue, setNewRevenue] = useState({ name: '', branchCode: currentUser?.branchCode || '' });
    const [editingRevenue, setEditingRevenue] = useState(null);

    // Fetch revenue heads
    const {
        data: revenueHeads = [],
        isLoading: isLoadingRevenueHeads,
        isError: isErrorRevenueHeads,
        error: revenueHeadsError
    } = useQuery({
        queryKey: ['revenueHeads'],
        queryFn: getRevenueHeads,
        onError: (err) => showModal(err.message || 'Failed to load revenue heads.', 'Error'),
    });

    // Fetch branches for dropdown
    const {
        data: branches = [],
        isLoading: isLoadingBranches,
        isError: isErrorBranches,
        error: branchesError
    } = useQuery({
        queryKey: ['branches'],
        queryFn: getBranches,
        onError: (err) => showModal(err.message || 'Failed to load branches.', 'Error'),
    });

    // Mutation for adding a revenue head
    const addRevenueMutation = useMutation({
        mutationFn: addRevenueHead,
        onSuccess: () => {
            queryClient.invalidateQueries(['revenueHeads']);
            showModal('Revenue Head added successfully!');
            setNewRevenue({ name: '', branchCode: currentUser?.branchCode || '' });
        },
        onError: (err) => {
            showModal(err.message || 'Failed to add revenue head.', 'Error');
        },
    });

    // Mutation for updating a revenue head
    const updateRevenueMutation = useMutation({
        mutationFn: ({ code, data }) => updateRevenueHead(code, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['revenueHeads']);
            showModal('Revenue Head updated successfully!');
            setEditingRevenue(null);
        },
        onError: (err) => {
            showModal(err.message || 'Failed to update revenue head.', 'Error');
        },
    });

    // Mutation for deleting a revenue head
    const deleteRevenueMutation = useMutation({
        mutationFn: deleteRevenueHead,
        onSuccess: () => {
            queryClient.invalidateQueries(['revenueHeads']);
            showModal('Revenue Head deleted successfully!');
        },
        onError: (err) => {
            showModal(err.message || 'Failed to delete revenue head.', 'Error');
        },
    });

    const handleAddRevenue = () => {
        if (!newRevenue.name || !newRevenue.branchCode) {
            showModal('Please fill in both name and branch for the new revenue head.', 'Validation Error');
            return;
        }
        addRevenueMutation.mutate(newRevenue);
    };

    const handleUpdateRevenue = () => {
        if (!editingRevenue?.name || !editingRevenue?.branchCode) {
            showModal('Please fill in both name and branch for the revenue head.', 'Validation Error');
            return;
        }
        updateRevenueMutation.mutate({
            code: editingRevenue.code,
            data: {
                name: editingRevenue.name,
                branchCode: editingRevenue.branchCode
            }
        });
    };

    const handleDeleteRevenue = (code, name) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete revenue head "${name}" (${code})? This action cannot be undone.`
        );
        if (confirmDelete) {
            deleteRevenueMutation.mutate(code);
        }
    };

    if (isLoadingRevenueHeads || isLoadingBranches) {
        return <LoadingSpinner />;
    }

    if (isErrorRevenueHeads || isErrorBranches) {
        return (
            <div className="text-center text-red-600 p-8">
                <p>Error loading data:</p>
                {isErrorRevenueHeads && <p>{revenueHeadsError.message}</p>}
                {isErrorBranches && <p>{branchesError.message}</p>}
            </div>
        );
    }

    // Check for authorization after loading
    if (!(currentUser?.isAdmin || currentUser?.isSupervisor)) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-700">
                <p className="text-lg font-semibold">You do not have permission to access Revenue Heads Setup.</p>
                <p className="text-gray-500 mt-2">Please contact a supervisor or admin for assistance.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-3xl font-extrabold mb-8 text-gray-800 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                Revenue Heads Setup
            </h2>

            <div className="bg-white p-8 rounded-xl shadow-lg mb-8 border border-gray-200">
                <h3 className="text-xl font-semibold mb-6 text-gray-700">
                    {editingRevenue ? 'Edit Revenue Head' : 'Add New Revenue Head'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                        type="text"
                        placeholder="Revenue Head Name"
                        value={editingRevenue ? editingRevenue.name : newRevenue.name}
                        onChange={(e) => editingRevenue
                            ? setEditingRevenue({ ...editingRevenue, name: e.target.value })
                            : setNewRevenue({ ...newRevenue, name: e.target.value })
                        }
                        className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                    />
                    <select
                        value={editingRevenue ? editingRevenue.branchCode : newRevenue.branchCode}
                        onChange={(e) => editingRevenue
                            ? setEditingRevenue({ ...editingRevenue, branchCode: e.target.value })
                            : setNewRevenue({ ...newRevenue, branchCode: e.target.value })
                        }
                        className="border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                    >
                        <option value="">Select Branch</option>
                        {branches.map(branch => (
                            <option key={branch.code} value={branch.code}>
                                {branch.code} - {branch.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={editingRevenue ? handleUpdateRevenue : handleAddRevenue}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 ease-in-out shadow-md flex items-center gap-2"
                        disabled={
                            (editingRevenue ? !editingRevenue.name || !editingRevenue.branchCode
                                : !newRevenue.name || !newRevenue.branchCode) ||
                            addRevenueMutation.isLoading ||
                            updateRevenueMutation.isLoading
                        }
                    >
                        {addRevenueMutation.isLoading || updateRevenueMutation.isLoading
                            ? 'Saving...'
                            : editingRevenue
                                ? <><Save className="w-5 h-5" /> Update Revenue Head</>
                                : <><Plus className="w-5 h-5" /> Add Revenue Head</>
                        }
                    </button>
                    {editingRevenue && (
                        <button
                            onClick={() => setEditingRevenue(null)}
                            className="bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500 transition duration-300 ease-in-out shadow-md flex items-center gap-2"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-semibold mb-6 text-gray-700">Existing Revenue Heads</h3>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse rounded-lg overflow-hidden">
                        <thead>
                        <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left border-b border-gray-200">Account Code</th>
                            <th className="py-3 px-6 text-left border-b border-gray-200">Name</th>
                            <th className="py-3 px-6 text-left border-b border-gray-200">Branch</th>
                            <th className="py-3 px-6 text-left border-b border-gray-200">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                        {revenueHeads.map(revenue => (
                            <tr key={revenue.code} className="border-b border-gray-200 hover:bg-gray-50 transition duration-150">
                                <td className="py-3 px-6 text-left font-mono">{revenue.code}</td>
                                <td className="py-3 px-6 text-left">{revenue.name}</td>
                                <td className="py-3 px-6 text-left">
                                    {revenue.branchCode} - {branches.find(b => b.code === revenue.branchCode)?.name || 'Unknown'}
                                </td>
                                <td className="py-3 px-6 text-left flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingRevenue(revenue)}
                                        className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 transition duration-200"
                                    >
                                        <Edit className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRevenue(revenue.code, revenue.name)}
                                        className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 transition duration-200"
                                        disabled={deleteRevenueMutation.isLoading}
                                    >
                                        {deleteRevenueMutation.isLoading
                                            ? 'Deleting...'
                                            : <><Trash2 className="w-3 h-3" /> Delete</>
                                        }
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RevenueHeadsPage;