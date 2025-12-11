import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerType } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate next customer code (CUST0001, CUST0002, ...)
   */
  private async generateCustomerCode(): Promise<string> {
    // Get all customers with auto-generated codes (CUST0001, CUST0002, etc.)
    const customers = await this.prisma.customer.findMany({
      where: {
        code: {
          startsWith: 'CUST',
          // Match pattern: CUST followed by 4 digits
        },
      },
      select: {
        code: true,
      },
      orderBy: {
        code: 'desc',
      },
    });

    // Filter to only valid codes (CUST + 4 digits) and extract numbers
    const validNumbers = customers
      .map(c => {
        const match = c.code.match(/^CUST(\d{4})$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(n => n !== null && !isNaN(n)) as number[];

    // Get the highest number, or start from 0
    const lastNumber = validNumbers.length > 0 ? Math.max(...validNumbers) : 0;
    const nextNumber = lastNumber + 1;

    // Pad with zeros (e.g., 1 -> "0001", 43 -> "0043")
    return `CUST${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Create a new customer (with optional contact)
   */
  async create(createDto: CreateCustomerDto) {
    // Auto-generate customer code if not provided
    const customerCode = createDto.code || (await this.generateCustomerCode());

    // Check if customer code already exists
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { code: customerCode },
    });

    if (existingCustomer) {
      throw new BadRequestException('Customer code already exists');
    }

    // Verify creator exists (if provided)
    if (createDto.createdBy) {
      const creator = await this.prisma.user.findUnique({
        where: { id: createDto.createdBy },
      });

      if (!creator) {
        throw new NotFoundException('User not found');
      }
    }

    // Verify territory if provided
    if (createDto.territoryId) {
      const territory = await this.prisma.territory.findUnique({
        where: { id: createDto.territoryId },
      });

      if (!territory) {
        throw new NotFoundException('Territory not found');
      }
    }

    // Auto-calculate customer grade from monthly revenue
    const customerType = createDto.monthlyRevenue
      ? this.calculateCustomerGrade(Number(createDto.monthlyRevenue))
      : CustomerType.C;

    // Create customer with optional contact
    const customer = await this.prisma.customer.create({
      data: {
        code: customerCode,
        name: createDto.name,
        type: customerType, // Use auto-calculated grade
        monthlyRevenue: createDto.monthlyRevenue,
        address: createDto.address,
        lat: createDto.lat,
        lng: createDto.lng,
        district: createDto.district,
        province: createDto.province,
        postalCode: createDto.postalCode,
        phone: createDto.phone,
        territoryId: createDto.territoryId,
        requiredVisitsPerMonth: createDto.requiredVisitsPerMonth,
        responseTimeHours: createDto.responseTimeHours,
        createdBy: createDto.createdBy,
        // Create contact if provided (Quick Create)
        contacts: createDto.contact
          ? {
              create: {
                name: createDto.contact.name,
                position: createDto.contact.position,
                phone: createDto.contact.phone,
                email: createDto.contact.email,
                isPrimary: true,
              },
            }
          : undefined,
      },
      include: {
        territory: { select: { id: true, nameTh: true, code: true } },
        creator: { select: { id: true, fullName: true } },
        contacts: true,
      },
    });

    return customer;
  }

  /**
   * Get all customers with filters
   */
  async findAll(
    territoryId?: string,
    type?: CustomerType,
    search?: string,
    isActive?: boolean,
  ) {
    const where: any = {};

    if (territoryId) where.territoryId = territoryId;
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      include: {
        territory: { select: { id: true, nameTh: true, code: true } },
        contacts: {
          where: { isPrimary: true },
          select: { id: true, name: true, position: true, phone: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get one customer by ID
   */
  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        territory: { select: { id: true, nameTh: true, nameEn: true, code: true } },
        creator: { select: { id: true, fullName: true, email: true } },
        contacts: {
          select: {
            id: true,
            name: true,
            position: true,
            phone: true,
            email: true,
            lineId: true,
            isPrimary: true,
          },
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  /**
   * Update a customer
   */
  async update(id: string, userId: string, updateDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if code is being updated and already exists
    if (updateDto.code && updateDto.code !== customer.code) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { code: updateDto.code },
      });

      if (existingCustomer) {
        throw new BadRequestException('Customer code already exists');
      }
    }

    // Verify territory if provided
    if (updateDto.territoryId) {
      const territory = await this.prisma.territory.findUnique({
        where: { id: updateDto.territoryId },
      });

      if (!territory) {
        throw new NotFoundException('Territory not found');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(updateDto.code && { code: updateDto.code }),
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.monthlyRevenue !== undefined && {
          monthlyRevenue: updateDto.monthlyRevenue,
        }),
        ...(updateDto.address !== undefined && { address: updateDto.address }),
        ...(updateDto.lat !== undefined && { lat: updateDto.lat }),
        ...(updateDto.lng !== undefined && { lng: updateDto.lng }),
        ...(updateDto.district !== undefined && { district: updateDto.district }),
        ...(updateDto.province !== undefined && { province: updateDto.province }),
        ...(updateDto.postalCode !== undefined && { postalCode: updateDto.postalCode }),
        ...(updateDto.phone !== undefined && { phone: updateDto.phone }),
        ...(updateDto.territoryId !== undefined && { territoryId: updateDto.territoryId }),
        ...(updateDto.requiredVisitsPerMonth !== undefined && {
          requiredVisitsPerMonth: updateDto.requiredVisitsPerMonth,
        }),
        ...(updateDto.responseTimeHours !== undefined && {
          responseTimeHours: updateDto.responseTimeHours,
        }),
      },
      include: {
        territory: { select: { id: true, nameTh: true } },
        contacts: true,
      },
    });
  }

  /**
   * Delete (soft delete) a customer
   */
  async remove(id: string, userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Soft delete by setting isActive to false
    await this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Customer deleted successfully' };
  }

  /**
   * Calculate customer grade based on monthly revenue
   */
  private calculateCustomerGrade(monthlyRevenue: number | null): CustomerType {
    if (!monthlyRevenue || monthlyRevenue < 100000) {
      return CustomerType.C;
    } else if (monthlyRevenue >= 100000 && monthlyRevenue <= 500000) {
      return CustomerType.B;
    } else {
      return CustomerType.A;
    }
  }

  /**
   * Get customer statistics (plans, reports, last visit)
   */
  async getCustomerStatistics(
    customerId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = { customerId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Count pre-call plans
    const totalPlans = await this.prisma.preCallPlan.count({
      where,
    });

    // Count call reports
    const totalReports = await this.prisma.callReport.count({
      where,
    });

    // Get last visit (last call report)
    const lastReport = await this.prisma.callReport.findFirst({
      where: { customerId },
      orderBy: { callDate: 'desc' },
      select: { callDate: true },
    });

    // Get next planned visit
    const nextPlan = await this.prisma.preCallPlan.findFirst({
      where: {
        customerId,
        planDate: { gte: new Date() },
        status: 'APPROVED',
      },
      orderBy: { planDate: 'asc' },
      select: { planDate: true },
    });

    return {
      totalPlans,
      totalReports,
      lastVisit: lastReport?.callDate || null,
      nextPlannedVisit: nextPlan?.planDate || null,
    };
  }

  /**
   * Get customers visible to user based on role
   */
  async getMyCustomers(
    userId: string,
    territoryId?: string,
    type?: CustomerType,
    search?: string,
  ) {
    // Get user with role and territory
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        territoryId: true,
        companyId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const where: any = {};

    // Role-based visibility
    if (user.role === 'SR') {
      // Sales Rep sees only their own customers
      where.createdBy = userId;
    } else if (user.role === 'SUP') {
      // Supervisor sees all customers in their territory
      if (user.territoryId) {
        where.territoryId = user.territoryId;
      }
    } else if (user.role === 'SM' || user.role === 'SD' || user.role === 'CEO') {
      // Sales Manager/Sales Director/CEO sees all customers in company
      // No additional filter needed
    }

    // Apply additional filters
    if (territoryId) where.territoryId = territoryId;
    if (type) where.type = type;
    where.isActive = true; // Only active customers

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get customers with basic statistics
    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        territory: { select: { id: true, nameTh: true, code: true } },
        contacts: {
          where: { isPrimary: true },
          select: { id: true, name: true, position: true, phone: true },
        },
        _count: {
          select: {
            preCallPlans: true,
            callReports: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get last visit for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const lastReport = await this.prisma.callReport.findFirst({
          where: { customerId: customer.id },
          orderBy: { callDate: 'desc' },
          select: { callDate: true },
        });

        return {
          ...customer,
          statistics: {
            totalPlans: customer._count.preCallPlans,
            totalReports: customer._count.callReports,
            lastVisit: lastReport?.callDate || null,
          },
        };
      }),
    );

    return customersWithStats;
  }
}
