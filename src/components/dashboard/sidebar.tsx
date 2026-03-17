"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  AlertTriangle,
  Users,
  Settings,
  ExternalLink,
  Plug,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Websites",
    href: "/websites",
    icon: Globe,
  },
  {
    label: "Issues",
    href: "/issues",
    icon: AlertTriangle,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    comingSoon: false,
  },
  {
    label: "Team",
    href: "/team",
    icon: Users,
  },
  {
    label: "Client Portals",
    href: "/clients",
    icon: ExternalLink,
  },
  {
    label: "Integrations",
    href: "/integrations",
    icon: Plug,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-64 border-r bg-sidebar min-h-screen"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-bold text-xs">AK</span>
        </div>
        <span className="font-bold text-sidebar-foreground">AccessKit</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Primary">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {item.comingSoon && (
                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-normal">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t">
        <a
          href="https://accesskit.app/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          Documentation
          <ExternalLink className="h-3 w-3 ml-auto opacity-60" aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}
