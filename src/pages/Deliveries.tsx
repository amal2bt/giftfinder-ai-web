import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Truck, Package, User, MapPin, Phone, Calendar, Loader2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deliveryApi, type DeliveryAssignment } from "@/services/api";

const Deliveries = () => {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<DeliveryAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [assignments, searchQuery, statusFilter]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const data = await deliveryApi.getAllAssignments();
      setAssignments(data.assignments || []);
    } catch (error: any) {
      toast({
        title: "Failed to load deliveries",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAssignments = () => {
    let filtered = [...assignments];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((assignment) => assignment.delivery_status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((assignment) => {
        const orderId = assignment.order_id.toString();
        const workerName = assignment.worker?.username?.toLowerCase() || "";
        const workerEmail = assignment.worker?.email?.toLowerCase() || "";
        const customerName = assignment.order?.user?.username?.toLowerCase() || "";
        return (
          orderId.includes(query) ||
          workerName.includes(query) ||
          workerEmail.includes(query) ||
          customerName.includes(query)
        );
      });
    }

    setFilteredAssignments(filtered);
  };

  const handleViewAssignment = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: DeliveryAssignment['delivery_status']) => {
    switch (status) {
      case "assigned":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "in_transit":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "delivered":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "failed":
        return "bg-red-500/20 text-red-700 dark:text-red-300";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            Deliveries
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all delivery assignments
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, worker, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-card/50 border-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <Card className="glass-card p-12 shadow-soft text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No deliveries found
            </h3>
            <p className="text-sm text-muted-foreground">
              {assignments.length === 0
                ? "No delivery assignments have been created yet."
                : "No deliveries match your search criteria."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="glass-card p-6 shadow-soft hover:shadow-glow transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-white font-bold">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          Order #{assignment.order_id}
                        </h3>
                        {assignment.worker && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {assignment.worker.username} ({assignment.worker.email})
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(parseFloat(assignment.order.total_amount.toString()))}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Assigned
                        </p>
                        <p className="font-semibold text-foreground text-xs">
                          {formatDate(assignment.assigned_at)}
                        </p>
                      </div>
                      {assignment.started_at && (
                        <div>
                          <p className="text-muted-foreground">Started</p>
                          <p className="font-semibold text-foreground text-xs">
                            {formatDate(assignment.started_at)}
                          </p>
                        </div>
                      )}
                      {assignment.delivered_at && (
                        <div>
                          <p className="text-muted-foreground">Delivered</p>
                          <p className="font-semibold text-foreground text-xs">
                            {formatDate(assignment.delivered_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getStatusColor(assignment.delivery_status)}>
                        {assignment.delivery_status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {assignment.order.delivery_address && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {assignment.order.delivery_address.substring(0, 30)}...
                        </span>
                      )}
                      {assignment.order.delivery_phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {assignment.order.delivery_phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAssignment(assignment)}
                      className="w-full lg:w-auto"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Assignment Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Delivery Assignment #{selectedAssignment?.id} Details</DialogTitle>
              <DialogDescription>
                Complete delivery information and status
              </DialogDescription>
            </DialogHeader>

            {selectedAssignment && (
              <div className="space-y-6">
                {/* Assignment Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-secondary/30">
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="text-lg font-bold text-foreground mt-2">
                      #{selectedAssignment.order_id}
                    </p>
                  </Card>
                  <Card className="p-4 bg-secondary/30">
                    <p className="text-sm text-muted-foreground">Delivery Status</p>
                    <Badge className={`mt-2 ${getStatusColor(selectedAssignment.delivery_status)}`}>
                      {selectedAssignment.delivery_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </Card>
                  <Card className="p-4 bg-secondary/30">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-bold text-foreground mt-2">
                      {formatCurrency(parseFloat(selectedAssignment.order.total_amount.toString()))}
                    </p>
                  </Card>
                  <Card className="p-4 bg-secondary/30">
                    <p className="text-sm text-muted-foreground">Assigned At</p>
                    <p className="text-foreground mt-2">
                      {formatDate(selectedAssignment.assigned_at)}
                    </p>
                  </Card>
                </div>

                {/* Delivery Worker Info */}
                {selectedAssignment.worker && (
                  <Card className="p-4 bg-secondary/30">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Delivery Worker
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Name:</span>{" "}
                        <span className="font-medium text-foreground">
                          {selectedAssignment.worker.username}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Email:</span>{" "}
                        <span className="font-medium text-foreground">
                          {selectedAssignment.worker.email}
                        </span>
                      </p>
                    </div>
                  </Card>
                )}

                {/* Customer Info */}
                {selectedAssignment.order.user && (
                  <Card className="p-4 bg-secondary/30">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Username:</span>{" "}
                        <span className="font-medium text-foreground">
                          {selectedAssignment.order.user.username}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Email:</span>{" "}
                        <span className="font-medium text-foreground">
                          {selectedAssignment.order.user.email}
                        </span>
                      </p>
                    </div>
                  </Card>
                )}

                {/* Delivery Address */}
                <Card className="p-4 bg-secondary/30">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedAssignment.order.delivery_address && (
                      <p className="text-foreground">
                        {selectedAssignment.order.delivery_address}
                      </p>
                    )}
                    {selectedAssignment.order.house_name && (
                      <p className="text-foreground">
                        <span className="text-muted-foreground">House/Building:</span>{" "}
                        {selectedAssignment.order.house_name}
                      </p>
                    )}
                    {selectedAssignment.order.floor && (
                      <p className="text-foreground">
                        <span className="text-muted-foreground">Floor:</span>{" "}
                        {selectedAssignment.order.floor}
                      </p>
                    )}
                    {selectedAssignment.order.delivery_phone && (
                      <div className="flex items-center gap-2 mt-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-foreground">{selectedAssignment.order.delivery_phone}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Timeline */}
                <Card className="p-4 bg-secondary/30">
                  <h4 className="font-semibold text-foreground mb-3">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Assigned:</span>
                      <span className="text-foreground">{formatDate(selectedAssignment.assigned_at)}</span>
                    </div>
                    {selectedAssignment.started_at && (
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Started:</span>
                        <span className="text-foreground">{formatDate(selectedAssignment.started_at)}</span>
                      </div>
                    )}
                    {selectedAssignment.delivered_at && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">Delivered:</span>
                        <span className="text-foreground">{formatDate(selectedAssignment.delivered_at)}</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Feedback */}
                {(selectedAssignment.driver_feedback || selectedAssignment.client_feedback) && (
                  <Card className="p-4 bg-secondary/30">
                    <h4 className="font-semibold text-foreground mb-3">Feedback</h4>
                    <div className="space-y-3">
                      {selectedAssignment.driver_feedback && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Driver Feedback:</p>
                          <p className="text-sm text-foreground italic bg-background/50 p-3 rounded">
                            {selectedAssignment.driver_feedback}
                          </p>
                        </div>
                      )}
                      {selectedAssignment.client_feedback && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                            <span>Client Feedback:</span>
                            <span className="text-primary">❤️</span>
                          </p>
                          <p className="text-sm text-foreground italic bg-background/50 p-3 rounded">
                            {selectedAssignment.client_feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Order Items */}
                {selectedAssignment.order.items && selectedAssignment.order.items.length > 0 && (
                  <Card className="p-4 bg-secondary/30">
                    <h4 className="font-semibold text-foreground mb-4">Order Items</h4>
                    <div className="space-y-3">
                      {selectedAssignment.order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-3 rounded-lg bg-background/50"
                        >
                          <div className="flex-1">
                            <h5 className="font-medium text-foreground">
                              {item.gifts?.name || `Gift #${item.gift_id}`}
                            </h5>
                            {item.gifts?.category && (
                              <p className="text-xs text-muted-foreground">
                                {item.gifts.category}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              Quantity: {item.quantity} ×{" "}
                              {formatCurrency(parseFloat(item.price.toString()))} ={" "}
                              <span className="font-semibold text-foreground">
                                {formatCurrency(parseFloat(item.subtotal.toString()))}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Deliveries;

