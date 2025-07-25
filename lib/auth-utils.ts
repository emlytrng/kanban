import { type NextRequest, NextResponse } from "next/server";

import { auth0 } from "./auth0";

export interface AuthContext {
  userId: string;
}

export type AuthenticatedHandler<TParams = Record<string, string>> = ({
  auth,
  request,
  context,
}: {
  auth: AuthContext;
  request: NextRequest;
  context?: { params: Promise<TParams> };
}) => Promise<NextResponse>;

export async function getSessionUserId(): Promise<
  { error: NextResponse; userId?: never } | { error?: never; userId: string }
> {
  try {
    const session = await auth0.getSession();

    const userId = session?.user["user_id"];
    if (!userId) {
      return {
        error: NextResponse.json({ error: "User not found" }, { status: 404 }),
      };
    }

    return { userId };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      error: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      ),
    };
  }
}

export function withAuth<TParams = Record<string, string>>(
  handler: AuthenticatedHandler<TParams>
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<TParams> }
  ) => {
    const authResult = await getSessionUserId();

    if (authResult.error) {
      return authResult.error;
    }

    const auth: AuthContext = {
      userId: authResult.userId,
    };

    return handler({ auth, request, context });
  };
}
