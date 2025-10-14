"use server";

import { db } from "@/db";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";
import { z } from "zod";
import { patientsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const upsertPatientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  phoneNumber: z.string().min(1, "Telefone é obrigatório"),
  sex: z.enum(["male", "female"], { message: "Sexo é obrigatório" }),
});

export const upsertPatient = protectedWithClinicActionClient
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, name, email, phoneNumber, sex } = parsedInput;
    const clinicId = ctx.user.clinic.id;

    let result;
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
      result = updatedPatient;
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
      result = newPatient;
    }

    revalidatePath("/patients");
    revalidatePath("/appointments");

    return { success: result };
  });
