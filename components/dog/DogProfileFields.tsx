'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { DogProfileFormValues } from '@/lib/dog/profile-form'
import { DOG_SEX_OPTIONS } from '@/lib/dog/profile-form'

export function DogProfileFields({
  form,
  onChange,
  nameRequired = true
}: {
  form: DogProfileFormValues
  onChange: (updates: Partial<DogProfileFormValues>) => void
  nameRequired?: boolean
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="dog-name">
          Name {nameRequired && <span className="text-primary">*</span>}
        </Label>
        <Input
          id="dog-name"
          value={form.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g. Stark"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dog-breed">Breed</Label>
          <Input
            id="dog-breed"
            value={form.breed}
            onChange={e => onChange({ breed: e.target.value })}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dog-age">Age (years)</Label>
          <Input
            id="dog-age"
            type="number"
            min={0}
            max={30}
            value={form.age}
            onChange={e => onChange({ age: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dog-sex">Sex</Label>
          <Select
            value={form.sex || 'unset'}
            onValueChange={v => onChange({ sex: v === 'unset' ? '' : (v as DogProfileFormValues['sex']) })}
          >
            <SelectTrigger id="dog-sex" className="w-full">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">Not specified</SelectItem>
              {DOG_SEX_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dog-weight">Weight (lbs)</Label>
          <Input
            id="dog-weight"
            type="number"
            min={0}
            step={0.1}
            value={form.weightLbs}
            onChange={e => onChange({ weightLbs: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dog-condition">Condition / reason for care</Label>
        <Input
          id="dog-condition"
          value={form.condition}
          onChange={e => onChange({ condition: e.target.value })}
          placeholder="e.g. TPLO recovery, hip dysplasia"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dog-vet-name">Veterinarian</Label>
          <Input
            id="dog-vet-name"
            value={form.vetName}
            onChange={e => onChange({ vetName: e.target.value })}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dog-vet-phone">Vet phone</Label>
          <Input
            id="dog-vet-phone"
            type="tel"
            value={form.vetPhone}
            onChange={e => onChange({ vetPhone: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dog-notes">Care notes</Label>
        <Textarea
          id="dog-notes"
          value={form.notes}
          onChange={e => onChange({ notes: e.target.value })}
          placeholder="Allergies, medications, mobility tips…"
          rows={3}
        />
      </div>
    </div>
  )
}
