"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";
import { useParams } from "next/navigation";
import { Order } from "../../types/order";

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function loadOrder() {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        total_price,
        status,
        qty,
        created_at,
        concerts (
          title,
          location,
          start_at
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Load order error:", error);
      setLoading(false);
      return;
    }

    console.log("DATA SUPABASE:", data);

    const rawConcert = Array.isArray(data.concerts) ? data.concerts[0] : data.concerts;
    const concert = rawConcert ?? {
      title: "",
      location: "",
      start_at: "",
    };

    const formatted: Order = {
      id: data.id,
      total_price: data.total_price,
      status: data.status,
      qty: data.qty,
      created_at: data.created_at,
      concerts: {
        title: concert?.title ?? "",
        location: concert?.location ?? "",
        start_at: concert?.start_at ?? "",
      },
    };

    setOrder(formatted);
    setLoading(false);
  }

  loadOrder();
}, [id]);


  if (loading) return <Layout title="loading">Loading...</Layout>;
  if (!order) return <Layout title="not-found">Order not found</Layout>;

  const concert = order.concerts;

  const items = [
    {
      ticket_type_name: "Basic Ticket",
      quantity: order.qty,
      event: {
        title: concert.title,
        venue: concert.location,
        date: concert.start_at,
      },
    },
  ];

  return (
    <Layout title="ticket-details">
      <div className="min-h-screen bg-linear-to-b from-[#0A0F29] via-[#0a1138] to-[#010314] text-white py-16 px-6">
        <div className="max-w-4xl my-4 mx-auto">
          <h1 className="text-4xl font-bold mb-8">
            Ticket Order #{order.id}
          </h1>

          <div className="bg-[#0F1F45]/50 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-2 text-gray-300">
              <p>
                <span className="font-semibold text-indigo-300">Total:</span>{" "}
                Rp {order.total_price.toLocaleString("id-ID")}
              </p>

              <p>
                <span className="font-semibold text-indigo-300">Status:</span>{" "}
                <span className="capitalize">{order.status}</span>
              </p>

              <p>
                <span className="font-semibold text-indigo-300">Date:</span>{" "}
                {new Date(order.created_at).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="mt-6 space-y-1 text-gray-300">
              <p>
                <span className="font-semibold text-indigo-300">Event:</span>{" "}
                {items[0].event.title}
              </p>
              <p>
                <span className="font-semibold text-indigo-300">Venue:</span>{" "}
                {items[0].event.venue}
              </p>
              <p>
                <span className="font-semibold text-indigo-300">Event Date:</span>{" "}
                {new Date(items[0].event.date).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <hr className="my-6 border-white/10" />

            <h2 className="text-2xl font-semibold mb-4">Your Tickets</h2>

            {items.map((item, index) => {
              const ticketData = {
                order_id: order.id,
                ticket_type: item.ticket_type_name,
                quantity: item.quantity,
                event: item.event.title,
                venue: item.event.venue,
                date: item.event.date,
              };

              return (
                <div
                  key={index}
                  className="bg-[#0A1530] p-6 rounded-xl border border-white/10 shadow-lg 
                  flex flex-col lg:flex-row lg:items-center gap-6 mb-6"
                >
                  <div className="flex justify-center items-center bg-[#0F1F45] p-4 rounded-xl border border-white/10">
                    <QRCodeSVG value={JSON.stringify(ticketData)} size={180} />
                  </div>

                  <div className="text-gray-300 space-y-1">
                    <p>
                      <span className="text-indigo-300 font-semibold">Ticket Type:</span>{" "}
                      {item.ticket_type_name}
                    </p>
                    <p>
                      <span className="text-indigo-300 font-semibold">Quantity:</span>{" "}
                      {item.quantity}
                    </p>
                    <p>
                      <span className="text-indigo-300 font-semibold">Event:</span>{" "}
                      {item.event.title}
                    </p>
                    <p>
                      <span className="text-indigo-300 font-semibold">Venue:</span>{" "}
                      {item.event.venue}
                    </p>
                    <p>
                      <span className="text-indigo-300 font-semibold">Date:</span>{" "}
                      {new Date(item.event.date).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
