import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Gift, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Package,
  Sparkles,
  Lightbulb,
  Truck
} from "lucide-react";
import { LogoutButton } from "../pages/LogoutButton"; // adjust path if needed

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Gift, label: "Gifts", path: "/gifts" },
  { icon: Users, label: "Users", path: "/users" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: MessageSquare, label: "Feedback", path: "/feedback" },
  { icon: Package, label: "Orders", path: "/orders" },
  { icon: Truck, label: "Deliveries", path: "/deliveries" },
  { icon: Lightbulb, label: "Community", path: "/community" },
];

export const Sidebar = () => {
  const location = useLocation();
  
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="flex h-full flex-col justify-between">
        {/* Top Section */}
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 border-b border-border px-6 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">GiftFinder</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "gradient-primary text-white shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: User Info + Logout */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white">
              A
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Admin</p>
              <p className="text-xs text-muted-foreground">admin@giftfinder.com</p>
            </div>
          </div>

          {/* Logout Button matching sidebar style */}
          <div className="mt-2">
            <LogoutButton className="w-full" />
          </div>
        </div>
      </div>
    </aside>
  );
};
