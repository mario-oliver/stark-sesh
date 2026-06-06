import { BucketDetailClient } from '../BucketDetailClient'

export default async function RecoveryPage({ params }: { params: Promise<{ dogId: string }> }) {
  const { dogId } = await params
  return <BucketDetailClient dogId={dogId} bucket="RECOVERY" />
}
