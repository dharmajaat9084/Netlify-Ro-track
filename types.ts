export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Overdue = 'Overdue',
}

export interface Payment {
  year: number;
  month: number; // 0-11 for Jan-Dec
  status: PaymentStatus;
  paymentDate?: string; // ISO string
  notes?: string;
  amount?: number;
}

export interface Customer {
  id: string;
  serialNumber: number;
  name: string;
  address: string;
  mobile: string;
  roModel: string;
  installationDate: string; // ISO string
  monthlyRent: number;
  payments: Payment[];
  enableMonthlyReminder?: boolean;
}

export interface AppSettings {
  paymentLink?: string;
}

export interface Reminder {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  message: string;
  messageHi: string;
  type: 'Overdue' | 'Monthly';
}

export type View =
  | { page: 'dashboard' }
  | { page: 'customers' }
  | { page: 'reminders' }
  | { page: 'profile'; customerId: string };
