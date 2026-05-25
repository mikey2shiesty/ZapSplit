// Maps action_url strings to react-navigation calls.
// Used by the push-notification tap handler in App.tsx so that tapping a
// notification opens the right screen, not just the home tab.

import type { NavigationContainerRef } from '@react-navigation/native';

type AnyNav = NavigationContainerRef<any>;

interface RouteTarget {
  name: string;
  params?: Record<string, any>;
  parentRoute?: { name: string; params?: Record<string, any> };
}

/**
 * Turn an action_url string into a navigation target. Returns null for
 * unknown/empty inputs so the caller can fall through to default behaviour.
 */
export function routeForActionUrl(actionUrl?: string | null): RouteTarget | null {
  if (!actionUrl || typeof actionUrl !== 'string') return null;

  // Normalise: strip leading slash, splash zapsplit:// scheme, querystrings.
  let path = actionUrl.replace(/^zapsplit:\/\//, '').replace(/^https?:\/\/[^/]+/, '');
  path = path.split('?')[0].replace(/^\//, '');

  if (!path) return null;

  const segs = path.split('/').filter(Boolean);
  if (segs.length === 0) return null;

  switch (segs[0]) {
    case 'settings': {
      if (segs[1] === 'stripe') return { name: 'ConnectStripe' };
      if (segs[1] === 'notifications') return { name: 'NotificationSettings' };
      return { name: 'Settings' };
    }
    case 'notifications':
      return { name: 'Notifications' };
    case 'splits': {
      const id = segs[1];
      if (id) {
        return { name: 'SplitFlow', params: { screen: 'SplitDetail', params: { splitId: id } } };
      }
      return { name: 'Main', params: { screen: 'Splits' } };
    }
    case 'split': {
      // legacy /split/:id
      const id = segs[1];
      if (id) {
        return { name: 'SplitFlow', params: { screen: 'SplitDetail', params: { splitId: id } } };
      }
      return null;
    }
    case 'pay': {
      const code = segs[1];
      if (code) {
        return { name: 'SplitFlow', params: { screen: 'ClaimItems', params: { paymentLinkCode: code } } };
      }
      return null;
    }
    case 'friends':
      return { name: 'Friends' };
    case 'analytics':
      return { name: 'Analytics' };
    default:
      return null;
  }
}

/**
 * Apply a routing decision to a navigation ref. Safe to call before nav is
 * ready — bails silently and the caller can retry.
 */
export function applyRoute(navRef: AnyNav | null, target: RouteTarget | null): boolean {
  if (!target || !navRef?.isReady?.()) return false;
  try {
    navRef.navigate(target.name as any, target.params);
    return true;
  } catch (e) {
    console.warn('Failed to apply notification route:', e);
    return false;
  }
}
