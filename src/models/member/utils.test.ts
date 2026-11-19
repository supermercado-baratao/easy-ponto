import { describe, expect, test } from 'vitest'

import {
  ADMIN_ROLE,
  EMPLOYEE_ROLE,
  OWNER_ROLE,
  VIEWER_ROLE
} from '@/models/account/utils'

import {
  canManageMember,
  canTransferOwnership,
  getAssignableRoles,
  isMemberRole
} from './utils'

const owner = { userId: 'owner', role: OWNER_ROLE }
const admin = { userId: 'admin', role: ADMIN_ROLE }
const otherAdmin = { userId: 'other-admin', role: ADMIN_ROLE }
const viewer = { userId: 'viewer', role: VIEWER_ROLE }

describe('isMemberRole', () => {
  test('Leaves the employees out of the members', () => {
    expect(isMemberRole(OWNER_ROLE)).toBe(true)
    expect(isMemberRole(ADMIN_ROLE)).toBe(true)
    expect(isMemberRole(VIEWER_ROLE)).toBe(true)
    expect(isMemberRole(EMPLOYEE_ROLE)).toBe(false)
  })
})

describe('getAssignableRoles', () => {
  test('Lets the owner assign the admin and the viewer roles', () => {
    expect(getAssignableRoles(OWNER_ROLE)).toEqual([ADMIN_ROLE, VIEWER_ROLE])
  })

  test('Lets the admin assign only the viewer role', () => {
    expect(getAssignableRoles(ADMIN_ROLE)).toEqual([VIEWER_ROLE])
  })

  test('Lets no other role assign a role', () => {
    expect(getAssignableRoles(VIEWER_ROLE)).toEqual([])
    expect(getAssignableRoles(EMPLOYEE_ROLE)).toEqual([])
    expect(getAssignableRoles('unknown')).toEqual([])
  })
})

describe('canManageMember', () => {
  test('Lets the owner manage the admins and the viewers', () => {
    expect(canManageMember(owner, admin)).toBe(true)
    expect(canManageMember(owner, viewer)).toBe(true)
  })

  test('Lets the admin manage only the viewers', () => {
    expect(canManageMember(admin, viewer)).toBe(true)
    expect(canManageMember(admin, otherAdmin)).toBe(false)
    expect(canManageMember(admin, owner)).toBe(false)
  })

  test('Never lets a member manage themselves', () => {
    expect(canManageMember(owner, owner)).toBe(false)
    expect(canManageMember(admin, admin)).toBe(false)
  })

  test('Lets the viewer manage no one', () => {
    expect(
      canManageMember(viewer, { userId: 'other', role: VIEWER_ROLE })
    ).toBe(false)
  })
})

describe('canTransferOwnership', () => {
  test('Lets the owner transfer the ownership to another member', () => {
    expect(canTransferOwnership(owner, admin)).toBe(true)
    expect(canTransferOwnership(owner, viewer)).toBe(true)
  })

  test('Lets no one else transfer the ownership', () => {
    expect(canTransferOwnership(admin, viewer)).toBe(false)
    expect(canTransferOwnership(owner, owner)).toBe(false)
  })
})
