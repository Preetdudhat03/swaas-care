import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect if we have real Supabase credentials
export const isMockMode = !supabaseUrl || supabaseUrl.includes('mock') || !supabaseAnonKey || supabaseAnonKey === 'mock_key';

// Only create a real client if credentials are valid
export const supabase = isMockMode
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);

const MOCK_USER_ID = 'demo-user-123';
const LOCAL_STORAGE_KEY = 'swaascare_voice_logs';

/* ——————————————————————————————————————————
   LocalStorage helpers (mock-mode persistence)
   —————————————————————————————————————————— */
function getLocalLogs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLogs(logs) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('[Mock Mode] localStorage write failed:', e.message);
  }
}

/* ——————————————————————————————————————————
   Auth helper
   —————————————————————————————————————————— */
export async function ensureDemoUser() {
  if (isMockMode) {
    return MOCK_USER_ID;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      console.log("No session found, signing in anonymously or ensuring demo user");
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) {
        console.warn("Anonymous sign-in failed (possibly disabled). Using mock user.");
        return MOCK_USER_ID;
      }
      return authData.user?.id || MOCK_USER_ID;
    }
    return data.session.user?.id || MOCK_USER_ID;
  } catch (e) {
    console.warn("Auth error, falling back to mock user:", e.message);
    return MOCK_USER_ID;
  }
}

/* ——————————————————————————————————————————
   Data helpers (auto-route to localStorage
   when no real Supabase is configured)
   —————————————————————————————————————————— */

/**
 * Fetch voice_logs for the given user.
 * Returns { data, error } — always resolves, never throws.
 */
export async function fetchVoiceLogs(userId) {
  if (isMockMode) {
    const logs = getLocalLogs()
      .filter(l => l.user_id === userId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return { data: logs, error: null };
  }
  return supabase
    .from('voice_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
}

/**
 * Insert a voice_log row.
 * Returns { error } — always resolves, never throws.
 */
export async function insertVoiceLog(row) {
  if (isMockMode) {
    const logs = getLocalLogs();
    const entry = {
      ...row,
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    logs.push(entry);
    saveLocalLogs(logs);
    console.log("[Mock Mode] Saved voice log to localStorage.");
    return { error: null };
  }
  return supabase.from('voice_logs').insert(row);
}
