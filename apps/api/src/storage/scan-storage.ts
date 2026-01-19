import type { ScanResult } from '../services/scan-service.js';
import type { Scan } from '@prisma/client';
import { prisma } from '../db/prisma.js';

/**
 * Database-backed storage for scan results
 * Scans are persisted to PostgreSQL and survive server restarts
 */
class ScanStorage {
  /**
   * Validate scan result before storage
   */
  private validateScanResult(scanResult: ScanResult): void {
    if (!scanResult) {
      throw new Error('Scan result is null or undefined');
    }
    if (!scanResult.scanId || typeof scanResult.scanId !== 'string') {
      throw new Error('Scan result missing or invalid scanId');
    }
    if (!scanResult.timestamp || !(scanResult.timestamp instanceof Date)) {
      throw new Error('Scan result missing or invalid timestamp');
    }
    if (!scanResult.region || typeof scanResult.region !== 'string') {
      throw new Error('Scan result missing or invalid region');
    }
    if (!scanResult.costSummary || typeof scanResult.costSummary.totalCost !== 'number') {
      throw new Error('Scan result missing or invalid costSummary');
    }
    if (!Array.isArray(scanResult.issues)) {
      throw new Error('Scan result missing or invalid issues array');
    }
    if (!scanResult.savings || typeof scanResult.savings.totalMonthlySavings !== 'number') {
      throw new Error('Scan result missing or invalid savings');
    }
  }

  /**
   * Convert database record to ScanResult
   */
  private dbToScanResult(dbScan: {
    scanId: string;
    customerId: string | null;
    timestamp: Date | string;
    region: string;
    costSummary: any;
    resourceInventory: any;
    issues: any;
    savings: any;
  }): ScanResult {
    // Ensure timestamp is a Date object
    let timestamp: Date;
    if (dbScan.timestamp instanceof Date) {
      timestamp = dbScan.timestamp;
    } else if (typeof dbScan.timestamp === 'string') {
      timestamp = new Date(dbScan.timestamp);
    } else {
      timestamp = new Date();
    }

    return {
      scanId: dbScan.scanId,
      timestamp,
      region: dbScan.region,
      costSummary: dbScan.costSummary as ScanResult['costSummary'],
      resourceInventory: dbScan.resourceInventory as ScanResult['resourceInventory'],
      issues: dbScan.issues as ScanResult['issues'],
      savings: dbScan.savings as ScanResult['savings'],
    };
  }

  /**
   * Store a scan result
   */
  async store(scanResult: ScanResult, customerId?: string): Promise<void> {
    try {
      // Validate scan result before storing
      this.validateScanResult(scanResult);

      // Store the scan in database (upsert to handle duplicates)
      await prisma.scan.upsert({
        where: { scanId: scanResult.scanId },
        create: {
          scanId: scanResult.scanId,
          customerId: customerId || null,
          timestamp: scanResult.timestamp,
          region: scanResult.region,
          costSummary: scanResult.costSummary as any,
          resourceInventory: scanResult.resourceInventory as any,
          issues: scanResult.issues as any,
          savings: scanResult.savings as any,
        },
        update: {
          customerId: customerId || null,
          timestamp: scanResult.timestamp,
          region: scanResult.region,
          costSummary: scanResult.costSummary as any,
          resourceInventory: scanResult.resourceInventory as any,
          issues: scanResult.issues as any,
          savings: scanResult.savings as any,
        },
      });

      // Verify storage was successful
      const stored = await prisma.scan.findUnique({
        where: { scanId: scanResult.scanId },
      });
      if (!stored) {
        throw new Error(`Failed to verify storage of scan ${scanResult.scanId}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store scan ${scanResult?.scanId || 'unknown'}: ${errorMessage}`);
    }
  }

  /**
   * Get customer ID for a scan
   */
  async getCustomerId(scanId: string): Promise<string | undefined> {
    if (!scanId || typeof scanId !== 'string') {
      return undefined;
    }
    const scan = await prisma.scan.findUnique({
      where: { scanId },
      select: { customerId: true },
    });
    return scan?.customerId || undefined;
  }

  /**
   * Retrieve a scan result by ID
   */
  async get(scanId: string): Promise<ScanResult | undefined> {
    if (!scanId || typeof scanId !== 'string') {
      return undefined;
    }
    
    const dbScan = await prisma.scan.findUnique({
      where: { scanId },
    });

    if (!dbScan) {
      return undefined;
    }

    const result = this.dbToScanResult(dbScan);
    
    // Log if we retrieve something unexpected
    const keys = Object.keys(result);
    if (keys.length === 0) {
      console.error(`[ScanStorage] Retrieved empty object for scanId: ${scanId}`);
    } else if (!result.scanId || !result.timestamp || !result.region) {
      console.warn(`[ScanStorage] Retrieved scan with missing required fields for scanId: ${scanId}`, {
        keys,
        hasScanId: !!result.scanId,
        hasTimestamp: !!result.timestamp,
        hasRegion: !!result.region,
      });
    }
    
    return result;
  }

  /**
   * List all scan results (most recent first)
   */
  async list(): Promise<ScanResult[]> {
    const dbScans = await prisma.scan.findMany({
      orderBy: { timestamp: 'desc' },
    });
    
    return dbScans.map((dbScan: Scan) => this.dbToScanResult(dbScan));
  }

  /**
   * Get the most recent scan result
   */
  async getLatest(): Promise<ScanResult | undefined> {
    const dbScan = await prisma.scan.findFirst({
      orderBy: { timestamp: 'desc' },
    });
    
    return dbScan ? this.dbToScanResult(dbScan) : undefined;
  }

  /**
   * Clear all scan results (useful for testing)
   */
  async clear(): Promise<void> {
    await prisma.scan.deleteMany({});
  }
}

export const scanStorage = new ScanStorage();
