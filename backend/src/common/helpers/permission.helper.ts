import { UserRole } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

/**
 * Permission Helper Functions
 * จัดการสิทธิ์การเข้าถึงข้อมูลตาม Role
 */

/**
 * ตรวจสอบว่า Role สามารถเห็น Call Plan และ Call Report ได้หรือไม่
 */
export function canAccessCallActivities(role: UserRole): boolean {
  // CEO ไม่สามารถเห็น Call Plan และ Call Report
  if (role === UserRole.CEO) {
    return false;
  }

  // Role อื่นๆ สามารถเห็นได้
  const allowedRoles: UserRole[] = [UserRole.SD, UserRole.SM, UserRole.SUP, UserRole.SR];
  return allowedRoles.includes(role);
}

/**
 * ตรวจสอบว่า Role สามารถจัดการผู้ใช้งานได้หรือไม่
 */
export function canManageUsers(role: UserRole): boolean {
  // เฉพาะ CEO ที่สามารถจัดการผู้ใช้งาน (สร้าง/แก้/ลบ)
  return role === UserRole.CEO;
}

/**
 * ตรวจสอบว่า Role สามารถจัดการทีมและเขตพื้นที่ได้หรือไม่
 */
export function canManageTeamsAndTerritories(role: UserRole): boolean {
  // SD และ SM สามารถจัดการทีมและเขตพื้นที่
  const allowedRoles: UserRole[] = [UserRole.SD, UserRole.SM];
  return allowedRoles.includes(role);
}

/**
 * ตรวจสอบว่า Role สามารถจัดการ Activities ได้หรือไม่
 */
export function canManageActivities(role: UserRole): boolean {
  // SD และ SM สามารถจัดการ Activities
  const allowedRoles: UserRole[] = [UserRole.SD, UserRole.SM];
  return allowedRoles.includes(role);
}

/**
 * ตรวจสอบว่า Role สามารถ Coach ได้หรือไม่
 */
export function canCoach(role: UserRole): boolean {
  // Supervisor, SM, และ SD สามารถ Coach ได้
  const allowedRoles: UserRole[] = [UserRole.SUP, UserRole.SM, UserRole.SD];
  return allowedRoles.includes(role);
}

/**
 * ตรวจสอบว่า User สามารถเข้าถึงข้อมูลของ Target User ได้หรือไม่
 * @param currentUser User ที่กำลังขอเข้าถึงข้อมูล
 * @param targetUserId ID ของ User ที่ต้องการเข้าถึง
 * @param subordinateIds Array ของ ID ของลูกทีม (ถ้ามี)
 */
export function canAccessUserData(
  currentUser: any,
  targetUserId: string,
  subordinateIds?: string[],
): boolean {
  // SR สามารถเข้าถึงข้อมูลของตัวเองเท่านั้น
  if (currentUser.role === UserRole.SR) {
    return currentUser.id === targetUserId;
  }

  // Supervisor สามารถเข้าถึงข้อมูลของตัวเองและลูกทีม
  if (currentUser.role === UserRole.SUP) {
    return (
      currentUser.id === targetUserId ||
      (subordinateIds && subordinateIds.includes(targetUserId))
    );
  }

  // SD และ SM สามารถเข้าถึงข้อมูลของ Supervisor และ SR ทั้งหมด
  const managementRoles: UserRole[] = [UserRole.SD, UserRole.SM];
  if (managementRoles.includes(currentUser.role)) {
    return true;
  }

  // CEO สามารถเข้าถึงข้อมูลผู้ใช้ทั้งหมด (แต่ไม่ใช่ Call Activities)
  if (currentUser.role === UserRole.CEO) {
    return true;
  }

  return false;
}

/**
 * ตรวจสอบและโยน Exception ถ้าไม่มีสิทธิ์เข้าถึง Call Activities
 */
export function requireCallActivityAccess(role: UserRole): void {
  if (!canAccessCallActivities(role)) {
    throw new ForbiddenException('CEO cannot access call plans and call reports');
  }
}

/**
 * ตรวจสอบและโยน Exception ถ้าไม่มีสิทธิ์จัดการผู้ใช้
 */
export function requireUserManagement(role: UserRole): void {
  if (!canManageUsers(role)) {
    throw new ForbiddenException('Only CEO can manage users');
  }
}

/**
 * ตรวจสอบและโยน Exception ถ้าไม่มีสิทธิ์เข้าถึงข้อมูล User
 */
export function requireUserDataAccess(
  currentUser: any,
  targetUserId: string,
  subordinateIds?: string[],
): void {
  if (!canAccessUserData(currentUser, targetUserId, subordinateIds)) {
    throw new ForbiddenException('You do not have permission to access this data');
  }
}

/**
 * ดึง ID ของลูกทีมทั้งหมด (สำหรับ Supervisor)
 */
export async function getSubordinateIds(prisma: any, managerId: string): Promise<string[]> {
  const subordinates = await prisma.user.findMany({
    where: { managerId },
    select: { id: true },
  });

  return subordinates.map((s) => s.id);
}

/**
 * สร้าง Where Clause สำหรับ Query ข้อมูลตาม Role
 */
export function buildDataAccessFilter(currentUser: any, subordinateIds?: string[]): any {
  // SR: เห็นเฉพาะข้อมูลของตัวเอง
  if (currentUser.role === UserRole.SR) {
    return { srId: currentUser.id };
  }

  // Supervisor: เห็นข้อมูลของตัวเองและลูกทีม
  if (currentUser.role === UserRole.SUP) {
    return {
      srId: {
        in: [currentUser.id, ...(subordinateIds || [])],
      },
    };
  }

  // SD, SM: เห็นข้อมูลทั้งหมดใน company
  const managementRoles: UserRole[] = [UserRole.SD, UserRole.SM];
  if (managementRoles.includes(currentUser.role)) {
    return {}; // No filter - can see all
  }

  // CEO: ไม่ควรเรียกฟังก์ชันนี้เพราะไม่สามารถเข้าถึง Call Activities
  if (currentUser.role === UserRole.CEO) {
    throw new ForbiddenException('CEO cannot access call activities data');
  }

  return {};
}
