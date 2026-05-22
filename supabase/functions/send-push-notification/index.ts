// Supabase Edge Function: send-push-notification
//
// Wire-up: a Postgres trigger (notifications_push_webhook) on
// public.notifications fires notify_push_on_insert() after every insert,
// which PERFORMs net.http_post to this function with the new row.
//
// On insert, we look up the recipient's push_token + preferences,
// honour quiet hours / per-type prefs, then POST to Expo's push API
// and stamp push_sent / push_sent_at on the notification row.
//
// JWT is disabled because the DB trigger calls this without auth headers —
// we rely on the SUPABASE_SERVICE_ROLE_KEY env for DB writes.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

type NotificationType =
  | 'split_created'
  | 'split_updated'
  | 'payment_requested'
  | 'payment_received'
  | 'payment_sent'
  | 'payment_reminder'
  | 'friend_request'
  | 'friend_accepted'
  | 'group_invite'
  | 'group_activity';

interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  action_url: string | null;
  channels: string[] | null;
  push_sent: boolean;
}

interface Preferences {
  push?: boolean;
  split_notifications?: boolean;
  payment_notifications?: boolean;
  reminder_notifications?: boolean;
  friend_notifications?: boolean;
  group_notifications?: boolean;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

const TYPE_TO_PREF: Record<NotificationType, keyof Preferences> = {
  split_created: 'split_notifications',
  split_updated: 'split_notifications',
  payment_requested: 'payment_notifications',
  payment_received: 'payment_notifications',
  payment_sent: 'payment_notifications',
  payment_reminder: 'reminder_notifications',
  friend_request: 'friend_notifications',
  friend_accepted: 'friend_notifications',
  group_invite: 'group_notifications',
  group_activity: 'group_notifications',
};

function inQuietHours(prefs: Preferences): boolean {
  if (!prefs.quiet_hours_enabled) return false;
  const start = prefs.quiet_hours_start ?? '23:00';
  const end = prefs.quiet_hours_end ?? '08:00';
  const now = new Date();
  const cur = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`;
  return start > end ? cur >= start || cur < end : cur >= start && cur < end;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  let payload: { type?: string; record?: NotificationRow };
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  if (payload.type !== 'INSERT' || !payload.record) {
    return new Response('ignored', { status: 200 });
  }

  const n = payload.record;
  if (n.push_sent) {
    return new Response('already sent', { status: 200 });
  }
  if (!n.channels?.includes('push')) {
    return new Response('not a push channel', { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('push_token, notification_preferences')
    .eq('id', n.user_id)
    .single();

  if (pErr || !profile) {
    return new Response(`profile lookup failed: ${pErr?.message}`, {
      status: 200,
    });
  }
  if (!profile.push_token) {
    return new Response('no push token', { status: 200 });
  }

  const prefs: Preferences = profile.notification_preferences ?? {};
  if (prefs.push === false) {
    return new Response('push disabled', { status: 200 });
  }
  const typePref = TYPE_TO_PREF[n.type];
  if (typePref && prefs[typePref] === false) {
    return new Response(`pref ${typePref} disabled`, { status: 200 });
  }
  if (inQuietHours(prefs)) {
    return new Response('quiet hours', { status: 200 });
  }

  const message = {
    to: profile.push_token,
    sound: 'default',
    title: n.title,
    body: n.body,
    data: { ...(n.data ?? {}), notificationId: n.id, actionUrl: n.action_url },
    channelId:
      n.type === 'payment_requested' ||
      n.type === 'payment_received' ||
      n.type === 'payment_sent'
        ? 'payments'
        : n.type === 'payment_reminder'
          ? 'reminders'
          : 'default',
  };

  const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const expoJson = await expoRes.json().catch(() => null);
  const ok = expoJson?.data?.status === 'ok';

  if (ok) {
    await supabase
      .from('notifications')
      .update({ push_sent: true, push_sent_at: new Date().toISOString() })
      .eq('id', n.id);
  }

  return new Response(
    JSON.stringify({ ok, expo: expoJson }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
