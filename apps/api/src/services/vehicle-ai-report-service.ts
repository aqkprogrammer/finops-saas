import { ReportStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../db/prisma.js';

export interface CreateReportInput {
  vehicleId: string;
  aiModelVersion?: string;
}

export interface UpdateReportInput {
  trustScore?: number;
  exteriorScore?: number;
  engineScore?: number;
  interiorScore?: number;
  transmissionScore?: number;
  highlightsJson?: unknown;
  issuesJson?: unknown;
  aiModelVersion?: string;
  status?: ReportStatus;
  failureReason?: string;
}

export interface VehicleAiReportResponse {
  id: string;
  vehicleId: string;
  trustScore: number | null;
  exteriorScore: number | null;
  engineScore: number | null;
  interiorScore: number | null;
  transmissionScore: number | null;
  highlightsJson: unknown;
  issuesJson: unknown;
  aiModelVersion: string | null;
  status: ReportStatus;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class VehicleAiReportService {
  /**
   * Create a new AI report with PENDING status
   * Ensures idempotency - one report per vehicle
   */
  async createReport(input: CreateReportInput): Promise<VehicleAiReportResponse> {
    return await prisma.$transaction(async (tx) => {
      // Check if vehicle exists, create if not
      await tx.vehicle.upsert({
        where: { id: input.vehicleId },
        update: {},
        create: { id: input.vehicleId },
      });

      // Upsert report to ensure idempotency
      const report = await tx.vehicleAiReport.upsert({
        where: { vehicleId: input.vehicleId },
        update: {
          status: ReportStatus.PENDING,
          aiModelVersion: input.aiModelVersion,
          updatedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          vehicleId: input.vehicleId,
          status: ReportStatus.PENDING,
          aiModelVersion: input.aiModelVersion,
        },
      });

      return this.toResponse(report);
    });
  }

  /**
   * Update AI report with analysis results
   */
  async updateReport(
    vehicleId: string,
    input: UpdateReportInput
  ): Promise<VehicleAiReportResponse> {
    const report = await prisma.vehicleAiReport.update({
      where: { vehicleId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });

    return this.toResponse(report);
  }

  /**
   * Get AI report for a vehicle
   */
  async getReport(vehicleId: string): Promise<VehicleAiReportResponse | null> {
    const report = await prisma.vehicleAiReport.findUnique({
      where: { vehicleId },
    });

    return report ? this.toResponse(report) : null;
  }

  /**
   * Mark report as completed with results
   */
  async completeReport(
    vehicleId: string,
    results: {
      trustScore: number;
      exteriorScore: number;
      engineScore: number;
      interiorScore: number;
      transmissionScore: number;
      highlightsJson: unknown;
      issuesJson: unknown;
      aiModelVersion: string;
    }
  ): Promise<VehicleAiReportResponse> {
    return await prisma.$transaction(async (tx) => {
      const report = await tx.vehicleAiReport.update({
        where: { vehicleId },
        data: {
          ...results,
          status: ReportStatus.COMPLETED,
          updatedAt: new Date(),
        },
      });

      return this.toResponse(report);
    });
  }

  /**
   * Mark report as failed
   */
  async failReport(
    vehicleId: string,
    failureReason?: string
  ): Promise<VehicleAiReportResponse> {
    const report = await prisma.vehicleAiReport.update({
      where: { vehicleId },
      data: {
        status: ReportStatus.FAILED,
        failureReason,
        updatedAt: new Date(),
      },
    });

    return this.toResponse(report);
  }

  /**
   * Convert Prisma model to response DTO
   */
  private toResponse(
    report: Prisma.VehicleAiReportGetPayload<{}>
  ): VehicleAiReportResponse {
    return {
      id: report.id,
      vehicleId: report.vehicleId,
      trustScore: report.trustScore,
      exteriorScore: report.exteriorScore,
      engineScore: report.engineScore,
      interiorScore: report.interiorScore,
      transmissionScore: report.transmissionScore,
      highlightsJson: report.highlightsJson,
      issuesJson: report.issuesJson,
      aiModelVersion: report.aiModelVersion,
      status: report.status,
      failureReason: report.failureReason,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }
}

export const vehicleAiReportService = new VehicleAiReportService();
