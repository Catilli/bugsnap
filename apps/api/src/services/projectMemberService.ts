import { prisma } from '../lib/prisma';

/**
 * Service for managing project members and access control
 */
export class ProjectMemberService {
  /**
   * Check if a user is a member of a project (or the owner)
   */
  static async isMemberOfProject(userId: string, projectId: string): Promise<boolean> {
    // Check if user is the project owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (project?.createdById === userId) {
      return true;
    }

    // Check if user is a member
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return !!membership;
  }

  /**
   * Get all projects accessible by a user (owned + member)
   */
  static async getUserProjects(userId: string) {
    // Get owned projects
    const ownedProjects = await prisma.project.findMany({
      where: { createdById: userId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        // _count: {
        //   select: {
        //     tasks: true,
        //   },
        // },
      },
    });

    // Get projects where user is a member
    const memberProjects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        // _count: {
        //   select: {
        //     tasks: true,
        //   },
        // },
      },
    });

    // Combine and deduplicate
    const allProjects = [...ownedProjects, ...memberProjects];
    const uniqueProjects = Array.from(
      new Map(allProjects.map((project) => [project.id, project])).values()
    );

    return uniqueProjects;
  }

  /**
   * Add a member to a project
   */
  static async addMember(
    projectId: string,
    userEmail: string,
    role: 'owner' | 'admin' | 'member' | 'viewer' = 'member'
  ) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new Error('User not found with this email');
    }

    // Check if already a member
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      throw new Error('User is already a member of this project');
    }

    // Add member
    return await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Remove a member from a project
   */
  static async removeMember(projectId: string, userId: string) {
    // Check if project owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (project?.createdById === userId) {
      throw new Error('Cannot remove project owner from members');
    }

    return await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    projectId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' | 'viewer'
  ) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('User is not a member of this project');
    }

    return await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get all members of a project
   */
  static async getProjectMembers(projectId: string) {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        addedAt: 'asc',
      },
    });

    // Get project owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Return owner + members
    return {
      owner: project?.createdBy,
      members,
    };
  }

  /**
   * Check if user has specific role or higher in a project
   */
  static async hasRole(
    userId: string,
    projectId: string,
    requiredRole: 'owner' | 'admin' | 'member' | 'viewer'
  ): Promise<boolean> {
    const roleHierarchy = {
      viewer: 0,
      member: 1,
      admin: 2,
      owner: 3,
    };

    // Check if owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (project?.createdById === userId) {
      return true; // Owner has all permissions
    }

    // Check member role
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return false;
    }

    const userRole = membership.role as 'owner' | 'admin' | 'member' | 'viewer';
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}