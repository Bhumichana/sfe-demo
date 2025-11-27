import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TerritoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.territory.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }
}
