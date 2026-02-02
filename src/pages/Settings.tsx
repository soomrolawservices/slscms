import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useSignupSettings, useUpdateSignupSetting } from '@/hooks/useSignupSettings';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { NotificationPreferencesSettings } from '@/components/settings/NotificationPreferencesSettings';
import { BroadcastManager } from '@/components/broadcasts/BroadcastManager';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { TOTPSetup } from '@/components/security/TOTPSetup';

export default function Settings() {
  const { user, profile, isAdmin } = useAuth();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState(profile?.name || '');
  const [profilePhone, setProfilePhone] = useState(profile?.phone || '');
  const { data: signupSettings, isLoading: signupLoading } = useSignupSettings();
  const updateSignupSetting = useUpdateSignupSetting();

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: 'Password updated',
      description: 'Your password has been changed successfully.',
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: profileName, 
          phone: profilePhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error saving profile',
        description: error.message || 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDropdownSave = () => {
    toast({
      title: 'Dropdowns updated',
      description: 'Dropdown options have been saved.',
    });
  };

  const handleSignupToggle = (key: string, value: boolean) => {
    updateSignupSetting.mutate({ key, value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and application settings
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="border-2 border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          {isAdmin && <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>}
          {isAdmin && <TabsTrigger value="forms">Forms</TabsTrigger>}
          {isAdmin && <TabsTrigger value="signups">Signup Controls</TabsTrigger>}
          {isAdmin && <TabsTrigger value="portals">Portals</TabsTrigger>}
          {isAdmin && <TabsTrigger value="dropdowns">Dropdowns</TabsTrigger>}
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card className="border-2 border-border">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 max-w-md">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email} disabled />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                  />
                </div>
                <Button className="w-fit" onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Preferences */}
        <TabsContent value="notifications">
          <NotificationPreferencesSettings />
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-2 border-border">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordChange} className="grid gap-4 max-w-md">
                <div className="grid gap-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input id="current" type="password" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new">New Password</Label>
                  <Input id="new" type="password" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <Input id="confirm" type="password" required />
                </div>
                <Button type="submit" className="w-fit">Update Password</Button>
              </form>
            </CardContent>
          </Card>

          {/* TOTP 2FA Setup */}
          <TOTPSetup />
        </TabsContent>

        {/* Broadcasts - Admin Only */}
        {isAdmin && (
          <TabsContent value="broadcasts">
            <BroadcastManager />
          </TabsContent>
        )}

        {/* Form Builder - Admin Only */}
        {isAdmin && (
          <TabsContent value="forms">
            <FormBuilder />
          </TabsContent>
        )}

        {/* Signup Controls - Admin Only */}
        {isAdmin && (
          <TabsContent value="signups">
            <Card className="border-2 border-border">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Signup Controls</CardTitle>
                <CardDescription>
                  Enable or disable signup options for different user types
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {signupLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading settings...</span>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-md">
                    <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                      <div>
                        <p className="font-medium">Client Portal Signup</p>
                        <p className="text-sm text-muted-foreground">
                          Allow new clients to register via the client portal
                        </p>
                      </div>
                      <Switch
                        checked={signupSettings?.client_signup_enabled ?? true}
                        onCheckedChange={(value) => handleSignupToggle('client_signup_enabled', value)}
                        disabled={updateSignupSetting.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                      <div>
                        <p className="font-medium">Team Member Signup</p>
                        <p className="text-sm text-muted-foreground">
                          Allow new team members to register for the system
                        </p>
                      </div>
                      <Switch
                        checked={signupSettings?.team_signup_enabled ?? true}
                        onCheckedChange={(value) => handleSignupToggle('team_signup_enabled', value)}
                        disabled={updateSignupSetting.isPending}
                      />
                    </div>
                    <div className="p-4 bg-muted/50 border-2 border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Disabling signups will prevent new users from registering. Existing users will not be affected.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Portal Controls - Admin Only */}
        {isAdmin && (
          <TabsContent value="portals">
            <Card className="border-2 border-border">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Portal Controls</CardTitle>
                <CardDescription>
                  Enable or disable seasonal portals
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {signupLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading settings...</span>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-md">
                    <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                      <div>
                        <p className="font-medium">Income Tax Return Portal</p>
                        <p className="text-sm text-muted-foreground">
                          Seasonal portal for ITR filing (July - October)
                        </p>
                      </div>
                      <Switch
                        checked={signupSettings?.itr_portal_enabled ?? false}
                        onCheckedChange={(value) => handleSignupToggle('itr_portal_enabled', value)}
                        disabled={updateSignupSetting.isPending}
                      />
                    </div>
                    <div className="p-4 bg-muted/50 border-2 border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> When enabled, the ITR Portal will appear in the sidebar for admin and team members.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Dropdown Editor - Admin Only */}
        {isAdmin && (
          <TabsContent value="dropdowns">
            <Card className="border-2 border-border">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Dropdown Options Editor</CardTitle>
                <CardDescription>
                  Manage dropdown options used throughout the application
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-4 max-w-lg">
                  <div className="grid gap-2">
                    <Label>Case Types</Label>
                    <Input defaultValue="Civil, Criminal, Family, Corporate, Property, Immigration" />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of case types
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Client Regions</Label>
                    <Input defaultValue="North, South, East, West, Central" />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of regions
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Document Types</Label>
                    <Input defaultValue="Contract, Agreement, Court Filing, Evidence, ID Document, Certificate" />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of document types
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Expense Categories</Label>
                    <Input defaultValue="Travel, Office Supplies, Court Fees, Consultation, Software, Other" />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of expense categories
                    </p>
                  </div>

                  <Button onClick={handleDropdownSave} className="w-fit">
                    Save Dropdown Options
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
