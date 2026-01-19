import { createRequire } from 'module';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

export interface JWTPayload {
  userId: string;
  email: string;
}

export async function createUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
    },
  });

  return user;
}

export async function verifyPassword(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValid) {
    return null;
  }

  return user;
}


export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
}
