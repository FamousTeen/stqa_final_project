// app/api/register/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
};

export async function POST(request: Request) {
  const body: Body = await request.json();

  const errors: Record<string, string> = {};

  if (!body.name || body.name.trim() === "") errors.name = "Name is required";
  if (!body.email || body.email.trim() === "")
    errors.email = "Email is required";
  if (!body.password || body.password.trim() === "")
    errors.password = "Password is required";
  if (body.password !== body.password_confirmation)
    errors.password_confirmation = "Passwords do not match";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // Create supabase admin client with service role key (server-only)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { message: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Create user (admin)
    const { data, error } = await supabase.auth.admin.createUser({
      email: body.email!,
      password: body.password!,
      email_confirm: true,
      user_metadata: { name: body.name },
    });

    if (error) {
      // supabase admin errors often returned in error.message
      return NextResponse.json(
        { errors: { email: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "User created",
        user: { id: data.user?.id, email: data.user?.email },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
