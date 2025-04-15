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
      url: "/routes",
      icon: Route,
      items: [
        {
          title: "Create Route",
          url: "/dashboard",
        },
        {
          title: "Saved Routes",
          url: "/dashboard/routes/saved",
        },
      ],
    },

    {
      title: "Fleet",
      url: "/fleet",
      icon: Truck,
      items: [
        {
          title: "Vehicles",
          url: "/dashboard/fleet/vehicles",
        },
      ],
    },
    {
      title: "Billing",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "Stripe Payments",
          url: "/dashboard/settings/billing",
        },
      ],
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
            className="w-24 h-auto object-contain"
          />
        </div>
      </SidebarHeader>

      {/* Move nav items up */}
      <SidebarContent className="pt-0">
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
