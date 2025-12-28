import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { usePermissions, useUpdatePermission, type PermissionData } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { PinProtectedPermissions } from '@/components/permissions/PinProtectedPermissions';
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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Permissions
          </h1>
          <p className="text-muted-foreground">Manage role-based access control</p>
        </div>
      </div>

      {/* Role Selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedRole === 'team_member' ? 'default' : 'outline'}
          onClick={() => setSelectedRole('team_member')}
          className={selectedRole === 'team_member' ? 'bg-gradient-to-r from-primary to-primary/90' : ''}
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
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
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
                    <tr className="border-b border-border bg-muted/30">
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
                        <tr key={module} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-medium capitalize">{module}</td>
                          {permissionKeys.map((key) => (
                            <td key={key} className="text-center p-4">
                              <Checkbox
                                checked={permission?.[key] ?? false}
                                onCheckedChange={() => handleToggle(module, key)}
                                disabled={updatePermission.isPending}
                                className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
              <div className="md:hidden divide-y divide-border/50">
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

      {/* PIN-Protected Permissions Section */}
      <PinProtectedPermissions />
    </div>
  );
}
