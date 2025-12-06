"use client";

import Layout from "./../components/Layout";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "./../lib/supabaseClient";
import { Concert } from "./../types/concert";

export default function EventsPage() {
  const [events, setEvents] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("concerts")
        .select("*")
        .eq("published", true)
        .order("start_at", { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setEvents(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <Layout title="events-page">
      <div className="min-h-screen bg-linear-to-b from-[#0A0F29] via-[#0a1138] to-[#010314] text-white py-16 px-6">
        <div className="max-w-6xl mx-auto my-4">

          <h1 className="text-4xl font-bold mb-10">All Events</h1>

          {loading ? (
            <div className="text-center text-gray-400">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center text-gray-400">No events available.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {events.map(event => {
                const imageSrc = event.image?.startsWith("http")
                  ? event.image
                  : "/" + event.image;

                return (
                  <div
                    key={event.id}
                    className="bg-[#0F1F45] rounded-2xl overflow-hidden shadow-lg border border-white/5"
                  >
                    <div className="relative w-full h-52">
                      <Image
                        src={imageSrc}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>

                    <div className="p-5">
                      <p className="text-sm text-gray-300">
                        Rp{event.price.toLocaleString("id-ID")}
                      </p>

                      <h2 className="text-xl font-semibold mt-2">{event.title}</h2>

                      <p className="text-gray-400 text-sm mt-1">
                        {new Date(event.start_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        | {event.location}
                      </p>

                      <Link
                        href={`/events/${event.id}`}
                        className="mt-5 block text-center py-3 border border-indigo-400 rounded-xl 
                                  hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition"
                      >
                        Get Tickets →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
