"use client";

import Auth from "@/spa/pages/Auth";

// Prevent static generation - this page needs runtime
export const dynamic = 'force-dynamic';

export default function AuthPage() {
  return <Auth />;
}
