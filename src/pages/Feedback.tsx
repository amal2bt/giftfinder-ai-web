import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { fetchFeedbacks } from "@/services/api";

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    setLoading(true);

    const queryParams = new URLSearchParams();

    if (selectedRating !== null) queryParams.append("rating", String(selectedRating));
    if (sortOrder) queryParams.append("sort", sortOrder);

    fetchFeedbacks(`?${queryParams.toString()}`)
      .then((data) => {
        setFeedbacks(data); // backend already returns data.feedback
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedRating, sortOrder]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            User Feedback
          </h1>
          <p className="text-muted-foreground mt-2">
            Reviews and comments from your customers
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-secondary/30 border">
          
          {/* Rating Filter */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Rating:</span>

            <button
              className={`px-3 py-1 rounded-md border text-sm ${
                selectedRating === null ? "bg-primary text-white" : "bg-background"
              }`}
              onClick={() => setSelectedRating(null)}
            >
              All
            </button>

            {[5, 4, 3, 2, 1].map((stars) => (
              <button
                key={stars}
                className={`px-3 py-1 rounded-md border text-sm flex items-center gap-1 ${
                  selectedRating === stars ? "bg-primary text-white" : "bg-background"
                }`}
                onClick={() => setSelectedRating(stars)}
              >
                {stars}
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              </button>
            ))}
          </div>

          {/* Sort Order */}
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

        {/* Feedback List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading feedback...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-500">{error}</div>
          ) : feedbacks.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No feedback found.
            </div>
          ) : (
            feedbacks.map((feedback) => (
              <Card
                key={feedback.id}
                className="glass-card p-6 shadow-soft hover:shadow-glow transition-all"
              >
                <div className="flex items-start justify-between">
                  
                  <div className="flex-1 space-y-3">

                    {/* User */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-white font-bold">
                        {feedback.user_name?.charAt(0) ?? "?"}
                      </div>

                      <div>
                        <p className="font-semibold text-foreground">
                          {feedback.user_name ?? "Anonymous"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {feedback.created_at?.slice(0, 10)}
                        </p>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < (feedback.rating || 0)
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    <p className="text-foreground">{feedback.comment}</p>
                  </div>

                  <Badge className="bg-secondary text-secondary-foreground">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Reviewed
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Feedback;
