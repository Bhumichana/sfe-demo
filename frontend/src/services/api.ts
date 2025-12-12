import axios, { AxiosError } from 'axios';
import { API_URL } from '@/lib/constants';
import type {
  LoginRequest,
  DemoLoginRequest,
  AuthResponse,
  ApiError,
  PreCallPlan,
  CreatePreCallPlanDto,
  UpdatePreCallPlanDto,
  ApproveRejectPreCallPlanDto,
  PlanStatus,
  CallReport,
  CreateCallReportDto,
  UpdateCallReportDto,
  CallReportStatus,
  Customer,
  CustomerWithStatistics,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerStatistics,
  CustomerType,
  Contact,
  ActivityTypeData,
} from '@/types';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sfe_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sfe_access_token');
        localStorage.removeItem('sfe_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  /**
   * Login with username and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Demo mode login (no password required)
   */
  loginDemo: async (username: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/demo', { username });
    return response.data;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

// Pre-Call Plans API
export const preCallPlansApi = {
  /**
   * Create a new pre-call plan (draft)
   */
  create: async (data: CreatePreCallPlanDto): Promise<PreCallPlan> => {
    const response = await api.post<PreCallPlan>('/pre-call-plans', data);
    return response.data;
  },

  /**
   * Get all pre-call plans with optional filters
   */
  findAll: async (params?: {
    status?: PlanStatus;
    srId?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PreCallPlan[]> => {
    const response = await api.get<PreCallPlan[]>('/pre-call-plans', { params });
    return response.data;
  },

  /**
   * Get all plans for a specific user (SR)
   */
  findByUser: async (userId: string, status?: PlanStatus): Promise<PreCallPlan[]> => {
    const response = await api.get<PreCallPlan[]>(`/pre-call-plans/user/${userId}`, {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  /**
   * Get pending approvals for a manager
   */
  findPendingApprovals: async (managerId: string): Promise<PreCallPlan[]> => {
    const response = await api.get<PreCallPlan[]>(
      `/pre-call-plans/pending-approvals/${managerId}`
    );
    return response.data;
  },

  /**
   * Get a specific pre-call plan by ID
   */
  findOne: async (id: string): Promise<PreCallPlan> => {
    const response = await api.get<PreCallPlan>(`/pre-call-plans/${id}`);
    return response.data;
  },

  /**
   * Update a draft pre-call plan
   */
  update: async (
    id: string,
    userId: string,
    data: UpdatePreCallPlanDto
  ): Promise<PreCallPlan> => {
    const response = await api.patch<PreCallPlan>(`/pre-call-plans/${id}`, data, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Delete a draft pre-call plan
   */
  remove: async (id: string, userId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/pre-call-plans/${id}`, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Submit a draft plan for approval
   */
  submit: async (id: string, userId: string): Promise<PreCallPlan> => {
    const url = `/pre-call-plans/${id}/submit`;
    console.log('🔗 API submit URL:', { url, id, userId, baseURL: API_URL });
    const response = await api.post<PreCallPlan>(url, {}, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Approve or reject a pending plan
   */
  approveOrReject: async (
    id: string,
    data: ApproveRejectPreCallPlanDto
  ): Promise<PreCallPlan> => {
    const response = await api.post<PreCallPlan>(
      `/pre-call-plans/${id}/approve-reject`,
      data
    );
    return response.data;
  },
};

// Call Reports API
export const callReportsApi = {
  /**
   * Get all call reports with optional filters
   */
  findAll: async (params?: {
    status?: CallReportStatus;
    srId?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CallReport[]> => {
    const response = await api.get<CallReport[]>('/call-reports', { params });
    return response.data;
  },

  /**
   * Get all reports for a specific user (SR)
   */
  findByUser: async (userId: string, status?: CallReportStatus): Promise<CallReport[]> => {
    const response = await api.get<CallReport[]>(`/call-reports/user/${userId}`, {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  /**
   * Get a specific call report by ID
   */
  findOne: async (id: string): Promise<CallReport> => {
    const response = await api.get<CallReport>(`/call-reports/${id}`);
    return response.data;
  },

  /**
   * Create a new call report
   */
  create: async (data: CreateCallReportDto): Promise<CallReport> => {
    const response = await api.post<CallReport>('/call-reports', data);
    return response.data;
  },

  /**
   * Update a draft call report
   */
  update: async (
    id: string,
    userId: string,
    data: UpdateCallReportDto
  ): Promise<CallReport> => {
    const response = await api.patch<CallReport>(`/call-reports/${id}`, data, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Delete a draft call report
   */
  remove: async (id: string, userId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/call-reports/${id}`, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Submit a draft report
   */
  submit: async (id: string, userId: string): Promise<CallReport> => {
    const response = await api.post<CallReport>(
      `/call-reports/${id}/submit`,
      {},
      {
        params: { userId },
      }
    );
    return response.data;
  },

  /**
   * Check-out from a call
   */
  checkOut: async (
    id: string,
    userId: string,
    data: {
      checkOutTime: string;
      checkOutLat: number;
      checkOutLng: number;
    }
  ): Promise<CallReport> => {
    const response = await api.post<CallReport>(
      `/call-reports/${id}/check-out?userId=${userId}`,
      data
    );
    return response.data;
  },

  /**
   * Get all photos for a call report
   */
  getPhotos: async (id: string): Promise<any[]> => {
    const response = await api.get<any[]>(`/call-reports/${id}/photos`);
    return response.data;
  },

  /**
   * Delete a photo from a call report
   */
  deletePhoto: async (callReportId: string, photoId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `/call-reports/${callReportId}/photos/${photoId}`
    );
    return response.data;
  },

  /**
   * Add coaching to a call report
   */
  addCoaching: async (
    reportId: string,
    data: {
      managerId: string;
      comments: string;
      rating: number;
    }
  ): Promise<any> => {
    const response = await api.post(`/call-reports/${reportId}/coach`, data);
    return response.data;
  },
};

// Activity Types API
export const activityTypesApi = {
  /**
   * Get all activity types
   */
  findAll: async (): Promise<ActivityTypeData[]> => {
    const response = await api.get<ActivityTypeData[]>('/activity-types');
    return response.data;
  },
};

// Notifications API
export const notificationsApi = {
  /**
   * Get notifications for a user
   */
  findByUser: async (userId: string, unreadOnly?: boolean): Promise<any[]> => {
    const response = await api.get(`/notifications/user/${userId}`, {
      params: unreadOnly ? { unreadOnly: true } : undefined,
    });
    return response.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: string, userId: string): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`, {}, {
      params: { userId },
    });
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead: async (userId: string): Promise<void> => {
    await api.put(`/notifications/user/${userId}/read-all`);
  },

  /**
   * Delete a notification
   */
  remove: async (notificationId: string, userId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`, {
      params: { userId },
    });
  },
};

// Analytics API
export const analyticsApi = {
  /**
   * Get analytics overview for company/territory
   */
  getOverview: async (params: {
    companyId: string;
    territoryId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await api.get('/analytics/overview', { params });
    return response.data;
  },

  /**
   * Get call metrics
   */
  getCallMetrics: async (params: {
    companyId: string;
    territoryId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await api.get('/analytics/call-metrics', { params });
    return response.data;
  },

  /**
   * Get ABC coverage metrics
   */
  getCoverage: async (params: {
    companyId: string;
    territoryId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await api.get('/analytics/coverage', { params });
    return response.data;
  },

  /**
   * Get activity breakdown
   */
  getActivities: async (params: {
    companyId: string;
    territoryId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await api.get('/analytics/activities', { params });
    return response.data;
  },

  /**
   * Export report
   */
  exportReport: async (data: {
    reportType: 'overview' | 'call-metrics' | 'coverage' | 'activities';
    format: 'pdf' | 'csv';
    companyId: string;
    territoryId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await api.post('/analytics/export', data);
    return response.data;
  },

  /**
   * Get Executive Dashboard (SM/SD only) - All 4 analysis sections
   */
  getExecutiveDashboard: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const response = await api.get('/analytics/executive-dashboard', { params });
    return response.data;
  },
};

// Contacts API
export const contactsApi = {
  /**
   * Create a new contact
   */
  create: async (data: {
    customerId: string;
    name: string;
    position?: string;
    phone?: string;
    email?: string;
    lineId?: string;
    isPrimary?: boolean;
  }): Promise<any> => {
    const response = await api.post('/contacts', data);
    return response.data;
  },

  /**
   * Get all contacts for a customer
   */
  findByCustomer: async (customerId: string): Promise<any[]> => {
    const response = await api.get(`/contacts/customer/${customerId}`);
    return response.data;
  },

  /**
   * Get one contact by ID
   */
  findOne: async (id: string): Promise<any> => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  /**
   * Update a contact
   */
  update: async (id: string, data: any): Promise<any> => {
    const response = await api.patch(`/contacts/${id}`, data);
    return response.data;
  },

  /**
   * Delete a contact
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/contacts/${id}`);
  },
};

// Users API
export const usersApi = {
  /**
   * Create a new user
   */
  create: async (data: {
    username: string;
    email: string;
    fullName: string;
    phone?: string;
    role: string;
    managerId?: string;
    companyId: string;
    territoryId?: string;
    password: string;
    isActive?: boolean;
  }): Promise<any> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  /**
   * Get all users with optional filters
   */
  findAll: async (params?: {
    companyId?: string;
    role?: string;
    territoryId?: string;
    isActive?: boolean;
  }): Promise<any[]> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  findOne: async (id: string): Promise<any> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Update a user
   */
  update: async (id: string, data: {
    username?: string;
    email?: string;
    fullName?: string;
    phone?: string;
    role?: string;
    managerId?: string;
    territoryId?: string;
    password?: string;
    avatarUrl?: string;
    isActive?: boolean;
  }): Promise<any> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Deactivate user (soft delete)
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  /**
   * Permanently delete user
   */
  hardDelete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}/hard`);
  },

  /**
   * Activate user
   */
  activate: async (id: string): Promise<void> => {
    await api.post(`/users/${id}/activate`);
  },

  /**
   * Get user statistics
   */
  getStatistics: async (companyId: string): Promise<any> => {
    const response = await api.get(`/users/statistics/${companyId}`);
    return response.data;
  },
};

// Teams API
export const teamsApi = {
  /**
   * Create a new team
   */
  create: async (data: {
    code: string;
    name: string;
    description?: string;
    leaderId?: string;
    companyId: string;
    isActive?: boolean;
  }): Promise<any> => {
    const response = await api.post('/teams', data);
    return response.data;
  },

  /**
   * Get all teams with optional filters
   */
  findAll: async (params?: {
    companyId?: string;
    isActive?: boolean;
  }): Promise<any[]> => {
    const response = await api.get('/teams', { params });
    return response.data;
  },

  /**
   * Get team by ID
   */
  findOne: async (id: string): Promise<any> => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  /**
   * Update a team
   */
  update: async (id: string, data: {
    code?: string;
    name?: string;
    description?: string;
    leaderId?: string;
    isActive?: boolean;
  }): Promise<any> => {
    const response = await api.patch(`/teams/${id}`, data);
    return response.data;
  },

  /**
   * Deactivate team (soft delete)
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },

  /**
   * Activate team
   */
  activate: async (id: string): Promise<void> => {
    await api.post(`/teams/${id}/activate`);
  },

  /**
   * Get team statistics
   */
  getStatistics: async (companyId: string): Promise<any> => {
    const response = await api.get(`/teams/statistics/${companyId}`);
    return response.data;
  },
};

// Territories API
export const territoriesApi = {
  /**
   * Create a new territory
   */
  create: async (data: {
    code: string;
    nameTh: string;
    nameEn: string;
    description?: string;
    provinces?: string[];
    companyId: string;
    isActive?: boolean;
  }): Promise<any> => {
    const response = await api.post('/territories', data);
    return response.data;
  },

  /**
   * Get all territories with optional filters
   */
  findAll: async (params?: {
    companyId?: string;
    isActive?: boolean;
  }): Promise<any[]> => {
    const response = await api.get('/territories', { params });
    return response.data;
  },

  /**
   * Get territory by ID
   */
  findOne: async (id: string): Promise<any> => {
    const response = await api.get(`/territories/${id}`);
    return response.data;
  },

  /**
   * Update a territory
   */
  update: async (id: string, data: {
    code?: string;
    nameTh?: string;
    nameEn?: string;
    description?: string;
    provinces?: string[];
    isActive?: boolean;
  }): Promise<any> => {
    const response = await api.patch(`/territories/${id}`, data);
    return response.data;
  },

  /**
   * Deactivate territory (soft delete)
   */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/territories/${id}`);
  },

  /**
   * Activate territory
   */
  activate: async (id: string): Promise<void> => {
    await api.post(`/territories/${id}/activate`);
  },

  /**
   * Get territory statistics
   */
  getStatistics: async (companyId: string): Promise<any> => {
    const response = await api.get(`/territories/statistics/${companyId}`);
    return response.data;
  },
};

// Customers API
export const customersApi = {
  /**
   * Create a new customer
   */
  create: async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  },

  /**
   * Get all customers with optional filters
   */
  findAll: async (params?: {
    territoryId?: string;
    type?: CustomerType;
    search?: string;
    isActive?: boolean;
  }): Promise<Customer[]> => {
    const response = await api.get<Customer[]>('/customers', { params });
    return response.data;
  },

  /**
   * Get my customers based on user role
   */
  getMyCustomers: async (params?: {
    territoryId?: string;
    type?: CustomerType;
    search?: string;
  }): Promise<CustomerWithStatistics[]> => {
    const response = await api.get<CustomerWithStatistics[]>('/customers/my-customers', {
      params,
    });
    return response.data;
  },

  /**
   * Get a specific customer by ID
   */
  findOne: async (id: string): Promise<Customer> => {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  /**
   * Get customer statistics
   */
  getStatistics: async (
    id: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<CustomerStatistics> => {
    const response = await api.get<CustomerStatistics>(`/customers/${id}/statistics`, {
      params,
    });
    return response.data;
  },

  /**
   * Update a customer
   */
  update: async (
    id: string,
    userId: string,
    data: UpdateCustomerDto
  ): Promise<Customer> => {
    const response = await api.patch<Customer>(`/customers/${id}`, data, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Delete (soft delete) a customer
   */
  remove: async (id: string, userId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/customers/${id}`, {
      params: { userId },
    });
    return response.data;
  },
};

// Manager API
export const managerApi = {
  /**
   * Get manager dashboard statistics
   */
  getDashboard: async (
    managerId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<any> => {
    const response = await api.get(`/manager/dashboard/${managerId}`, { params });
    return response.data;
  },

  /**
   * Get team members list
   */
  getTeamMembers: async (managerId: string): Promise<any> => {
    const response = await api.get(`/manager/team/${managerId}`);
    return response.data;
  },

  /**
   * Get call reports for review
   */
  getCallReports: async (
    managerId: string,
    params?: {
      srId?: string;
      customerId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<any> => {
    const response = await api.get(`/manager/call-reports/${managerId}`, { params });
    return response.data;
  },

  /**
   * Get team pre-call plans
   */
  getTeamPlans: async (managerId: string): Promise<any> => {
    const response = await api.get(`/manager/team-plans/${managerId}`);
    return response.data;
  },

  /**
   * Get team performance metrics
   */
  getTeamPerformance: async (
    managerId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<any> => {
    const response = await api.get(`/manager/team-performance/${managerId}`, { params });
    return response.data;
  },
};
