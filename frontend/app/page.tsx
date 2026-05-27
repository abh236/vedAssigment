"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  useEffect(() => {
    router.replace(isLoggedIn ? "/home" : "/login");
  }, [isLoggedIn, router]);
  return null;
}
