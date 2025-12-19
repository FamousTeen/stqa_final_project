import {
  getConcerts,
  createConcert,
  updateConcert,
  deleteConcert,
  getUsers,
  toggleUserStatus,
  getOrders,
  updateOrderStatus,
  getConcert,
} from "@/app/admin/actions";
import { supabaseServer as mockedSupabaseServer } from "@/app/lib/supabaseServer";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

jest.mock("@/app/lib/supabaseServer", () => {
  const concertsApi = {
    select: jest.fn(),
    order: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  };

  const ordersApi = {
    select: jest.fn(),
    order: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
  };

  const profilesApi = {
    select: jest.fn(),
    order: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
  };

  const storageFrom = jest.fn(() => ({
    upload: jest.fn(),
    getPublicUrl: jest.fn(() => ({
      data: { publicUrl: "https://example.com/image.jpg" },
    })),
  }));

  const from = jest.fn((table: string) => {
    if (table === "concerts") return concertsApi;
    if (table === "orders") return ordersApi;
    if (table === "profiles") return profilesApi;
    return {};
  });

  return {
    supabaseServer: {
      from,
      storage: { from: storageFrom },
      __concertsApi: concertsApi,
      __ordersApi: ordersApi,
      __profilesApi: profilesApi,
    },
  };
});

const sessionMock = getServerSession as jest.Mock;
const revalidateMock = revalidatePath as jest.Mock;
const concertsApi = (mockedSupabaseServer as unknown as {
  __concertsApi: any;
}).__concertsApi;
const ordersApi = (mockedSupabaseServer as unknown as {
  __ordersApi: any;
}).__ordersApi;
const profilesApi = (mockedSupabaseServer as unknown as {
  __profilesApi: any;
}).__profilesApi;

describe("admin actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionMock.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });

    concertsApi.select.mockReturnValue(concertsApi);
    concertsApi.eq.mockReturnValue(concertsApi);
    concertsApi.order.mockResolvedValue({ data: [], error: null });
    concertsApi.insert.mockResolvedValue({ error: null });
    concertsApi.update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    concertsApi.delete.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    concertsApi.single.mockResolvedValue({
      data: { id: "concert-1" },
      error: null,
    });

    ordersApi.select.mockReturnValue(ordersApi);
    ordersApi.eq.mockReturnValue(ordersApi);
    ordersApi.neq.mockReturnValue(ordersApi);
    ordersApi.order.mockResolvedValue({ data: [], error: null });
    ordersApi.limit.mockResolvedValue({ data: [], error: null });
    ordersApi.single.mockResolvedValue({ data: { status: 'pending' }, error: null });
    ordersApi.update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    ordersApi.delete.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    profilesApi.select.mockReturnValue(profilesApi);
    profilesApi.eq.mockReturnValue(profilesApi);
    profilesApi.order.mockResolvedValue({ data: [], error: null });
    profilesApi.update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  it("rejects non-admin sessions", async () => {
    sessionMock.mockResolvedValueOnce({ user: { role: "user" } });

    await expect(getConcerts()).rejects.toThrow(/unauthorized/i);
  });

  it("returns concerts for admins", async () => {
    const concert = { id: "c1" };
    concertsApi.order.mockResolvedValueOnce({ data: [concert], error: null });

    const result = await getConcerts();

    expect(concertsApi.select).toHaveBeenCalledWith("*");
    expect(concertsApi.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(result).toEqual([concert]);
  });

  it("creates a concert and revalidates", async () => {
    const newConcert = {
      title: "Show",
      description: "desc",
      start_at: "2025-01-01",
      end_at: null,
      location: "Venue",
      price: 100,
      total_tickets: 50,
      available_tickets: 50,
      image: null,
      featured: false,
      published: true,
    };

    await createConcert(newConcert);

    expect(concertsApi.insert).toHaveBeenCalledWith(newConcert);
    expect(revalidateMock).toHaveBeenCalledWith("/admin/concerts");
  });

  it("updates a concert and revalidates", async () => {
    const eqSpy = jest.fn().mockResolvedValue({ error: null });
    concertsApi.update.mockReturnValue({ eq: eqSpy });

    await updateConcert("concert-1", { title: "Updated" });

    expect(concertsApi.update).toHaveBeenCalledWith({ title: "Updated" });
    expect(eqSpy).toHaveBeenCalledWith("id", "concert-1");
    expect(revalidateMock).toHaveBeenCalledWith("/admin/concerts");
  });

  it("blocks deletion when active orders exist", async () => {
    ordersApi.limit.mockResolvedValueOnce({
      data: [{ id: "order-1" }],
      error: null,
    });

    await expect(deleteConcert("concert-1")).rejects.toThrow(/active/i);
    expect(concertsApi.delete).not.toHaveBeenCalled();
    expect(revalidateMock).not.toHaveBeenCalled();
  });

  it("deletes orders and concert when safe", async () => {
    const deleteOrdersEq = jest.fn().mockResolvedValue({ error: null });
    const deleteConcertEq = jest.fn().mockResolvedValue({ error: null });

    ordersApi.delete.mockReturnValue({ eq: deleteOrdersEq });
    concertsApi.delete.mockReturnValue({ eq: deleteConcertEq });

    await deleteConcert("concert-2");

    expect(ordersApi.delete).toHaveBeenCalled();
    expect(deleteOrdersEq).toHaveBeenCalledWith("concert_id", "concert-2");
    expect(deleteConcertEq).toHaveBeenCalledWith("id", "concert-2");
    expect(revalidateMock).toHaveBeenCalledWith("/admin/concerts");
  });

  it("returns a single concert", async () => {
    concertsApi.single.mockResolvedValueOnce({
      data: { id: "concert-3" },
      error: null,
    });

    const result = await getConcert("concert-3");

    expect(concertsApi.eq).toHaveBeenCalledWith("id", "concert-3");
    expect(result).toEqual({ id: "concert-3" });
  });

  it("returns users list", async () => {
    profilesApi.order.mockResolvedValueOnce({
      data: [{ id: "user-1", role: "user" }],
      error: null,
    });

    const result = await getUsers();

    expect(profilesApi.eq).toHaveBeenCalledWith("role", "user");
    expect(result).toEqual([{ id: "user-1", role: "user" }]);
  });

  it("toggles user status and revalidates", async () => {
    const eqSpy = jest.fn().mockResolvedValue({ error: null });
    profilesApi.update.mockReturnValue({ eq: eqSpy });

    await toggleUserStatus("user-1", false);

    expect(profilesApi.update).toHaveBeenCalledWith({ is_active: false });
    expect(eqSpy).toHaveBeenCalledWith("id", "user-1");
    expect(revalidateMock).toHaveBeenCalledWith("/admin/users");
  });

  it("returns orders list", async () => {
    ordersApi.order.mockResolvedValueOnce({
      data: [{ id: "order-1" }],
      error: null,
    });

    const result = await getOrders();

    expect(ordersApi.select).toHaveBeenCalledWith(
      "*, concerts(*), profiles(email)"
    );
    expect(result).toEqual([{ id: "order-1" }]);
  });

  it("updates order status and revalidates", async () => {
    const eqSpy = jest.fn().mockResolvedValue({ error: null });
    ordersApi.update.mockReturnValue({ eq: eqSpy });

    await updateOrderStatus("order-1", "cancelled");

    expect(ordersApi.update).toHaveBeenCalledWith({ status: "cancelled" });
    expect(eqSpy).toHaveBeenCalledWith("id", "order-1");
    expect(revalidateMock).toHaveBeenCalledWith("/admin/orders");
  });
});
