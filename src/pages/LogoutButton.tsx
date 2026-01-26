import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const LogoutButton = ({ className }: { className?: string }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("auth_user");

    navigate("/login", { replace: true });
  };

  return (
    <div
      onClick={handleLogout}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground cursor-pointer transition-all",
        className
      )}
    >
      <LogOut className="h-5 w-5" />
      Logout
    </div>
  );
};
