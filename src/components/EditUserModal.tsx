import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Lock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usersApi } from "@/services/api";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: () => void;
}

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }: EditUserModalProps) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user"
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: "",
        role: user.role
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await usersApi.update(user.id, updateData);

      toast({
        title: "User updated successfully",
        description: `${formData.username} has been updated`,
      });

      onUserUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Edit User
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="pl-10 bg-background/50 border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="pl-10 bg-background/50 border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">New Password (optional)</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Leave blank to keep current password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="pl-10 bg-background/50 border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-foreground">Role</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger className="pl-10 bg-background/50 border-border">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="delivery_worker">Delivery Worker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-primary text-white shadow-soft hover:shadow-glow transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
