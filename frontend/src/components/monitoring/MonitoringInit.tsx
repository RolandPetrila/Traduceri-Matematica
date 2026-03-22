"use client";

import { useEffect } from "react";
import { initGlobalErrorHandlers } from "@/lib/monitoring";

export function MonitoringInit() {
  useEffect(() => {
    initGlobalErrorHandlers();
  }, []);
  return null;
}
