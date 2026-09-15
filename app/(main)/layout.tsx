import { AppSidebar } from "@/components/navigation/AppSidebar";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MobileTopBar } from "@/components/navigation/MobileTopBar";
import { FAB } from "@/components/navigation/FAB";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopBar />
        <main className="flex-1 pb-16 md:pb-0 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
      <FAB />
      <BottomNav />
    </div>
  );
}
