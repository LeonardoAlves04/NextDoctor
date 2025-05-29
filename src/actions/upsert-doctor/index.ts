"use server";

import { db } from "@/db";
import { upsertDoctorSchema, UpsertDoctorSchema } from "./schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { doctorsTable } from "@/db/schema";
import { actionClient } from "@/lib/next-safe-action";

export const upsertDoctor = actionClient
  .schema(upsertDoctorSchema)
  .action(async ({ parsedInput }) => {
    async (data: UpsertDoctorSchema) => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (!session?.user) {
        throw new Error("Unaunthorized");
      }
      if (!session?.user.clinic?.id) {
        throw new Error("Clinic not found");
      }
      await db
        .insert(doctorsTable)
        .values({
          id: parsedInput.id,
          ...parsedInput,
          clinicId: session?.user.clinic?.id,
        })
        .onConflictDoUpdate({
          target: [doctorsTable.id],
          set: {
            ...parsedInput,
          },
        });
    };
  });
