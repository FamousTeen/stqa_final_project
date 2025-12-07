'use client'
import { Concert } from "@/app/types/concert";
import { deleteConcert } from "@/app/admin/actions";
import Link from "next/link";

export function ConcertList({ concerts }: { concerts: Concert[] }) {
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      try {
        await deleteConcert(id);
      } catch (error) {
        if (error instanceof Error) {
            alert(error.message || "Failed to delete concert");
        } else {
            alert("Failed to delete concert");
        }
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-900 border border-gray-800 text-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b border-gray-800 text-left text-white">Title</th>
            <th className="py-2 px-4 border-b border-gray-800 text-left text-white">Start Date</th>
            <th className="py-2 px-4 border-b border-gray-800 text-left text-white">Location</th>
            <th className="py-2 px-4 border-b border-gray-800 text-left text-white">Price</th>
            <th className="py-2 px-4 border-b border-gray-800 text-left text-white">Status</th>
            <th className="py-2 px-4 border-b border-gray-800 text-left text-white">Actions</th>
          </tr>
        </thead>
        <tbody>
          {concerts.map((concert) => (
            <tr key={concert.id} className="hover:bg-gray-800">
              <td className="py-2 px-4 border-b border-gray-800">{concert.title}</td>
              <td className="py-2 px-4 border-b border-gray-800">
                {new Date(concert.start_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </td>
              <td className="py-2 px-4 border-b border-gray-800">{concert.location}</td>
              <td className="py-2 px-4 border-b border-gray-800">{concert.price}</td>
              <td className="py-2 px-4 border-b border-gray-800">
                {concert.published ? <span className="text-green-400">Published</span> : <span className="text-gray-500">Draft</span>}
                {concert.featured && <span className="ml-2 text-blue-400 text-xs border border-blue-400 px-1 rounded">Featured</span>}
              </td>
              <td className="py-2 px-4 border-b border-gray-800 space-x-2">
                <Link href={`/admin/concerts/${concert.id}`} className="text-blue-400 hover:underline">Edit</Link>
                <button onClick={() => handleDelete(concert.id)} className="text-red-400 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
