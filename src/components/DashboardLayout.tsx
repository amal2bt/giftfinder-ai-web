import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <Sidebar />
      <main className="ml-64 min-h-screen p-8">
        {children}
      </main>
    </div>
  );
};
