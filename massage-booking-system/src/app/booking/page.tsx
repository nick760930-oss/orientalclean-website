import { Suspense } from "react";
import BookingWizard from "@/components/BookingWizard";

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-center text-brand-400">載入中…</div>}>
      <BookingWizard />
    </Suspense>
  );
}
