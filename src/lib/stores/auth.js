import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase.js';

// User store
export const user = writable(null);
export const profile = writable(null);
export const loading = writable(true);

// Initialize auth state
supabase.auth.onAuthStateChange(async (event, session) => {
  loading.set(true);
  
  if (session?.user) {
    user.set(session.user);
    
    // Get user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    profile.set(profileData);
  } else {
    user.set(null);
    profile.set(null);
  }
  
  loading.set(false);
});

// Auth functions
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signUp = async (email, password, userData = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};