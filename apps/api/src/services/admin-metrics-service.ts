import { prisma } from '../db/prisma.js';
import { customerStorage } from '../storage/customer-storage.js';

export interface AdminMetrics {
  totalUsers: number;
  newUsersLast7Days: number;
  totalScans: number;
  scansLast24Hours: number;
  scansLast7Days: number;
  failedScansCount: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  freeUsers: number;
  paidUsers: number;
  averageScansPerUser: number;
  usersWithAtLeastOneScanPercent: number;
}

export async function calculateTotalUsers(): Promise<number> {
  return prisma.user.count();
}

export async function calculateNewUsersLast7Days(): Promise<number> {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return prisma.user.count({
    where: {
      createdAt: {
        gte: last7Days,
      },
    },
  });
}

export async function calculateTotalScans(): Promise<number> {
  return prisma.scan.count();
}

export async function calculateScansLast24Hours(): Promise<number> {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.scan.count({
    where: {
      createdAt: {
        gte: last24Hours,
      },
    },
  });
}

export async function calculateScansLast7Days(): Promise<number> {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return prisma.scan.count({
    where: {
      createdAt: {
        gte: last7Days,
      },
    },
  });
}

export function calculateFailedScansCount(): number {
  return 0;
}

export function calculateActiveSubscriptions(): number {
  return customerStorage.getAllActiveSubscriptions().length;
}

export function calculateCanceledSubscriptions(): number {
  const allSubscriptions = customerStorage.getAllSubscriptions();
  return allSubscriptions.filter((sub) => sub.status === 'canceled').length;
}

export async function calculateFreeUsers(totalUsers: number, paidUsers: number): Promise<number> {
  return Math.max(0, totalUsers - paidUsers);
}

export async function calculatePaidUsers(): Promise<number> {
  const activeSubscriptionsList = customerStorage.getAllActiveSubscriptions();
  const activeCustomerIds = new Set(
    activeSubscriptionsList.map((sub) => sub.customerId)
  );
  return activeCustomerIds.size;
}

export async function calculateAverageScansPerUser(totalScans: number, totalUsers: number): Promise<number> {
  if (totalUsers === 0) return 0;
  return Number((totalScans / totalUsers).toFixed(2));
}

export async function calculateUsersWithAtLeastOneScanPercent(totalUsers: number): Promise<number> {
  if (totalUsers === 0) return 0;
  
  const usersWithScans = await prisma.scan.groupBy({
    by: ['customerId'],
    where: {
      customerId: {
        not: null,
      },
    },
  });

  const uniqueUsersWithScans = new Set(
    usersWithScans.map((s) => s.customerId).filter((id): id is string => id !== null)
  ).size;
  
  return Number(((uniqueUsersWithScans / totalUsers) * 100).toFixed(2));
}

export async function getAllAdminMetrics(): Promise<AdminMetrics> {
  const now = Date.now();
  const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersLast7Days,
    totalScans,
    scansLast24Hours,
    scansLast7Days,
  ] = await Promise.all([
    calculateTotalUsers(),
    calculateNewUsersLast7Days(),
    calculateTotalScans(),
    calculateScansLast24Hours(),
    calculateScansLast7Days(),
  ]);

  const failedScansCount = calculateFailedScansCount();
  const activeSubscriptions = calculateActiveSubscriptions();
  const canceledSubscriptions = calculateCanceledSubscriptions();
  const paidUsers = await calculatePaidUsers();
  const freeUsers = await calculateFreeUsers(totalUsers, paidUsers);
  const averageScansPerUser = await calculateAverageScansPerUser(totalScans, totalUsers);
  const usersWithAtLeastOneScanPercent = await calculateUsersWithAtLeastOneScanPercent(totalUsers);

  return {
    totalUsers,
    newUsersLast7Days,
    totalScans,
    scansLast24Hours,
    scansLast7Days,
    failedScansCount,
    activeSubscriptions,
    canceledSubscriptions,
    freeUsers,
    paidUsers,
    averageScansPerUser,
    usersWithAtLeastOneScanPercent,
  };
}
