import Image from "next/image";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <Image
        src="/logo-full.png"
        alt="Keren Amar - Professional Cosmetics · Nails"
        width={280}
        height={126}
        className="mb-10"
        priority
      />
      <LoginForm />
    </main>
  );
}
