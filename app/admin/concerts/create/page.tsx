import { ConcertForm } from "../ConcertForm";

export default function CreateConcertPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create Concert</h1>
      <ConcertForm />
    </div>
  );
}
