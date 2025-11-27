import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto } from './dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto) {
    // Check if code already exists
    const existingTeam = await this.prisma.team.findUnique({
      where: { code: createTeamDto.code },
    });

    if (existingTeam) {
      throw new ConflictException('Team code already exists');
    }

    // Validate company exists
    const company = await this.prisma.company.findUnique({
      where: { id: createTeamDto.companyId },
    });

    if (!company) {
      throw new BadRequestException('Company not found');
    }

    // Validate leader exists if leaderId provided
    if (createTeamDto.leaderId) {
      const leader = await this.prisma.user.findUnique({
        where: { id: createTeamDto.leaderId },
      });

      if (!leader) {
        throw new BadRequestException('Leader not found');
      }

      // Check if leader belongs to the same company
      if (leader.companyId !== createTeamDto.companyId) {
        throw new BadRequestException('Leader must belong to the same company');
      }
    }

    // Create team
    const team = await this.prisma.team.create({
      data: createTeamDto,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return team;
  }

  async findAll(companyId?: string, isActive?: boolean) {
    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const teams = await this.prisma.team.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return teams;
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        members: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
          orderBy: {
            fullName: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto) {
    // Check if team exists
    const existingTeam = await this.prisma.team.findUnique({
      where: { id },
    });

    if (!existingTeam) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    // Check for code conflict (if being updated)
    if (updateTeamDto.code) {
      const conflictTeam = await this.prisma.team.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { code: updateTeamDto.code },
          ],
        },
      });

      if (conflictTeam) {
        throw new ConflictException('Team code already exists');
      }
    }

    // Validate leader exists if leaderId provided
    if (updateTeamDto.leaderId) {
      const leader = await this.prisma.user.findUnique({
        where: { id: updateTeamDto.leaderId },
      });

      if (!leader) {
        throw new BadRequestException('Leader not found');
      }

      // Check if leader belongs to the same company
      if (leader.companyId !== existingTeam.companyId) {
        throw new BadRequestException('Leader must belong to the same company');
      }
    }

    // Update team
    const team = await this.prisma.team.update({
      where: { id },
      data: updateTeamDto,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return team;
  }

  async remove(id: string) {
    // Check if team exists
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    // Check if team has members
    if (team.members.length > 0) {
      throw new BadRequestException(
        'Cannot deactivate team with members. Please reassign members first.',
      );
    }

    // Soft delete by setting isActive to false
    await this.prisma.team.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Team deactivated successfully' };
  }

  async activate(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    await this.prisma.team.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: 'Team activated successfully' };
  }

  async getStatistics(companyId: string) {
    const [
      totalTeams,
      activeTeams,
      teamsWithLeaders,
      totalMembers,
    ] = await Promise.all([
      this.prisma.team.count({ where: { companyId } }),
      this.prisma.team.count({ where: { companyId, isActive: true } }),
      this.prisma.team.count({ where: { companyId, leaderId: { not: null } } }),
      this.prisma.user.count({ where: { companyId, teamId: { not: null } } }),
    ]);

    return {
      totalTeams,
      activeTeams,
      inactiveTeams: totalTeams - activeTeams,
      teamsWithLeaders,
      totalMembers,
    };
  }
}
