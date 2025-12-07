'use client'
import { Profile } from "@/app/types/profile";
import { toggleUserStatus } from "@/app/admin/actions";
import { useState } from "react";

export function UserList({ users }: { users: Profile[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setLoadingId(id);
    try {
      await toggleUserStatus(id, !currentStatus);
    } catch (error) {
      alert('Error updating user status');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-900 border border-gray-800 text-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b border-gray-800 text-white text-left">Email</th>
            <th className="py-2 px-4 border-b border-gray-800 text-white text-left">Role</th>
            <th className="py-2 px-4 border-b border-gray-800 text-white text-left">Status</th>
            <th className="py-2 px-4 border-b border-gray-800 text-white text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-800">
              <td className="py-2 px-4 border-b border-gray-800">{user.email}</td>
              <td className="py-2 px-4 border-b border-gray-800">{user.role}</td>
              <td className="py-2 px-4 border-b border-gray-800">
                <span className={`px-2 py-1 rounded text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.is_active ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td className="py-2 px-4 border-b border-gray-800">
                <button 
                  onClick={() => handleToggle(user.id, user.is_active)}
                  disabled={loadingId === user.id}
                  className={`text-sm ${user.is_active ? 'text-red-600' : 'text-green-600'} hover:underline`}
                >
                  {loadingId === user.id ? '...' : (user.is_active ? 'Disable' : 'Enable')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
