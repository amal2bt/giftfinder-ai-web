import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign, CheckCircle2, Printer } from "lucide-react";
import { fetchAnalyticsSummary } from "@/services/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

const Analytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load a longer range for analytics (last 12 months)
    fetchAnalyticsSummary(365)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Convert sales totals to numbers (daily)
  const salesTrends =
    data?.salesTrends?.map((d: any) => ({
      date: d.date.slice(5), // "MM-DD" format
      total: Number(d.total),
    })) || [];

  // Monthly income (sum of sales totals per month)
  const monthlyIncome = (() => {
    if (!data?.salesTrends) return [];
    const monthlyTotals: Record<string, number> = {};
    (data.salesTrends as any[]).forEach((d: any) => {
      const dateStr = typeof d.date === "string" ? d.date : "";
      if (!dateStr) return;
      const key = dateStr.slice(0, 7); // YYYY-MM
      monthlyTotals[key] = (monthlyTotals[key] || 0) + Number(d.total ?? 0);
    });

    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => {
        const label = new Date(`${month}-01`).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        return { month: label, total: Number(total) };
      });
  })();

  // Delivered orders trends (daily)
  const deliveredTrends =
    data?.deliveredOrdersTrends?.map((d: any) => ({
      date: d.date.slice(5), // "MM-DD"
      count: Number(d.count ?? 0),
    })) || [];

  const totalDelivered = deliveredTrends.reduce(
    (sum: number, d: any) => sum + d.count,
    0
  );

  // Print helpers
  const printSection = (elementId: string) => {
    if (typeof window === "undefined") return;
    const element = document.getElementById(elementId);
    if (!element) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Analytics Report</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; }
            h1, h2, h3 { margin: 0 0 8px 0; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const printAll = () => {
    printSection("analytics-root");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground mt-2">
            Detailed insights and performance metrics
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={printAll}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print All to PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading analytics...</div>
        ) : error ? (
          <div className="py-16 text-center text-red-500">{error}</div>
        ) : (
          <div id="analytics-root" className="grid gap-6 md:grid-cols-2">
            {/* Sales Trends */}
            <Card id="sales-card" className="glass-card p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Sales Trends</h2>
                <Button
                  variant="outline"
                  size="xs"
                  className="ml-auto flex items-center gap-1"
                  onClick={() => printSection("sales-card")}
                >
                  <Printer className="h-3 w-3" />
                  Print
                </Button>
              </div>
              <div className="h-64">
                {salesTrends.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrends} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `$${value}`} />
                      <Bar
                        dataKey="total"
                        fill="#4f46e5" // primary UI color
                        radius={[4, 4, 0, 0]} // rounded top corners
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No sales data available
                  </div>
                )}
              </div>
            </Card>

            {/* User Growth */}
            <Card id="user-growth-card" className="glass-card p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">User Growth (last 14 days)</h2>
                <Button
                  variant="outline"
                  size="xs"
                  className="ml-auto flex items-center gap-1"
                  onClick={() => printSection("user-growth-card")}
                >
                  <Printer className="h-3 w-3" />
                  Print
                </Button>
              </div>
              <div className="h-64 flex flex-col items-center justify-center rounded-lg bg-secondary/30">
                {data?.recentUsers?.length ? (
                  <ul className="w-full max-h-56 overflow-auto text-left">
                    {data.recentUsers.map((u: any) => (
                      <li
                        key={u.date}
                        className="flex justify-between border-b border-muted-foreground/10 px-2 py-1 text-foreground text-sm"
                      >
                        <span>{u.date}</span>
                        <span>{u.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No recent user activity
                  </div>
                )}
              </div>
            </Card>

            {/* Monthly Income */}
            <Card id="monthly-income-card" className="glass-card p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Total Income by Month</h2>
                <Button
                  variant="outline"
                  size="xs"
                  className="ml-auto flex items-center gap-1"
                  onClick={() => printSection("monthly-income-card")}
                >
                  <Printer className="h-3 w-3" />
                  Print
                </Button>
              </div>
              <div className="h-64">
                {monthlyIncome.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyIncome} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" angle={-35} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `$${value}`} />
                      <Bar
                        dataKey="total"
                        fill="#16a34a"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No income data available
                  </div>
                )}
              </div>
            </Card>

            {/* Delivered Orders */}
            <Card id="delivered-orders-card" className="glass-card p-6 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Delivered Orders</h2>
                <Button
                  variant="outline"
                  size="xs"
                  className="ml-auto flex items-center gap-1"
                  onClick={() => printSection("delivered-orders-card")}
                >
                  <Printer className="h-3 w-3" />
                  Print
                </Button>
              </div>
              <div className="h-64 flex flex-col gap-4 rounded-lg bg-secondary/30 p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {totalDelivered.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    total delivered orders (selected period)
                  </span>
                </div>
                <div className="flex-1">
                  {deliveredTrends.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deliveredTrends} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No delivered orders data available
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
