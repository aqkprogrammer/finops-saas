import type { Credentials } from '@aws-sdk/types';
import { Ec2Client } from './clients/ec2-client.js';
import { RdsClient } from './clients/rds-client.js';
import { CostExplorerClient as CostClient } from './clients/cost-explorer-client.js';
import type { AwsClientConfig } from './types/index.js';

export interface AwsClientOptions extends AwsClientConfig {
  credentials: Credentials;
}

export class AwsClient {
  public readonly ec2: Ec2Client;
  public readonly rds: RdsClient;
  public readonly costExplorer: CostClient;
  public readonly region: string;
  public readonly credentials: Credentials;

  constructor(options: AwsClientOptions) {
    this.region = options.region;
    this.credentials = options.credentials;

    // Wrap with our client classes
    this.ec2 = new Ec2Client({
      region: this.region,
      credentials: {
        accessKeyId: this.credentials.accessKeyId,
        secretAccessKey: this.credentials.secretAccessKey,
        sessionToken: this.credentials.sessionToken,
      },
    });

    this.rds = new RdsClient({
      region: this.region,
      credentials: {
        accessKeyId: this.credentials.accessKeyId,
        secretAccessKey: this.credentials.secretAccessKey,
        sessionToken: this.credentials.sessionToken,
      },
    });

    this.costExplorer = new CostClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.credentials.accessKeyId,
        secretAccessKey: this.credentials.secretAccessKey,
        sessionToken: this.credentials.sessionToken,
      },
    });
  }
}
