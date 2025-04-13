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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"

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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { data: session, status } = useSession();
  const log: any = session?.user?.email;
  const [credit, setCredits] = useState(0);

  data.user.email = log;
/*
  const loadCredits = async() => {
  
      const credits = await check_credits(log);
      setCredits(credits ?? 0);
     // console.log(credits);
     
    }

      if (credit <= 0){

        setTimeout(() => {

           loadCredits();




      }, 0);

      }

    */

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
      <div className="mb-8">
              {/* Logo centered just below the top */}
              <img
                src="/logo.png"  // Logo path
                alt="Reroute Logo"
                className="h-32 mb-6"  // Logo size doubled (h-64) and moved closer to the top
              />
             
            </div>
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
