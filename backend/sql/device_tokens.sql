-- Device tokens table stores push registration per user/device
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL DEFAULT 'unknown',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON public.device_tokens(user_id) WHERE revoked_at IS NULL;

COMMENT ON TABLE public.device_tokens IS 'Stores push notification tokens per user device.';
COMMENT ON COLUMN public.device_tokens.platform IS 'ios | android | web | unknown';
COMMENT ON COLUMN public.device_tokens.revoked_at IS 'Set when a token is invalidated so we stop sending pushes.';

