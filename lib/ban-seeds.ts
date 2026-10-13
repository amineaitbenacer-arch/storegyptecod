/** Shared permanent ban seeds — safe for Edge middleware (no fs/db). */

export type SeedPhoneBan = {
  phone: string;
  reason: string;
  createdAt: string;
};

export type SeedIpBan = {
  ip: string;
  reason: string;
  createdAt: string;
};

export type SeedVisitorBan = {
  visitorId: string;
  reason: string;
  createdAt: string;
};

export const SEED_PHONE_BANS: SeedPhoneBan[] = [
  {
    phone: '0509606340',
    reason: 'abuse: multi-order قريش شرواني',
    createdAt: '2026-10-12T00:00:00.000Z',
  },
  {
    phone: '0570267340',
    reason: 'abuse: same person alt number قريش شرواني',
    createdAt: '2026-10-12T00:00:00.000Z',
  },
  {
    phone: '0512121212',
    reason: 'abuse: fake spam number troll',
    createdAt: '2026-10-13T14:10:00.000Z',
  },
];

export const SEED_IP_BANS: SeedIpBan[] = [
  {
    ip: '178.73.80.69',
    reason: 'abuse: fake spam 0512121212',
    createdAt: '2026-10-13T14:10:00.000Z',
  },
];

export const SEED_VISITOR_BANS: SeedVisitorBan[] = [
  {
    visitorId: '9be93016-a35f-432f-b4fd-0c4c4e2ec351',
    reason: 'abuse: multi-order 0509606340',
    createdAt: '2026-10-12T00:00:00.000Z',
  },
  {
    visitorId: 'fe9fc92d-86bf-4723-a7dc-2863de77c35d',
    reason: 'abuse: multi-order 0570267340',
    createdAt: '2026-10-12T00:00:00.000Z',
  },
  {
    visitorId: '9fe303c8-b20e-45c8-a017-43d45fadb5a3',
    reason: 'abuse: fake spam 0512121212',
    createdAt: '2026-10-13T14:10:00.000Z',
  },
];

/** Cookie set on abuse responses — blocks site even before DB round-trip. */
export const SITE_BAN_COOKIE = '__dm_blocked';
