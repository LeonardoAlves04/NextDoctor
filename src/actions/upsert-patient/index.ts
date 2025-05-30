"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { actionClient } from "@/lib/next-safe-action";
import { z } from "zod";
import { patientsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

const upsertPatientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  phoneNumber: z.string().min(1, "Telefone é obrigatório"),
  sex: z.enum(["male", "female"], { message: "Sexo é obrigatório" }),
});

export const upsertPatient = actionClient
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput }) => {
    const { id, name, email, phoneNumber, sex } = parsedInput;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.clinic?.id) {
      throw new Error("Usuário não está associado a nenhuma clínica.");
    }
    const clinicId = session.user.clinic.id;

    if (id) {
      const [updatedPatient] = await db
        .update(patientsTable)
        .set({
          name,
          email,
          phoneNumber,
          sex,
          updatedAt: new Date(),
        })
        .where(eq(patientsTable.id, id))
        .returning();
      return { success: updatedPatient };
    } else {
      const [newPatient] = await db
        .insert(patientsTable)
        .values({
          name,
          email,
          phoneNumber,
          sex,
          clinicId,
        })
        .returning();
      return { success: newPatient };
    }
  });
