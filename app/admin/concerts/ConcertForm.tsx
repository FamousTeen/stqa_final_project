'use client'
import { useState } from "react";
import { Concert } from "@/app/types/concert";
import { createConcert, updateConcert, uploadImage } from "@/app/admin/actions";
import { useRouter } from "next/navigation";

export function ConcertForm({ concert }: { concert?: Concert }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const total_tickets = Number(formData.get('total_tickets'));
    const available_tickets_input = formData.get('available_tickets');
    let available_tickets = total_tickets; // Default for create if not specified

    if (available_tickets_input !== null && available_tickets_input !== '') {
        available_tickets = Number(available_tickets_input);
    } else if (concert) {
        // If editing and left empty, keep existing logic or default to current available?
        // Let's assume if user clears it, they might mean 0 or reset. 
        // But since we default it in the input, it shouldn't be empty unless cleared.
        // If it is empty, let's default to total_tickets as a fallback.
        available_tickets = total_tickets;
    }
    
    // Handle Image Upload
    let imageUrl = formData.get('image_url_hidden') as string;
    const file = formData.get('image_file') as File;

    if (file && file.size > 0) {
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            imageUrl = await uploadImage(uploadFormData);
        } catch (err) {
            console.error("Image upload failed", err);
            alert("Image upload failed");
            setLoading(false);
            return;
        }
    }

    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      start_at: new Date(formData.get('start_at') as string).toISOString(),
      end_at: formData.get('end_at') ? new Date(formData.get('end_at') as string).toISOString() : null,
      location: formData.get('location') as string,
      price: Number(formData.get('price')),
      total_tickets: total_tickets,
      available_tickets: available_tickets, 
      image: imageUrl,
      featured: formData.get('featured') === 'on',
      published: formData.get('published') === 'on',
    };

    try {
      if (concert) {
        // Update logic
        await updateConcert(concert.id, data);
      } else {
        // Create logic
        await createConcert(data);
      }
      router.push('/admin/concerts');
    } catch (error) {
      alert('Error saving concert');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg bg-gray-900 p-6 rounded shadow border border-gray-800 text-white">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">Title</label>
        <input name="title" defaultValue={concert?.title} required className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
        <textarea name="description" defaultValue={concert?.description || ''} className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Start Date</label>
            <input type="datetime-local" name="start_at" defaultValue={concert?.start_at ? new Date(concert.start_at).toISOString().slice(0, 16) : ''} required className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>
        <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">End Date</label>
            <input type="datetime-local" name="end_at" defaultValue={concert?.end_at ? new Date(concert.end_at).toISOString().slice(0, 16) : ''} className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">Location</label>
        <input name="location" defaultValue={concert?.location} required className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">Price</label>
        <input type="number" name="price" defaultValue={concert?.price} required className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">Total Tickets</label>
        <input type="number" name="total_tickets" defaultValue={concert?.total_tickets} required className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">Available Tickets</label>
        <input 
            type="number" 
            name="available_tickets" 
            defaultValue={concert?.available_tickets ?? concert?.total_tickets} 
            placeholder="Leave empty to default to Total Tickets on create"
            className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
        />
        <p className="text-xs text-gray-500 mt-1">For restocking or manual adjustment.</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">Image</label>
        <input type="hidden" name="image_url_hidden" defaultValue={concert?.image || ''} />
        <input type="file" name="image_file" accept="image/*" className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
        {concert?.image && (
            <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">Current Image:</p>
                <img src={concert.image} alt="Current" className="h-20 w-auto rounded border border-gray-700" />
            </div>
        )}
      </div>
      <div className="flex space-x-4">
        <div className="flex items-center">
            <input type="checkbox" name="featured" defaultChecked={concert?.featured} className="mr-2 bg-gray-800 border-gray-700 rounded text-blue-600 focus:ring-blue-500" />
            <label className="text-sm font-medium text-gray-300">Featured</label>
        </div>
        <div className="flex items-center">
            <input type="checkbox" name="published" defaultChecked={concert?.published} className="mr-2 bg-gray-800 border-gray-700 rounded text-blue-600 focus:ring-blue-500" />
            <label className="text-sm font-medium text-gray-300">Published</label>
        </div>
      </div>
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50">
        {loading ? 'Saving...' : (concert ? 'Update Concert' : 'Create Concert')}
      </button>
    </form>
  );
}
