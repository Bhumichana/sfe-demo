import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        taxId: true,
        address: true,
        district: true,
        province: true,
        postalCode: true,
        phone: true,
        email: true,
        website: true,
        logoUrl: true,
        storageUsedMb: true,
        storageLimitMb: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    // Check if company exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // Update company
    const company = await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
      select: {
        id: true,
        name: true,
        taxId: true,
        address: true,
        district: true,
        province: true,
        postalCode: true,
        phone: true,
        email: true,
        website: true,
        logoUrl: true,
        storageUsedMb: true,
        storageLimitMb: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return company;
  }
}
