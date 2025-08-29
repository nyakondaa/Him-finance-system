import React, { useState, useEffect } from 'react';
import { Plus, User, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import MemberFormModal from '../components/MemberFormModal';
import { createMember, deleteMember, getMembers } from '@/services/api';




const mockMembers = [
    {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        memberNumber: '12345',
        email: 'john.doe@example.com',
        branchCode: 'B01',
    },
    {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        memberNumber: '67890',
        email: 'jane.smith@example.com',
        branchCode: 'B02',
    },
    {
        id: '3',
        firstName: 'Peter',
        lastName: 'Jones',
        memberNumber: '11223',
        email: 'peter.jones@example.com',
        branchCode: 'B01',
    }
];





// --- MAIN COMPONENT ---
export default function App() {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch members when the component mounts
    useEffect(() => {
        const fetchMembers = async () => {
            setIsLoading(true);
            try {
                const data = await getMembers();
                console.log("Fetched members:", data);
                setMembers(data.members || []);
            } catch (err) {
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
    };
    
    
    const handleEdit = (memberId) => {
        console.log(`Edit member with ID: ${memberId}`);
        
    };

    const handleDelete = async (memberId) => {

        console.log(`Delete member with ID: ${memberId}`);
        setIsLoading(true);
        try {

            await deleteMember(memberId);
            toast.success("Member deleted successfully");
            setMembers(members.filter(member => member.id !== memberId));
        }catch(err) {
            console.error("Failed to delete member:", err);
            toast.error("Failed to delete member");
        }finally {
            setIsLoading(false);
        }
        
    };

    // In App.tsx

// In your MenbersPage.tsx

const handleCreateMember = async (memberData) => {
    setIsLoading(true);
    try {
        
        await createMember(memberData); 
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
                                                                onClick={() => handleDelete(member.id)}
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
        </div>
    );
}
