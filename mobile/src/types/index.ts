export type UserRole = 'SR' | 'SUP' | 'SM' | 'PM' | 'MM';
export type CustomerType = 'A' | 'B' | 'C';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  companyId: string;
  territoryId?: string;
  isActive: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  monthlyRevenue?: number;
  address?: string;
  lat?: number;
  lng?: number;
  district?: string;
  province?: string;
  phone?: string;
  territoryId?: string;
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
}
