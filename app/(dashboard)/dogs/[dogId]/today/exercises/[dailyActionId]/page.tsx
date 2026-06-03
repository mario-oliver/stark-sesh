import { ExerciseDetailClient } from './ExerciseDetailClient'

export default async function ExerciseDetailPage({
  params
}: {
  params: Promise<{ dogId: string; dailyActionId: string }>
}) {
  const { dogId, dailyActionId } = await params
  return <ExerciseDetailClient dogId={dogId} dailyActionId={dailyActionId} />
}
