import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Gift, Users, MessageSquare, Package, TrendingUp } from "lucide-react";
import { fetchAnalyticsSummary } from "@/services/api";

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsSummary()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's what's happening with your gift finder today.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading dashboard...</div>
        ) : error ? (
          <div className="py-16 text-center text-red-500">{error}</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Gifts"
                value={data?.gifts?.total?.toLocaleString() ?? "0"}
                icon={<Gift className="h-6 w-6 text-white" />}
              />
              <StatCard
                title="Active Users"
                value={data?.users?.total?.toLocaleString() ?? "0"}
                icon={<Users className="h-6 w-6 text-white" />}
              />
              <StatCard
                title="AI Chats"
                value={data?.ai?.chats?.toLocaleString() ?? "0"}
                icon={<MessageSquare className="h-6 w-6 text-white" />}
              />
            </div>

            {/* Charts & Lists */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Popular Gifts By Category */}
              <Card className="glass-card p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Most Popular Gift Categories</h2>
                </div>
                <div className="space-y-4">
                  {(data?.gifts?.categories || []).map((cat: any) => {
                    const total = data.gifts.categories.reduce(
                      (sum: number, c: any) => sum + c.count,
                      0
                    );
                    const percentage = total ? (cat.count / total) * 100 : 0;

                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{cat.category}</p>
                          <p className="text-sm text-muted-foreground">{cat.count} gifts</p>
                        </div>
                        <div className="h-3 w-full rounded-full bg-secondary/30 overflow-hidden">
                          <div
                            className="h-3 rounded-full gradient-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  {(!data?.gifts?.categories || data.gifts.categories.length === 0) && (
                    <div className="text-sm text-muted-foreground">No data available</div>
                  )}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="glass-card p-6 shadow-soft lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
                </div>
                <div className="space-y-3 max-h-80 overflow-auto">
                  {data?.recentActivity?.length ? (
                    data.recentActivity.map((activity: any, idx: number) => {
                      // Removed wishlist activity type (wishlist_created)
                      let icon = <Package className="h-4 w-4 text-primary" />;

                      switch (activity.type) {
                        case "user_created":
                          icon = <Users className="h-4 w-4 text-green-500" />;
                          break;
                        case "gift_created":
                          icon = <Gift className="h-4 w-4 text-blue-500" />;
                          break;
                        case "chat":
                          icon = <MessageSquare className="h-4 w-4 text-purple-500" />;
                          break;
                        default:
                          icon = <Package className="h-4 w-4 text-primary" />;
                      }

                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex-shrink-0">{icon}</div>
                          <div className="flex-1 flex flex-col">
                            <p className="text-sm text-foreground">{activity.message}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.time).toLocaleString()}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground capitalize">
                            {activity.type.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground">No recent activity to display.</div>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
