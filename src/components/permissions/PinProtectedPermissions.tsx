import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, Shield, Clock, User, Key, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUsers } from '@/hooks/useUsers';
import { format, addDays, addHours } from 'date-fns';
import { cn } from '@/lib/utils';

const ADMIN_PIN = '1234'; // In production, this should be stored securely

const specialPermissions = [
  { id: 'view_all_data', label: 'View All Client Data', description: 'Access all client records regardless of assignment' },
  { id: 'export_sensitive', label: 'Export Sensitive Data', description: 'Export data containing confidential information' },
  { id: 'delete_records', label: 'Delete Any Record', description: 'Delete any record including those created by others' },
  { id: 'manage_users', label: 'User Management', description: 'Create, edit, and deactivate user accounts' },
  { id: 'financial_access', label: 'Financial Reports', description: 'Access detailed financial reports and analytics' },
  { id: 'audit_logs', label: 'Audit Log Access', description: 'View complete system audit logs' },
  { id: 'credential_view', label: 'View Credentials', description: 'View unmasked passwords and PINs' },
  { id: 'system_config', label: 'System Configuration', description: 'Modify system settings and integrations' },
];

const modules = ['clients', 'cases', 'documents', 'payments', 'invoices', 'appointments', 'credentials', 'users'];
const permissionTypes = ['can_create', 'can_read', 'can_update', 'can_delete', 'can_export', 'can_read_own'];

interface UserPermission {
  id: string;
  user_id: string;
  module: string;
  permission_type: string;
  expires_at: string | null;
  pin_protected: boolean | null;
  profiles?: { name: string; email: string };
}

export function PinProtectedPermissions() {
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPermission, setNewPermission] = useState({
    user_id: '',
    module: '',
    permission_type: '',
    expires_in: '',
    pin_protected: false,
  });

  const queryClient = useQueryClient();
  const { data: users = [] } = useUsers();

  const { data: userPermissions = [], isLoading } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as UserPermission[];
    },
    enabled: isPinVerified,
  });

  const addPermission = useMutation({
    mutationFn: async (data: typeof newPermission) => {
      let expires_at = null;
      if (data.expires_in === '1h') expires_at = addHours(new Date(), 1).toISOString();
      else if (data.expires_in === '24h') expires_at = addHours(new Date(), 24).toISOString();
      else if (data.expires_in === '7d') expires_at = addDays(new Date(), 7).toISOString();
      else if (data.expires_in === '30d') expires_at = addDays(new Date(), 30).toISOString();

      const { error } = await supabase.from('user_permissions').insert({
        user_id: data.user_id,
        module: data.module,
        permission_type: data.permission_type,
        expires_at,
        pin_protected: data.pin_protected,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      toast({ title: 'Permission granted successfully' });
      setShowAddDialog(false);
      setNewPermission({ user_id: '', module: '', permission_type: '', expires_in: '', pin_protected: false });
    },
    onError: (error: Error) => {
      toast({ title: 'Error granting permission', description: error.message, variant: 'destructive' });
    },
  });

  const deletePermission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_permissions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      toast({ title: 'Permission revoked' });
    },
  });

  const verifyPin = () => {
    if (pinInput === ADMIN_PIN) {
      setIsPinVerified(true);
      setShowPinDialog(false);
      setPinInput('');
      toast({ title: 'PIN verified', description: 'Access granted to special permissions' });
    } else {
      toast({ title: 'Invalid PIN', variant: 'destructive' });
      setPinInput('');
    }
  };

  if (!isPinVerified) {
    return (
      <>
        <Card className="border-0 shadow-md overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-gradient-to-br from-amber-500/20 to-amber-500/10 rounded-full mb-4">
              <Lock className="h-10 w-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">PIN Protected Area</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              This section contains sensitive permission controls. Enter your admin PIN to access special permissions and user-specific grants.
            </p>
            <Button 
              onClick={() => setShowPinDialog(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              <Key className="h-4 w-4 mr-2" />
              Enter PIN
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                Admin PIN Required
              </DialogTitle>
              <DialogDescription>Enter your 4-digit admin PIN to access special permissions</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
                onKeyDown={(e) => e.key === 'Enter' && verifyPin()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPinDialog(false)}>Cancel</Button>
              <Button onClick={verifyPin} disabled={pinInput.length !== 4}>Verify</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Special Permissions Grid */}
      <Card className="border-0 shadow-md overflow-hidden border-l-4 border-l-amber-500">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-amber-500/10 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                Special Permissions
              </CardTitle>
              <CardDescription>Advanced permissions for privileged operations</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsPinVerified(false)}
              className="text-amber-600 border-amber-500/50 hover:bg-amber-500/10"
            >
              <Lock className="h-4 w-4 mr-2" />
              Lock
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialPermissions.map((perm) => (
              <div
                key={perm.id}
                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="font-medium">{perm.label}</p>
                  <p className="text-sm text-muted-foreground">{perm.description}</p>
                </div>
                <Switch defaultChecked={perm.id === 'view_all_data' || perm.id === 'financial_access'} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User-Specific Permissions */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card to-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                User-Specific Permissions
              </CardTitle>
              <CardDescription>Grant temporary or custom permissions to individual users</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Permission
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : userPermissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No custom permissions granted yet
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {userPermissions.map((perm) => (
                <div key={perm.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{perm.profiles?.name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">
                        {perm.module} • {perm.permission_type.replace('can_', '').replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {perm.expires_at && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(perm.expires_at), 'MMM d, h:mm a')}
                      </div>
                    )}
                    {perm.pin_protected && (
                      <Lock className="h-4 w-4 text-amber-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePermission.mutate(perm.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Permission Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Permission</DialogTitle>
            <DialogDescription>Add a custom permission for a specific user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User *</Label>
              <Select
                value={newPermission.user_id}
                onValueChange={(value) => setNewPermission(prev => ({ ...prev, user_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Module *</Label>
              <Select
                value={newPermission.module}
                onValueChange={(value) => setNewPermission(prev => ({ ...prev, module: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module} value={module} className="capitalize">{module}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Permission Type *</Label>
              <Select
                value={newPermission.permission_type}
                onValueChange={(value) => setNewPermission(prev => ({ ...prev, permission_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select permission" />
                </SelectTrigger>
                <SelectContent>
                  {permissionTypes.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.replace('can_', '').replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expires In</Label>
              <Select
                value={newPermission.expires_in}
                onValueChange={(value) => setNewPermission(prev => ({ ...prev, expires_in: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Never (permanent)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/30">
              <Checkbox
                checked={newPermission.pin_protected}
                onCheckedChange={(checked) => setNewPermission(prev => ({ ...prev, pin_protected: checked as boolean }))}
              />
              <div>
                <p className="font-medium text-sm">PIN Protected</p>
                <p className="text-xs text-muted-foreground">Require PIN to use this permission</p>
              </div>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => addPermission.mutate(newPermission)}
              disabled={!newPermission.user_id || !newPermission.module || !newPermission.permission_type}
            >
              Grant Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
