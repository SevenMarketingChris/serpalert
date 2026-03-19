const runningJobs = new Set<string>()

export function acquireLock(jobName: string): boolean {
  if (runningJobs.has(jobName)) return false
  runningJobs.add(jobName)
  return true
}

export function releaseLock(jobName: string): void {
  runningJobs.delete(jobName)
}
