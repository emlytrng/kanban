import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { supabase } from "@/lib/supabase";

// DELETE /api/columns/[columnId] - Delete a column
export async function DELETE(
  request: NextRequest,
  { params }: { params: { columnId: string } }
) {
  try {
    // Check if user is authenticated
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from Auth0 ID
    const userId = session.user["user_id"];
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const columnId = params.columnId;

    // Delete the column
    const { error } = await supabase
      .from("columns")
      .delete()
      .eq("id", columnId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting column:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
