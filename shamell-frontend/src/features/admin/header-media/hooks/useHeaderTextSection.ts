"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  DEFAULT_HEADER_TEXT,
  type AdminHeaderTextRow,
  type HeaderTextContent,
} from "@/lib/headerTextTypes";
import { isValidHexColor } from "@/lib/headerTextStyleTokens";
import { getHeaderMediaBearerToken } from "../lib/headerMediaAuth";
import { fetchAdminHeaderText } from "../services/fetchAdminHeaderText";
import { patchAdminHeaderText } from "../services/patchAdminHeaderText";

export function useHeaderTextForm(onSaved: () => Promise<void>) {
  const [headline, setHeadline] = useState(DEFAULT_HEADER_TEXT.headline);
  const [headlineFont, setHeadlineFont] = useState(DEFAULT_HEADER_TEXT.headlineFont);
  const [headlineColor, setHeadlineColor] = useState(DEFAULT_HEADER_TEXT.headlineColor);
  const [tagline, setTagline] = useState(DEFAULT_HEADER_TEXT.tagline);
  const [taglineFont, setTaglineFont] = useState(DEFAULT_HEADER_TEXT.taglineFont);
  const [taglineColor, setTaglineColor] = useState(DEFAULT_HEADER_TEXT.taglineColor);
  const [quote, setQuote] = useState(DEFAULT_HEADER_TEXT.quote);
  const [quoteFont, setQuoteFont] = useState(DEFAULT_HEADER_TEXT.quoteFont);
  const [quoteColor, setQuoteColor] = useState(DEFAULT_HEADER_TEXT.quoteColor);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const syncFormFromRecord = useCallback((row: AdminHeaderTextRow | HeaderTextContent | null) => {
    const source = row ?? DEFAULT_HEADER_TEXT;
    setHeadline(source.headline);
    setHeadlineFont(source.headlineFont);
    setHeadlineColor(source.headlineColor);
    setTagline(source.tagline);
    setTaglineFont(source.taglineFont);
    setTaglineColor(source.taglineColor);
    setQuote(source.quote);
    setQuoteFont(source.quoteFont);
    setQuoteColor(source.quoteColor);
  }, []);

  const draftContent: HeaderTextContent = {
    headline,
    headlineFont,
    headlineColor,
    tagline,
    taglineFont,
    taglineColor,
    quote,
    quoteFont,
    quoteColor,
  };

  const validate = useCallback((): string | null => {
    if (!headline.trim()) return "Title is required.";
    if (!tagline.trim()) return "Tagline is required.";
    if (!quote.trim()) return "Quote is required.";
    if (!isValidHexColor(headlineColor)) return "Title color must be a valid hex (#RRGGBB).";
    if (!isValidHexColor(taglineColor)) return "Tagline color must be a valid hex (#RRGGBB).";
    if (!isValidHexColor(quoteColor)) return "Quote color must be a valid hex (#RRGGBB).";
    return null;
  }, [headline, tagline, quote, headlineColor, taglineColor, quoteColor]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<boolean> => {
      event.preventDefault();
      const validationError = validate();
      if (validationError) {
        toast({
          variant: "destructive",
          title: "Check the form",
          description: validationError,
        });
        return false;
      }

      const token = getHeaderMediaBearerToken();
      if (!token) return false;

      setIsSubmitting(true);
      try {
        await patchAdminHeaderText(token, {
          headline: headline.trim(),
          headlineFont,
          headlineColor,
          tagline: tagline.replace(/^\s+|\s+$/g, ""),
          taglineFont,
          taglineColor,
          quote: quote.replace(/^\s+|\s+$/g, ""),
          quoteFont,
          quoteColor,
        });

        toast({
          title: "Header text saved",
          description: "Hero title, tagline and quote were updated.",
        });
        await onSaved();
        return true;
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err instanceof Error ? err.message : "Could not save header text.",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      validate,
      headline,
      headlineFont,
      headlineColor,
      tagline,
      taglineFont,
      taglineColor,
      quote,
      quoteFont,
      quoteColor,
      onSaved,
    ],
  );

  return {
    headline,
    setHeadline,
    headlineFont,
    setHeadlineFont,
    headlineColor,
    setHeadlineColor,
    tagline,
    setTagline,
    taglineFont,
    setTaglineFont,
    taglineColor,
    setTaglineColor,
    quote,
    setQuote,
    quoteFont,
    setQuoteFont,
    quoteColor,
    setQuoteColor,
    draftContent,
    isSubmitting,
    syncFormFromRecord,
    onSubmit,
  };
}

export function useHeaderTextSection() {
  const [record, setRecord] = useState<AdminHeaderTextRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    const token = getHeaderMediaBearerToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchAdminHeaderText(token);
      setRecord(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Could not load header text.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const form = useHeaderTextForm(loadData);

  const openEditModal = useCallback(() => {
    form.syncFormFromRecord(record ?? DEFAULT_HEADER_TEXT);
    setIsModalOpen(true);
  }, [form, record]);

  const closeEditModal = useCallback(() => {
    if (!form.isSubmitting) setIsModalOpen(false);
  }, [form.isSubmitting]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      const ok = await form.onSubmit(event);
      if (ok) setIsModalOpen(false);
    },
    [form],
  );

  const previewContent = record ?? DEFAULT_HEADER_TEXT;

  return {
    record,
    previewContent,
    isLoading,
    isModalOpen,
    openEditModal,
    closeEditModal,
    handleSubmit,
    form,
    reload: loadData,
  };
}
