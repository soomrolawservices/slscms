// Core types for the Legal Case Management System

export type UserRole = 'admin' | 'team_member';

export type UserStatus = 'pending' | 'active' | 'blocked';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  cnic?: string;
  role: UserRole;
  status: UserStatus;
  profilePic?: string;
  createdAt: Date;
}

export type ClientType = 'individual' | 'corporate' | 'government';
export type ClientStatus = 'active' | 'inactive';

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  phone: string;
  email: string;
  cnic: string;
  region: string;
  status: ClientStatus;
  createdAt: Date;
  assignedTo?: string[];
}

export type CaseStatus = 'open' | 'in_progress' | 'pending' | 'closed' | 'archived';

export interface Case {
  id: string;
  title: string;
  clientId: string;
  status: CaseStatus;
  assignedMembers: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  size: number;
  uploadDate: Date;
  clientId: string;
  caseId?: string;
  url: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  title: string;
  amount: number;
  clientId: string;
  caseId?: string;
  date: Date;
  status: PaymentStatus;
}

export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'partial';

export interface Invoice {
  id: string;
  amount: number;
  clientId: string;
  caseId?: string;
  status: InvoiceStatus;
  dueDate: Date;
  createdAt: Date;
}

export interface Expense {
  id: string;
  date: Date;
  title: string;
  amount: number;
  category: string;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type AppointmentType = 'in_office' | 'outdoor' | 'virtual';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface Appointment {
  id: string;
  date: Date;
  time: string;
  topic: string;
  duration: number;
  type: AppointmentType;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  platform?: string;
  status: AppointmentStatus;
}

export interface Credential {
  id: string;
  clientId: string;
  platform: string;
  url: string;
  username: string;
  password: string;
  pin?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}
