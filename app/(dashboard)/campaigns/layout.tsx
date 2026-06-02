import { CampaignAccessGate } from '@/components/campaign/CampaignAccessGate'

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return <CampaignAccessGate>{children}</CampaignAccessGate>
}
