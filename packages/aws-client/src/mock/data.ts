import type { Ec2Instance, EbsVolume, EbsSnapshot } from '../types/index.js';
import type { CostSummary } from '../services/cost-explorer-service.js';

/**
 * Deterministic mock data for AWS resources
 * All values are realistic and consistent across runs
 */

const MOCK_ACCOUNT_ID = '123456789012';
const MOCK_REGION = 'us-east-1';

export const mockEc2Instances: Ec2Instance[] = [
  {
    id: 'i-0123456789abcdef0',
    instanceId: 'i-0123456789abcdef0',
    type: 'ec2-instance',
    instanceType: 't3.large',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    state: 'running',
    launchTime: new Date('2024-01-15T10:30:00Z'),
    cpuUtilization: {
      average: 12.5,
      period: '7-day',
    },
    tags: {
      Name: 'web-server-01',
      Environment: 'production',
      Team: 'platform',
    },
  },
  {
    id: 'i-0123456789abcdef1',
    instanceId: 'i-0123456789abcdef1',
    type: 'ec2-instance',
    instanceType: 'm5.xlarge',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    state: 'running',
    launchTime: new Date('2024-02-20T14:15:00Z'),
    cpuUtilization: {
      average: 45.8,
      period: '7-day',
    },
    tags: {
      Name: 'app-server-01',
      Environment: 'production',
      Team: 'backend',
    },
  },
  {
    id: 'i-0123456789abcdef2',
    instanceId: 'i-0123456789abcdef2',
    type: 'ec2-instance',
    instanceType: 't3.medium',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    state: 'stopped',
    launchTime: new Date('2024-03-10T09:00:00Z'),
    tags: {
      Name: 'dev-server-01',
      Environment: 'development',
      Team: 'engineering',
    },
  },
  {
    id: 'i-0123456789abcdef3',
    instanceId: 'i-0123456789abcdef3',
    type: 'ec2-instance',
    instanceType: 'c5.2xlarge',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    state: 'running',
    launchTime: new Date('2024-01-05T11:20:00Z'),
    cpuUtilization: {
      average: 78.3,
      period: '7-day',
    },
    tags: {
      Name: 'compute-worker-01',
      Environment: 'production',
      Team: 'data',
    },
  },
];

export const mockEbsVolumes: EbsVolume[] = [
  {
    id: 'vol-0123456789abcdef0',
    volumeId: 'vol-0123456789abcdef0',
    type: 'ebs-volume',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    size: 100,
    volumeType: 'gp3',
    state: 'in-use',
    attached: true,
    attachmentInstanceId: 'i-0123456789abcdef0',
    createTime: new Date('2024-01-15T10:30:00Z'),
    encrypted: true,
    tags: {
      Name: 'web-server-root',
      Environment: 'production',
    },
  },
  {
    id: 'vol-0123456789abcdef1',
    volumeId: 'vol-0123456789abcdef1',
    type: 'ebs-volume',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    size: 500,
    volumeType: 'gp3',
    state: 'in-use',
    attached: true,
    attachmentInstanceId: 'i-0123456789abcdef1',
    createTime: new Date('2024-02-20T14:15:00Z'),
    encrypted: true,
    tags: {
      Name: 'app-server-data',
      Environment: 'production',
    },
  },
  {
    id: 'vol-0123456789abcdef2',
    volumeId: 'vol-0123456789abcdef2',
    type: 'ebs-volume',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    size: 200,
    volumeType: 'gp2',
    state: 'available',
    attached: false,
    createTime: new Date('2024-03-01T08:00:00Z'),
    encrypted: false,
    tags: {
      Name: 'orphaned-volume',
      Environment: 'production',
    },
  },
  {
    id: 'vol-0123456789abcdef3',
    volumeId: 'vol-0123456789abcdef3',
    type: 'ebs-volume',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    size: 50,
    volumeType: 'gp3',
    state: 'in-use',
    attached: true,
    attachmentInstanceId: 'i-0123456789abcdef3',
    createTime: new Date('2024-01-05T11:20:00Z'),
    encrypted: true,
    tags: {
      Name: 'compute-worker-root',
      Environment: 'production',
    },
  },
  {
    id: 'vol-0123456789abcdef4',
    volumeId: 'vol-0123456789abcdef4',
    type: 'ebs-volume',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    size: 1000,
    volumeType: 'io1',
    state: 'available',
    attached: false,
    createTime: new Date('2024-02-10T12:00:00Z'),
    encrypted: true,
    tags: {
      Name: 'old-database-volume',
      Environment: 'production',
    },
  },
];

export const mockEbsSnapshots: EbsSnapshot[] = [
  {
    id: 'snap-0123456789abcdef0',
    snapshotId: 'snap-0123456789abcdef0',
    type: 'ebs-snapshot',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    volumeId: 'vol-0123456789abcdef0',
    volumeSize: 100,
    state: 'completed',
    startTime: new Date('2024-01-20T02:00:00Z'),
    ageInDays: 45,
    encrypted: true,
    description: 'Daily backup snapshot',
    tags: {
      Name: 'web-server-backup-2024-01-20',
      BackupType: 'daily',
    },
  },
  {
    id: 'snap-0123456789abcdef1',
    snapshotId: 'snap-0123456789abcdef1',
    type: 'ebs-snapshot',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    volumeId: 'vol-0123456789abcdef1',
    volumeSize: 500,
    state: 'completed',
    startTime: new Date('2024-02-25T02:00:00Z'),
    ageInDays: 20,
    encrypted: true,
    description: 'Daily backup snapshot',
    tags: {
      Name: 'app-server-backup-2024-02-25',
      BackupType: 'daily',
    },
  },
  {
    id: 'snap-0123456789abcdef2',
    snapshotId: 'snap-0123456789abcdef2',
    type: 'ebs-snapshot',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    volumeId: 'vol-0123456789abcdef0',
    volumeSize: 100,
    state: 'completed',
    startTime: new Date('2023-12-15T02:00:00Z'),
    ageInDays: 90,
    encrypted: true,
    description: 'Monthly backup snapshot',
    tags: {
      Name: 'web-server-backup-2023-12-15',
      BackupType: 'monthly',
    },
  },
  {
    id: 'snap-0123456789abcdef3',
    snapshotId: 'snap-0123456789abcdef3',
    type: 'ebs-snapshot',
    region: MOCK_REGION,
    accountId: MOCK_ACCOUNT_ID,
    volumeId: 'vol-0123456789abcdef4',
    volumeSize: 1000,
    state: 'completed',
    startTime: new Date('2023-11-01T02:00:00Z'),
    ageInDays: 135,
    encrypted: true,
    description: 'Old database snapshot',
    tags: {
      Name: 'database-backup-2023-11-01',
      BackupType: 'monthly',
    },
  },
];

export const mockCostSummary: CostSummary = {
  totalCost: 2847.50,
  currency: 'USD',
  period: {
    start: '2024-01-01',
    end: '2024-01-31',
    days: 30,
  },
  services: [
    {
      service: 'Amazon Elastic Compute Cloud - Compute',
      cost: 1245.30,
      percentage: 43.75,
    },
    {
      service: 'Amazon Elastic Block Store',
      cost: 856.20,
      percentage: 30.05,
    },
    {
      service: 'Amazon Simple Storage Service',
      cost: 342.50,
      percentage: 12.02,
    },
    {
      service: 'Amazon Relational Database Service',
      cost: 285.40,
      percentage: 10.01,
    },
    {
      service: 'Amazon CloudWatch',
      cost: 118.10,
      percentage: 4.15,
    },
  ],
};
