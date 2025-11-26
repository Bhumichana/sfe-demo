import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityTypeDto } from './dto/create-activity-type.dto';
import { UpdateActivityTypeDto } from './dto/update-activity-type.dto';

@Injectable()
export class ActivityTypesService {
  constructor(private prisma: PrismaService) {}

  async create(createActivityTypeDto: CreateActivityTypeDto) {
    return this.prisma.activityType.create({
      data: createActivityTypeDto,
    });
  }

  async findAll(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};

    return this.prisma.activityType.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { nameTh: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const activityType = await this.prisma.activityType.findUnique({
      where: { id },
    });

    if (!activityType) {
      throw new NotFoundException(`Activity Type with ID ${id} not found`);
    }

    return activityType;
  }

  async findByCode(code: string) {
    return this.prisma.activityType.findUnique({
      where: { code },
    });
  }

  async update(id: string, updateActivityTypeDto: UpdateActivityTypeDto) {
    await this.findOne(id); // Check if exists

    return this.prisma.activityType.update({
      where: { id },
      data: updateActivityTypeDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists

    return this.prisma.activityType.delete({
      where: { id },
    });
  }

  async seedDefaultActivities() {
    const defaultActivities = [
      {
        code: 'DETAIL_PRODUCT',
        nameTh: 'Detail product',
        nameEn: 'Detail product',
        category: 'PRESENTATION',
        requiresPhoto: false,
        sortOrder: 1,
      },
      {
        code: 'POP_POSM',
        nameTh: 'วาง POP/POSM',
        nameEn: 'Place POP/POSM',
        category: 'MERCHANDISING',
        requiresPhoto: true,
        sortOrder: 2,
      },
      {
        code: 'PROPOSE_PRODUCT',
        nameTh: 'เสนอสินค้าเข้า',
        nameEn: 'Propose new product',
        category: 'SALES',
        requiresPhoto: false,
        sortOrder: 3,
      },
      {
        code: 'PRESENT_PRODUCT',
        nameTh: 'Present product',
        nameEn: 'Present product',
        category: 'PRESENTATION',
        requiresPhoto: false,
        sortOrder: 4,
      },
      {
        code: 'SAMPLING',
        nameTh: 'Sampling',
        nameEn: 'Product sampling',
        category: 'MARKETING',
        requiresPhoto: true,
        sortOrder: 5,
      },
      {
        code: 'HANDLE_PROBLEMS',
        nameTh: 'Handle customer problems',
        nameEn: 'Handle customer problems',
        category: 'SUPPORT',
        requiresPhoto: false,
        sortOrder: 6,
      },
      {
        code: 'SALES_ORDER',
        nameTh: 'รับ sales order',
        nameEn: 'Take sales order',
        category: 'SALES',
        requiresPhoto: false,
        sortOrder: 7,
      },
      {
        code: 'CHECK_STOCK',
        nameTh: 'เช็ค stock',
        nameEn: 'Check stock',
        category: 'INVENTORY',
        requiresPhoto: false,
        sortOrder: 8,
      },
      {
        code: 'FOLLOW_SPEC',
        nameTh: 'ติดตาม product spec',
        nameEn: 'Follow up product specification',
        category: 'SUPPORT',
        requiresPhoto: false,
        sortOrder: 9,
      },
      {
        code: 'BILLING',
        nameTh: 'วางบิล/ตามบิล/เก็บเงิน',
        nameEn: 'Billing/Collection',
        category: 'FINANCE',
        requiresPhoto: false,
        sortOrder: 10,
      },
      {
        code: 'BUSINESS_MEAL',
        nameTh: 'Business meal',
        nameEn: 'Business meal',
        category: 'RELATIONSHIP',
        requiresPhoto: false,
        sortOrder: 11,
      },
      {
        code: 'BOOTH',
        nameTh: 'ออก booth',
        nameEn: 'Event booth',
        category: 'MARKETING',
        requiresPhoto: true,
        sortOrder: 12,
      },
      {
        code: 'BUDGET_ENGAGE',
        nameTh: 'ประมาณงบการ engage',
        nameEn: 'Budget engagement planning',
        category: 'PLANNING',
        requiresPhoto: false,
        sortOrder: 13,
      },
    ];

    const created = [];
    for (const activity of defaultActivities) {
      const existing = await this.findByCode(activity.code);
      if (!existing) {
        const newActivity = await this.create(activity);
        created.push(newActivity);
      }
    }

    return {
      message: `Seeded ${created.length} default activities`,
      created,
    };
  }
}
