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
