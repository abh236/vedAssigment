"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user, updateUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    // Fix legacy accounts: if role is "school" but no schoolName, they registered
    // via the student-only form — patch role to "student" locally and in backend
    if (user?.role === "school" && !user?.schoolName) {
      updateUser({ role: "student" });
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/fix-role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, role: "student" }),
      }).catch(() => {/* ignore */});
    }
  }, [isLoggedIn, user, router, updateUser]);

  if (!isLoggedIn) return null;
  return <>{children}</>;
}
