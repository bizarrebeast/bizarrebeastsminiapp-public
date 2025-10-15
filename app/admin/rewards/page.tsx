import { Metadata } from 'next';
import RewardsClient from './RewardsClient';

export const metadata: Metadata = {
  title: 'Rewards Dashboard | Admin',
  description: 'Manage attestation streak rewards'
};

export default function RewardsPage() {
  return <RewardsClient />;
}