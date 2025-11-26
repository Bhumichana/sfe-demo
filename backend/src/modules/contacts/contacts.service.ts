import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new contact
   */
  async create(createDto: CreateContactDto) {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: createDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // If this contact is primary, unset other primary contacts for this customer
    if (createDto.isPrimary) {
      await this.prisma.contact.updateMany({
        where: { customerId: createDto.customerId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.contact.create({
      data: {
        customerId: createDto.customerId,
        name: createDto.name,
        position: createDto.position,
        phone: createDto.phone,
        email: createDto.email,
        lineId: createDto.lineId,
        isPrimary: createDto.isPrimary ?? false,
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
      },
    });
  }

  /**
   * Get all contacts by customer ID
   */
  async findByCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.contact.findMany({
      where: { customerId },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Get one contact by ID
   */
  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, code: true, type: true },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  /**
   * Update a contact
   */
  async update(id: string, updateDto: UpdateContactDto) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // If setting this contact as primary, unset other primary contacts
    if (updateDto.isPrimary) {
      await this.prisma.contact.updateMany({
        where: {
          customerId: contact.customerId,
          isPrimary: true,
          id: { not: id },
        },
        data: { isPrimary: false },
      });
    }

    return this.prisma.contact.update({
      where: { id },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.position !== undefined && { position: updateDto.position }),
        ...(updateDto.phone !== undefined && { phone: updateDto.phone }),
        ...(updateDto.email !== undefined && { email: updateDto.email }),
        ...(updateDto.lineId !== undefined && { lineId: updateDto.lineId }),
        ...(updateDto.isPrimary !== undefined && { isPrimary: updateDto.isPrimary }),
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Delete a contact
   */
  async remove(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.contact.delete({ where: { id } });

    return { message: 'Contact deleted successfully' };
  }
}
