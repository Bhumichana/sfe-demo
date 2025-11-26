// User roles
export type UserRole = 'SR' | 'SUP' | 'SM' | 'PM' | 'MM';

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  managerId?: string;
  companyId?: string;
  territoryId?: string;
  territory?: Territory;
  company?: Company;
  googleId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Company interface
export interface Company {
  id: string;
  name: string;
  code: string;
}

// Territory interface
export interface Territory {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface DemoLoginRequest {
  username: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Customer ABC Classification
export type CustomerClass = 'A' | 'B' | 'C';

export interface Customer {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  customerClass: CustomerClass;
  annualRevenue: number;
  territoryId: string;
  territory?: Territory;
}

// Contact interface
export interface Contact {
  id: string;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

// Pre-Call Plan Status
export type PlanStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

// Pre-Call Plan interface
export interface PreCallPlan {
  id: string;
  srId: string;
  customerId: string;
  contactId: string;
  planDate: string;
  objectives?: string;
  plannedActivities?: string[];
  status: PlanStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  comments?: any;
  createdAt: string;
  updatedAt: string;

  // Relations
  sr?: {
    id: string;
    fullName: string;
    email: string;
    role?: string;
  };
  customer?: {
    id: string;
    code: string;
    name: string;
    type: string;
    address?: string;
    phone?: string;
  };
  contact?: Contact;
  approver?: {
    id: string;
    fullName: string;
    email?: string;
  };
}

// Pre-Call Plan DTOs
export interface CreatePreCallPlanDto {
  srId: string;
  customerId: string;
  contactId: string;
  planDate: string;
  objectives?: string;
  plannedActivities?: string[];
}

export interface UpdatePreCallPlanDto {
  customerId?: string;
  contactId?: string;
  planDate?: string;
  objectives?: string;
  plannedActivities?: string[];
}

export interface ApproveRejectPreCallPlanDto {
  action: 'approve' | 'reject';
  approverId: string;
  reason?: string;
}

// Call Report Status
export type CallReportStatus = 'DRAFT' | 'SUBMITTED';

// Call Report Activity Type
export type ActivityType = 'VIRTUAL' | 'FACE_TO_FACE';

// Call Report interface
export interface CallReport {
  id: string;
  preCallPlanId?: string;
  srId: string;
  customerId: string;
  contactId: string;
  callDate: string;
  checkInTime?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkOutTime?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  activityType: ActivityType;
  activitiesDone: string[];
  customerResponse?: string;
  customerRequest?: string;
  customerObjections?: string;
  customerNeeds?: string;
  customerComplaints?: string;
  nextAction?: string;
  status: CallReportStatus;
  isPlanned: boolean;
  durationMinutes?: number;
  photos?: string[];
  createdAt: string;
  updatedAt: string;

  // Relations
  sr?: {
    id: string;
    fullName: string;
    email: string;
    role?: string;
  };
  customer?: {
    id: string;
    code: string;
    name: string;
    type: string;
    address?: string;
    phone?: string;
  };
  contact?: Contact;
  preCallPlan?: PreCallPlan;
}

// Call Report DTOs
export interface CreateCallReportDto {
  preCallPlanId?: string;
  srId: string;
  customerId: string;
  contactId: string;
  callDate: string;
  checkInTime?: string;
  checkInLat?: number;
  checkInLng?: number;
  activityType: ActivityType;
  activitiesDone: string[];
  customerResponse?: string;
  customerRequest?: string;
  customerObjections?: string;
  customerNeeds?: string;
  customerComplaints?: string;
  nextAction?: string;
  isPlanned: boolean;
}

export interface UpdateCallReportDto {
  checkInTime?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkOutTime?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  activityType?: ActivityType;
  activitiesDone?: string[];
  customerResponse?: string;
  customerRequest?: string;
  customerObjections?: string;
  customerNeeds?: string;
  customerComplaints?: string;
  nextAction?: string;
  durationMinutes?: number;
}

// Activity Type interface (Master Data)
export interface ActivityTypeData {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  category?: string;
  requiresPhoto?: boolean;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

// API Error Response
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
