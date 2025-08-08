/**
 * @fileoverview Authentication store
 * @author School Management System
 * @created 2025-01-08
 */

import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase.js';

// Auth store
export const user = writable(null);
export const profile = writable(null);
export const loading = writable(true);

/**
 * Initialize auth state
 */
export const initAuth = async () => {
  try {
    loading.set(true);
    
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      user.set(session.user);
      await loadProfile(session.user.id);
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        user.set(session.user);
        await loadProfile(session.user.id);
      } else {
        user.set(null);
        profile.set(null);
      }
    });
  } catch (error) {
    console.error('Auth initialization error:', error);
  } finally {
    loading.set(false);
  }
};

/**
 * Load user profile
 * @param {string} userId - User ID
 */
const loadProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        zones (
          id,
          name
        ),
        groups (
          id,
          name
        )
      `)
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    profile.set(data);
  } catch (error) {
    console.error('Profile loading error:', error);
    profile.set(null);
  }
};

/**
 * Sign in with email and password
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' 
    };
  }
};

/**
 * Sign out
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    user.set(null);
    profile.set(null);
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการออกจากระบบ' 
    };
  }
};

/**
 * Update profile
 * @param {Object} updates - Profile updates
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateProfile = async (updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', updates.id)
      .select()
      .single();
    
    if (error) throw error;
    
    profile.set(data);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล' 
    };
  }
};

/**
 * Check if user has role
 * @param {string} requiredRole - Required role
 * @param {Object} userProfile - User profile
 * @returns {boolean}
 */
export const hasRole = (requiredRole, userProfile = null) => {
  if (!userProfile) return false;
  
  const roleHierarchy = {
    'super_admin': 5,
    'admin': 4,
    'teacher': 3,
    'parent': 2,
    'student': 1
  };
  
  const userRoleLevel = roleHierarchy[userProfile.role] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
  
  return userRoleLevel >= requiredRoleLevel;
};