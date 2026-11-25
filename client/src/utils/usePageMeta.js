import { useEffect } from "react";

export default function usePageMeta(title) {
  useEffect(() => {
    if (!title) return;
    document.title = `${title} — Lovaction Ministries`;
    return () => {
      document.title = "Lovaction Ministries — Love in Action, Hope for All";
    };
  }, [title]);
}
