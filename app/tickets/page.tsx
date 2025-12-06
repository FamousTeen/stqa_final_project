"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "./../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { Order } from "../types/order";
import { useRouter } from "next/navigation";

export default function TicketsPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace(`/auth/login?redirect=/tickets`);
        return;
      }

      setAuthChecked(true);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    const fetchOrders = async () => {
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
        );

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted: Order[] = data.map((item: any) => {
        const concert = Array.isArray(item.concerts)
          ? item.concerts[0]
          : null;

        return {
          id: item.id,
          total_price: item.total_price,
          status: item.status,
          qty: item.qty ?? 0,
          created_at: item.created_at,
          concerts: {
            title: concert?.title ?? "",
            location: concert?.location ?? "",
            start_at: concert?.start_at ?? "",
          },
        };
      });

      setOrders(formatted);
      setLoading(false);
    };

    fetchOrders();
  }, [authChecked]);

  if (!authChecked) {
    return (
      <Layout title="checking-auth">
        <div className="min-h-screen flex justify-center items-center text-gray-300">
          Checking authentication...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="home-page">
      <div className="min-h-screen bg-linear-to-b from-[#0A0F29] via-[#0a1138] to-[#010314] text-white py-16 px-6">
        <div className="max-w-5xl my-4 mx-auto">
          <h1 className="text-4xl font-bold mb-8">My Tickets</h1>

          {loading && (
            <div className="text-gray-300 text-center py-10">Loading...</div>
          )}

          {!loading && orders.length > 0 && (
            <>
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#0F1F45]/50 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg mb-6"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="text-lg font-semibold text-indigo-300">
                        Order #{order.id}
                      </div>

                      <div className="mt-1 text-gray-300">
                        <span className="font-semibold">Total:</span>{" "}
                        Rp {order.total_price.toLocaleString("id-ID")}
                      </div>

                      <div className="text-sm text-gray-400 mt-2 leading-relaxed">
                        Status:{" "}
                        <span className="capitalize">{order.status}</span>
                        <br />
                        {new Date(order.created_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className="min-w-[150px]">
                      <Link
                        href={`/tickets/${order.id}`}
                        className="block w-full text-center px-4 py-3 rounded-xl font-semibold border border-indigo-400 text-indigo-300 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition"
                      >
                        View Ticket →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && orders.length === 0 && (
            <div className="bg-[#0F1F45]/40 backdrop-blur-xl p-6 rounded-xl border border-white/10 text-center mt-10">
              <p className="text-gray-300 text-lg">Kamu belum memiliki tiket.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
