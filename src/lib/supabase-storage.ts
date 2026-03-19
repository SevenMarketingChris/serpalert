import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function uploadScreenshot(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const supabase = getSupabase()
  const { error } = await supabase.storage
    .from('screenshots')
    .upload(filename, buffer, { contentType: 'image/png', upsert: true })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  return supabase.storage.from('screenshots').getPublicUrl(filename).data.publicUrl
}

export async function deleteScreenshotFiles(publicUrls: string[]): Promise<void> {
  if (publicUrls.length === 0) return
  const supabase = getSupabase()
  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/screenshots/`
  const paths = publicUrls
    .filter(u => u.startsWith(baseUrl))
    .map(u => u.replace(baseUrl, ''))
  if (paths.length === 0) return
  await supabase.storage.from('screenshots').remove(paths)
}
