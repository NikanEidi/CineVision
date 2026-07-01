import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '⚠️ Supabase credentials not found. Create a .env file with:\n' +
        'VITE_SUPABASE_URL=your_supabase_url\n' +
        'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n\n' +
        'Using mock client for UI preview.'
    );

    // Mock Supabase client for UI preview
    const mockResponse = { data: null, error: { message: 'Supabase not configured' } };
    const mockAuth = {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => mockResponse,
        signUp: async () => mockResponse,
        signOut: async () => mockResponse,
        resetPasswordForEmail: async () => mockResponse,
        updateUser: async () => mockResponse,
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    };
    const mockFrom = () => ({
        select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => mockResponse, order: async () => mockResponse }) }) }), order: async () => mockResponse }),
        insert: async () => mockResponse,
        update: () => ({ eq: () => ({ eq: () => ({ eq: async () => mockResponse }) }) }),
        delete: () => ({ eq: () => ({ eq: () => ({ eq: async () => mockResponse }) }) }),
        upsert: async () => mockResponse,
    });

    supabase = {
        auth: mockAuth,
        from: mockFrom,
    };
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };