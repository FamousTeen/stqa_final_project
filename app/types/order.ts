export interface Concert {
  title: string;
  location: string;
  start_at: string;
}

export interface Order {
  id: string;
  total_price: number;
  status: string;
  qty: number;
  created_at: string;
  concerts: Concert;
}
