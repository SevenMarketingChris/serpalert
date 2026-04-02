'use client'

import { useState } from 'react'
import { Settings, Bell, CreditCard, Shield, Users } from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon: React.ElementType
}

const defaultTabs: Tab[] = [
  { id: 'brand', label: 'Brand', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Shield },
]

const adminTabs: Tab[] = [
  { id: 'admin', label: 'Admin', icon: Users },
]

interface Props {
  isAdmin: boolean
  children: Record<string, React.ReactNode>
}

export function SettingsTabs({ isAdmin, children }: Props) {
  const tabs = isAdmin ? [...defaultTabs, ...adminTabs] : defaultTabs
  const [activeTab, setActiveTab] = useState('brand')

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white/50 backdrop-blur-lg border border-white/50 rounded-xl p-1 shadow-sm overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                active
                  ? 'bg-white shadow-sm text-gray-900 border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-indigo-600' : ''}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="max-w-2xl">
        {children[activeTab]}
      </div>
    </div>
  )
}
