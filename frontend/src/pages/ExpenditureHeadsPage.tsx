// src/pages/ExpenditureHeadsPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Banknote, Plus, Save, Edit, Trash2 } from 'lucide-react';
import { getExpenditureHeads, addExpenditureHead, updateExpenditureHead, deleteExpenditureHead, getBranches } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import useAuth from '../hooks/useAuth';

const ExpenditureHeadsPage = ({ showModal }) => {
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [newExpenditure, setNewExpenditure] = useState({ name: '', branch: currentUser?.branch || '' });
    const [editingExpenditure, setEditingExpenditure] = useState(null);

    // Fetch expenditure heads
    const { data: expenditureHeads = [], isLoading: isLoadingExpenditureHeads, isError: isErrorExpenditureHeads, error: expenditureHeadsError } = useQuery({
        queryKey: ['expenditureHeads'],
        queryFn: getExpenditureHeads,
        onError: (err) => showModal(err.message || 'Failed to load expenditure heads.', 'Error'),
    });

    // Fetch branches for dropdown
    const { data: branches = [], isLoading: isLoadingBranches, isError: isErrorBranches, error: branchesError } = useQuery({
        queryKey: ['branches'],
        queryFn: getBranches,
        onError: (err) => showModal(err.message || 'Failed to load branches.', 'Error'),
    });

    // Mutation for adding an expenditure head
    const addExpenditureMutation = useMutation({
        mutationFn: addExpenditureHead,
        onSuccess: () => {
            queryClient.invalidateQueries(['expenditureHeads']);
            showModal('Expenditure Head added successfully!');
            setNewExpenditure({ name: '', branch: currentUser?.branch || '' });
        },
        onError: (err) => {
            showModal(err.message || 'Failed to add expenditure head.', 'Error');
        },
    });

    // Mutation for updating an expenditure head
    const updateExpenditureMutation = useMutation({
        mutationFn: ({ code, data }) => updateExpenditureHead(code, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['expenditureHeads']);
            showModal('Expenditure Head updated successfully!');
            setEditingExpenditure(null);
        },
        onError: (err) => {
            showModal(err.message || 'Failed to update expenditure head.', 'Error');
        },
    });

    // Mutation for deleting an expenditure head
    const deleteExpenditureMutation = useMutation({
        mutationFn: deleteExpenditureHead,
        onSuccess: () => {
            queryClient.invalidateQueries(['expenditureHeads']);
            showModal('Expenditure Head deleted successfully!');
        },
        onError: (err) => {
            showModal(err.message || 'Failed to delete expenditure head.', 'Error');
        },
    });

    const handleAddExpenditure = () => {
        if (!newExpenditure.name || !newExpenditure.branch) {
            showModal('Please fill in both name and branch for the new expenditure head.', 'Validation Error');
            return;
        }
        addExpenditureMutation.mutate(newExpenditure);
    };

    const handleUpdateExpenditure = () => {
        if (!editingExpenditure.name || !editingExpenditure.branchCode) {
            showModal('Please fill in both name and branch for the expenditure head.', 'Validation Error');
            return;
        }
        updateExpenditureMutation.mutate({ code: editingExpenditure.code, data: { name: editingExpenditure.name, branch: editingExpenditure.branchCode } });
    };

    const handleDeleteExpenditure = (code, name) => {
        showModal(
            `Are you sure you want to delete expenditure head "${name}" (${code})? This action cannot be undone.`,
            'Confirm Deletion',
            true,
            () => deleteExpenditureMutation.mutate(code)
        );
    };

    if (isLoadingExpenditureHeads || isLoadingBranches) {
        return <LoadingSpinner />;
    }

    if (isErrorExpenditureHeads || isErrorBranches) {
        return (
            <div className="text-center text-red-600 p-8">
                <p>Error loading data:</p>
                {isErrorExpenditureHeads && <p>{expenditureHeadsError.message}</p>}
                {isErrorBranches && <p>{branchesError.message}</p>}
            </div>
        );
    }

    // Check for authorization after loading
    if (!(currentUser?.role === 'supervisor' || currentUser?.role === 'admin')) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-700">
                <p className="text-lg font-semibold">You do not have permission to access Expenditure Heads Setup.</p>
                <p className="text-gray-500 mt-2">Please contact a supervisor or admin for assistance.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-3xl font-extrabold mb-8 text-gray-800 flex items-center gap-3">
                <Banknote className="w-8 h-8 text-red-600" />
                Expenditure Heads Setup
            </h2>

            <div className="bg-white p-8 rounded-xl shadow-lg mb-8 border border-gray-200">
                <h3 className="text-xl font-semibold mb-6 text-gray-700">
                    {editingExpenditure ? 'Edit Expenditure Head' : 'Add New Expenditure Head'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                        type="text"
                        placeholder="Expenditure Head Name"
                        value={editingExpenditure ? editingExpenditure.name : newExpenditure.name}
                        onChange={(e) => editingExpenditure ? setEditingExpenditure({ ...editingExpenditure, name: e.target.value }) : setNewExpenditure({ ...newExpenditure, name: e.target.value })}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                    />
                    <select
                        value={editingExpenditure ? editingExpenditure.branchCode : newExpenditure.branch}
                        onChange={(e) => editingExpenditure ? setEditingExpenditure({ ...editingExpenditure, branchCode: e.target.value }) : setNewExpenditure({ ...newExpenditure, branch: e.target.value })}
                        className="border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                    >
                        {branches.map(branch => (
                            <option key={branch.code} value={branch.code}>
                                {branch.code} - {branch.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={editingExpenditure ? handleUpdateExpenditure : handleAddExpenditure}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition duration-300 ease-in-out shadow-md flex items-center gap-2"
                        disabled={(editingExpenditure ? !editingExpenditure.name : !newExpenditure.name) || addExpenditureMutation.isLoading || updateExpenditureMutation.isLoading}
                    >
                        {addExpenditureMutation.isLoading || updateExpenditureMutation.isLoading ? 'Saving...' : editingExpenditure ? <><Save className="w-5 h-5" /> Update Expenditure Head</> : <><Plus className="w-5 h-5" /> Add Expenditure Head</>}
                    </button>
                    {editingExpenditure && (
                        <button
                            onClick={() => setEditingExpenditure(null)}
                            className="bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500 transition duration-300 ease-in-out shadow-md flex items-center gap-2"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-semibold mb-6 text-gray-700">Existing Expenditure Heads</h3>
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
                        {expenditureHeads.map(expenditure => (
                            <tr key={expenditure.code} className="border-b border-gray-200 hover:bg-gray-50 transition duration-150">
                                <td className="py-3 px-6 text-left font-mono">{expenditure.code}</td>
                                <td className="py-3 px-6 text-left">{expenditure.name}</td>
                                <td className="py-3 px-6 text-left">{expenditure.branchCode} - {branches.find(b => b.code === expenditure.branchCode)?.name}</td>
                                <td className="py-3 px-6 text-left flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingExpenditure(expenditure)}
                                        className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 transition duration-200"
                                    >
                                        <Edit className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteExpenditure(expenditure.code, expenditure.name)}
                                        className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-200"
                                        disabled={deleteExpenditureMutation.isLoading}
                                    >
                                        {deleteExpenditureMutation.isLoading ? 'Deleting...' : <><Trash2 className="w-3 h-3" /> Delete</>}
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

export default ExpenditureHeadsPage;
