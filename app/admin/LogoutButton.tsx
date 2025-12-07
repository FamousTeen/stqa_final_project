'use client'

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: '/auth/login' })}
      className="block w-full text-left py-2 px-4 hover:bg-gray-700 rounded text-red-400 mt-4"
    >
      Logout
    </button>
  );
}
