import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export const StatCard = ({ title, value, icon, trend, trendUp, className }: StatCardProps) => {
  return (
    <Card className={cn("glass-card p-6 shadow-soft hover:shadow-glow transition-all", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium",
              trendUp ? "text-green-500" : "text-red-500"
            )}>
              {trend}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow">
          {icon}
        </div>
      </div>
    </Card>
  );
};
