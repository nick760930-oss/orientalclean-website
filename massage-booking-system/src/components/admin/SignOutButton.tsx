"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/admin/login" })} className="text-brand-500 hover:text-brand-700">
      登出
    </button>
  );
}
