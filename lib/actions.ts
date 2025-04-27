"use server";

import { supabase } from "./supabase";
import { auth0 } from "./auth0";

/**
 * Syncs the authenticated user from Auth0 to Supabase DB.
 * Creates a new user record if one doesn't exist.
 */
export async function syncUserToDb() {
  try {
    const session = await auth0.getSession();

    if (!session?.user) {
      return { success: false, error: "No authenticated user" };
    }

    const auth0Id = session.user.sub;

    const { data: existingUser, error: queryError } = await supabase
      .from("users")
      .select("id")
      .eq("auth0_id", auth0Id)
      .maybeSingle();

    if (queryError) {
      console.error("Error checking for existing user:", queryError);
      return { success: false, error: queryError.message };
    }

    if (!existingUser) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          auth0_id: auth0Id,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating user:", insertError);
        return { success: false, error: insertError.message };
      }

      console.log("Created new user in Supabase:", newUser.id);
      return { success: true, userId: newUser.id, isNewUser: true };
    }

    return { success: true, userId: existingUser.id, isNewUser: false };
  } catch (error) {
    console.error("Error syncing user to Supabase:", error);
    return { success: false, error: "Failed to sync user" };
  }
}
