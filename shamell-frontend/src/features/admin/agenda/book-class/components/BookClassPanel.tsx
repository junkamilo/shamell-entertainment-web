"use client";

import dynamic from "next/dynamic";
import { AgendaCatalogSpinner } from "../../shared/components/AgendaCatalogSpinner";
import { useBookClassKind } from "../hooks/useBookClassKind";
import { BookClassKindTabs } from "./BookClassKindTabs";
import { PrivateClassForm } from "./PrivateClassForm";

const BookClassForm = dynamic(
  () =>
    import("./BookClassForm").then((m) => ({
      default: m.BookClassForm,
    })),
  {
    ssr: false,
    loading: () => <AgendaCatalogSpinner />,
  },
);

export function BookClassPanel() {
  const { classKind, setClassKind } = useBookClassKind();

  return (
    <div>
      <BookClassKindTabs activeKind={classKind} onKindChange={setClassKind} />
      {classKind === "group" ? <BookClassForm /> : <PrivateClassForm />}
    </div>
  );
}
