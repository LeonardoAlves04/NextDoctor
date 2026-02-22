"use client";

import { Stethoscope, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppointmentsRequirementsModalProps {
  hasDoctors: boolean;
  hasPatients: boolean;
}

export function AppointmentsRequirementsModal({
  hasDoctors,
  hasPatients,
}: AppointmentsRequirementsModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasDoctors || !hasPatients) {
      setOpen(true);
    }
  }, [hasDoctors, hasPatients]);

  const missingItems: string[] = [];
  if (!hasDoctors) missingItems.push("médico");
  if (!hasPatients) missingItems.push("paciente");

  const message =
    missingItems.length === 2
      ? "É necessário cadastrar um paciente e um médico para prosseguir com o agendamento."
      : `É necessário cadastrar ${missingItems[0]} para prosseguir com o agendamento.`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Requisitos para agendamento</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {!hasDoctors && (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/doctors">
                <Stethoscope className="mr-2 size-4" />
                Cadastrar médico
              </Link>
            </Button>
          )}
          {!hasPatients && (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/patients">
                <UsersRound className="mr-2 size-4" />
                Cadastrar paciente
              </Link>
            </Button>
          )}
          <Button onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
