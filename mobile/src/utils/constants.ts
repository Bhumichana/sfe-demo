export const API_URL = process.env.API_URL || 'http://localhost:3000/api';

export const USER_ROLES = {
  SR: 'SR',
  SUP: 'SUP',
  SM: 'SM',
  PM: 'PM',
  MM: 'MM',
} as const;

export const CUSTOMER_TYPES = {
  A: 'A',
  B: 'B',
  C: 'C',
} as const;

export const DEMO_USERS = {
  MANAGER: { username: 'manager', password: 'demo1234' },
  SALES1: { username: 'sales1', password: 'demo1234' },
  SALES2: { username: 'sales2', password: 'demo1234' },
  PM: { username: 'pm', password: 'demo1234' },
};
