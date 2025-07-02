# Production Permissions Setup Guide

This guide explains how to safely add the new permission system to your production database.

## Overview

The permission system migration adds:
- 25 default permissions
- Role-permission assignments for all existing roles
- No modification or deletion of existing data

## Prerequisites

1. Ensure you have run the database migration first:
   ```bash
   npm run db:migrate:deploy
   ```

2. Verify the migration was successful:
   ```bash
   npm run db:migrate:status
   ```

## Running the Permission Seeder

To add the permission system data to production:

```bash
npm run db:seed:permissions
```

This command will:
- Add all 25 default permissions (if they don't already exist)
- Assign permissions to roles based on the current hierarchy
- Log all operations to the console
- Use `upsert` operations to prevent duplicates

## What Gets Added

### Permissions by Category

**Content Management:**
- `create_listing` - Create new compatibility listings
- `approve_listings` - Approve or reject submitted listings
- `edit_any_listing` - Edit any user's listing
- `delete_any_listing` - Delete any user's listing
- `manage_games` - Add, edit, and approve games
- `approve_games` - Approve or reject submitted games
- `manage_emulators` - Create, edit, and manage emulators
- `manage_custom_fields` - Create and manage custom field definitions
- `manage_devices` - Create and manage devices and SoCs
- `manage_systems` - Create and manage gaming systems/platforms

**Comment Management:**
- `edit_own_comment` - Edit your own comments
- `delete_own_comment` - Delete your own comments
- `edit_any_comment` - Edit any user's comment
- `delete_any_comment` - Delete any user's comment

**User Management:**
- `manage_users` - View and manage user accounts
- `change_user_roles` - Modify user roles
- `modify_super_admin_users` - Modify super admin user accounts
- `manage_emulator_verified_developers` - Verify and manage emulator developers
- `manage_trust_system` - Manage user trust scores and actions

**System Access:**
- `access_admin_panel` - Access the admin dashboard
- `view_statistics` - View system statistics and analytics
- `view_logs` - View system logs and audit trails
- `manage_permissions` - Create, edit, and assign permissions to roles
- `view_permission_logs` - View permission change logs
- `view_trust_logs` - View trust action logs

### Default Role Assignments

**USER:**
- `create_listing`
- `edit_own_comment`
- `delete_own_comment`

**AUTHOR:**
- Same as USER

**DEVELOPER:**
- All USER permissions
- `access_admin_panel`
- `manage_emulators` (for their verified emulators)
- `manage_custom_fields` (for their emulators)

**MODERATOR:**
- All USER permissions
- `access_admin_panel`
- `approve_listings`
- `edit_any_listing`
- `delete_any_comment`
- `view_statistics`
- `view_logs`
- `view_trust_logs`

**ADMIN:**
- All MODERATOR permissions
- `delete_any_listing`
- `manage_games`
- `approve_games`
- `manage_emulators` (all emulators)
- `manage_custom_fields` (all)
- `manage_emulator_verified_developers`
- `manage_users`
- `change_user_roles`
- `manage_trust_system`
- `manage_devices`
- `manage_systems`

**SUPER_ADMIN:**
- All permissions

## Verification

After running the seeder, verify the permissions were added:

1. Check the admin panel at `/admin/permissions` (requires SUPER_ADMIN role)
2. Review the permission matrix to ensure roles have correct permissions
3. Check `/admin/permission-logs` for any issues

## Rollback

If you need to remove the permission system:

1. Remove role-permission assignments:
   ```sql
   DELETE FROM role_permissions;
   ```

2. Remove permissions:
   ```sql
   DELETE FROM permissions;
   ```

3. Remove permission logs:
   ```sql
   DELETE FROM permission_action_logs;
   ```

## Notes

- The seeder is idempotent - running it multiple times is safe
- Existing data is never modified or deleted
- All operations are logged to the console
- The seeder uses transactions for data consistency