import React from 'react';
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { 
  Route, 
  MapPin, 
  Settings, 
  Users, 
  Calendar,
  Truck,
  History,
  BarChart
} from "lucide-react";

// Navigation configuration
export const navigationConfig = [
  {
    title: "Planning",
    items: [
      {
        title: "Route Planner",
        href: "/route-planner",
        icon: Route,
        description: "Plan and optimize delivery routes"
      },
      {
        title: "Locations",
        href: "/locations",
        icon: MapPin,
        description: "Manage saved locations"
      },
      {
        title: "Schedule",
        href: "/schedule",
        icon: Calendar,
        description: "View and manage delivery schedules"
      }
    ]
  },
  {
    title: "Fleet",
    items: [
      {
        title: "Vehicles",
        href: "/vehicles",
        icon: Truck,
        description: "Manage vehicle fleet"
      },
      {
        title: "Drivers",
        href: "/drivers",
        icon: Users,
        description: "Manage driver assignments"
      }
    ]
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart,
        description: "View delivery analytics"
      },
      {
        title: "History",
        href: "/history",
        icon: History,
        description: "View past routes"
      }
    ]
  },
  {
    title: "System",
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Configure system settings"
      }
    ]
  }
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{
    title: string;
    href?: string;
  }>;
}

export default function DashboardLayout({ 
  children, 
  breadcrumbs = []
}: DashboardLayoutProps) {
  return (
    <div className="relative">
      <SidebarProvider>
        <AppSidebar/>
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                 
                  {breadcrumbs.map((crumb, index) => (
                    <BreadcrumbItem key={index}>
                      {crumb.href ? (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.title}
                        </BreadcrumbLink>
                      ) : (
                        <span className="text-muted-foreground">
                          {crumb.title}
                        </span>
                      )}
                    </BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}