// =============================================================================
// WERA — tRPC React Client
// Client-side hooks for tRPC procedures
// =============================================================================

"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

export const trpc = createTRPCReact<AppRouter>();
