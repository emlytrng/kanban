import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

import type { Database } from "@/types/supabase";

import { auth0 } from "./auth0";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a server-side Supabase client with Auth0 token
export async function createSupabaseClient() {
  try {
    const session = await auth0.getSession();

    const payload = {
      userId: session?.user.sub,
      user_id: session?.user["https://kanban-nine-pi.vercel.app/user_id"],
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };

    if (!process.env.SUPABASE_JWT_SECRET) {
      throw new Error("Missing Supabase JWT secret");
    }

    const accessToken = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET);

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  } catch (error) {
    console.error("Error creating server Supabase client:", error);
    // Fall back to anonymous client if there is an error
    return createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
}
