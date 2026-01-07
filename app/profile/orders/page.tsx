"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /profile/orders to /orders
 * This page has been consolidated into /orders
 */
export default function ProfileOrdersRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/orders");
  }, [router]);

  return null;
}

