"use client";

import { useEffect, useState } from "react";
import { UpgradeModal } from "./UpgradeModal";

export type UpgradeTrigger = "scan-limit" | "blurred-issue" | "watch-site" | "export-pdf" | "competitor" | "chat" | "sitemap";

export function UpgradeModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<UpgradeTrigger>("scan-limit");

  useEffect(() => {
    const handleShow = (e: Event) => {
      const customEvent = e as CustomEvent<{ trigger: UpgradeTrigger }>;
      setTrigger(customEvent.detail?.trigger || "scan-limit");
      setOpen(true);
    };

    window.addEventListener("showUpgradeModal", handleShow);
    return () => window.removeEventListener("showUpgradeModal", handleShow);
  }, []);

  return (
    <>
      {children}
      <UpgradeModal open={open} onClose={() => setOpen(false)} trigger={trigger} />
    </>
  );
}
