import Link from 'next/link'
import {
  Building2,
  FileSearch,
  Users,
  BarChart3,
  Settings,
  Shield,
  ArrowRight,
} from 'lucide-react'

export default function AdminPage() {
  const adminSections = [
    {
      title: 'Brand Management',
      description: 'Add, edit, or remove monitored brand keywords',
      href: '/admin/brands',
      icon: Building2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Audit Results',
      description: 'View recent SERP audit results and reports',
      href: '/admin/audit-results',
      icon: FileSearch,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and access',
      href: '/admin/users',
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Analytics Dashboard',
      description: 'View monitoring stats and competitor trends',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: 'System Settings',
      description: 'Configure SERP check intervals and alert rules',
      href: '/admin/settings',
      icon: Settings,
      color: 'text-gray-500',
      bg: 'bg-gray-500/10',
    },
    {
      title: 'Brand Protection',
      description: 'Manage cease & desist templates and alert preferences',
      href: '/admin/brands',
      icon: Shield,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/">
            <span className="text-gradient-tech font-extrabold text-xl">
              SerpAlert
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View Site
            </Link>
          </div>
        </div>
      </nav>

      {/* Admin Dashboard */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mb-10">
          Manage brands, users, and monitoring settings
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminSections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="group bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <div
                className={`inline-flex items-center justify-center h-10 w-10 rounded-lg ${section.bg} mb-4`}
              >
                <section.icon className={`h-5 w-5 ${section.color}`} />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {section.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {section.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold text-foreground mb-2">
            Quick Info
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            The admin portal is under active development. If you need help or
            have questions, contact{' '}
            <a
              href="mailto:chris@sevenmarketing.co.uk"
              className="text-primary hover:underline"
            >
              chris@sevenmarketing.co.uk
            </a>
            .
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
