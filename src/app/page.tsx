import { AuthenticationGate } from "@/features/auth/components/authentication-gate";

export default function Home() {
  return <AuthenticationGate />;
}
