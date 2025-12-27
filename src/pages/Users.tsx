import { useState } from 'react';
import { MoreHorizontal, Check, X, Eye, UserCog, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/types';
import { toast } from '@/hooks/use-toast';

const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@legalflow.com',
    name: 'Admin User',
    phone: '+1 555-0100',
    cnic: '11111-2222333-4',
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'john.lawyer@legalflow.com',
    name: 'John Lawyer',
    phone: '+1 555-0101',
    cnic: '22222-3333444-5',
    role: 'team_member',
    status: 'active',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: '3',
    email: 'jane.doe@legalflow.com',
    name: 'Jane Doe',
    phone: '+1 555-0102',
    cnic: '33333-4444555-6',
    role: 'team_member',
    status: 'pending',
    createdAt: new Date('2024-06-20'),
  },
  {
    id: '4',
    email: 'mark.smith@legalflow.com',
    name: 'Mark Smith',
    phone: '+1 555-0103',
    cnic: '44444-5555666-7',
    role: 'team_member',
    status: 'blocked',
    createdAt: new Date('2024-03-10'),
  },
];

export default function Users() {
  const [users, setUsers] = useState(mockUsers);
  const [activeTab, setActiveTab] = useState('all');

  const filteredUsers = users.filter((user) =>
    activeTab === 'all' ? true : user.status === activeTab
  );

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={row.profilePic} />
            <AvatarFallback className="text-xs bg-muted">
              {row.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
    },
    {
      key: 'cnic',
      header: 'CNIC',
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <span className="capitalize">{row.role.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const handleApprove = (user: User) => {
    setUsers(users.map(u => 
      u.id === user.id ? { ...u, status: 'active' as const } : u
    ));
    toast({
      title: 'User approved',
      description: `${user.name} has been activated.`,
    });
  };

  const handleReject = (user: User) => {
    setUsers(users.filter(u => u.id !== user.id));
    toast({
      title: 'User rejected',
      description: `${user.name}'s request has been rejected.`,
    });
  };

  const handleBlock = (user: User) => {
    setUsers(users.map(u => 
      u.id === user.id ? { ...u, status: 'blocked' as const } : u
    ));
    toast({
      title: 'User blocked',
      description: `${user.name} has been blocked.`,
    });
  };

  const handleUnblock = (user: User) => {
    setUsers(users.map(u => 
      u.id === user.id ? { ...u, status: 'active' as const } : u
    ));
    toast({
      title: 'User unblocked',
      description: `${user.name} has been unblocked.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Users
          </h1>
          <p className="text-muted-foreground">
            Manage team members and access
          </p>
        </div>
      </div>

      {/* Pending Requests Alert */}
      {users.filter(u => u.status === 'pending').length > 0 && (
        <div className="border-2 border-border bg-muted/50 p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Pending Approval Requests</p>
            <p className="text-sm text-muted-foreground">
              {users.filter(u => u.status === 'pending').length} users waiting for approval
            </p>
          </div>
          <Button variant="outline" onClick={() => setActiveTab('pending')}>
            Review
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-2 border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            data={filteredUsers}
            columns={columns}
            searchPlaceholder="Search users..."
            searchKey="name"
            actions={(row) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-2 border-border">
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    View Activity
                  </DropdownMenuItem>
                  {row.status === 'pending' && (
                    <>
                      <DropdownMenuItem onClick={() => handleApprove(row)}>
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleReject(row)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </DropdownMenuItem>
                    </>
                  )}
                  {row.status === 'active' && row.role !== 'admin' && (
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleBlock(row)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Block
                    </DropdownMenuItem>
                  )}
                  {row.status === 'blocked' && (
                    <DropdownMenuItem onClick={() => handleUnblock(row)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Unblock
                    </DropdownMenuItem>
                  )}
                  {row.role !== 'admin' && (
                    <DropdownMenuItem>
                      <UserCog className="h-4 w-4 mr-2" />
                      Change Role
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
