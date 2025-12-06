"use client";

import Image from "next/image";
import Link from "next/link";
import Layout from "./components/Layout";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { Concert } from "./types/concert";

export default function Home() {
  const [featured, setFeatured] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("concerts")
        .select("*")
        .eq("featured", true)
        .eq("published", true)
        .order("start_at", { ascending: true })
        .limit(6);

      if (error) {
        console.error(error);
      } else {
        setFeatured(data);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <Layout title="home-page">
      <div className="min-h-screen bg-linear-to-b from-[#0A0F29] via-[#0a1138] to-[#010314] text-white">

        <section className="relative pt-24 pb-32">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-0 grid md:grid-cols-2 gap-12 items-center">

            <div className="px-2">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                Book your <br />
                <span className="text-indigo-400">Tickets for Event!</span>
              </h1>

              <p className="mt-6 text-gray-300">
                Safe, Secure, Reliable ticketing.
                <br />Your ticket to live entertainment!
              </p>

              <Link
                href="/events"
                className="inline-block mt-8 px-6 py-3 bg-white text-black rounded-lg font-semibold shadow-lg hover:scale-105 transition"
              >
                View More →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-5">
              <Image src="/banner1.jpg" width={500} height={300} alt="Banner 1"
                className="rounded-xl shadow-lg object-cover h-48 md:h-64 w-full" />
              <Image src="/banner2.jpg" width={500} height={300} alt="Banner 2"
                className="rounded-xl shadow-lg object-cover h-48 md:h-64 w-full mt-10" />
              <Image src="/banner3.jpg" width={500} height={300} alt="Banner 3"
                className="rounded-xl shadow-lg object-cover h-48 md:h-64 w-full" />
              <Image src="/banner4.jpg" width={500} height={300} alt="Banner 4"
                className="rounded-xl shadow-lg object-cover h-48 md:h-64 w-full mt-10" />
            </div>

          </div>
        </section>

        <section className="py-20">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-0">
            <div className="bg-[#0D1B3C]/70 backdrop-blur-xl p-10 rounded-3xl shadow-xl border border-white/10">

              <h2 className="text-3xl font-bold mb-3">Featured Events</h2>
              <p className="text-gray-300 mb-10">Be sure not to miss these Event today.</p>

              {loading ? (
                <div className="text-center text-gray-400">Loading...</div>
              ) : featured.length === 0 ? (
                <div className="text-center text-gray-400">No featured events found.</div>
              ) : (
                <div className="grid md:grid-cols-3 gap-8">
                  {featured.map((event) => (
                    <div
                      key={event.id}
                      className="bg-[#0F1F45] rounded-2xl overflow-hidden shadow-lg border border-white/5"
                    >
                      <Image
                        src={event.image.startsWith("/") ? event.image : "/" + event.image}
                        width={500}
                        height={300}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />

                      <div className="p-6">
                        <div className="text-sm text-gray-300">
                          Rp{event.price.toLocaleString("id-ID")}
                        </div>

                        <div className="font-bold text-xl mt-2">{event.title}</div>

                        <div className="text-gray-400 text-sm mt-1">
                          {new Date(event.start_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          | {event.location}
                        </div>

                        <Link
                          href={`/events/${event.id}`}
                          className="mt-6 block w-full text-center py-3 rounded-xl font-semibold border border-indigo-400 hover:bg-indigo-500 hover:border-indigo-500 hover:text-white transition"
                        >
                          Get Tickets →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
