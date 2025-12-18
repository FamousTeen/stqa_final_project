'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { supabaseServer } from "@/app/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import { Concert } from "@/app/types/concert";
import { Profile } from "@/app/types/profile";
import { Order } from "@/app/types/order";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error("Unauthorized");
  }
  return session;
}

// Concerts
export async function getConcerts() {
  await checkAdmin();
  const { data, error } = await supabaseServer.from('concerts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Concert[];
}

export async function createConcert(concert: Omit<Concert, 'id' | 'created_at'>) {
  await checkAdmin();
  const { error } = await supabaseServer.from('concerts').insert(concert);
  if (error) throw error;
  revalidatePath('/admin/concerts');
}

export async function updateConcert(id: string, concert: Partial<Concert>) {
  await checkAdmin();
  const { error } = await supabaseServer.from('concerts').update(concert).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/concerts');
}

export async function deleteConcert(id: string) {
  await checkAdmin();

  // 1. Check for any orders that are NOT cancelled
  const { data: activeOrders, error: checkError } = await supabaseServer
    .from('orders')
    .select('id')
    .eq('concert_id', id)
    .neq('status', 'cancelled')
    .limit(1);

  if (checkError) throw checkError;

  if (activeOrders && activeOrders.length > 0) {
    throw new Error("Cannot delete concert. There are active (non-cancelled) orders.");
  }

  // 2. Delete cancelled orders first (to satisfy FK constraint)
  const { error: deleteOrdersError } = await supabaseServer
    .from('orders')
    .delete()
    .eq('concert_id', id);

  if (deleteOrdersError) throw deleteOrdersError;

  // 3. Delete the concert
  const { error } = await supabaseServer.from('concerts').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
        throw new Error("Cannot delete concert because it has existing orders.");
    }
    throw error;
  }
  revalidatePath('/admin/concerts');
}

export async function getConcert(id: string) {
    await checkAdmin();
    const { data, error } = await supabaseServer.from('concerts').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Concert;
}

export async function uploadImage(formData: FormData) {
  await checkAdmin();
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file uploaded');

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Convert File to ArrayBuffer for Supabase upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabaseServer.storage
    .from('concerts')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabaseServer.storage
    .from('concerts')
    .getPublicUrl(filePath);

  return publicUrl;
}

// Users
export async function getUsers() {
  await checkAdmin();
  const { data, error } = await supabaseServer.from('profiles').select('*').eq('role', 'user').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Profile[];
}

export async function toggleUserStatus(id: string, isActive: boolean) {
  await checkAdmin();
  const { error } = await supabaseServer.from('profiles').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/users');
}

// Orders
export async function getOrders() {
  await checkAdmin();
  const { data, error } = await supabaseServer.from('orders').select('*, concerts(*), profiles(email)').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function updateOrderStatus(id: string, newStatus: string) {
  await checkAdmin();
  
  // Get current order status
  const { data: order, error: fetchError } = await supabaseServer
    .from('orders')
    .select('status')
    .eq('id', id)
    .single();
  
  if (fetchError) throw fetchError;
  if (!order) throw new Error('Order not found');
  
  const currentStatus = order.status;
  
  // Validate status transition
  const allowedTransitions: Record<string, string[]> = {
    'pending': ['pending', 'success', 'cancelled'],
    'success': ['success', 'cancelled'], // Cannot go back to pending
    'cancelled': ['cancelled'], // Cannot change once cancelled
  };
  
  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot change status from "${currentStatus}" to "${newStatus}"`);
  }
  
  const { error } = await supabaseServer.from('orders').update({ status: newStatus }).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/orders');
}
