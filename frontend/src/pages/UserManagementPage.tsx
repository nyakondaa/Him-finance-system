// src/pages/UserManagementPage.jsx
import React, { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  
} from "@tanstack/react-query";
import {
  Users,
  Lock,
  Unlock,
  Plus,
  MinusCircle,
  Trash2,
  Edit,
 
  Eye,
  EyeOff,
  Search,
  Mail,
  Phone,
  Calendar,
  Activity,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getBranches,
  lockUser,
  unlockUser,
  resetPassword,
} from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import useAuth from "../hooks/useAuth";

// Predefined system roles with their permissions
const SYSTEM_ROLES = [
  {
    id: 1,
    name: "admin",
    displayName: "Administrator",
    description: "Full system access with all permissions",
    permissions: {
      users: ["read", "create", "update", "delete", "lock_unlock"],
      roles: ["read"],
      branches: ["read", "create", "update", "delete"],
      transactions: ["read", "create", "update", "delete", "refund"],
      reports: ["read", "export", "advanced"],
      settings: ["read", "update", "system_config"],
    },
    isActive: true,
  },
  {
    id: 2,
    name: "supervisor",
    displayName: "Supervisor",
    description: "Can manage users and view reports",
    permissions: {
      users: ["read", "create", "update", "lock_unlock"],
      roles: ["read"],
      branches: ["read"],
      transactions: ["read", "create", "update"],
      reports: ["read", "export"],
      settings: ["read"],
    },
    isActive: true,
  },
  {
    id: 3,
    name: "cashier",
    displayName: "Cashier",
    description: "Can process transactions and view basic reports",
    permissions: {
      users: ["read"],
      roles: ["read"],
      branches: ["read"],
      transactions: ["read", "create"],
      reports: ["read"],
      settings: ["read"],
    },
    isActive: true,
  },
];

type UserManagementPageProps = {
  showModal: (
    message: string,
    title?: string,
    confirm?: boolean,
    onConfirm?: () => void
  ) => void;
};

