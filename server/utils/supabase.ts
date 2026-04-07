import { createClient } from '@supabase/supabase-js'

export function useSupabaseServiceClient() {
  const config = useRuntimeConfig()
  return createClient(config.supabaseUrl, config.supabaseServiceKey)
}
