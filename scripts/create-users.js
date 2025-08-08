import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// User data
const users = [
  // Super Admin
  { email: 'superadmin1@school.com', password: 'password123', role: 'super_admin', full_name: 'ผู้ดูแลระบบสูงสุด' },
  
  // Admins
  { email: 'admin1@school.com', password: 'password123', role: 'admin', full_name: 'ผู้ดูแลระบบ 1' },
  { email: 'admin2@school.com', password: 'password123', role: 'admin', full_name: 'ผู้ดูแลระบบ 2' },
  { email: 'admin3@school.com', password: 'password123', role: 'admin', full_name: 'ผู้ดูแลระบบ 3' },
  
  // Teachers
  { email: 'teacher1@school.com', password: 'password123', role: 'teacher', full_name: 'ครู สมชาย ใจดี' },
  { email: 'teacher2@school.com', password: 'password123', role: 'teacher', full_name: 'ครู สมหญิง รักเรียน' },
  { email: 'teacher3@school.com', password: 'password123', role: 'teacher', full_name: 'ครู วิชัย ปัญญาดี' },
  { email: 'teacher4@school.com', password: 'password123', role: 'teacher', full_name: 'ครู สุดา เก่งคณิต' },
  { email: 'teacher5@school.com', password: 'password123', role: 'teacher', full_name: 'ครู มานะ รักวิทย์' },
  { email: 'teacher6@school.com', password: 'password123', role: 'teacher', full_name: 'ครู สุนีย์ ศิลปิน' },
  { email: 'teacher7@school.com', password: 'password123', role: 'teacher', full_name: 'ครู ประยุทธ์ นักดนตรี' },
  { email: 'teacher8@school.com', password: 'password123', role: 'teacher', full_name: 'ครู สมศักดิ์ นักกีฬา' },
  { email: 'teacher9@school.com', password: 'password123', role: 'teacher', full_name: 'ครู วิไล ไอที' },
  { email: 'teacher10@school.com', password: 'password123', role: 'teacher', full_name: 'ครู สมบูรณ์ ช่างฝีมือ' }
];

// Add students (100 total)
for (let i = 1; i <= 100; i++) {
  users.push({
    email: `student${i}@school.com`,
    password: 'password123',
    role: 'student',
    full_name: `นักเรียน คนที่ ${i}`
  });
}

// Add parents (60 total)
for (let i = 1; i <= 60; i++) {
  users.push({
    email: `parent${i}@school.com`,
    password: 'password123',
    role: 'parent',
    full_name: `ผู้ปกครอง คนที่ ${i}`
  });
}

async function createUsers() {
  console.log('Starting user creation...');
  
  for (const userData of users) {
    try {
      // Create user with admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name
        }
      });

      if (authError) {
        console.error(`Error creating user ${userData.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Created user: ${userData.email}`);

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role
        });

      if (profileError) {
        console.error(`Error creating profile for ${userData.email}:`, profileError.message);
      } else {
        console.log(`✅ Created profile: ${userData.email}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Unexpected error for ${userData.email}:`, error);
    }
  }

  console.log('User creation completed!');
}

createUsers().catch(console.error);