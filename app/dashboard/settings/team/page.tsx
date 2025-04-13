'use client'
import React from 'react';
import { 
  UserPlus,
  Mail,
  Phone,
  Shield,
  MoreVertical,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  phone: string;
  avatar: string;
  lastActive: string;
}

const dummyTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    role: 'Admin',
    status: 'active',
    phone: '+1 (555) 123-4567',
    avatar: '/placeholder/48',
    lastActive: '2024-02-21T10:00:00'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    role: 'Driver',
    status: 'active',
    phone: '+1 (555) 987-6543',
    avatar: '/placeholder/48',
    lastActive: '2024-02-21T09:30:00'
  },
  // Add more dummy team members
];

interface RoleCount {
  role: string;
  count: number;
  icon: React.ReactNode;
}

const roleStats: RoleCount[] = [
  { role: 'Admins', count: 2, icon: <Shield className="h-4 w-4" /> },
  { role: 'Drivers', count: 8, icon: <Users className="h-4 w-4" /> },
  // Add more role statistics
];

export default function TeamManagement() {

  const router = useRouter();
  const { status } = useSession();
  
  if (status === "unauthenticated"){

    router.push("/auth/login");

  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage your team members and their roles</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roleStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.role}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dummyTeamMembers.map((member) => (
          <Card key={member.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Edit Details</DropdownMenuItem>
                  <DropdownMenuItem>Change Role</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  {member.email}
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  {member.phone}
                </div>
                <div className="flex items-center justify-between">
                  <Badge>
                    {member.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Last active: {new Date(member.lastActive).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}