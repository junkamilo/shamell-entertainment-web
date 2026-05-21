"use client";

import { useHeaderMediaPage } from "../hooks/useHeaderMediaPage";
import HeaderMediaPageContent from "./HeaderMediaPageContent";

export default function HeaderMediaPage() {
  const state = useHeaderMediaPage();
  return <HeaderMediaPageContent state={state} />;
}
