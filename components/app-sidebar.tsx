"use client";

import * as React from "react";
import {
  Route,
  Truck,
  Settings2,
  Calculator,
  Map,
  Building2,
  Boxes,
  Warehouse,
  Sun,
  Moon,
  SaveAll,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const data = {
  user: {
    name: "",
    email: "",
    avatar: "",
  },
  teams: [
    {
      name: "Logistics Division",
      logo: Truck,
      plan: "Enterprise",
    },
    {
      name: "Fleet Management",
      logo: Warehouse,
      plan: "Professional",
    },
    {
      name: "Delivery Team",
      logo: Boxes,
      plan: "Standard",
    },
  ],
  navMain: [
    {
      title: "Routes",
      url: "/dashboard",
      icon: Route,
      // items: [
      //   {
      //     title: "Create Route",
      //     url: "/dashboard",
      //   },
      //   {
      //     title: "Saved Routes",
      //     url: "/dashboard/routes/saved",
      //   },
      // ],
    },
    {
      title: "Load",
      url: "/dashboard/routes/saved",
      icon: SaveAll,
      // items: [
      //   {
      //     title: "Create Route",
      //     url: "/dashboard",
      //   },
      //   {
      //     title: "Saved Routes",
      //     url: "/dashboard/routes/saved",
      //   },
      // ],
    },

    {
      title: "Vehicles",
      url: "/dashboard/fleet/vehicles",
      icon: Truck,
      items: [
      ],
    },
    {
      title: "Billing",
      url: "/dashboard/settings/billing",
      icon: Settings2,
      items: [],
    },
  ],
  quickAccess: [
    {
      name: "Distribution Centers",
      url: "/locations/distribution",
      icon: Building2,
    },
    {
      name: "Route Optimization",
      url: "/routes/optimize",
      icon: Calculator,
    },
    {
      name: "Live Tracking",
      url: "/tracking",
      icon: Map,
    },
  ],
};

// Theme Toggle Component
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  data.user.email = session?.user?.email as string;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex flex-col items-center mt-4 mb-2">
          {/* Smaller logo, centered, with fixed size and preserved aspect ratio */}
          <img
            src="/logo.png"
            alt="Reroute Logo"
            className="w-28 h-auto object-contain"
          />
        </div>
      </SidebarHeader>

      {/* Move nav items up */}
      <SidebarContent className="pt-0">
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between w-full px-2 pb-4">
          <NavUser user={data.user} />
          <ThemeToggle />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
