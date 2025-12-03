import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Check if username or email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === createUserDto.username) {
        throw new ConflictException('Username already exists');
      }
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already exists');
      }
    }

    // Validate manager exists if managerId provided
    if (createUserDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: createUserDto.managerId },
      });
      if (!manager) {
        throw new BadRequestException('Manager not found');
      }
    }

    // Validate territory exists if territoryId provided
    if (createUserDto.territoryId) {
      const territory = await this.prisma.territory.findUnique({
        where: { id: createUserDto.territoryId },
      });
      if (!territory) {
        throw new BadRequestException('Territory not found');
      }
    }

    // Validate team exists if teamId provided
    if (createUserDto.teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: createUserDto.teamId },
      });
      if (!team) {
        throw new BadRequestException('Team not found');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const { password, ...userData } = createUserDto;
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        passwordHash: hashedPassword,
      },
      include: {
        company: true,
        territory: true,
        team: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Remove sensitive data
    const { passwordHash, ...result } = user;
    return result;
  }

  async findAll(companyId?: string, role?: string, territoryId?: string, isActive?: boolean) {
    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (role) {
      where.role = role;
    }

    if (territoryId) {
      where.territoryId = territoryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        territory: {
          select: {
            id: true,
            code: true,
            nameTh: true,
            nameEn: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            subordinates: true,
            preCallPlans: true,
            callReports: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remove sensitive data
    return users.map(({ passwordHash, googleId, ...user }) => user);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
        territory: true,
        team: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            preCallPlans: true,
            callReports: true,
            customersCreated: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Remove sensitive data
    const { passwordHash, googleId, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    console.log('🔍 Update User Service Called:', { id, updateUserDto });

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      console.log('❌ User not found:', id);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check for username/email conflicts (if being updated)
    if (updateUserDto.username || updateUserDto.email) {
      const conflictUser = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                updateUserDto.username ? { username: updateUserDto.username } : {},
                updateUserDto.email ? { email: updateUserDto.email } : {},
              ],
            },
          ],
        },
      });

      if (conflictUser) {
        if (conflictUser.username === updateUserDto.username) {
          throw new ConflictException('Username already exists');
        }
        if (conflictUser.email === updateUserDto.email) {
          throw new ConflictException('Email already exists');
        }
      }
    }

    // Validate manager exists if managerId provided
    if (updateUserDto.managerId) {
      if (updateUserDto.managerId === id) {
        throw new BadRequestException('User cannot be their own manager');
      }
      const manager = await this.prisma.user.findUnique({
        where: { id: updateUserDto.managerId },
      });
      if (!manager) {
        throw new BadRequestException('Manager not found');
      }
    }

    // Validate territory exists if territoryId provided
    if (updateUserDto.territoryId) {
      const territory = await this.prisma.territory.findUnique({
        where: { id: updateUserDto.territoryId },
      });
      if (!territory) {
        throw new BadRequestException('Territory not found');
      }
    }

    // Validate team exists if teamId provided
    if (updateUserDto.teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: updateUserDto.teamId },
      });
      if (!team) {
        throw new BadRequestException('Team not found');
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (updateUserDto.password) {
      passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    const { password, ...updateData } = updateUserDto;
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        ...(passwordHash && { passwordHash }),
      },
      include: {
        company: true,
        territory: true,
        team: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Remove sensitive data
    const { passwordHash: _, googleId, ...result } = user;
    return result;
  }

  async remove(id: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        subordinates: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if user has subordinates
    if (user.subordinates.length > 0) {
      throw new BadRequestException(
        'Cannot delete user with subordinates. Please reassign subordinates first.',
      );
    }

    // Soft delete by setting isActive to false
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'User deactivated successfully' };
  }

  async hardDelete(id: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Hard delete (will cascade delete related records)
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User permanently deleted' };
  }

  async activate(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: 'User activated successfully' };
  }

  async getStatistics(companyId: string) {
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      usersByTerritory,
    ] = await Promise.all([
      this.prisma.user.count({ where: { companyId } }),
      this.prisma.user.count({ where: { companyId, isActive: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: { companyId },
        _count: true,
      }),
      this.prisma.user.groupBy({
        by: ['territoryId'],
        where: { companyId, territoryId: { not: null } },
        _count: true,
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      byRole: usersByRole.map(r => ({ role: r.role, count: r._count })),
      byTerritory: usersByTerritory.map(t => ({ territoryId: t.territoryId, count: t._count })),
    };
  }
}
