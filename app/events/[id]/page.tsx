"use client";

import { useEffect, useState, use } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";
import Image from "next/image";
import { Concert } from "../../types/concert";
import { useRouter } from "next/navigation";

type EventParams = {
  id: string;
};

export default function EventDetailPage({ params }: {params: Promise<EventParams> }) {
  const { id } = use <EventParams>(params);
  const [event, setEvent] = useState<Concert>();
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(0);

  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then((res) => {
      console.log("=== SESSION CHECK ===");
      console.log(res.data.session);
    });
  }, []);


  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace(`/auth/login?redirect=/events/${id}`);
        return;
      }

      setAuthChecked(true);
    };

    checkAuth();
  }, [router, id]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("concerts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setEvent(data);
      }
      setLoading(false);
    }

    fetchData();
  }, [id]);

  const handleCheckout = () => {
    if (qty <= 0) {
      alert("Pilih jumlah tiket dulu.");
      return;
    }

    createOrder();
  };

  const createOrder = async () => {
  if (!event) return;

  const total = qty * event.price;

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    alert("User tidak ditemukan. Silakan login ulang.");
    return;
  }

  const userId = session.user.id;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      concert_id: event.id,
      qty,
      total_price: total,
      status: "success",
    })
    .select()
    .single();

  if (error) {
    console.error("ORDER ERROR:", error);
    alert("Gagal membuat order.");
    return;
  }

  await supabase
    .from("concerts")
    .update({ qty: event.qty - qty })
    .eq("id", event.id);

  router.push(`/tickets/${order.id}`);
};


   if (!authChecked) {
    return (
      <Layout title="checking-auth">
        <div className="min-h-screen flex justify-center items-center text-gray-300">
          Checking authentication...
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="loading">
        <div className="min-h-screen flex justify-center items-center text-gray-300">
          Loading event details...
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout title="not-found">
        <div className="min-h-screen flex justify-center items-center text-red-400">
          Event not found.
        </div>
      </Layout>
    );
  }

  const imageSrc = event.image?.startsWith("http")
    ? event.image
    : "/" + event.image;

  return (
    <Layout title={event.title}>
      <div className="min-h-screen text-white">

        <section className="relative bg-linear-to-b from-[#0A0F29] via-[#0a1138] to-[#010314] py-20 px-6 shadow-lg">
          <div className="max-w-4xl mx-auto text-center">

            {event.image && (
              <div className="relative w-full h-64 mb-10 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src={imageSrc}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <h1 className="text-4xl md:text-5xl font-extrabold">
              {event.title}
            </h1>

            <p className="mt-5 text-gray-300 text-lg max-w-2xl mx-auto">
              {event.description}
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg mx-auto">

              <div className="bg-[#0F1530]/60 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-4 flex items-center space-x-3">
                <div className="text-indigo-400 text-sm font-semibold">Date</div>
                <div className="flex-1 text-gray-200">
                  {new Date(event.start_at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div className="bg-[#0F1530]/60 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-4 flex items-center space-x-3">
                <div className="text-indigo-400 text-sm font-semibold">Venue</div>
                <div className="flex-1 text-gray-200">{event.location}</div>
              </div>

            </div>
          </div>
        </section>

        <section className="bg-[#050718] px-6 py-16">
          <div className="max-w-5xl mx-auto">

            <h2 className="text-3xl font-bold mb-6">Available Ticket</h2>

            <div className="bg-[#101935] rounded-2xl p-6 border border-indigo-500/20 shadow-lg">

              <div className="flex items-center justify-between">

                <div>
                  <h4 className="text-xl font-semibold text-white">Basic Ticket</h4>

                  <p className="mt-1 text-sm text-gray-300">
                    Rp {event.price.toLocaleString("id-ID")}
                    <span className="ml-2 text-xs text-indigo-300">
                      • Stock: {event.qty}
                    </span>
                  </p>
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    min={0}
                    max={event.qty}
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value))}
                    className="w-full text-center bg-[#0C1128] border border-indigo-400/30 rounded-lg py-1 text-white"
                  />
                </div>

              </div>

            </div>

            <div className="mt-10">

              <button
                onClick={handleCheckout}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition w-full md:w-auto"
              >
                Proceed to Payment →
              </button>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
