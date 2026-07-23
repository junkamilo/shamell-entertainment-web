"use client";

import { type FormEvent, useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import {
  buildPrivateClassRequestBody,
  validatePrivateClassForm,
} from "../lib/privateClassValidation";
import {
  createPrivateClassCash,
  createPrivateClassCheckoutSession,
} from "../services/createPrivateClassBooking";
import type {
  PrivateClassFormFields,
  PrivateClassPaymentMethod,
} from "../types/privateClass.types";

const INITIAL: PrivateClassFormFields = {
  classType: "",
  eventDate: "",
  eventTimeStart: "",
  location: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  notes: "",
  amountUsd: "",
  paymentMethod: "stripe",
  cashConfirmed: false,
};

export function usePrivateClassForm() {
  const [fields, setFields] = useState<PrivateClassFormFields>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const patch = useCallback((partial: Partial<PrivateClassFormFields>) => {
    setFields((prev) => ({ ...prev, ...partial }));
  }, []);

  const setPaymentMethod = useCallback((paymentMethod: PrivateClassPaymentMethod) => {
    setFields((prev) => ({
      ...prev,
      paymentMethod,
      cashConfirmed: paymentMethod === "cash" ? prev.cashConfirmed : false,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFields(INITIAL);
  }, []);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const error = validatePrivateClassForm(fields);
      if (error) {
        toast({ title: "Missing fields", description: error, variant: "destructive" });
        return;
      }
      const body = buildPrivateClassRequestBody(fields);
      if (!body) {
        toast({
          title: "Missing fields",
          description: "Enter a valid price.",
          variant: "destructive",
        });
        return;
      }
      const token = getAdminBearerToken();
      if (!token) {
        toast({
          title: "Sign-in required",
          description: "Admin session missing.",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);
      try {
        const result =
          fields.paymentMethod === "cash"
            ? await createPrivateClassCash(token, body)
            : await createPrivateClassCheckoutSession(token, body);
        if (!result.ok) {
          toast({
            title: "Could not save",
            description: result.message,
            variant: "destructive",
          });
          return;
        }
        toast({
          title:
            fields.paymentMethod === "cash"
              ? "Private class reserved"
              : "Payment link sent",
          description: result.message,
        });
        resetForm();
      } finally {
        setSubmitting(false);
      }
    },
    [fields, resetForm],
  );

  return {
    fields,
    patch,
    setPaymentMethod,
    submitting,
    datePickerOpen,
    setDatePickerOpen,
    timePickerOpen,
    setTimePickerOpen,
    onSubmit,
  };
}
