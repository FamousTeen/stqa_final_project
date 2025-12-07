'use client'
import { Order } from "@/app/types/order";
import { updateOrderStatus } from "@/app/admin/actions";
import { useState } from "react";

export function OrderList({ orders }: { orders: Order[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    setLoadingId(id);
    try {
      await updateOrderStatus(id, status);
    } catch (error) {
      alert('Error updating order status');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-900 border border-gray-800 text-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b border-gray-800 text-white text-left">Order ID</th>
            <th className="py-2 px-4 border-b border-gray-800 text-white text-left">User</th>
            <th className="py-2 px-4 border-b border-gray-800 text-white text-left">Concert</th>
            <th className="py-2 px-4 border-b border-gray-800 text-white text-left">Quantity</th>
            <th className="py-2 px-4 border-b border-gray-800 text-white text-left">Total Price</th>
            <th className="py-2 px-4 border-b border-gray-800 text-white text-left">Status</th>
            <th className="py-2 px-4 border-b border-gray-800 text-white text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-800">
              <td className="py-2 px-4 border-b border-gray-800 text-xs text-white">{order.id}</td>
              <td className="py-2 px-4 border-b border-gray-800 text-white">{order.profiles?.email}</td>
              <td className="py-2 px-4 border-b border-gray-800 text-white">{order.concerts?.title}</td>
              <td className="py-2 px-4 border-b border-gray-800 text-white">{order.quantity}</td>
              <td className="py-2 px-4 border-b border-gray-800 text-white">{order.total_price}</td>
              <td className="py-2 px-4 border-b border-gray-800 text-white">
                <select 
                  value={order.status} 
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  disabled={loadingId === order.id}
                  className="border rounded p-1 bg-gray-900 border border-gray-800 text-gray-300"
                >
                  <option value="pending">Pending</option>
                  <option value="success">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td className="py-2 px-4 border-b border-gray-800 text-white">{new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
