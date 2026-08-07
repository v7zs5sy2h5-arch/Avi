import Link from "next/link";
import {
  Users,
  ListChecks,
  Wallet,
  Target,
  ShoppingBag,
  Receipt,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { signOut } from "./actions";

const links = [
  { href: "/payments-pending", label: "תשלומים ממתינים", icon: Wallet },
  { href: "/clients", label: "ניהול לקוחות", icon: Users },
  { href: "/products/new", label: "מכירת מוצר", icon: ShoppingBag },
  { href: "/expenses/new", label: "הוספת הוצאה", icon: Receipt },
  { href: "/settings/treatments", label: "ניהול מחירון טיפולים", icon: ListChecks },
  { href: "/settings/expense-categories", label: "ניהול קטגוריות הוצאה", icon: Receipt },
  { href: "/settings/goal", label: "הגדרת יעד שבועי", icon: Target },
] as const;

export default function MorePage() {
  return (
    <div className="px-4">
      <Header title="עוד" />
      <div className="mt-4 space-y-2 pb-6">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface p-4"
          >
            <Icon size={20} className="text-accent-strong" />
            <span className="flex-1 text-[15px]">{label}</span>
            <ChevronLeft size={18} className="text-text-muted" />
          </Link>
        ))}

        <form action={signOut} className="pt-2">
          <button className="flex w-full items-center gap-3 rounded-2xl p-4 text-warning">
            <LogOut size={20} />
            <span className="text-[15px]">התנתקות</span>
          </button>
        </form>
      </div>
    </div>
  );
}
