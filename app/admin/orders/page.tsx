import { getOrders } from "@/app/admin/actions";
import { OrderList } from "./OrderList";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <OrderList orders={orders} />
    </div>
  );
}
