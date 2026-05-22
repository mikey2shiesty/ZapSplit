-- Trigger: notifications_push_webhook
--
-- Fires the send-push-notification edge function after every insert into
-- public.notifications. Only fires when 'push' is in the channels array.
--
-- Requires: pg_net extension enabled (it is).

CREATE OR REPLACE FUNCTION public.notify_push_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  function_url text := 'https://hnoepzcsrtyqahjyzemg.supabase.co/functions/v1/send-push-notification';
BEGIN
  IF NEW.channels IS NULL OR NOT ('push' = ANY(NEW.channels)) THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'notifications',
      'schema', 'public',
      'record', to_jsonb(NEW)
    )
  );

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notifications_push_webhook ON public.notifications;

CREATE TRIGGER notifications_push_webhook
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION notify_push_on_insert();
