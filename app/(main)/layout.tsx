import { AppSidebar } from "@/components/navigation/AppSidebar";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MobileTopBar } from "@/components/navigation/MobileTopBar";
import { FAB } from "@/components/navigation/FAB";
import { getCurrentUser } from "@/lib/currentUser";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar currentUser={currentUser} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopBar />
        <main className="flex-1 w-full max-w-full min-w-0 pb-16 md:pb-0 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
      <FAB />
      <BottomNav />
    </div>
  );
}
