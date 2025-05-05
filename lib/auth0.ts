import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  async beforeSessionSaved(session) {
    return {
      ...session,
      user: {
        ...session.user,
        user_id: session.user["https://kanban-nine-pi.vercel.app/user_id"],
      },
    };
  },
  authorizationParameters: {
    audience: "https://bqnydhygcjcfjlmukgjp.supabase.co",
  },
});
