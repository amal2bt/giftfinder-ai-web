import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Lock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usersApi } from "@/services/api";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal = ({ isOpen, onClose, onUserAdded }: AddUserModalProps) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user"
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await usersApi.create(formData);

      toast({
        title: "User created successfully",
        description: `${formData.username} has been added`,
      });

      // Reset form
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "user"
      });

      onUserAdded();
      onClose();
    } catch (error: any) {
      toast({
        title: "Creation failed",
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

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "user"
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Add New User
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
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="pl-10 bg-background/50 border-border"
                required
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
              onClick={handleClose}
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
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
