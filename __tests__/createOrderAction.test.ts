import { createOrderAction } from "@/app/actions";
import { buildConcert, buildOrder } from "./factories";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { supabaseServer as mockedSupabaseServer } from "@/app/lib/supabaseServer";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

jest.mock("@/app/lib/supabaseServer", () => {
  const concertsApi = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
    update: jest.fn(),
  };

  const ordersApi = {
    insert: jest.fn(),
  };

  const from = jest.fn((table: string) => {
    if (table === "concerts") return concertsApi;
    if (table === "orders") return ordersApi;
    return {};
  });

  return {
    supabaseServer: {
      from,
      __concertsApi: concertsApi,
      __ordersApi: ordersApi,
    },
  };
});

const concertApi = (mockedSupabaseServer as unknown as { __concertsApi: any })
  .__concertsApi;
const ordersApi = (mockedSupabaseServer as unknown as { __ordersApi: any })
  .__ordersApi;

describe("createOrderAction (server action)", () => {
  const mockSession = getServerSession as jest.Mock;
  const mockRevalidate = revalidatePath as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default session
    mockSession.mockResolvedValue({ user: { id: "user-1" } });

    // Chain: select -> eq -> single
    concertApi.select.mockReturnValue(concertApi);
    concertApi.eq.mockReturnValue(concertApi);

    // Update chain: update -> eq
    concertApi.update.mockImplementation(() => ({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }));
  });

  it("throws when unauthenticated", async () => {
    mockSession.mockResolvedValue(null);

    await expect(createOrderAction("concert-x", 1)).rejects.toThrow(
      /not authenticated/i
    );
  });

  it("throws when tickets are insufficient", async () => {
    const concert = buildConcert({ available_tickets: 0 });
    concertApi.single.mockResolvedValue({ data: concert, error: null });

    await expect(createOrderAction(concert.id, 1)).rejects.toThrow(
      /not enough tickets/i
    );
  });

  it("creates an order, decrements tickets, and revalidates paths", async () => {
    const concert = buildConcert({ available_tickets: 10 });
    const order = buildOrder({ quantity: 2, total_price: concert.price * 2 });

    concertApi.single.mockResolvedValue({ data: concert, error: null });

    const orderSingle = jest
      .fn()
      .mockResolvedValue({ data: order, error: null });
    const orderSelect = jest.fn().mockReturnValue({ single: orderSingle });
    ordersApi.insert.mockReturnValue({ select: orderSelect });

    const result = await createOrderAction(concert.id, 2);

    expect(orderSingle).toHaveBeenCalled();
    expect(result).toEqual(order);
    expect(concertApi.update).toHaveBeenCalledWith({
      available_tickets: concert.available_tickets - 2,
    });
    expect(mockRevalidate).toHaveBeenCalledWith(`/events/${concert.id}`);
    expect(mockRevalidate).toHaveBeenCalledWith("/tickets");
  });
});
