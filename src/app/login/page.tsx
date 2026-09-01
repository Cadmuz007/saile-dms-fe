import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in | Saile DMS",
  description: "Sign in to Saile Document Management System.",
};

export default function LoginPage() {
  redirect("/");
}
