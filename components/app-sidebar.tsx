"use client"

import * as React from "react"
import {
  Route,
  Truck,
  Settings2,
  Calculator,
  Map,
  Building2,
  Boxes,
  Warehouse
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Cameron Carvalho",
    email: "cam@brocku.ca",
    avatar: "/avatars/shadcn.jpg",
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
      isActive: true,
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
        }
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/dashboard/settings/general",
        },
        {
          title: "Team Management",
          url: "/dashboard/settings/team",
        },
        {
          title: "Billing",
          url: "/dashboard/settings/billing",
        },
        {
          title: "API Integration",
          url: "/dashboard/settings/api",
        }
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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}