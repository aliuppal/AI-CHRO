"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { APP_NAME } from "@/lib/brand";
import { mainNav, settingsNav, type NavItem } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
        <Link href={item.href} aria-current={active ? "page" : undefined}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} />
      ))}
    </SidebarMenu>
  );
}

/** Reads the URL, so it lives under <Suspense> (dynamic routes can't prerender it). */
function ActiveNavList({ items }: { items: NavItem[] }) {
  return <NavList items={items} pathname={usePathname()} />;
}

/** Nav with the current page highlighted; renders unhighlighted until the URL is known. */
function Nav({ items }: { items: NavItem[] }) {
  return (
    <Suspense fallback={<NavList items={items} pathname="" />}>
      <ActiveNavList items={items} />
    </Suspense>
  );
}

export function AppSidebar({ organizationName }: { organizationName: string }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={APP_NAME}>
              <Link href="/dashboard">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-md bg-night"
                >
                  <span className="size-2.5 rounded-full bg-primary" />
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate font-medium tracking-[-0.2px]">{APP_NAME}</span>
                  <span className="truncate text-xs text-muted-foreground">{organizationName}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Nav items={mainNav} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Nav items={[settingsNav]} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
