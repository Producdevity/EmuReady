export type TestScenario = {
  id: string
  description: string
}

export type TestCategory = {
  id: string
  name: string
  scenarios: TestScenario[]
}

export type TestRole = {
  id: string
  name: string
  icon: string
  color: string
  note?: string
  categories: TestCategory[]
}

export type TestAccount = {
  email: string
  password: string
  role: string
}

export const testAccounts: Record<string, TestAccount> = {
  user: {
    email: 'user@emuready.com',
    password: 'DevPassword123!',
    role: 'USER',
  },
  author: {
    email: 'author@emuready.com',
    password: 'DevPassword123!',
    role: 'AUTHOR',
  },
  developer: {
    email: 'developer@emuready.com',
    password: 'DevPassword123!',
    role: 'DEVELOPER',
  },
  moderator: {
    email: 'moderator@emuready.com',
    password: 'DevPassword123!',
    role: 'MODERATOR',
  },
  admin: {
    email: 'admin@emuready.com',
    password: 'DevPassword123!',
    role: 'ADMIN',
  },
  superadmin: {
    email: 'superadmin@emuready.com',
    password: 'DevPassword123!',
    role: 'SUPER_ADMIN',
  },
}

export const testScenarios: TestRole[] = [
  {
    id: 'user',
    name: 'USER - Basic Functionality',
    icon: '🟢',
    color: 'bg-green-600',
    categories: [
      {
        id: 'auth',
        name: 'Authentication & Profile',
        scenarios: [
          { id: 'signin', description: 'Sign in successfully' },
          { id: 'profile', description: 'View and update profile information' },
          { id: 'avatar', description: 'Upload profile image' },
          {
            id: 'prefs',
            description: 'Update preferences (NSFW, notifications)',
          },
          { id: 'signout', description: 'Sign out successfully' },
        ],
      },
      {
        id: 'browse',
        name: 'Browse & Search',
        scenarios: [
          { id: 'browse-games', description: 'Browse games page' },
          { id: 'search', description: 'Search for games using search bar' },
          { id: 'filter', description: 'Filter games by system' },
          { id: 'game-details', description: 'View game details page' },
          { id: 'browse-listings', description: 'Browse handheld listings' },
          { id: 'browse-pc', description: 'Browse PC listings' },
          {
            id: 'filter-listings',
            description: 'Filter listings by device/emulator',
          },
          {
            id: 'sort',
            description: 'Use sorting options (newest, oldest, highest rated)',
          },
        ],
      },
      {
        id: 'create',
        name: 'Create Content (Requires Approval)',
        scenarios: [
          {
            id: 'create-listing',
            description: 'Submit new handheld listing (goes to pending)',
          },
          {
            id: 'create-pc',
            description: 'Submit new PC listing (goes to pending)',
          },
          {
            id: 'custom-fields',
            description: 'Fill in emulator custom fields correctly',
          },
          { id: 'add-game', description: 'Submit new game if not in database' },
        ],
      },
      {
        id: 'interact',
        name: 'Interact with Content',
        scenarios: [
          { id: 'vote', description: 'Vote on listings (upvote/downvote)' },
          { id: 'comment', description: 'Comment on listings' },
          { id: 'edit-comment', description: 'Edit own comments' },
          { id: 'delete-comment', description: 'Delete own comments' },
          { id: 'report', description: 'Report inappropriate content' },
          { id: 'notifications', description: 'View notifications' },
        ],
      },
    ],
  },
  {
    id: 'author',
    name: 'AUTHOR - Content Creation Without Approval',
    icon: '📝',
    color: 'bg-blue-600',
    note: 'Includes all USER tests, plus the following:',
    categories: [
      {
        id: 'instant-publish',
        name: 'Content Creation (Auto-Approved)',
        scenarios: [
          {
            id: 'instant-listing',
            description: 'Create handheld listing - publishes immediately',
          },
          {
            id: 'instant-pc',
            description: 'Create PC listing - publishes immediately',
          },
          {
            id: 'edit-own',
            description: 'Edit own listings without re-approval',
          },
          {
            id: 'verify-instant',
            description: 'Verify listings appear immediately in browse pages',
          },
        ],
      },
    ],
  },
  {
    id: 'developer',
    name: 'DEVELOPER - Emulator Management',
    icon: '🔧',
    color: 'bg-purple-600',
    note: 'Includes all AUTHOR tests. Setup Required: Admin must assign an emulator at /admin/verified-developers',
    categories: [
      {
        id: 'admin-access',
        name: 'Admin Dashboard Access',
        scenarios: [
          { id: 'access-admin', description: 'Access admin dashboard' },
          {
            id: 'limited-nav',
            description: 'See only assigned emulator(s) in navigation',
          },
        ],
      },
      {
        id: 'emulator-mgmt',
        name: 'Emulator Management',
        scenarios: [
          {
            id: 'view-emulator',
            description: 'View assigned emulator details',
          },
          {
            id: 'edit-emulator',
            description: 'Edit emulator information (name, description, URLs)',
          },
          { id: 'add-field', description: 'Add new custom field' },
          { id: 'edit-field', description: 'Edit existing custom field' },
          { id: 'delete-field', description: 'Delete custom field' },
          { id: 'reorder-fields', description: 'Reorder custom fields' },
          {
            id: 'no-templates',
            description: 'Verify NO "Apply Templates" button visible',
          },
          { id: 'isolation', description: 'Cannot access other emulators' },
        ],
      },
      {
        id: 'approvals',
        name: 'Listing Approvals',
        scenarios: [
          {
            id: 'view-pending',
            description: 'View pending listings for assigned emulator',
          },
          {
            id: 'approve-listing',
            description: 'Approve listings for assigned emulator',
          },
          { id: 'reject-listing', description: 'Reject listings with reason' },
          {
            id: 'no-other-listings',
            description: 'Cannot see listings for other emulators',
          },
        ],
      },
    ],
  },
  {
    id: 'moderator',
    name: 'MODERATOR - Content Moderation',
    icon: '🛡️',
    color: 'bg-amber-600',
    note: 'Includes all AUTHOR tests, plus the following:',
    categories: [
      {
        id: 'moderation',
        name: 'Content Moderation',
        scenarios: [
          {
            id: 'review-handheld',
            description: 'Review handheld listing approvals',
          },
          { id: 'review-pc', description: 'Review PC listing approvals' },
          { id: 'review-games', description: 'Review game approvals' },
          {
            id: 'bulk-approve',
            description: 'Bulk approve/reject operations work',
          },
          {
            id: 'edit-before-approve',
            description: 'Edit content before approving',
          },
        ],
      },
      {
        id: 'reports',
        name: 'User Reports & Moderation',
        scenarios: [
          { id: 'view-reports', description: 'View user reports' },
          {
            id: 'change-status',
            description:
              'Change report status (Under Review, Resolved, Dismissed)',
          },
          {
            id: 'report-warnings',
            description: 'See warnings for users with multiple reports',
          },
          {
            id: 'create-ban',
            description: 'Create user ban (regular or shadow)',
          },
          { id: 'edit-ban', description: 'Edit existing bans' },
          { id: 'remove-ban', description: 'Remove bans' },
        ],
      },
      {
        id: 'devices',
        name: 'Device Management',
        scenarios: [
          { id: 'manage-devices', description: 'Add/edit/delete devices' },
          { id: 'manage-brands', description: 'Manage device brands' },
          { id: 'manage-socs', description: 'Manage SoCs' },
          { id: 'manage-cpus', description: 'Manage CPUs' },
          { id: 'manage-gpus', description: 'Manage GPUs' },
        ],
      },
    ],
  },
  {
    id: 'admin',
    name: 'ADMIN - System Administration',
    icon: '👨‍💼',
    color: 'bg-red-600',
    note: 'Includes all MODERATOR tests, plus the following:',
    categories: [
      {
        id: 'system',
        name: 'System Management',
        scenarios: [
          { id: 'manage-systems', description: 'Add/edit/delete game systems' },
          { id: 'create-emulator', description: 'Create new emulator' },
          { id: 'edit-all-emulators', description: 'Edit all emulators' },
          {
            id: 'supported-systems',
            description: 'Manage emulator supported systems',
          },
          {
            id: 'verify-developers',
            description: 'Verify developers for emulators',
          },
          {
            id: 'remove-verification',
            description: 'Remove developer verification',
          },
          {
            id: 'performance-scales',
            description: 'Manage performance scales',
          },
        ],
      },
    ],
  },
  {
    id: 'superadmin',
    name: 'SUPER_ADMIN - Full System Access',
    icon: '🔑',
    color: 'bg-gray-800',
    note: 'Includes all ADMIN tests, plus the following:',
    categories: [
      {
        id: 'users',
        name: 'User Management',
        scenarios: [
          { id: 'access-users', description: 'Access users page' },
          { id: 'change-roles', description: 'Change user roles' },
          { id: 'user-search', description: 'Search and filter users' },
        ],
      },
      {
        id: 'advanced',
        name: 'Advanced Features',
        scenarios: [
          {
            id: 'all-listings',
            description: 'Manage all listings without restrictions',
          },
          {
            id: 'processed-history',
            description: 'View processed listings history',
          },
          { id: 'permissions', description: 'Manage role permissions' },
          { id: 'permission-logs', description: 'View permission change logs' },
          { id: 'badges', description: 'Create and assign badges' },
          {
            id: 'field-templates',
            description: 'Create and apply custom field templates',
          },
          { id: 'trust-logs', description: 'View trust system logs' },
          {
            id: 'monitoring',
            description: 'Access system monitoring and metrics',
          },
        ],
      },
    ],
  },
]
