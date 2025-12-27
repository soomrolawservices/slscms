import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
}

interface RolePermissions {
  clients: Permission;
  cases: Permission;
  documents: Permission;
  payments: Permission;
  invoices: Permission;
  appointments: Permission;
  credentials: Permission;
}

const defaultPermissions: Record<string, RolePermissions> = {
  team_member: {
    clients: { create: true, read: true, update: true, delete: false, export: true },
    cases: { create: true, read: true, update: true, delete: false, export: true },
    documents: { create: true, read: true, update: true, delete: false, export: true },
    payments: { create: false, read: true, update: false, delete: false, export: false },
    invoices: { create: false, read: true, update: false, delete: false, export: true },
    appointments: { create: true, read: true, update: true, delete: true, export: false },
    credentials: { create: false, read: true, update: false, delete: false, export: false },
  },
  manager: {
    clients: { create: true, read: true, update: true, delete: true, export: true },
    cases: { create: true, read: true, update: true, delete: true, export: true },
    documents: { create: true, read: true, update: true, delete: true, export: true },
    payments: { create: true, read: true, update: true, delete: false, export: true },
    invoices: { create: true, read: true, update: true, delete: false, export: true },
    appointments: { create: true, read: true, update: true, delete: true, export: true },
    credentials: { create: true, read: true, update: true, delete: false, export: false },
  },
};

const modules = ['clients', 'cases', 'documents', 'payments', 'invoices', 'appointments', 'credentials'] as const;
const permissions = ['create', 'read', 'update', 'delete', 'export'] as const;

export default function Permissions() {
  const [rolePermissions, setRolePermissions] = useState(defaultPermissions);
  const [selectedRole, setSelectedRole] = useState<'team_member' | 'manager'>('team_member');

  const togglePermission = (module: keyof RolePermissions, permission: keyof Permission) => {
    setRolePermissions(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [module]: {
          ...prev[selectedRole][module],
          [permission]: !prev[selectedRole][module][permission],
        },
      },
    }));
  };

  const handleSave = () => {
    toast({
      title: 'Permissions saved',
      description: 'Role permissions have been updated successfully.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Permissions
          </h1>
          <p className="text-muted-foreground">
            Manage role-based access control
          </p>
        </div>
        <Button onClick={handleSave} className="shadow-xs">
          Save Changes
        </Button>
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
          variant={selectedRole === 'manager' ? 'default' : 'outline'}
          onClick={() => setSelectedRole('manager')}
        >
          Manager
        </Button>
      </div>

      {/* Permissions Matrix */}
      <Card className="border-2 border-border overflow-hidden">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-lg">
            {selectedRole === 'team_member' ? 'Team Member' : 'Manager'} Permissions
          </CardTitle>
          <CardDescription>
            Configure what this role can do in each module
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border bg-muted/50">
                  <th className="text-left p-4 font-bold">Module</th>
                  {permissions.map((perm) => (
                    <th key={perm} className="text-center p-4 font-bold capitalize">
                      {perm}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module} className="border-b border-border">
                    <td className="p-4 font-medium capitalize">{module}</td>
                    {permissions.map((perm) => (
                      <td key={perm} className="text-center p-4">
                        <Switch
                          checked={rolePermissions[selectedRole][module][perm]}
                          onCheckedChange={() => togglePermission(module, perm)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y-2 divide-border">
            {modules.map((module) => (
              <div key={module} className="p-4">
                <p className="font-medium capitalize mb-3">{module}</p>
                <div className="grid grid-cols-2 gap-3">
                  {permissions.map((perm) => (
                    <div key={perm} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{perm}</span>
                      <Switch
                        checked={rolePermissions[selectedRole][module][perm]}
                        onCheckedChange={() => togglePermission(module, perm)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Special Permissions */}
      <Card className="border-2 border-border">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-lg">Special Permissions</CardTitle>
          <CardDescription>
            Additional access controls for sensitive operations
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Approve Signup Requests</p>
              <p className="text-sm text-muted-foreground">
                Can approve or reject new team member registrations
              </p>
            </div>
            <Switch disabled checked={false} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">View Sensitive Credentials</p>
              <p className="text-sm text-muted-foreground">
                Can view unmasked passwords and PINs
              </p>
            </div>
            <Switch
              checked={selectedRole === 'manager'}
              onCheckedChange={() => {}}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Access All Client Data</p>
              <p className="text-sm text-muted-foreground">
                Can view data for all clients, not just assigned ones
              </p>
            </div>
            <Switch
              checked={selectedRole === 'manager'}
              onCheckedChange={() => {}}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
