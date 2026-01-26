import { useState, useEffect } from "react";
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
import { Search, Package, Eye, Calendar, User, MapPin, CreditCard, Loader2, Truck, Phone, Building, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ordersApi, type Order, deliveryApi, type DeliveryWorker, type DeliveryAssignment } from "@/services/api";

const OrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveryWorkers, setDeliveryWorkers] = useState<DeliveryWorker[]>([]);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    try {
      const [workersRes, assignmentsRes] = await Promise.all([
        deliveryApi.getWorkers(),
        deliveryApi.getAllAssignments(),
      ]);
      setDeliveryWorkers(workersRes.workers || []);
      setAssignments(assignmentsRes.assignments || []);
    } catch (error: any) {
      console.error('Error fetching delivery data:', error);
    }
  };

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      // Fetch all orders (admin view)
      const data = await ordersApi.list(true);
      setOrders(data);
    } catch (error: any) {
      toast({
        title: "Failed to load orders",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by search query (order ID, user info, or items)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderId = order.id.toString();
        const userInfo = order.user
          ? `${order.user.username} ${order.user.email}`.toLowerCase()
          : "";
        const hasMatchingItem = order.items?.some(
          (item) => item.gifts?.name.toLowerCase().includes(query)
        );
        return (
          orderId.includes(query) ||
          userInfo.includes(query) ||
          hasMatchingItem
        );
      });
    }

    setFilteredOrders(filtered);
  };

  const handleViewOrder = async (orderId: number) => {
    try {
      const order = await ordersApi.getById(orderId);
      setSelectedOrder(order);
      setIsDialogOpen(true);
      // Refresh delivery data to get latest assignments
      await fetchDeliveryData();
    } catch (error: any) {
      toast({
        title: "Failed to load order details",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const getOrderAssignment = (orderId: number): DeliveryAssignment | undefined => {
    return assignments.find(a => a.order_id === orderId);
  };

  const handleAssignDelivery = async () => {
    if (!selectedOrder || !selectedWorkerId) {
      toast({
        title: "Error",
        description: "Please select a delivery worker",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);
    try {
      await deliveryApi.assignOrder(selectedOrder.id, selectedWorkerId);
      toast({
        title: "Success",
        description: `Order assigned to delivery worker successfully`,
      });
      setIsAssignDialogOpen(false);
      setSelectedWorkerId("");
      await fetchDeliveryData();
      await fetchOrders();
      // Refresh order details
      if (selectedOrder) {
        const updatedOrder = await ordersApi.getById(selectedOrder.id);
        setSelectedOrder(updatedOrder);
      }
    } catch (error: any) {
      toast({
        title: "Failed to assign order",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: Order['status']) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast({
        title: "Order status updated",
        description: `Order #${orderId} status changed to ${newStatus}`,
      });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "processing":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "shipped":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300";
      case "delivered":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "cancelled":
        return "bg-red-500/20 text-red-700 dark:text-red-300";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getPaymentStatusColor = (status: Order['payment_status']) => {
    switch (status) {
      case "paid":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "failed":
        return "bg-red-500/20 text-red-700 dark:text-red-300";
      case "refunded":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search orders by ID, user, or item..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="glass-card p-12 shadow-soft text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No orders found
          </h3>
          <p className="text-sm text-muted-foreground">
            {orders.length === 0
              ? "No orders have been placed yet."
              : "No orders match your search criteria."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="glass-card p-6 shadow-soft hover:shadow-glow transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-white font-bold">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Order #{order.id}
                      </h3>
                      {order.user && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.user.username} ({order.user.email})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(parseFloat(order.total_amount.toString()))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Items</p>
                      <p className="font-semibold text-foreground">
                        {order.items?.length || 0} item(s)
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Date
                      </p>
                      <p className="font-semibold text-foreground text-xs">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment</p>
                      <Badge className={getPaymentStatusColor(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    {order.needs_delivery && (
                      <>
                        <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Delivery Required
                        </Badge>
                        {getOrderAssignment(order.id) && (
                          <Badge className={`${
                            getOrderAssignment(order.id)?.delivery_status === 'delivered' 
                              ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                              : getOrderAssignment(order.id)?.delivery_status === 'in_transit'
                              ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                              : 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                          } flex items-center gap-1`}>
                            <Truck className="h-3 w-3" />
                            {getOrderAssignment(order.id)?.delivery_status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        )}
                      </>
                    )}
                    {!order.needs_delivery && (
                      <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-300">
                        Pickup Only
                      </Badge>
                    )}
                    {order.shipping_address && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {order.shipping_address.substring(0, 30)}...
                      </span>
                    )}
                    {order.payment_method && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {order.payment_method}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewOrder(order.id)}
                    className="w-full lg:w-auto"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  {order.status !== "delivered" && order.status !== "cancelled" && (
                    <Select
                      value={order.status}
                      onValueChange={(value) =>
                        handleUpdateStatus(order.id, value as Order['status'])
                      }
                    >
                      <SelectTrigger className="w-full lg:w-[150px] bg-card/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id} Details</DialogTitle>
            <DialogDescription>
              Complete order information and items
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-secondary/30">
                  <p className="text-sm text-muted-foreground">Order Status</p>
                  <Badge className={`mt-2 ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </Badge>
                </Card>
                <Card className="p-4 bg-secondary/30">
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge className={`mt-2 ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                    {selectedOrder.payment_status}
                  </Badge>
                </Card>
                <Card className="p-4 bg-secondary/30">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold text-foreground mt-2">
                    {formatCurrency(parseFloat(selectedOrder.total_amount.toString()))}
                  </p>
                </Card>
                <Card className="p-4 bg-secondary/30">
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="text-foreground mt-2">
                    {selectedOrder.payment_method || "N/A"}
                  </p>
                </Card>
              </div>

              {/* User Info */}
              {selectedOrder.user && (
                <Card className="p-4 bg-secondary/30">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Username:</span>{" "}
                      <span className="font-medium text-foreground">
                        {selectedOrder.user.username}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="font-medium text-foreground">
                        {selectedOrder.user.email}
                      </span>
                    </p>
                  </div>
                </Card>
              )}

              {/* Delivery Information */}
              <Card className="p-4 bg-secondary/30">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Delivery Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Delivery Required:</span>
                    <Badge className={selectedOrder.needs_delivery ? "bg-blue-500/20 text-blue-700 dark:text-blue-300" : "bg-gray-500/20 text-gray-700 dark:text-gray-300"}>
                      {selectedOrder.needs_delivery ? "Yes" : "No (Pickup Only)"}
                    </Badge>
                  </div>
                  {selectedOrder.needs_delivery && (
                    <>
                      {selectedOrder.delivery_address && (
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1 mb-1">
                            <MapPin className="h-3 w-3" />
                            Delivery Address:
                          </p>
                          <p className="text-foreground ml-5">
                            {selectedOrder.delivery_address}
                          </p>
                        </div>
                      )}
                      {selectedOrder.delivery_phone && (
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1 mb-1">
                            <Phone className="h-3 w-3" />
                            Phone Number:
                          </p>
                          <p className="text-foreground ml-5">
                            {selectedOrder.delivery_phone}
                          </p>
                        </div>
                      )}
                      {selectedOrder.house_name && (
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1 mb-1">
                            <Building className="h-3 w-3" />
                            House/Building Name:
                          </p>
                          <p className="text-foreground ml-5">
                            {selectedOrder.house_name}
                          </p>
                        </div>
                      )}
                      {selectedOrder.floor && (
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1 mb-1">
                            Floor:
                          </p>
                          <p className="text-foreground ml-5">
                            {selectedOrder.floor}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>

              {/* Delivery Assignment Section */}
              {selectedOrder.needs_delivery && (
                <Card className="p-4 bg-secondary/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Delivery Assignment
                    </h4>
                    {!getOrderAssignment(selectedOrder.id) && (
                      <Button
                        size="sm"
                        onClick={() => setIsAssignDialogOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign Delivery Worker
                      </Button>
                    )}
                  </div>
                  {getOrderAssignment(selectedOrder.id) ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Assigned To:</span>
                        <span className="font-medium text-foreground">
                          {assignments.find(a => a.order_id === selectedOrder.id)?.worker?.username || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Delivery Status:</span>
                        <Badge className={`${
                          getOrderAssignment(selectedOrder.id)?.delivery_status === 'delivered'
                            ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                            : getOrderAssignment(selectedOrder.id)?.delivery_status === 'in_transit'
                            ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                            : 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                        }`}>
                          {getOrderAssignment(selectedOrder.id)?.delivery_status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {getOrderAssignment(selectedOrder.id)?.assigned_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Assigned At:</span>
                          <span className="text-foreground">
                            {formatDate(getOrderAssignment(selectedOrder.id)!.assigned_at)}
                          </span>
                        </div>
                      )}
                      {getOrderAssignment(selectedOrder.id)?.started_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Started At:</span>
                          <span className="text-foreground">
                            {formatDate(getOrderAssignment(selectedOrder.id)!.started_at)}
                          </span>
                        </div>
                      )}
                      {getOrderAssignment(selectedOrder.id)?.delivered_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Delivered At:</span>
                          <span className="text-foreground">
                            {formatDate(getOrderAssignment(selectedOrder.id)!.delivered_at)}
                          </span>
                        </div>
                      )}
                      {getOrderAssignment(selectedOrder.id)?.driver_feedback && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-muted-foreground mb-1">Driver Feedback:</p>
                          <p className="text-foreground italic">
                            {getOrderAssignment(selectedOrder.id)?.driver_feedback}
                          </p>
                        </div>
                      )}
                      {getOrderAssignment(selectedOrder.id)?.client_feedback && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-muted-foreground mb-1 flex items-center gap-1">
                            <span>Client Feedback:</span>
                            <span className="text-primary">❤️</span>
                          </p>
                          <p className="text-foreground italic">
                            {getOrderAssignment(selectedOrder.id)?.client_feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No delivery worker assigned yet. Click "Assign Delivery Worker" to assign one.
                    </p>
                  )}
                </Card>
              )}

              {/* Shipping Address (Legacy field - keep for backward compatibility) */}
              {selectedOrder.shipping_address && !selectedOrder.needs_delivery && (
                <Card className="p-4 bg-secondary/30">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <p className="text-sm text-foreground">
                    {selectedOrder.shipping_address}
                  </p>
                </Card>
              )}

              {/* Order Items */}
              <Card className="p-4 bg-secondary/30">
                <h4 className="font-semibold text-foreground mb-4">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
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
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No items found for this order.
                    </p>
                  )}
                </div>
              </Card>

              {/* Order Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Created At</p>
                  <p className="text-foreground">
                    {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="text-foreground">
                    {formatDate(selectedOrder.updated_at)}
                  </p>
                </div>
              </div>

              {/* Update Status */}
              {selectedOrder.status !== "delivered" &&
                selectedOrder.status !== "cancelled" && (
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <span className="text-sm font-medium text-foreground">
                      Update Status:
                    </span>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) =>
                        handleUpdateStatus(selectedOrder.id, value as Order['status'])
                      }
                    >
                      <SelectTrigger className="w-[200px] bg-card/50 border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Worker Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Worker</DialogTitle>
            <DialogDescription>
              Select a delivery worker to assign Order #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deliveryWorkers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No delivery workers available. Please create delivery workers first.
              </p>
            ) : (
              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a delivery worker" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryWorkers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.username} ({worker.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAssignDialogOpen(false);
                  setSelectedWorkerId("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignDelivery}
                disabled={!selectedWorkerId || isAssigning || deliveryWorkers.length === 0}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersTab;












