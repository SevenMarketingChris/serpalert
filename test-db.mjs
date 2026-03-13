import postgres from 'postgres'

const configs = [
  { host: 'aws-0-eu-west-2.pooler.supabase.com', port: 6543, label: 'pooler tx eu-west-2' },
  { host: 'aws-0-eu-west-2.pooler.supabase.com', port: 5432, label: 'pooler session eu-west-2' },
  { host: 'aws-0-eu-west-1.pooler.supabase.com', port: 6543, label: 'pooler tx eu-west-1' },
]

for (const { host, port, label } of configs) {
  const sql = postgres({
    host,
    port,
    database: 'postgres',
    username: 'postgres.ynxvyecliinsrftxrrzm',
    password: 'pwtio1Merl6g9hle',
    ssl: 'require',
    connect_timeout: 8,
  })
  try {
    const r = await sql`SELECT current_user`
    console.log(`✓ Connected via ${label} — user: ${r[0].current_user}`)
    await sql.end()
    break
  } catch (e) {
    console.log(`✗ ${label}: ${e.message}`)
    await sql.end()
  }
}
