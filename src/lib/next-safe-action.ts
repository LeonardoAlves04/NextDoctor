import { createSafeActionClient } from "next-safe-action";
import { headers } from "next/headers";
import { auth } from "./auth";

export const actionClient = createSafeActionClient();

export const protectActionClient = createSafeActionClient().use(
  async ({ next }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorizerd");
    }
    return next({ ctx: { user: session.user } });
  },
);

export const protectedWithClinicActionClient = protectActionClient.use(
  async ({ next, ctx }) => {
    if (!ctx.user.clinic?.id) {
      throw new Error("Clinic not found");
    }
    return next({ ctx: { user: { ...ctx.user, clinic: ctx.user.clinic! } } });
  },
);
