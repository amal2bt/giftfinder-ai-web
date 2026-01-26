import { DashboardLayout } from "@/components/DashboardLayout";
import OrdersTab from "@/components/OrdersTab";

const Orders = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            Orders
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage all orders from users
          </p>
        </div>

        <OrdersTab />
      </div>
    </DashboardLayout>
  );
};

export default Orders;











