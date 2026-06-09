import { describe, expect, it } from 'vitest'

describe('harness smoke', () => {
  it('runner executes assertions', () => {
    expect(1 + 1).toBe(2)
  })
})
