'use client'
import React from 'react';
import { 
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  routeAlerts: boolean;
  weeklyReports: boolean;
}

const dummyCompanySettings: CompanySettings = {
  name: 'Acme Logistics',
  email: 'contact@acmelogistics.com',
  phone: '+1 (555) 123-4567',
  website: 'www.acmelogistics.com',
  address: '123 Business Ave, Toronto, ON M5V 2T6'
};

const dummyNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  routeAlerts: true,
  weeklyReports: false
};

export default function GeneralSettings() {
  const [companySettings, setCompanySettings] = React.useState<CompanySettings>(dummyCompanySettings);
  const [notifications, setNotifications] = React.useState<NotificationSettings>(dummyNotificationSettings);

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">General Settings</h1>
        <p className="text-muted-foreground">Manage your company profile and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>Update your company information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <div className="flex space-x-2">
                <Building2 className="h-4 w-4 mt-3 text-muted-foreground" />
                <Input
                  id="company-name"
                  value={companySettings.name}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex space-x-2">
                <Mail className="h-4 w-4 mt-3 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={companySettings.email}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="flex space-x-2">
                <Phone className="h-4 w-4 mt-3 text-muted-foreground" />
                <Input
                  id="phone"
                  value={companySettings.phone}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="flex space-x-2">
                <Globe className="h-4 w-4 mt-3 text-muted-foreground" />
                <Input
                  id="website"
                  value={companySettings.website}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="flex space-x-2">
                <MapPin className="h-4 w-4 mt-3 text-muted-foreground" />
                <Input
                  id="address"
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select defaultValue="est">
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="est">Eastern Time</SelectItem>
                    <SelectItem value="cst">Central Time</SelectItem>
                    <SelectItem value="pst">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Notifications</span>
                    </Label>
                    <Switch
                      id="email-notifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications" className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <span>Push Notifications</span>
                    </Label>
                    <Switch
                      id="push-notifications"
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}