const UserManagementPage: React.FC<UserManagementPageProps> = ({
  showModal,
}) => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  // State for tabs
  

  // User management state
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    roleId: "",
    branchCode: currentUser?.branchCode || "",
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch users
  const {
  data: users,
  isLoading: isLoadingUsers,
  error: usersError,
} = useQuery({
  queryKey: ["users"],
  queryFn: getUsers,
});

  // Fetch branches
  const {
    data: branches = [],
    isLoading: isLoadingBranches,
    error: branchesError,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
    onError: (err: { message: any }) =>
      showModal(err.message || "Failed to load branches.", "Error"),
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showModal("User created successfully!");
      resetUserForm();
    },
    onError: (err) =>
      showModal(err.message || "Failed to create user.", "Error"),
  });

  const updateUserMutation = useMutation<
    { id: number; data: any },
    any,
    { id: number; data: any }
  >({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      showModal("User updated successfully!");
      setEditingUser(null);
    },
    onError: (err) =>
      showModal(err.message || "Failed to update user.", "Error"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showModal("User deleted successfully.");
    },
    onError: (err) =>
      showModal(err.message || "Failed to delete user.", "Error"),
  });

  const lockUserMutation = useMutation({
    mutationFn: lockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showModal("User locked successfully.");
    },
    onError: (err) => showModal(err.message || "Failed to lock user.", "Error"),
  });

  const unlockUserMutation = useMutation({
    mutationFn: unlockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showModal("User unlocked successfully.");
    },
    onError: (err) =>
      showModal(err.message || "Failed to unlock user.", "Error"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, newPassword }) => resetPassword(token, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({});
      showModal(
        "Password reset successfully. New password has been generated."
      );
    },
    onError: (err) =>
      showModal(err.message || "Failed to reset password.", "Error"),
  });

  // Helper functions
  const resetUserForm = () => {
    setNewUser({
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      roleId: "",
      branchCode: currentUser?.branchCode || "",
    });
    setPasswordError("");
  };

  const validatePassword = (password: string) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[a-zA-Z\d!@#$%^&*()_+]{8,}$/;
    if (!regex.test(password)) {
      return "Password must be at least 8 characters, contain uppercase, lowercase, a number, and a special character.";
    }
    return "";
  };

  const handleCreateUser = () => {
    const error = validatePassword(newUser.password);
    if (error) {
      setPasswordError(error);
      return;
    }
    createUserMutation.mutate({
      ...newUser,
      roleId: parseInt(newUser.roleId),
      createdBy: currentUser.username,
    });
  };

  const handleUpdateUser = () => {
    const updateData = { ...editingUser };
    if (updateData.password && updateData.password.trim() !== "") {
      const error = validatePassword(updateData.password);
      if (error) {
        setPasswordError(error);
        return;
      }
    } else {
      delete updateData.password; // Don't update password if empty
    }
    updateUserMutation.mutate({
      id: editingUser.id,
      data: { ...updateData, roleId: parseInt(updateData.roleId) },
    });
  };

  const handleToggleUserLock = (userId, currentLockedStatus) => {
    if (currentLockedStatus) {
      unlockUserMutation.mutate(userId);
    } else {
      lockUserMutation.mutate(userId);
    }
  };

  const handleResetPassword = (userId) => {
    showModal(
      "Are you sure you want to reset this user's password? A new temporary password will be generated.",
      "Confirm Password Reset",
      true,
      () => resetPasswordMutation.mutate(userId)
    );
  };

  const handleDeleteUser = (userId, username) => {
    showModal(
      `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      "Confirm Deletion",
      true,
      () => deleteUserMutation.mutate(userId)
    );
  };

  // Filter users based on search term
 // Corrected Code
// Use optional chaining to safely access 'users' and provide an empty array as a fallback.
const filteredUsers = Array.isArray(users)
  ? users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.firstName || ""} ${user.lastName || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  : [];

  if (isLoadingUsers || isLoadingBranches) {
    return <LoadingSpinner />;
  }

  if (usersError || branchesError) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading data:</p>
        {usersError && <p>{usersError.message}</p>}
        {branchesError && <p>{branchesError.message}</p>}
      </div>
    );
  }

  // Check permissions
  const canManageUsers =
    currentUser?.permissions?.users?.includes("read") || false;

  if (!canManageUsers) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg text-center text-gray-700">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <p className="text-lg font-semibold">Access Denied</p>
        <p className="text-gray-500 mt-2">
          You do not have permission to access User Management.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-800 flex items-center gap-3">
        <Users className="w-8 h-8 text-blue-600" />
        User Management
      </h2>

      <div className="bg-white rounded-xl shadow-lg mb-8 border border-gray-200">
        {/* Create/Edit User Form */}
        <div className="p-8">
          <h3 className="text-xl font-semibold mb-6 text-gray-700">
            {editingUser ? "Edit User" : "Create New User"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <input
              type="text"
              placeholder="Username *"
              value={editingUser ? editingUser.username : newUser.username}
              onChange={(e) =>
                editingUser
                  ? setEditingUser({ ...editingUser, username: e.target.value })
                  : setNewUser({ ...newUser, username: e.target.value })
              }
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            />
            <input
              type="email"
              placeholder="Email"
              value={editingUser ? editingUser.email || "" : newUser.email}
              onChange={(e) =>
                editingUser
                  ? setEditingUser({ ...editingUser, email: e.target.value })
                  : setNewUser({ ...newUser, email: e.target.value })
              }
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            />
            <input
              type="text"
              placeholder="First Name"
              value={
                editingUser ? editingUser.firstName || "" : newUser.firstName
              }
              onChange={(e) =>
                editingUser
                  ? setEditingUser({
                      ...editingUser,
                      firstName: e.target.value,
                    })
                  : setNewUser({ ...newUser, firstName: e.target.value })
              }
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={
                editingUser ? editingUser.lastName || "" : newUser.lastName
              }
              onChange={(e) =>
                editingUser
                  ? setEditingUser({ ...editingUser, lastName: e.target.value })
                  : setNewUser({ ...newUser, lastName: e.target.value })
              }
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={
                editingUser
                  ? editingUser.phoneNumber || ""
                  : newUser.phoneNumber
              }
              onChange={(e) =>
                editingUser
                  ? setEditingUser({
                      ...editingUser,
                      phoneNumber: e.target.value,
                    })
                  : setNewUser({ ...newUser, phoneNumber: e.target.value })
              }
              className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={
                  editingUser
                    ? "New Password (leave blank to keep current)"
                    : "Password *"
                }
                value={
                  editingUser ? editingUser.password || "" : newUser.password
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (editingUser) {
                    setEditingUser({ ...editingUser, password: value });
                  } else {
                    setNewUser({ ...newUser, password: value });
                    setPasswordError(validatePassword(value));
                  }
                }}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <select
              value={editingUser ? editingUser.roleId : newUser.roleId}
              onChange={(e) =>
                editingUser
                  ? setEditingUser({ ...editingUser, roleId: e.target.value })
                  : setNewUser({ ...newUser, roleId: e.target.value })
              }
              className="border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            >
              <option value="">Select Role *</option>
              {SYSTEM_ROLES.filter((role) => role.isActive).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.displayName}
                </option>
              ))}
            </select>
            <select
              value={editingUser ? editingUser.branchCode : newUser.branchCode}
              onChange={(e) =>
                editingUser
                  ? setEditingUser({
                      ...editingUser,
                      branchCode: e.target.value,
                    })
                  : setNewUser({ ...newUser, branchCode: e.target.value })
              }
              className="border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            >
              <option value="">Select Branch *</option>
              {branches
                .filter((branch) => branch.isActive)
                .map((branch) => (
                  <option key={branch.code} value={branch.code}>
                    {branch.code} - {branch.name}
                  </option>
                ))}
            </select>
          </div>
          {passwordError && (
            <p className="text-red-600 text-sm mt-3 flex items-center gap-1">
              <MinusCircle className="w-4 h-4" /> {passwordError}
            </p>
          )}
          <div className="flex gap-4 mt-6">
            <button
              onClick={editingUser ? handleUpdateUser : handleCreateUser}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-md flex items-center gap-2"
              disabled={
                (editingUser
                  ? !editingUser.username ||
                    !editingUser.roleId ||
                    !editingUser.branchCode
                  : !newUser.username ||
                    !newUser.password ||
                    !newUser.roleId ||
                    !newUser.branchCode) ||
                passwordError ||
                createUserMutation.isLoading ||
                updateUserMutation.isLoading
              }
            >
              {createUserMutation.isLoading || updateUserMutation.isLoading ? (
                editingUser ? (
                  "Updating..."
                ) : (
                  "Creating..."
                )
              ) : editingUser ? (
                <>
                  <Edit className="w-5 h-5" /> Update User
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" /> Create User
                </>
              )}
            </button>
            {editingUser && (
              <button
                onClick={() => {
                  setEditingUser(null);
                  setPasswordError("");
                }}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-300 ease-in-out shadow-md"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 px-8">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by username, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto px-8 pb-8">
          <table className="w-full border-collapse rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left border-b border-gray-200">
                  User Info
                </th>
                <th className="py-3 px-6 text-left border-b border-gray-200">
                  Role
                </th>
                <th className="py-3 px-6 text-left border-b border-gray-200">
                  Branch
                </th>
                <th className="py-3 px-6 text-left border-b border-gray-200">
                  Status
                </th>
                <th className="py-3 px-6 text-left border-b border-gray-200">
                  Activity
                </th>
                <th className="py-3 px-6 text-left border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {filteredUsers.map((user) => {
                const userRole = SYSTEM_ROLES.find((r) => r.id === user.roleId);
                const userBranch = branches.find(
                  (b) => b.code === user.branchCode
                );
                return (
                  <tr
                    key={user.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition duration-150"
                  >
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">
                          {user.username}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : "No name provided"}
                        </span>
                        {user.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        )}
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Phone className="w-3 h-3" />
                            {user.phoneNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {userRole?.displayName || "Unknown Role"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium">{user.branchCode}</span>
                        <span className="text-gray-500 text-xs">
                          {userBranch?.name || "Unknown Branch"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.locked
                              ? "bg-red-100 text-red-800"
                              : user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.locked
                            ? "Locked"
                            : user.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                        {user.attempts > 0 && (
                          <span className="text-xs text-orange-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {user.attempts} failed attempts
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col text-xs text-gray-500">
                        {user.lastLogin ? (
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Last:{" "}
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                        ) : (
                          <span>Never logged in</span>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          Created:{" "}
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        {user.createdBy && (
                          <span className="text-xs">by {user.createdBy}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        {currentUser?.permissions?.users?.includes(
                          "update"
                        ) && (
                          <button
                            onClick={() => {
                              setEditingUser({ ...user, password: "" });
                              setPasswordError("");
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 bg-blue-500 text-white hover:bg-blue-600 transition duration-200"
                            disabled={updateUserMutation.isPending}
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                        )}
                        {currentUser?.permissions?.users?.includes(
                          "lock_unlock"
                        ) && (
                          <button
                            onClick={() =>
                              handleToggleUserLock(user.id, user.locked)
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition duration-200 ${
                              user.locked
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "bg-red-500 text-white hover:bg-red-600"
                            }`}
                            disabled={
                              lockUserMutation.isPending ||
                              unlockUserMutation.isPending
                            }
                          >
                            {user.locked ? (
                              <>
                                <Unlock className="w-3 h-3" /> Unlock
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" /> Lock
                              </>
                            )}
                          </button>
                        )}
                        {currentUser?.permissions?.users?.includes(
                          "update"
                        ) && (
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 bg-purple-500 text-white hover:bg-purple-600 transition duration-200"
                            disabled={resetPasswordMutation.isPending}
                          >
                            <RefreshCw className="w-3 h-3" /> Reset PW
                          </button>
                        )}
                        {currentUser?.permissions?.users?.includes("delete") &&
                          currentUser.id !== user.id && (
                            <button
                              onClick={() =>
                                handleDeleteUser(user.id, user.username)
                              }
                              className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-200"
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? "No users found matching your search."
                : "No users found."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
