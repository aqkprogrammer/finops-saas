#!/usr/bin/env node

/**
 * Script to get your AWS account ID
 * This is the account ID that clients need to add to their IAM role trust policy
 */

// Load environment variables from .env file
import 'dotenv/config';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

async function getAccountId() {
  try {
    const stsClient = new STSClient({ region: 'us-east-1' });
    const command = new GetCallerIdentityCommand({});
    const response = await stsClient.send(command);

    if (response.Account) {
      console.log('\n✅ Your AWS Account ID:', response.Account);
      console.log('✅ Your User/Role ARN:', response.Arn || 'N/A');
      console.log('✅ Your User ID:', response.UserId || 'N/A');
      
      console.log('\n📋 For IAM Role Trust Policy:');
      console.log('\n   Option 1 - Allow entire account (easiest):');
      console.log(`   "Principal": { "AWS": "arn:aws:iam::${response.Account}:root" }`);
      
      if (response.Arn && response.Arn.includes(':user/')) {
        console.log('\n   Option 2 - Allow specific user (more secure):');
        console.log(`   "Principal": { "AWS": "${response.Arn}" }`);
      }
      
      console.log('\n📋 Share this Account ID with your clients.');
      console.log('   They need to add it to their IAM role trust policy.\n');
      return response.Account;
    } else {
      console.error('❌ Could not retrieve account ID');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error getting account ID:', error.message);
    console.error('\nMake sure your AWS credentials are set correctly.');
    console.error('Run: node check-credentials.js to verify.\n');
    process.exit(1);
  }
}

getAccountId();
