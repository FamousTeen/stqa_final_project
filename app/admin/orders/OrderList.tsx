'use client'
import { Order } from "@/app/types/order";
import { updateOrderStatus } from "@/app/admin/actions";
import { useState } from "react";

// Helper function to format date consistently (avoids hydration mismatch)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get allowed status transitions
function getAllowedStatuses(currentStatus: string): string[] {
  switch (currentStatus) {
    case 'pending':
      return ['pending', 'success', 'cancelled']; // Can go to paid or cancelled
    case 'success':
      return ['success', 'cancelled']; // Can only cancel, cannot go back to pending
    case 'cancelled':
      return ['cancelled']; // Cannot change once cancelled
    default:
      return ['pending', 'success', 'cancelled'];
  }
}

export function OrderList({ orders }: { orders: Order[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, currentStatus: string, newStatus: string) => {
    // Prevent invalid status transitions
    const allowed = getAllowedStatuses(currentStatus);
    if (!allowed.includes(newStatus)) {
      alert(`Cannot change status from "${currentStatus}" to "${newStatus}"`);
      return;
    }

    setLoadingId(id);
    try {
      await updateOrderStatus(id, newStatus);
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
          {orders.map((order) => {
            const allowedStatuses = getAllowedStatuses(order.status);
            return (
              <tr key={order.id} className="hover:bg-gray-800">
                <td className="py-2 px-4 border-b border-gray-800 text-xs text-white">{order.id}</td>
                <td className="py-2 px-4 border-b border-gray-800 text-white">{order.profiles?.email}</td>
                <td className="py-2 px-4 border-b border-gray-800 text-white">{order.concerts?.title}</td>
                <td className="py-2 px-4 border-b border-gray-800 text-white">{order.quantity}</td>
                <td className="py-2 px-4 border-b border-gray-800 text-white">{order.total_price}</td>
                <td className="py-2 px-4 border-b border-gray-800 text-white">
                  <select 
                    value={order.status} 
                    onChange={(e) => handleStatusChange(order.id, order.status, e.target.value)}
                    disabled={loadingId === order.id || allowedStatuses.length <= 1}
                    className="rounded p-1 bg-gray-900 border border-gray-800 text-gray-300 disabled:opacity-50"
                  >
                    <option value="pending" disabled={!allowedStatuses.includes('pending')}>Pending</option>
                    <option value="success" disabled={!allowedStatuses.includes('success')}>Paid</option>
                    <option value="cancelled" disabled={!allowedStatuses.includes('cancelled')}>Cancelled</option>
                  </select>
                </td>
                <td className="py-2 px-4 border-b border-gray-800 text-white">{formatDate(order.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
