interface KeywordSuggestionsProps {
  brandName: string
  currentKeywords: string[]
}

export function KeywordSuggestions({ brandName, currentKeywords }: KeywordSuggestionsProps) {
  const brandLower = brandName.toLowerCase()

  const suggestions = [
    `${brandLower} reviews`,
    `${brandLower} uk`,
    `${brandLower} alternative`,
    `${brandLower} vs`,
    `${brandLower} login`,
    `${brandLower} app`,
    `${brandLower} pricing`,
    `${brandLower} discount`,
    `${brandLower} contact`,
    `buy ${brandLower}`,
  ].filter(s => !currentKeywords.some(k => k.toLowerCase() === s))

  if (suggestions.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-3">
        Suggested Keywords
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Consider monitoring these additional brand terms:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.slice(0, 6).map(s => (
          <span key={s} className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
