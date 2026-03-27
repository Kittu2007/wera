// =============================================================================
// WERA — tRPC Initialization
// Context creation + router/procedure factories
// =============================================================================

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import type { User } from "@prisma/client";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export async function createTRPCContext(opts: { headers: Headers }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  let user: User | null = null;
  let decodedToken = null;

  if (sessionToken) {
    try {
      decodedToken = await adminAuth.verifyIdToken(sessionToken);
      if (decodedToken?.uid) {
        user = await db.user.findUnique({
          where: { supabaseId: decodedToken.uid },
        });

        // Lazy sync: If user exists in Firebase but not in our DB, create them
        if (!user && decodedToken.email) {
          user = await db.user.create({
            data: {
              supabaseId: decodedToken.uid,
              email: decodedToken.email,
              name: decodedToken.name || decodedToken.email.split("@")[0],
              role: "CUSTOMER", // Default role
            },
          });
        }
      }
    } catch (error) {
      console.error("Firebase token verification failed", error);
    }
  }

  return {
    db,
    session: decodedToken, // Firebase decoded token acts as session
    user,
    headers: opts.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// ---------------------------------------------------------------------------
// tRPC Instance
// ---------------------------------------------------------------------------

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// ---------------------------------------------------------------------------
// Exported builders
// ---------------------------------------------------------------------------

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Public procedure — no auth required.
 * Used for product listings, categories, banners, etc.
 */
export const publicProcedure = t.procedure;

/**
 * Auth-protected procedure — requires a valid session.
 * Throws UNAUTHORIZED if no session or user found.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});

/**
 * Admin-only procedure — requires ADMIN role.
 * Extends protectedProcedure with role check.
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required.",
    });
  }

  return next({ ctx });
});
