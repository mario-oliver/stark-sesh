import { BucketDetailClient } from '../BucketDetailClient'

export default async function MobilityPage({ params }: { params: Promise<{ dogId: string }> }) {
  const { dogId } = await params
  return <BucketDetailClient dogId={dogId} bucket="MOBILITY" />
}
