import { AwsResource } from '@finopsguard/shared';

export interface AwsClientConfig {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

export interface Ec2Instance extends AwsResource {
  instanceId: string;
  instanceType: string;
  state: string;
  launchTime: Date;
  cpuUtilization?: {
    average: number;
    period: string;
  };
}

export interface EbsVolume extends AwsResource {
  volumeId: string;
  size: number;
  volumeType: string;
  state: string;
  attached: boolean;
  attachmentInstanceId?: string;
  createTime: Date;
  encrypted: boolean;
}

export interface EbsSnapshot extends AwsResource {
  snapshotId: string;
  volumeId?: string;
  volumeSize: number;
  state: string;
  startTime: Date;
  ageInDays: number;
  encrypted: boolean;
  description?: string;
}

export interface RdsInstance extends AwsResource {
  dbInstanceIdentifier: string;
  engine: string;
  instanceClass: string;
  status: string;
}
