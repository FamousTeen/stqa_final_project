import { getConcert } from "@/app/admin/actions";
import { ConcertForm } from "../ConcertForm";

export default async function EditConcertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const concert = await getConcert(id);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Concert</h1>
      <ConcertForm concert={concert} />
    </div>
  );
}
