import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { requireSession } from "@/lib/session";
import { logoutAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await requireSession();
  } catch (e) {
    redirect("/login");
  }
  const user = session.user;

  return (
    <div className="flex h-screen overflow-hidden bg-background bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background relative z-0">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative z-10">
        {user && (
          <header className="sticky top-0 z-50 h-14">
            <div className="absolute inset-0 -z-10 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
            
            <div className="flex h-full w-full items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <MobileNav />
                <Link href="/" className="md:hidden flex items-center gap-2">
                  <div className="size-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-border/50 bg-black">
                    <img src="/logo-icon.png" alt="Zyra CRM Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">ZYRA CRM</span>
                </Link>
                
                <div className="hidden sm:flex items-center gap-4">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {user.role}
                  </span>
                </div>
              </div>
              <form action={logoutAction} className="flex items-center">
                <button
                  type="submit"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-md transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </header>
        )}
        <div className="flex-1 p-6 lg:p-8 lg:pl-4">
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
