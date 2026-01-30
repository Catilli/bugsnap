import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  url: z.string().optional(),
  screenshotUrl: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  visibility: z.enum(['members', 'members_and_clients']).default('members'),
  assignedToId: z.string().uuid().optional(),
  environmentData: z.any().optional(),
  annotations: z.array(z.object({
    type: z.enum(['pen', 'rectangle', 'arrow', 'text']),
    coordinates: z.any(),
    content: z.string().optional(),
    color: z.string().optional(),
  })).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  visibility: z.enum(['members', 'members_and_clients']).optional(),
  assignedToId: z.string().uuid().optional(),
});

export async function taskRoutes(fastify: FastifyInstance) {
  // Get next task number for a project
  fastify.get('/projects/:projectId/next-task-number', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Verify user has access to project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: true,
        },
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      const isOwner = project.createdById === userId;
      const isMember = project.members.some((member: any) => member.userId === userId);

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this project' });
      }

      // Get the last task to determine next number
      const lastTask = await prisma.task.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      let nextTaskNumber = 1;
      if (lastTask) {
        // Extract number from "Task #X ..." format
        const match = lastTask.title.match(/Task #(\d+)/);
        if (match) {
          nextTaskNumber = parseInt(match[1]) + 1;
        }
      }

      return reply.send({ nextTaskNumber });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get next task number' });
    }
  });

  // Create a new task
  fastify.post('/tasks', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const data = createTaskSchema.parse(request.body);

      // Verify user has access to project
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        include: {
          members: true,
        },
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      const isOwner = project.createdById === userId;
      const isMember = project.members.some((member: any) => member.userId === userId);

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this project' });
      }

      // Get next task number for this project
      const lastTask = await prisma.task.findFirst({
        where: { projectId: data.projectId },
        orderBy: { createdAt: 'desc' },
      });

      let newTaskNumber = 1;
      if (lastTask) {
        // Extract number from "Task #X ..." format
        const match = lastTask.title.match(/Task #(\d+)/);
        if (match) {
          newTaskNumber = parseInt(match[1]) + 1;
        }
      }

      // Create task with title as task number
      const task = await prisma.task.create({
        data: {
          projectId: data.projectId,
          title: `Task #${newTaskNumber} - ${data.title}`,
          description: data.description,
          url: data.url,
          screenshotUrl: data.screenshotUrl,
          priority: data.priority,
          visibility: data.visibility,
          assignedToId: data.assignedToId,
          environmentData: data.environmentData,
          createdById: userId,
          // Create annotations if provided
          annotations: data.annotations ? {
            create: data.annotations.map((annotation: any) => ({
              type: annotation.type,
              coordinates: annotation.coordinates,
              content: annotation.content,
              color: annotation.color || '#ef4444', // Default red color
            }))
          } : undefined,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          annotations: true,
        },
      });

      return reply.status(201).send(task);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid task data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to create task' });
    }
  });

  // Get tasks for a project
  fastify.get('/projects/:projectId/tasks', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Verify user has access to project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: true,
        },
      });

      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      const isOwner = project.createdById === userId;
      const isMember = project.members.some((member: any) => member.userId === userId);

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this project' });
      }

      // Get tasks
      const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: [
          {
            title: 'asc',
          },
        ],
      });

      return reply.send(tasks);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch tasks' });
    }
  });

  // Get a specific task
  fastify.get('/tasks/:taskId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { taskId } = request.params as { taskId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!task) {
        return reply.status(404).send({ error: 'Task not found' });
      }

      // Verify user has access to project
      const isOwner = task.project.createdById === userId;
      const isMember = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId,
        },
      });

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this task' });
      }

      return reply.send(task);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch task' });
    }
  });

  // Update a task
  fastify.patch('/tasks/:taskId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { taskId } = request.params as { taskId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const updateData = updateTaskSchema.parse(request.body);

      // Get task to verify access
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });

      if (!task) {
        return reply.status(404).send({ error: 'Task not found' });
      }

      // Verify user has access
      const isOwner = task.project.createdById === userId;
      const isMember = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId,
        },
      });

      if (!isOwner && !isMember) {
        return reply.status(403).send({ error: 'You do not have access to this task' });
      }

      // Update task
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return reply.send(updatedTask);
    } catch (error: any) {
      fastify.log.error(error);
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Invalid task data', details: error.errors });
      }
      return reply.status(500).send({ error: 'Failed to update task' });
    }
  });

  // Delete a task
  fastify.delete('/tasks/:taskId', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  }, async (request, reply) => {
    try {
      const { taskId } = request.params as { taskId: string };
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });

      if (!task) {
        return reply.status(404).send({ error: 'Task not found' });
      }

      // Only owner or task creator can delete
      const isProjectOwner = task.project.createdById === userId;
      const isTaskCreator = task.createdById === userId;

      if (!isProjectOwner && !isTaskCreator) {
        return reply.status(403).send({ error: 'Only the project owner or task creator can delete this task' });
      }

      await prisma.task.delete({
        where: { id: taskId },
      });

      return reply.send({ message: 'Task deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete task' });
    }
  });
}