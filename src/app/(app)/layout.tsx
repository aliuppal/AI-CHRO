import { AppSidebar } from "@/components/shell/app-sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();

  return (
    <SidebarProvider>
      <AppSidebar organizationName={user.organizationName} />
      <SidebarInset className="min-w-0">
        <TopBar user={user} />
        <div id="content" tabIndex={-1} className="flex-1 px-4 py-8 outline-none md:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
