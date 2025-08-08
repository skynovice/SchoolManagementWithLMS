// Database utility functions for School Management System
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role key for database operations
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Database Management Functions
 * These functions provide admin-level access to the database
 */

export class DatabaseManager {
  constructor() {
    this.client = supabaseAdmin;
  }

  /**
   * Create a new user with profile
   */
  async createUser(userData) {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await this.client.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role
        }
      });

      if (authError) throw authError;

      // Create profile
      const { data: profileData, error: profileError } = await this.client
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          zone_id: userData.zone_id || null,
          group_id: userData.group_id || null,
          student_id: userData.student_id || null,
          employee_id: userData.employee_id || null,
          phone: userData.phone || null,
          address: userData.address || null,
          date_of_birth: userData.date_of_birth || null
        });

      if (profileError) throw profileError;

      return { success: true, user: authData.user, profile: profileData };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, profile: data };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete user and profile
   */
  async deleteUser(userId) {
    try {
      // Delete from auth (this will cascade to profile due to foreign key)
      const { error: authError } = await this.client.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    try {
      const [
        { count: totalUsers },
        { count: totalStudents },
        { count: totalTeachers },
        { count: totalCourses },
        { count: totalMessages },
        { count: activeUsers }
      ] = await Promise.all([
        this.client.from('profiles').select('*', { count: 'exact', head: true }),
        this.client.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        this.client.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        this.client.from('courses').select('*', { count: 'exact', head: true }),
        this.client.from('messages').select('*', { count: 'exact', head: true }),
        this.client.from('profiles').select('*', { count: 'exact', head: true })
          .gte('last_login_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        success: true,
        stats: {
          totalUsers: totalUsers || 0,
          totalStudents: totalStudents || 0,
          totalTeachers: totalTeachers || 0,
          totalCourses: totalCourses || 0,
          totalMessages: totalMessages || 0,
          activeUsers: activeUsers || 0
        }
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create sample data
   */
  async createSampleData() {
    try {
      // Create sample zones
      const zones = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'อาคาร A ชั้น 1',
          description: 'ห้องเรียนชั้นประถมศึกษา',
          building: 'อาคาร A',
          floor: 1,
          capacity: 200
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'อาคาร A ชั้น 2',
          description: 'ห้องเรียนชั้นมัธยมศึกษาตอนต้น',
          building: 'อาคาร A',
          floor: 2,
          capacity: 180
        }
      ];

      const { error: zonesError } = await this.client
        .from('zones')
        .upsert(zones);

      if (zonesError) throw zonesError;

      // Create sample subjects
      const subjects = [
        {
          id: '770e8400-e29b-41d4-a716-446655440001',
          name: 'คณิตศาสตร์พื้นฐาน',
          code: 'MATH101',
          description: 'คณิตศาสตร์พื้นฐานสำหรับนักเรียนชั้นประถม',
          credits: 3,
          department: 'คณิตศาสตร์'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440002',
          name: 'ภาษาอังกฤษพื้นฐาน',
          code: 'ENG101',
          description: 'ภาษาอังกฤษพื้นฐานสำหรับการสื่อสาร',
          credits: 3,
          department: 'ภาษาต่างประเทศ'
        }
      ];

      const { error: subjectsError } = await this.client
        .from('subjects')
        .upsert(subjects);

      if (subjectsError) throw subjectsError;

      return { success: true, message: 'Sample data created successfully' };
    } catch (error) {
      console.error('Error creating sample data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run database health check
   */
  async healthCheck() {
    try {
      // Test basic connectivity
      const { data, error } = await this.client
        .from('system_settings')
        .select('*')
        .limit(1);

      if (error) throw error;

      // Check table counts
      const tables = ['profiles', 'zones', 'groups', 'subjects', 'courses', 'messages'];
      const counts = {};

      for (const table of tables) {
        const { count, error: countError } = await this.client
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          counts[table] = `Error: ${countError.message}`;
        } else {
          counts[table] = count || 0;
        }
      }

      return {
        success: true,
        health: {
          database_connected: true,
          system_settings: data?.[0] || null,
          table_counts: counts,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        success: false,
        health: {
          database_connected: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Log activity
   */
  async logActivity(userId, action, resourceType, resourceId = null, details = null) {
    try {
      const { error } = await this.client
        .from('activity_logs')
        .insert({
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error logging activity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get activity logs
   */
  async getActivityLogs(limit = 100, offset = 0) {
    try {
      const { data, error } = await this.client
        .from('activity_logs')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { success: true, logs: data };
    } catch (error) {
      console.error('Error getting activity logs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(settings) {
    try {
      const { data, error } = await this.client
        .from('system_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;

      return { success: true, settings: data };
    } catch (error) {
      console.error('Error updating system settings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Backup database (export data)
   */
  async exportData(tables = null) {
    try {
      const tablesToExport = tables || [
        'profiles', 'zones', 'groups', 'subjects', 'courses',
        'course_enrollments', 'lessons', 'assignments', 'messages',
        'system_settings'
      ];

      const exportData = {};

      for (const table of tablesToExport) {
        const { data, error } = await this.client
          .from(table)
          .select('*');

        if (error) {
          console.warn(`Error exporting ${table}:`, error);
          exportData[table] = { error: error.message };
        } else {
          exportData[table] = data;
        }
      }

      return {
        success: true,
        data: exportData,
        exported_at: new Date().toISOString(),
        tables_count: Object.keys(exportData).length
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
export const dbManager = new DatabaseManager();

// Utility functions for common operations
export const dbUtils = {
  /**
   * Format user role for display
   */
  formatRole(role) {
    const roleNames = {
      'super_admin': 'ผู้ดูแลระบบสูงสุด',
      'admin': 'ผู้ดูแลระบบ',
      'teacher': 'ครู',
      'parent': 'ผู้ปกครอง',
      'student': 'นักเรียน'
    };
    return roleNames[role] || role;
  },

  /**
   * Generate unique student/employee ID
   */
  generateId(type, sequence) {
    const prefix = type === 'student' ? 'S' : 'T';
    return `${prefix}${String(sequence).padStart(4, '0')}`;
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Format date for Thai locale
   */
  formatThaiDate(date) {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * Calculate age from birth date
   */
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
};

export default dbManager;