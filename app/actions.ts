'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { supabaseServer } from "@/app/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function createOrderAction(concertId: string, quantity: number) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const userId = session.user.id;

  // 1. Get Concert Details (for price and current availability)
  const { data: concert, error: concertError } = await supabaseServer
    .from("concerts")
    .select("*")
    .eq("id", concertId)
    .single();

  if (concertError || !concert) {
    throw new Error("Concert not found");
  }

  if (concert.available_tickets < quantity) {
    throw new Error("Not enough tickets available");
  }

  const totalPrice = concert.price * quantity;

  // 2. Create Order
  const { data: order, error: orderError } = await supabaseServer
    .from("orders")
    .insert({
      user_id: userId,
      concert_id: concertId,
      quantity: quantity,
      total_price: totalPrice,
      status: "success",
    })
    .select()
    .single();

  if (orderError) {
    console.error("Order creation failed:", orderError);
    throw new Error("Failed to create order");
  }

  // 3. Update Concert Availability
  const { error: updateError } = await supabaseServer
    .from("concerts")
    .update({ available_tickets: concert.available_tickets - quantity })
    .eq("id", concertId);

  if (updateError) {
    console.error("Failed to update ticket count:", updateError);
    // Ideally we should rollback the order here, but for now we throw
    throw new Error("Failed to update ticket count");
  }

  revalidatePath(`/events/${concertId}`);
  revalidatePath('/tickets');
  
  return order;
}
