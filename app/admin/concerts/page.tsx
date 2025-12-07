import { getConcerts } from "@/app/admin/actions";
import Link from "next/link";
import { ConcertList } from "./ConcertList";

export default async function ConcertsPage() {
  const concerts = await getConcerts();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Concerts</h1>
        <Link href="/admin/concerts/create" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create Concert
        </Link>
      </div>
      <ConcertList concerts={concerts} />
    </div>
  );
}
