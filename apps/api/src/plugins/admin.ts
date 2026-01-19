import { FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from './auth.js';
import { env } from '../config/env.js';

export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await authMiddleware(request, reply);

  if (reply.sent) {
    return;
  }

  if (!request.user) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const adminEmails = env.ADMIN_EMAILS
    ? env.ADMIN_EMAILS.split(',').map((email) => email.trim().toLowerCase())
    : [];

  if (adminEmails.length === 0) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin access not configured',
    });
  }

  const userEmail = request.user.email.toLowerCase().trim();

  if (!adminEmails.includes(userEmail)) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
}
