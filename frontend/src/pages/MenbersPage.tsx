import React, { useState, useEffect } from 'react';
import { Plus, User, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import MemberFormModal from '../components/MemberFormModal';
import { createMember, deleteMember as deleteMemberApi, getMembers } from '@/services/api';
import DeleteMemberModalForm from '@/components/DeleteMemberModalForm';


// --- MAIN COMPONENT ---
export default function App() {
    let [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showToast, setShowToast] = useState({ message: '', type: '' })


    const showNotification = (message, type) => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast({ message: '', type: '' }), 3000);
  };


    // Fetch members when the component mounts
    useEffect(() => {
        const fetchMembers = async () => {
            setIsLoading(true);
            try {
                const data = await getMembers();
                console.log("Fetched members:", data.members);
                setMembers(data.members);
            } catch (err) {
                showNotification("Failed to fetch members.", "error");
                console.error("Failed to fetch members:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, []);


    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

   

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsDeleteModalOpen(false);
        setSelectedMember(null);
    };
       
    


    const handleOpenDeleteModal = (member) => {
    setSelectedMember(member); 
    setIsDeleteModalOpen(true);
    };


    const handleDeleteConfirm = async () => {
    if (!selectedMember) return;
    setIsLoading(true);
    try {
        await deleteMemberApi(selectedMember.id); // call API
        setMembers(members.filter(m => m.id !== selectedMember.id)); // update state
        showNotification("Member deleted successfully.", "success");
        handleCloseModal();
    } catch(err) {
        console.error("Failed to delete member:", err);
        showNotification("Failed to delete member.", "error");
    } finally {
        setIsLoading(false);
    }
};


const handleCreateMember = async (memberData) => {
    setIsLoading(true);
    try {
        
        const newMember = await createMember(memberData); 
        setMembers(prev => [newMember, ...prev]);
        toast.success("Member created successfully");           
      
        handleCloseModal();
    } catch (err) {
        console.error("Failed to create member:", err);
     
    } finally {
        setIsLoading(false);
    }
};

    

    return (
        <div className="min-h-screen bg-gray-100 font-[Inter] antialiased relative">
            <div className={`p-8 ${isModalOpen ? "blur-md" : ""}`}>
                <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                 
                    <div className="p-8 bg-green-600 text-white flex justify-between items-center rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white bg-opacity-20 rounded-full">
                                <User className="w-8 h-8" />
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight">Members</h1>
                        </div>
                        <button
                            onClick={handleOpenModal}
                            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full font-semibold text-lg hover:bg-green-700 transition-colors shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Add Member
                        </button>
                    </div>
                    
                    
                    <div className="p-8">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-10">
                                <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member #</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                                            <th className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {members.length > 0 ? (
                                            members.map((member) => (
                                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-sm font-medium text-gray-900">{member.firstName} {member.lastName}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {member.memberNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {member.branchCode}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEdit(member.id)}
                                                                className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                 

                                                        <button
                                                        onClick={() => handleOpenDeleteModal(member)}
                                                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>


                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-10 text-center text-gray-500">
                                                    No members found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            
            {isModalOpen && <MemberFormModal onClose={handleCloseModal} onCreate={handleCreateMember} />}
        
          
      {isDeleteModalOpen && selectedMember && (
  <div className="fixed inset-0 flex items-center justify-center p-4 z-40">
    {/* Blurred background */}
    <div className="absolute inset-0 backdrop-blur-sm"></div>

    {/* Modal content */}
    <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Delete Member</h2>
        <button
          onClick={handleCloseModal}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-gray-700 mb-6">
        Are you sure you want to delete{' '}
        <strong>{selectedMember.firstName} {selectedMember.lastName}</strong>? This action cannot be undone.
      </p>

      <div className="flex justify-end gap-3">
        <button
          onClick={handleCloseModal}
          className="px-4 py-2 text-gray-700 font-semibold rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDeleteConfirm}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-colors shadow-md"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}



        </div>
    );
}
