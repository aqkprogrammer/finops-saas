import {
  EC2Client,
  DescribeVolumesCommand,
  DescribeSnapshotsCommand,
} from '@aws-sdk/client-ec2';
import type { AwsClientConfig, EbsVolume, EbsSnapshot } from '../types/index.js';

export class EbsClient {
  private client: EC2Client;
  private region: string;

  constructor(config: AwsClientConfig) {
    this.region = config.region;
    this.client = new EC2Client({
      region: config.region,
      credentials: config.credentials
        ? {
            accessKeyId: config.credentials.accessKeyId,
            secretAccessKey: config.credentials.secretAccessKey,
            sessionToken: config.credentials.sessionToken,
          }
        : undefined,
    });
  }

  /**
   * List all EBS volumes with attachment status
   */
  async listVolumes(): Promise<EbsVolume[]> {
    const command = new DescribeVolumesCommand({});
    const response = await this.client.send(command);

    const volumes: EbsVolume[] = [];

    for (const volume of response.Volumes || []) {
      if (volume.VolumeId) {
        const attachments = volume.Attachments || [];
        const attached = attachments.length > 0;
        const attachment = attachments[0]; // Get first attachment if any

        const volumeData: EbsVolume = {
          id: volume.VolumeId,
          volumeId: volume.VolumeId,
          type: 'ebs-volume',
          region: this.region,
          accountId: 'unknown', // EBS volumes don't expose OwnerId in DescribeVolumes response
          size: volume.Size || 0,
          volumeType: volume.VolumeType || 'unknown',
          state: volume.State || 'unknown',
          attached,
          attachmentInstanceId: attachment?.InstanceId,
          createTime: volume.CreateTime || new Date(),
          encrypted: volume.Encrypted || false,
          tags: volume.Tags?.reduce(
            (acc, tag) => {
              if (tag.Key && tag.Value) {
                acc[tag.Key] = tag.Value;
              }
              return acc;
            },
            {} as Record<string, string>
          ),
        };
        volumes.push(volumeData);
      }
    }

    return volumes;
  }

  /**
   * List all EBS snapshots with age and size information
   */
  async listSnapshots(ownerId?: string): Promise<EbsSnapshot[]> {
    const command = new DescribeSnapshotsCommand({
      OwnerIds: ownerId ? [ownerId] : undefined,
    });
    const response = await this.client.send(command);

    const snapshots: EbsSnapshot[] = [];
    const now = new Date();

    for (const snapshot of response.Snapshots || []) {
      if (snapshot.SnapshotId) {
        const startTime = snapshot.StartTime || new Date();
        const ageInDays = Math.floor(
          (now.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)
        );

        const snapshotData: EbsSnapshot = {
          id: snapshot.SnapshotId,
          snapshotId: snapshot.SnapshotId,
          type: 'ebs-snapshot',
          region: this.region,
          accountId: snapshot.OwnerId || 'unknown',
          volumeId: snapshot.VolumeId,
          volumeSize: snapshot.VolumeSize || 0,
          state: snapshot.State || 'unknown',
          startTime,
          ageInDays,
          encrypted: snapshot.Encrypted || false,
          description: snapshot.Description,
          tags: snapshot.Tags?.reduce(
            (acc, tag) => {
              if (tag.Key && tag.Value) {
                acc[tag.Key] = tag.Value;
              }
              return acc;
            },
            {} as Record<string, string>
          ),
        };
        snapshots.push(snapshotData);
      }
    }

    return snapshots;
  }

  /**
   * Get unattached volumes
   */
  async getUnattachedVolumes(): Promise<EbsVolume[]> {
    const volumes = await this.listVolumes();
    return volumes.filter((volume) => !volume.attached && volume.state === 'available');
  }

  /**
   * Get attached volumes
   */
  async getAttachedVolumes(): Promise<EbsVolume[]> {
    const volumes = await this.listVolumes();
    return volumes.filter((volume) => volume.attached);
  }
}
