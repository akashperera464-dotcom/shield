// Shared auth gate for API routes.
//
// Usage:
//   import { requireAdmin, requireSuperadmin } from "@/lib/auth-guard";
//   export const POST = withErrors(async (req) => {
//     const actor = await requireSuperadmin(req);
//     if (!actor.ok) return actor.response;
//     // actor.info.uid, actor.info.role
//   });

import { readSessionFromCookie, type SessionInfo } from "@/lib/auth";
import { NextResponse } from "next/server";

export type AuthResult =
  | { ok: true; info: SessionInfo }
  | { ok: false; response: Response };

/** Require any authenticated admin (or superadmin). */
export async function requireAdmin(req: Request): Promise<AuthResult> {
  const info = await readSessionFromCookie(req);
  if (!info) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  return { ok: true, info };
}

/** Require the superadmin specifically. */
export async function requireSuperadmin(req: Request): Promise<AuthResult> {
  const info = await readSessionFromCookie(req);
  if (!info) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  if (info.role !== "superadmin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Superadmin access required" },
        { status: 403 }
      ),
    };
  }
  return { ok: true, info };
}
