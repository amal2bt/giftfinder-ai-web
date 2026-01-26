import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash } from "lucide-react";
import { communityApi } from "@/services/api";

interface Idea {
  id: number;
  description: string;
  is_flagged?: boolean;
  user?: { username: string };
  created_at: string;
}

const Community = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Fetch ideas from API
 const fetchIdeas = async () => {
  setLoading(true);
  try {
    const data = await communityApi.list();

    // Map `users` -> `user` for frontend
    const mapped = data.map((idea: any) => ({
      ...idea,
      user: idea.users, // <-- map backend 'users' to frontend 'user'
    }));

    const sorted = mapped.sort((a: Idea, b: Idea) =>
      sortOrder === "newest"
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    setIdeas(sorted);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchIdeas();
  }, [sortOrder]);

  // Delete a single idea
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this idea?")) return;
    try {
      await communityApi.remove(id);
      setIdeas((prev) => prev.filter((idea) => idea.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete idea.");
    }
  };

  // Delete all flagged ideas
  const handleDeleteAllFlagged = async () => {
    const flaggedCount = ideas.filter((idea) => idea.is_flagged).length;
    if (flaggedCount === 0) {
      alert("No flagged ideas to delete.");
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${flaggedCount} flagged idea(s)?`)) return;

    try {
      const result = await communityApi.deleteAllFlagged();
      setIdeas((prev) => prev.filter((idea) => !idea.is_flagged));
      alert(result.message || `Deleted ${result.deleted_count} flagged idea(s).`);
      // Refresh the list
      fetchIdeas();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete flagged ideas.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            Community Ideas
          </h1>
          <p className="text-muted-foreground mt-2">
            Admin view: manage ideas containing inappropriate content
          </p>
        </div>

        {/* Delete All Flagged Button */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-muted-foreground">
            {ideas.filter((idea) => idea.is_flagged).length} flagged idea(s)
          </div>
          <button
            onClick={handleDeleteAllFlagged}
            disabled={ideas.filter((idea) => idea.is_flagged).length === 0}
            className="px-4 py-2 bg-destructive text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete All Flagged
          </button>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-secondary/30 border">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Ideas List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading ideas...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-500">{error}</div>
          ) : ideas.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No ideas found.
            </div>
          ) : (
            ideas.map((idea) => {
              const flagged = idea.is_flagged || false;
              return (
                <Card
                  key={idea.id}
                  className={`glass-card p-6 shadow-soft hover:shadow-glow transition-all flex justify-between items-start ${
                    flagged ? "border-2 border-destructive" : ""
                  }`}
                >
                  <div className="flex-1 space-y-3">
                    {/* User */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-white font-bold">
                        {idea.user?.username?.charAt(0) ?? "?"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {idea.user?.username ?? "Anonymous"}
                          </p>
                          {flagged && (
                            <Badge className="bg-destructive text-destructive-foreground text-xs">
                              FLAGGED
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {idea.created_at?.slice(0, 10)}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className={`text-foreground ${flagged ? "text-destructive font-medium" : ""}`}>
                      {idea.description}
                    </p>
                  </div>

                  {/* Delete Button if flagged */}
                  {flagged && (
                    <Badge
                      className="bg-destructive text-destructive-foreground cursor-pointer flex items-center gap-1 hover:bg-red-700 transition"
                      onClick={() => handleDelete(idea.id)}
                    >
                      <Trash className="w-4 h-4" />
                      Delete
                    </Badge>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Community;
