'use client'

import { useAuth, useSignIn, useUser } from '@clerk/nextjs'
import {
  CheckCircle2,
  Circle,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  User,
  Copy,
  CheckCheck,
  LogIn,
  Shield,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button, Card, Input, LoadingSpinner } from '@/components/ui'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import { testScenarios, testAccounts } from './testScenarios'

type TestResult = {
  checked: boolean
  notes?: string
}

type TestResults = {
  [roleId: string]: {
    [categoryId: string]: {
      [scenarioId: string]: TestResult
    }
  }
}

export default function TestingPage() {
  const [testerName, setTesterName] = useState('')
  const [selectedRole, setSelectedRole] = useState('user')
  const [testResults, setTestResults] = useState<TestResults>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null)

  const { signOut, isSignedIn } = useAuth()
  const { signIn, setActive } = useSignIn()
  const { user } = useUser()

  // Check if we're on an allowed environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const allowedHosts = ['localhost', 'staging.emuready.com', 'dev.emuready.com']
      setIsAllowed(allowedHosts.some((host) => hostname.includes(host)))
    }
  }, [])

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('emuready-test-results')
    if (saved) {
      const parsed = JSON.parse(saved)
      setTestResults(parsed.results || {})
      setTesterName(parsed.testerName || '')
      setSelectedRole(parsed.selectedRole || 'user')
      setExpandedCategories(new Set(parsed.expandedCategories || []))
    }
  }, [])

  // Auto-save
  useEffect(() => {
    const data = {
      testerName,
      results: testResults,
      selectedRole,
      expandedCategories: Array.from(expandedCategories),
      lastSaved: new Date().toISOString(),
    }
    localStorage.setItem('emuready-test-results', JSON.stringify(data))
  }, [testResults, testerName, selectedRole, expandedCategories])

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const updateTestResult = (
    roleId: string,
    categoryId: string,
    scenarioId: string,
    result: TestResult,
  ) => {
    setTestResults((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [categoryId]: {
          ...(prev[roleId]?.[categoryId] || {}),
          [scenarioId]: result,
        },
      },
    }))
  }

  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    await navigator.clipboard.writeText(text)
    if (type === 'email') {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } else {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  const handleQuickSignIn = async (email: string, password: string) => {
    if (!signIn) {
      toast.error('Sign in not available')
      return
    }

    setIsSigningIn(true)
    try {
      // First sign out if already signed in
      if (isSignedIn) {
        await signOut()
        // Wait a bit for sign out to complete
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Sign in with the test account
      const result = await signIn.create({
        identifier: email,
        password: password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        toast.success(`Signed in as ${email}!`)
        // Stay on the testing page instead of redirecting
        // The UI will update automatically when signed in
      } else if (result.status === 'needs_first_factor') {
        // Handle MFA if enabled (unlikely for test accounts)
        toast.error('This account requires additional authentication')
      } else {
        toast.error('Sign in incomplete')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      const err = error as {
        errors?: Array<{ message: string }>
        message?: string
      }
      if (err?.errors?.[0]?.message) {
        toast.error(err.errors[0].message)
      } else if (err?.message) {
        toast.error(err.message)
      } else {
        toast.error('Failed to sign in. Please use manual sign in.')
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  const getProgress = () => {
    let total = 0
    let checked = 0

    testScenarios.forEach((role) => {
      role.categories.forEach((category) => {
        category.scenarios.forEach((scenario) => {
          total++
          if (testResults[role.id]?.[category.id]?.[scenario.id]?.checked) {
            checked++
          }
        })
      })
    })

    return {
      total,
      checked,
      percentage: total > 0 ? Math.round((checked / total) * 100) : 0,
    }
  }

  const getRoleProgress = (roleId: string) => {
    let total = 0
    let checked = 0

    const role = testScenarios.find((r) => r.id === roleId)
    if (!role) return { total: 0, checked: 0, percentage: 0 }

    role.categories.forEach((category) => {
      category.scenarios.forEach((scenario) => {
        total++
        if (testResults[roleId]?.[category.id]?.[scenario.id]?.checked) {
          checked++
        }
      })
    })

    return {
      total,
      checked,
      percentage: total > 0 ? Math.round((checked / total) * 100) : 0,
    }
  }

  const exportAsMarkdown = () => {
    const progress = getProgress()
    let markdown = `# EmuReady Testing Results\n\n`
    markdown += `**Tester:** ${testerName || 'Anonymous'}\n`
    markdown += `**Date:** ${new Date().toLocaleString()}\n`
    markdown += `**Progress:** ${progress.checked}/${progress.total} (${progress.percentage}%)\n`
    markdown += `**Staging URL:** https://staging.emuready.com\n\n`

    testScenarios.forEach((role) => {
      markdown += `## ${role.icon} ${role.name}\n\n`

      role.categories.forEach((category) => {
        const categoryHasResults = category.scenarios.some(
          (s) =>
            testResults[role.id]?.[category.id]?.[s.id]?.checked ||
            testResults[role.id]?.[category.id]?.[s.id]?.notes,
        )

        if (!categoryHasResults) return

        markdown += `### ${category.name}\n\n`

        category.scenarios.forEach((scenario) => {
          const result = testResults[role.id]?.[category.id]?.[scenario.id]
          if (result?.checked || result?.notes) {
            markdown += `- [${result?.checked ? 'x' : ' '}] ${scenario.description}\n`
            if (result?.notes) {
              markdown += `  - **Notes:** ${result.notes}\n`
            }
          }
        })
        markdown += '\n'
      })
    })

    // Add general notes section
    markdown += `## Issues and Observations\n\n`
    testScenarios.forEach((role) => {
      role.categories.forEach((category) => {
        category.scenarios.forEach((scenario) => {
          const result = testResults[role.id]?.[category.id]?.[scenario.id]
          if (result?.notes && !result.checked) {
            markdown += `- **${role.name} - ${scenario.description}:** ${result.notes}\n`
          }
        })
      })
    })

    // Download the file
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emuready-test-results-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all test results? This cannot be undone.')) {
      setTestResults({})
      setTesterName('')
      localStorage.removeItem('emuready-test-results')
    }
  }

  const progress = getProgress()
  const currentRole = testScenarios.find((r) => r.id === selectedRole)
  const currentAccount = testAccounts[selectedRole]

  // Show loading while checking environment
  if (isAllowed === null) {
    return <LoadingSpinner size="lg" text="Checking environment..." />
  }

  // Block access on production
  if (!isAllowed) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <Card className="p-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            This testing page is only available on staging and development environments.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">EmuReady Test Checklist</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {typeof window !== 'undefined' && window.location.hostname}
            </span>
          </div>
        </div>

        {/* Current User Info */}
        {isSignedIn && user && (
          <Card className="p-4 mb-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">
                  Currently signed in as: <strong>{user.emailAddresses[0]?.emailAddress}</strong>
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </Card>
        )}

        {/* Header Info */}
        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tester Name</label>
              <Input
                value={testerName}
                onChange={(e) => setTesterName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Testing Date</label>
              <Input value={new Date().toLocaleDateString()} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Overall Progress</label>
              <div className="text-2xl font-bold">{progress.percentage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {progress.checked} of {progress.total} tests
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={exportAsMarkdown} variant="primary">
              <Download className="w-4 h-4 mr-2" />
              Export All Results
            </Button>
            <Button onClick={clearAll} variant="destructive">
              Clear All Progress
            </Button>
          </div>
        </Card>

        {/* Role Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {testScenarios.map((role) => {
              const roleProgress = getRoleProgress(role.id)
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={cn(
                    selectedRole === role.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2',
                  )}
                >
                  <span className="text-lg">{role.icon}</span>
                  <span>{role.name.split(' - ')[0]}</span>
                  {roleProgress.percentage > 0 && (
                    <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {roleProgress.percentage}%
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Current Role Content */}
      {currentRole && currentAccount && (
        <div>
          {/* Login Card */}
          <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <User className="w-5 h-5" />
                {currentRole.name} Login Details
              </h2>
              <div
                className={`px-3 py-1 rounded-full text-white text-sm font-medium ${currentRole.color}`}
              >
                {currentAccount.role} Role
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-gray-800 px-4 py-2 rounded border border-gray-200 dark:border-gray-700 font-mono">
                    {currentAccount.email}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(currentAccount.email, 'email')}
                  >
                    {copiedEmail ? (
                      <CheckCheck className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">
                  Password
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-gray-800 px-4 py-2 rounded border border-gray-200 dark:border-gray-700 font-mono">
                    {currentAccount.password}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(currentAccount.password, 'password')}
                  >
                    {copiedPassword ? (
                      <CheckCheck className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  onClick={() => handleQuickSignIn(currentAccount.email, currentAccount.password)}
                  disabled={isSigningIn}
                  className="flex-1"
                >
                  {isSigningIn ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Quick Sign In as {currentRole.name.split(' - ')[0]}
                    </>
                  )}
                </Button>
                {isSignedIn && (
                  <Button variant="outline" onClick={() => signOut()} className="flex-1">
                    Sign Out Current Session
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Manual Sign In:</strong>{' '}
                <a
                  href={`/sign-in`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open Sign In Page →
                </a>
              </p>
            </div>
          </Card>

          {/* Quick Sign In Info */}
          <Card className="p-4 mb-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <p className="text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Quick Sign In:</strong> Click the &quot;Quick Sign In&quot; button above to
                instantly switch to this test account. The page will stay open so you can continue
                testing. Sign out when done to test another role.
              </span>
            </p>
          </Card>

          {/* Role Note */}
          {currentRole.note && (
            <Card className="p-4 mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <p className="text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                {currentRole.note}
              </p>
            </Card>
          )}

          {/* Test Categories */}
          <div className="space-y-4">
            {currentRole.categories.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => toggleCategory(`${selectedRole}-${category.id}`)}
                >
                  <h3 className="font-semibold flex items-center gap-2">
                    {expandedCategories.has(`${selectedRole}-${category.id}`) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                    {category.name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {
                      category.scenarios.filter(
                        (s) => testResults[selectedRole]?.[category.id]?.[s.id]?.checked,
                      ).length
                    }{' '}
                    / {category.scenarios.length}
                  </span>
                </div>

                {expandedCategories.has(`${selectedRole}-${category.id}`) && (
                  <div className="p-4 space-y-3">
                    {category.scenarios.map((scenario) => {
                      const result = testResults[selectedRole]?.[category.id]?.[scenario.id] || {
                        checked: false,
                      }
                      const hasNotes = !!result.notes

                      return (
                        <div
                          key={scenario.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() =>
                                updateTestResult(selectedRole, category.id, scenario.id, {
                                  ...result,
                                  checked: !result.checked,
                                })
                              }
                              className="mt-0.5"
                            >
                              {result.checked ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              ) : (
                                <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>
                            <div className="flex-1">
                              <label
                                className={`block cursor-pointer ${result.checked ? 'line-through opacity-60' : ''}`}
                              >
                                {scenario.description}
                              </label>
                              {(!result.checked || hasNotes) && (
                                <div className="mt-2">
                                  <Input
                                    as="textarea"
                                    value={result.notes || ''}
                                    onChange={(e) =>
                                      updateTestResult(selectedRole, category.id, scenario.id, {
                                        ...result,
                                        notes: e.target.value,
                                      })
                                    }
                                    placeholder="Add notes if this test failed or needs clarification..."
                                    className="text-sm"
                                    rows={2}
                                  />
                                </div>
                              )}
                            </div>
                            {hasNotes && <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Quick Links */}
          <Card className="p-6 mt-8">
            <h3 className="font-bold mb-3">
              Quick Links for {currentRole.name.split(' - ')[0]} Testing
            </h3>
            <div className="flex flex-wrap gap-2">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  Home
                </Button>
              </a>
              <a href="/games" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  Games
                </Button>
              </a>
              <a href="/listings" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  Handheld Listings
                </Button>
              </a>
              <a href="/pc-listings" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  PC Listings
                </Button>
              </a>
              <a href="/profile" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  Profile
                </Button>
              </a>
              {['moderator', 'admin', 'superadmin', 'developer'].includes(selectedRole) && (
                <a href="/admin" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Admin Dashboard
                  </Button>
                </a>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
