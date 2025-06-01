'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { 
  Sparkles, LogOut, MessageCircle, Grid3X3, Globe, 
  Menu, X, ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface GlobalNavProps {
  user: User | null
}

export default function GlobalNav({ user }: GlobalNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileDropdownOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Don't show nav on auth pages
  if (!user || pathname === '/') {
    return null
  }

  const isActive = (path: string) => {
    if (path === '/chat' && pathname.startsWith('/chat')) return true
    if (path === '/ideas' && pathname.startsWith('/ideas')) return true
    return pathname === path
  }

  const navItems = [
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/ideas', label: 'Ideas Gallery', icon: Grid3X3 },
    { href: '/discover', label: 'Discover', icon: Globe },
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/chat" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Poppy Idea Engine</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Main Nav Items */}
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Lab Button - Always Visible */}
            <Link
              href="/lab"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                pathname === '/lab'
                  ? 'text-white bg-purple-700'
                  : 'text-white bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg'
              }`}
            >
              <span className="animate-pulse">⚡</span>
              <span>Lab</span>
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Desktop Profile */}
            <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {(user.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-gray-700">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Profile Settings
                    </Link>
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Admin Dashboard
                    </Link>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
              
              {/* Lab Button in Mobile */}
              <Link
                href="/lab"
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/lab'
                    ? 'bg-purple-700 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <span className="animate-pulse">⚡</span>
                Lab
              </Link>
            </nav>

            {/* Mobile Profile Section */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="px-4 py-2 text-sm text-gray-600">
                {user.user_metadata?.full_name || user.email}
              </div>
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Profile Settings
              </Link>
              <Link
                href="/admin"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Admin Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
