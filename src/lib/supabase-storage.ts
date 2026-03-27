import { put, del } from '@vercel/blob'

export async function uploadScreenshot(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const blob = await put(`screenshots/${filename}`, buffer, {
    access: 'public',
    contentType: 'image/png',
  })
  return blob.url
}

export async function deleteScreenshotFiles(publicUrls: string[]): Promise<void> {
  if (publicUrls.length === 0) return
  await Promise.all(publicUrls.map(url => del(url).catch(() => {})))
}
