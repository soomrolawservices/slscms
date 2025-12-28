import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { usePermissions, useUpdatePermission, type PermissionData } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const modules = ['clients', 'cases', 'documents', 'payments', 'invoices', 'appointments', 'credentials'] as const;
const permissionKeys = ['can_create', 'can_read', 'can_update', 'can_delete', 'can_export'] as const;
type PermissionKey = typeof permissionKeys[number];

export default function Permissions() {
  const { isAdmin } = useAuth();
  const { data: permissions = [], isLoading } = usePermissions();
  const updatePermission = useUpdatePermission();
  const [selectedRole, setSelectedRole] = useState<AppRole>('team_member');

  const getPermission = (module: string) => {
    return permissions.find((p) => p.module === module && p.role === selectedRole);
  };

  const handleToggle = async (module: string, key: PermissionKey) => {
    const permission = getPermission(module);
    if (!permission) return;

    await updatePermission.mutateAsync({
      id: permission.id,
      [key]: !permission[key],
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Permissions</h1>
          <p className="text-muted-foreground">Manage role-based access control</p>
        </div>
      </div>

      {/* Role Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedRole === 'team_member' ? 'default' : 'outline'}
          onClick={() => setSelectedRole('team_member')}
        >
          Team Member
        </Button>
        <Button
          variant={selectedRole === 'admin' ? 'default' : 'outline'}
          onClick={() => setSelectedRole('admin')}
          disabled
        >
          Admin (Full Access)
        </Button>
      </div>

      {/* Permissions Matrix */}
      <Card className="border-2 border-border overflow-hidden">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-lg">
            {selectedRole === 'team_member' ? 'Team Member' : 'Admin'} Permissions
          </CardTitle>
          <CardDescription>Configure what this role can do in each module</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading permissions...</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border bg-muted/50">
                      <th className="text-left p-4 font-bold">Module</th>
                      <th className="text-center p-4 font-bold">Create</th>
                      <th className="text-center p-4 font-bold">Read</th>
                      <th className="text-center p-4 font-bold">Update</th>
                      <th className="text-center p-4 font-bold">Delete</th>
                      <th className="text-center p-4 font-bold">Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module) => {
                      const permission = getPermission(module);
                      return (
                        <tr key={module} className="border-b border-border">
                          <td className="p-4 font-medium capitalize">{module}</td>
                          {permissionKeys.map((key) => (
                            <td key={key} className="text-center p-4">
                              <Checkbox
                                checked={permission?.[key] ?? false}
                                onCheckedChange={() => handleToggle(module, key)}
                                disabled={updatePermission.isPending}
                                className="h-5 w-5"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y-2 divide-border">
                {modules.map((module) => {
                  const permission = getPermission(module);
                  return (
                    <div key={module} className="p-4">
                      <p className="font-medium capitalize mb-3">{module}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {permissionKeys.map((key) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={permission?.[key] ?? false}
                              onCheckedChange={() => handleToggle(module, key)}
                              disabled={updatePermission.isPending}
                            />
                            <span className="text-sm capitalize">{key.replace('can_', '')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Special Permissions */}
      <Card className="border-2 border-border">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-lg">Special Permissions</CardTitle>
          <CardDescription>Additional access controls for sensitive operations</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium">Approve Signup Requests</p>
              <p className="text-sm text-muted-foreground">Can approve or reject new team member registrations</p>
            </div>
            <Checkbox disabled checked={selectedRole === 'admin'} />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium">View Sensitive Credentials</p>
              <p className="text-sm text-muted-foreground">Can view unmasked passwords and PINs</p>
            </div>
            <Checkbox checked={selectedRole === 'admin'} disabled />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium">Access All Client Data</p>
              <p className="text-sm text-muted-foreground">Can view data for all clients, not just assigned ones</p>
            </div>
            <Checkbox checked={selectedRole === 'admin'} disabled />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
