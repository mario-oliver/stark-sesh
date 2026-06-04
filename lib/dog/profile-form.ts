import type { DogSex } from '@/lib/api/endpoints/dogs'

export const DOG_SEX_OPTIONS: { value: DogSex; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'UNKNOWN', label: 'Unknown' }
]

export function formatDogSex(sex: DogSex | null | undefined) {
  if (!sex) return null
  return DOG_SEX_OPTIONS.find(o => o.value === sex)?.label ?? sex
}

export type DogProfileFormValues = {
  name: string
  breed: string
  age: string
  sex: DogSex | ''
  weightLbs: string
  condition: string
  vetName: string
  vetPhone: string
  notes: string
}

export function emptyDogProfileForm(): DogProfileFormValues {
  return {
    name: '',
    breed: '',
    age: '',
    sex: '',
    weightLbs: '',
    condition: '',
    vetName: '',
    vetPhone: '',
    notes: ''
  }
}

export function dogToProfileForm(dog: {
  name: string
  breed: string | null
  age: number | null
  sex?: DogSex | null
  weightLbs?: number | null
  condition?: string | null
  vetName?: string | null
  vetPhone?: string | null
  notes: string | null
}): DogProfileFormValues {
  return {
    name: dog.name,
    breed: dog.breed ?? '',
    age: dog.age != null ? String(dog.age) : '',
    sex: dog.sex ?? '',
    weightLbs: dog.weightLbs != null ? String(dog.weightLbs) : '',
    condition: dog.condition ?? '',
    vetName: dog.vetName ?? '',
    vetPhone: dog.vetPhone ?? '',
    notes: dog.notes ?? ''
  }
}

export function profileFormToApiPayload(form: DogProfileFormValues) {
  const parsedAge = form.age.trim() ? Number.parseInt(form.age, 10) : null
  const parsedWeight = form.weightLbs.trim() ? Number.parseFloat(form.weightLbs) : null

  return {
    name: form.name.trim(),
    breed: form.breed.trim() || null,
    age: parsedAge != null && !Number.isNaN(parsedAge) ? parsedAge : null,
    sex: form.sex || null,
    weightLbs: parsedWeight != null && !Number.isNaN(parsedWeight) ? parsedWeight : null,
    condition: form.condition.trim() || null,
    vetName: form.vetName.trim() || null,
    vetPhone: form.vetPhone.trim() || null,
    notes: form.notes.trim() || null
  }
}

export function validateDogProfileForm(form: DogProfileFormValues): string | null {
  if (!form.name.trim()) return 'Name is required.'
  if (form.age.trim()) {
    const age = Number.parseInt(form.age, 10)
    if (Number.isNaN(age) || age < 0) return 'Enter a valid age in years.'
  }
  if (form.weightLbs.trim()) {
    const weight = Number.parseFloat(form.weightLbs)
    if (Number.isNaN(weight) || weight <= 0) return 'Enter a valid weight in pounds.'
  }
  return null
}
