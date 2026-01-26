// ...other imports
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Shield, User, Edit, Trash, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditUserModal from "@/components/EditUserModal";
import AddUserModal from "@/components/AddUserModal";
import { usersApi } from "@/services/api";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

const Users = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const data = await usersApi.list();
      setUsers(data.users || []);
    } catch (error: any) {
      toast({
        title: "Failed to load users",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = () => setIsAddModalOpen(true);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user '${user.username}'? This cannot be undone.`)) return;

    try {
      await usersApi.delete(user.id);

      toast({
        title: "User deleted",
        description: user.username,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Failed to delete user",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleUserAdded = () => fetchUsers();
  const handleUserUpdated = () => fetchUsers();

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "gradient-primary text-white";
      case "delivery_worker":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "admin" || role === "manager") return Shield;
    if (role === "delivery_worker") return Truck;
    return User;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading users...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-muted-foreground mt-2">Manage users and assign roles</p>
          </div>
          <Button
            onClick={handleAddUser}
            className="gradient-primary text-white shadow-soft hover:shadow-glow transition-all"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50 border-border"
          />
        </div>

        {/* Users List */}
        <Card className="glass-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4">
                        <Badge className={getRoleColor(user.role)}>
                          <RoleIcon className="mr-1 h-3 w-3" />
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            user.is_verified
                              ? "bg-green-500/20 text-green-700 dark:text-green-300"
                              : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                          }
                        >
                          {user.is_verified ? "verified" : "pending"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="flex items-center gap-2 ml-2 text-red-600 hover:text-white hover:bg-red-600"
                        >
                          <Trash className="h-4 w-4" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modals */}
        <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onUserAdded={handleUserAdded} />
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      </div>
    </DashboardLayout>
  );
};

export default Users;
