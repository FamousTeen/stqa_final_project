export interface TicketType {
  id: number;
  event_id: number;
  name: string;
  price: string; // numeric comes back as string by default from Postgres
  quantity?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: number;
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  description?: string | null;
  image_path?: string | null;
  location?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  published?: boolean;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
  ticket_types?: TicketType[]; // include by an explicit join
}
