import { CampaignAccessGate } from '@/components/campaign/CampaignAccessGate'

export default function CampaignFunnelLayout({ children }: { children: React.ReactNode }) {
  return <CampaignAccessGate>{children}</CampaignAccessGate>
}
