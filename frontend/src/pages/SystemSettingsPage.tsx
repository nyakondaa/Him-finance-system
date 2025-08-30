import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Plus, Save, Edit, Trash2 } from "lucide-react";
import {
  getBranches,
  addBranch,
  updateBranch,
  deleteBranch,
} from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import useAuth from "../hooks/useAuth";


interface Branch {
  code: string;
  name: string;
}


interface User {
  uid: string;
  role: "supervisor" | "admin" | "user";
}

interface AddBranchVariables {
  code: string;
  name: string;
}

// Define the type for the variables passed to the updateBranch mutation.
interface UpdateBranchVariables {
  code: string;
  data: {
    name: string;
  };
}

// Define the props for the component, specifically the showModal function.
interface SystemSettingsPageProps {
  showModal: (
    message: string,
    type?: "Error" | "Confirm Deletion" | undefined,
    isConfirm?: boolean,
    onConfirm?: () => void
  ) => void;
}

const SystemSettingsPage = ({
  showModal,
}: SystemSettingsPageProps): any => {
  const queryClient = useQueryClient();
  // We're using a type assertion here to tell TypeScript the shape of the return value
  const { currentUser } = useAuth() as { currentUser: User | null };

  const [newBranchCode, setNewBranchCode] = useState<string>("");
  const [newBranchName, setNewBranchName] = useState<string>("");
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Fetch branches with proper typing for the data and error.
  const {
    data: branches = [],
    isLoading: isLoadingBranches,
    isError: isErrorBranches,
    error: branchesError,
  } = useQuery<Branch[], Error>({
    queryKey: ["branches"],
    queryFn: getBranches,
  });

  // Add showModal to the dependency array to satisfy the linter.
  useEffect(() => {
    if (isErrorBranches && branchesError) {
      showModal(branchesError.message || "Failed to load branches.", "Error");
    }
  }, [isErrorBranches, branchesError, showModal]);

  // Mutation for adding a branch with correct type parameters.
  const addBranchMutation = useMutation<void, Error, AddBranchVariables>({
    mutationFn: addBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      showModal("New branch added successfully!");
      setNewBranchCode("");
      setNewBranchName("");
    },
    onError: (err) => {
      showModal(err.message || "Failed to add branch.", "Error");
    },
  });

  // Mutation for updating a branch with correct type parameters.
  const updateBranchMutation = useMutation<void, Error, UpdateBranchVariables>({
     mutationFn: ({ code, data }) => updateBranch(code, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      showModal("Branch updated successfully!");
      setEditingBranch(null);
    },
    onError: (err) => {
      showModal(err.message || "Failed to update branch.", "Error");
    },
  });

  // Mutation for deleting a branch with correct type parameters (string for the code).
  const deleteBranchMutation = useMutation<void, Error, string>({
    mutationFn: deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      showModal("Branch deleted successfully!");
    },
    onError: (err) => {
      showModal(err.message || "Failed to delete branch.", "Error");
    },
  });

  const handleAddBranch = () => {
    if (!newBranchCode || !newBranchName) {
      showModal("Branch Code and Name cannot be empty.", "Error");
      return;
    }
    // Pass the correctly typed object to the mutation.
    addBranchMutation.mutate({ code: newBranchCode, name: newBranchName });
  };

  const handleUpdateBranch = () => {
    if (!editingBranch || !editingBranch.name) {
      showModal("Branch Name cannot be empty.", "Error");
      return;
    }
    updateBranchMutation.mutate({
      code: editingBranch.code,
      data: { name: editingBranch.name },
    });
  };

  // Correct the type for `code` to be a lowercase 'string'.
  const handleDeleteBranch = (code: string, name: string) => {
    showModal(
      `Are you sure you want to delete branch "${name}" (${code})? This action cannot be undone.`,
      "Confirm Deletion",
      true,
      () => deleteBranchMutation.mutate(code),
    );
  };

  if (isLoadingBranches) {
    return <LoadingSpinner />;
  }

  if (isErrorBranches) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading branches:</p>
        <p>{branchesError.message}</p>
      </div>
    );
  }

  // Check for authorization after loading.
  if (!(currentUser?.role === "supervisor" || currentUser?.role === "admin")) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-700">
        <p className="text-lg font-semibold">
          You do not have permission to access System Settings.
        </p>
        <p className="text-gray-500 mt-2">
          Please contact a supervisor or admin for assistance.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-800 flex items-center gap-3">
        <Settings className="w-8 h-8 text-gray-600" />
        System Settings
      </h2>

      <div className="bg-white p-8 rounded-xl shadow-lg mb-8 border border-gray-200">
        <h3 className="text-xl font-semibold mb-6 text-gray-700">
          {editingBranch ? "Edit Branch" : "Manage Branches"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!editingBranch && (
            <input
              type="text"
              placeholder="New Branch Code (e.g., 05)"
              value={newBranchCode}
              onChange={(e) => setNewBranchCode(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            />
          )}
          <input
            type="text"
            placeholder={
              editingBranch
                ? "Branch Name"
                : "New Branch Name (e.g., Gweru Branch)"
            }
            value={editingBranch ? editingBranch.name : newBranchName}
            onChange={(e) =>
              editingBranch
                ? setEditingBranch({ ...editingBranch, name: e.target.value })
                : setNewBranchName(e.target.value)
            }
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
          />
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={editingBranch ? handleUpdateBranch : handleAddBranch}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-md flex items-center gap-2"
            disabled={
              (editingBranch
                ? !editingBranch.name
                : !newBranchCode || !newBranchName) ||
              addBranchMutation.isPending ||
              updateBranchMutation.isPending
            }
          >
            {addBranchMutation.isPending || updateBranchMutation.isPending ? (
              "Saving..."
            ) : editingBranch ? (
              <>
                <Save className="w-5 h-5" /> Update Branch
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" /> Add Branch
              </>
            )}
          </button>
          {editingBranch && (
            <button
              onClick={() => setEditingBranch(null)}
              className="bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500 transition duration-300 ease-in-out shadow-md flex items-center gap-2"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold mb-6 text-gray-700">
          Existing Branches
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left border-b border-gray-200">
                  Code
                </th>
                <th className="py-3 px-6 text-left border-b border-gray-200">
                  Name
                </th>
                <th className="py-3 px-6 text-left border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {branches.map((branch) => (
                <tr
                  key={branch.code}
                  className="border-b border-gray-200 hover:bg-gray-50 transition duration-150"
                >
                  <td className="py-3 px-6 text-left font-mono">
                    {branch.code}
                  </td>
                  <td className="py-3 px-6 text-left">{branch.name}</td>
                  <td className="py-3 px-6 text-left flex items-center gap-2">
                    <button
                      onClick={() => setEditingBranch(branch)}
                      className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 transition duration-200"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteBranch(branch.code, branch.name)
                      }
                      className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-200"
                      disabled={deleteBranchMutation.isPending}
                    >
                      {deleteBranchMutation.isPending ? (
                        "Deleting..."
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3" /> Delete
                        </>
                      )}
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

export default SystemSettingsPage;
