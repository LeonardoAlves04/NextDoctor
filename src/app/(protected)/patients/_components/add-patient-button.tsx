"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import UpsertPatientForm from "./upsert-patient-form";
import { useRouter } from "next/navigation";

const AddPatientButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Adicionar Paciente</Button>
      </DialogTrigger>
      <UpsertPatientForm
        isOpen={isOpen}
        onSuccess={() => {
          setIsOpen(false);
          router.refresh();
        }}
      />
    </Dialog>
  );
};

export default AddPatientButton;
