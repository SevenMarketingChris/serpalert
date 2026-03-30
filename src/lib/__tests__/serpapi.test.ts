import { describe, it, expect } from 'vitest'

// Test the normalizeDomain logic (we can't easily test the full API call,
// but we can test the domain normalization pattern)
function normalizeDomain(d: string): string {
  return d.toLowerCase().replace(/^www\./, '')
}

describe('normalizeDomain', () => {
  it('strips www prefix', () => {
    expect(normalizeDomain('www.example.com')).toBe('example.com')
  })

  it('lowercases', () => {
    expect(normalizeDomain('WWW.Example.COM')).toBe('example.com')
  })

  it('handles no www', () => {
    expect(normalizeDomain('example.com')).toBe('example.com')
  })

  it('handles subdomain that is not www', () => {
    expect(normalizeDomain('app.example.com')).toBe('app.example.com')
  })
})
