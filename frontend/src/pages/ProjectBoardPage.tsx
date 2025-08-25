import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Trash2, Edit, ChevronDown, ChevronUp, Search, RefreshCw,
    List, Filter, Grid, Table, Users, PieChart, AlertCircle, Calendar,
    DollarSign, TrendingUp, Download, Settings, Eye, EyeOff,
    FileText, BarChart3, Clock, Target, Activity, MoreVertical, Copy, Archive
} from 'lucide-react';
import {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectMembers,
    getProjectContributions,
    getBranches,
    getCurrencies
} from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import useAuth from '../hooks/useAuth';
import ProjectFormModal from '../components/FormModals/ProjectFormModal';
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { formatCurrency, formatDate } from '../utils/helpers';

const ProjectBoardPage = ({ showModal }) => {
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    // Enhanced State management
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [expandedProject, setExpandedProject] = useState(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [statusFilter, setStatusFilter] = useState('all');
    const [branchFilter, setBranchFilter] = useState('all');
    const [selectedProjects, setSelectedProjects] = useState([]);

    // Fetch data with enhanced error handling
    const {
        data: projects = [],
        isLoading: isLoadingProjects,
        error: projectsError,
        refetch: refetchProjects,
        isRefetching
    } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
        onError: (err) => showModal?.(err.message || 'Failed to load projects.', 'Error'),
    });

    const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: getBranches });
    const { data: currencies = [] } = useQuery({ queryKey: ['currencies'], queryFn: getCurrencies });

    const getBranchName = useCallback((code) => branches.find(b => b.code === code)?.name || code, [branches]);
    const getCurrencySymbol = useCallback((code) => currencies.find(c => c.code === code)?.symbol || code, [currencies]);

    // Mutations
    const createProjectMutation = useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
            showModal?.('Project created successfully!', 'Success');
            setIsProjectModalOpen(false);
            setCurrentProject(null);
        },
        onError: (err) => showModal?.(err.message || 'Failed to create project.', 'Error'),
    });

    const updateProjectMutation = useMutation({
        mutationFn: ({ id, data }) => updateProject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
            showModal?.('Project updated successfully!', 'Success');
            setIsProjectModalOpen(false);
            setCurrentProject(null);
        },
        onError: (err) => showModal?.(err.message || 'Failed to update project.', 'Error'),
    });

    const deleteProjectMutation = useMutation({
        mutationFn: deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
            showModal?.('Project deleted successfully.', 'Success');
        },
        onError: (err) => showModal?.(err.message || 'Failed to delete project.', 'Error'),
    });

    // Filter and sort logic
    const filteredAndSortedProjects = useMemo(() => {
        let filtered = [...(projects || [])];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }
        if (branchFilter !== 'all') {
            filtered = filtered.filter(p => p.branchCode === branchFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); }
                if (typeof bVal === 'string') { bVal = bVal.toLowerCase(); }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [projects, sortConfig, searchTerm, statusFilter, branchFilter]);

    // Helper functions
    const handleEditProject = useCallback((project) => {
        setCurrentProject(project);
        setIsProjectModalOpen(true);
    }, []);

    const handleCreateProject = useCallback(() => {
        setCurrentProject(null);
        setIsProjectModalOpen(true);
    }, []);

    const handleDeleteProject = useCallback((id) => {
        showModal(
            'Are you sure you want to delete this project?',
            'Confirm Deletion',
            true,
            () => deleteProjectMutation.mutate(id)
        );
    }, [deleteProjectMutation, showModal]);

    const requestSort = useCallback((key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setStatusFilter('all');
        setBranchFilter('all');
    }, []);

    if (isLoadingProjects) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <List className="w-8 h-8 text-blue-600" />
                        </div>
                        Project Management
                    </h1>
                    <p className="text-gray-600">Manage and track all projects across branches</p>
                </div>
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button
                        onClick={refetchProjects}
                        disabled={isRefetching}
                        className="p-3 rounded-xl border border-gray-300 hover:bg-gray-100 transition duration-200 bg-white disabled:opacity-50"
                        title="Refresh data"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-500 ${isRefetching ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleCreateProject}
                        className="px-6 py-3 text-white bg-blue-600 rounded-xl hover:bg-blue-700 hover:opacity-90 transition duration-300 shadow-lg flex items-center gap-2 font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Add Project
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                        <div className="flex flex-col sm:flex-row gap-4 flex-grow">
                            <div className="relative flex-grow max-w-md">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="all">All Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                                <select
                                    value={branchFilter}
                                    onChange={(e) => setBranchFilter(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="all">All Branches</option>
                                    {branches.map(branch => (
                                        <option key={branch.code} value={branch.code}>{branch.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-200">
                            <th onClick={() => requestSort('name')} className={`py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer`}>Project Name</th>
                            <th onClick={() => requestSort('branchCode')} className={`py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer`}>Branch</th>
                            <th onClick={() => requestSort('targetAmount')} className={`py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer`}>Target Amount</th>
                            <th onClick={() => requestSort('status')} className={`py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer`}>Status</th>
                            <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filteredAndSortedProjects.length > 0 ? (
                            filteredAndSortedProjects.map(project => (
                                <React.Fragment key={project.id}>
                                    <tr className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="py-4 px-6 text-gray-900">{project.name}</td>
                                        <td className="py-4 px-6">{getBranchName(project.branchCode)}</td>
                                        <td className="py-4 px-6">{formatCurrency(project.targetAmount, project.currencyCode)}</td>
                                        <td className="py-4 px-6">
                                            <StatusBadge status={project.status} />
                                        </td>
                                        <td className="py-4 px-6 flex items-center gap-2">
                                            <button
                                                onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                                                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                                            >
                                                {expandedProject === project.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => handleEditProject(project)} className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200">
                                                <Edit className="w-3 h-3" /> Edit
                                            </button>
                                            <button onClick={() => handleDeleteProject(project.id)} className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200">
                                                <Trash2 className="w-3 h-3" /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedProject === project.id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan="5" className="p-6">
                                                <ExpandedProjectView projectId={project.id} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5">
                                    <EmptyState
                                        entity="projects"
                                        searchTerm={searchTerm}
                                        onCreate={handleCreateProject}
                                        onClearFilters={clearFilters}
                                        hasFilters={!!searchTerm || statusFilter !== 'all' || branchFilter !== 'all'}
                                        canManage={true}
                                    />
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isProjectModalOpen && (
                <ProjectFormModal
                    project={currentProject}
                    onClose={() => {
                        setIsProjectModalOpen(false);
                        setCurrentProject(null);
                    }}
                    onCreate={createProjectMutation.mutate}
                    onUpdate={updateProjectMutation.mutate}
                    isLoading={createProjectMutation.isLoading || updateProjectMutation.isLoading}
                />
            )}
        </div>
    );
};

const ExpandedProjectView = ({ projectId }) => {
    const { data: members = [], isLoading: isLoadingMembers } = useQuery({
        queryKey: ['projectMembers', projectId],
        queryFn: () => getProjectMembers(projectId),
    });

    const { data: contributions = [], isLoading: isLoadingContributions } = useQuery({
        queryKey: ['projectContributions', projectId],
        queryFn: () => getProjectContributions(projectId),
    });

    return (
        <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-800">Project Details</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h5 className="font-medium text-gray-700 mb-2">Members</h5>
                    {isLoadingMembers ? <LoadingSpinner /> : (
                        <div className="flex flex-wrap gap-2">
                            {members.length > 0 ? members.map(m => (
                                <span key={m.id} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                                    {m.firstName} {m.lastName}
                                </span>
                            )) : <p className="text-gray-500 text-xs">No members assigned.</p>}
                        </div>
                    )}
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h5 className="font-medium text-gray-700 mb-2">Contributions</h5>
                    {isLoadingContributions ? <LoadingSpinner /> : (
                        <ul className="space-y-1">
                            {contributions.length > 0 ? contributions.map(c => (
                                <li key={c.id} className="flex justify-between items-center text-sm">
                                    <span>{c.memberId}</span>
                                    <span className="font-semibold">{formatCurrency(c.amount, c.currencyCode)}</span>
                                </li>
                            )) : <p className="text-gray-500 text-xs">No contributions yet.</p>}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectBoardPage;