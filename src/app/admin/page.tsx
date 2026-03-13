import { getAllActiveBrands } from '@/lib/db/queries'
import { NewBrandForm } from './new-brand-form'
import { SignOutButton } from './sign-out-button'

export default async function AdminPage() {
  const brands = await getAllActiveBrands()
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Serp Alert — Admin</h1>
        <SignOutButton />
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Brands</h2>
        {brands.map(b => (
          <div key={b.id} className="flex items-center justify-between border rounded p-3 text-sm mb-2">
            <span className="font-medium">{b.name}</span>
            <a href={`/client/${b.clientToken}`} className="text-blue-600 text-xs">/client/{b.clientToken}</a>
            <a href={`/dashboard/${b.id}`} className="text-xs text-muted-foreground">Dashboard →</a>
          </div>
        ))}
        {brands.length === 0 && <p className="text-sm text-muted-foreground">No brands yet.</p>}
      </div>
      <NewBrandForm />
    </div>
  )
}
