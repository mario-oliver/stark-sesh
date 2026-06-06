import { BucketDetailClient } from '../BucketDetailClient'

export default async function ActivityPage({ params }: { params: Promise<{ dogId: string }> }) {
  const { dogId } = await params
  return <BucketDetailClient dogId={dogId} bucket="ACTIVITY" />
}
