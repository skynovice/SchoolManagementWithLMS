<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';
  import Button from '$components/Button.svelte';

  let user = null;
  let profile = null;
  let loading = true;
  let processing = false;
  let results = [];

  onMount(async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }

    user = session.user;
    await loadProfile();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      goto('/dashboard');
      return;
    }

    loading = false;
  });

  async function loadProfile() {
    if (!user) return;

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    profile = data;
  }

  async function setupDatabase() {
    processing = true;
    results = [];

    try {
      // Check and create course_assignments table
      results.push('🔍 ตรวจสอบตาราง course_assignments...');

      const { data: assignmentsTest, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select('id')
        .limit(1);

      if (assignmentsError && assignmentsError.code === 'PGRST116') {
        results.push('❌ ตาราง course_assignments ไม่มีอยู่ - ต้องสร้างใหม่');
        results.push('⚠️ กรุณาสร้างตารางนี้ในฐานข้อมูล Supabase:');
        results.push(`
CREATE TABLE course_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'completed', 'overdue')),
  description TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  score DECIMAL(5,2),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own assignments" ON course_assignments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage assignments for their courses" ON course_assignments
  FOR ALL USING (
    assigned_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_assignments.course_id 
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all assignments" ON course_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
        `);
      } else if (assignmentsError) {
        results.push(
          `❌ เกิดข้อผิดพลาดในการตรวจสอบ course_assignments: ${assignmentsError.message}`
        );
      } else {
        results.push('✅ ตาราง course_assignments มีอยู่แล้ว');
      }

      // Check and create student_progress table
      results.push('🔍 ตรวจสอบตาราง student_progress...');

      const { data: progressTest, error: progressError } = await supabase
        .from('student_progress')
        .select('id')
        .limit(1);

      if (progressError && progressError.code === 'PGRST116') {
        results.push('❌ ตาราง student_progress ไม่มีอยู่ - ต้องสร้างใหม่');
        results.push('⚠️ กรุณาสร้างตารางนี้ในฐานข้อมูล Supabase:');
        results.push(`
CREATE TABLE student_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES learning_topics(id) ON DELETE CASCADE,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  total_time_spent INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, topic_id)
);

-- Add RLS policies
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own progress" ON student_progress
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can update their own progress" ON student_progress
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own progress" ON student_progress
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view progress for their topics" ON student_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_topics 
      WHERE learning_topics.id = student_progress.topic_id 
      AND learning_topics.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all progress" ON student_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
        `);
      } else if (progressError) {
        results.push(`❌ เกิดข้อผิดพลาดในการตรวจสอบ student_progress: ${progressError.message}`);
      } else {
        results.push('✅ ตาราง student_progress มีอยู่แล้ว');
      }

      // Check quiz_attempts table
      results.push('🔍 ตรวจสอบตาราง quiz_attempts...');

      const { data: attemptsTest, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id')
        .limit(1);

      if (attemptsError && attemptsError.code === 'PGRST116') {
        results.push('❌ ตาราง quiz_attempts ไม่มีอยู่ - ต้องสร้างใหม่');
        results.push('⚠️ กรุณาสร้างตารางนี้ในฐานข้อมูล Supabase:');
        results.push(`
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  score DECIMAL(5,2),
  total_questions INTEGER,
  correct_answers INTEGER DEFAULT 0,
  is_passed BOOLEAN DEFAULT FALSE,
  time_taken INTEGER, -- in seconds
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own quiz attempts" ON quiz_attempts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view attempts for their quizzes" ON quiz_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN learning_parts lp ON q.part_id = lp.id
      JOIN learning_topics lt ON lp.topic_id = lt.id
      WHERE q.id = quiz_attempts.quiz_id 
      AND lt.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all quiz attempts" ON quiz_attempts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
        `);
      } else if (attemptsError) {
        results.push(`❌ เกิดข้อผิดพลาดในการตรวจสอบ quiz_attempts: ${attemptsError.message}`);
      } else {
        results.push('✅ ตาราง quiz_attempts มีอยู่แล้ว');
      }

      // Check quiz_attempt_answers table
      results.push('🔍 ตรวจสอบตาราง quiz_attempt_answers...');

      const { data: answersTest, error: answersError } = await supabase
        .from('quiz_attempt_answers')
        .select('id')
        .limit(1);

      if (answersError && answersError.code === 'PGRST116') {
        results.push('❌ ตาราง quiz_attempt_answers ไม่มีอยู่ - ต้องสร้างใหม่');
        results.push('⚠️ กรุณาสร้างตารางนี้ในฐานข้อมูล Supabase:');
        results.push(`
CREATE TABLE quiz_attempt_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES quiz_question_options(id),
  answer_text TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  points_earned DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own quiz answers" ON quiz_attempt_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts 
      WHERE quiz_attempts.id = quiz_attempt_answers.attempt_id 
      AND quiz_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert their own quiz answers" ON quiz_attempt_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_attempts 
      WHERE quiz_attempts.id = quiz_attempt_answers.attempt_id 
      AND quiz_attempts.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view answers for their quizzes" ON quiz_attempt_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      JOIN learning_parts lp ON q.part_id = lp.id
      JOIN learning_topics lt ON lp.topic_id = lt.id
      WHERE qa.id = quiz_attempt_answers.attempt_id 
      AND lt.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all quiz answers" ON quiz_attempt_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
        `);
      } else if (answersError) {
        results.push(`❌ เกิดข้อผิดพลาดในการตรวจสอบ quiz_attempt_answers: ${answersError.message}`);
      } else {
        results.push('✅ ตาราง quiz_attempt_answers มีอยู่แล้ว');
      }

      // Check system_logs table
      results.push('🔍 ตรวจสอบตาราง system_logs...');

      const { data: logsTest, error: logsError } = await supabase
        .from('system_logs')
        .select('id')
        .limit(1);

      if (logsError && logsError.code === 'PGRST116') {
        results.push('❌ ตาราง system_logs ไม่มีอยู่ - ต้องสร้างใหม่');
        results.push('⚠️ กรุณาสร้างตารางนี้ในฐานข้อมูล Supabase:');
        results.push(`
CREATE TABLE system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs" ON system_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all logs" ON system_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert logs" ON system_logs
  FOR INSERT WITH CHECK (true);
        `);
      } else if (logsError) {
        results.push(`❌ เกิดข้อผิดพลาดในการตรวจสอบ system_logs: ${logsError.message}`);
      } else {
        results.push('✅ ตาราง system_logs มีอยู่แล้ว');
      }

      results.push('🎉 การตรวจสอบฐานข้อมูลเสร็จสิ้น!');
      results.push('📝 หากมีตารางที่ไม่มีอยู่ กรุณาคัดลอก SQL ข้างต้นไปรันใน Supabase SQL Editor');
    } catch (error) {
      console.error('Error setting up database:', error);
      results.push(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    }

    processing = false;
  }

  async function testConnections() {
    processing = true;
    results = [];

    try {
      results.push('🔍 ทดสอบการเชื่อมต่อฐานข้อมูล...');

      // Test basic tables
      const tables = [
        'profiles',
        'subjects',
        'zones',
        'groups',
        'courses',
        'learning_topics',
        'learning_parts',
        'learning_resources',
        'quizzes',
        'quiz_questions',
        'quiz_question_options',
        'messages'
      ];

      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('id').limit(1);

          if (error) {
            results.push(`❌ ${table}: ${error.message}`);
          } else {
            results.push(`✅ ${table}: เชื่อมต่อสำเร็จ`);
          }
        } catch (err) {
          results.push(`❌ ${table}: ${err.message}`);
        }
      }

      results.push('🎉 การทดสอบเสร็จสิ้น!');
    } catch (error) {
      console.error('Error testing connections:', error);
      results.push(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    }

    processing = false;
  }
</script>

<svelte:head>
  <title>ตั้งค่าฐานข้อมูล - Admin</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดข้อมูล..." />
  </div>
{:else}
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div
      class="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl shadow-lg border border-purple-200 p-8 mb-8"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg"
          >
            🗄️
          </div>
          <div>
            <h1
              class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"
            >
              ตั้งค่าฐานข้อมูล
            </h1>
            <p class="text-gray-700 text-lg mt-1">ตรวจสอบและสร้างตารางที่จำเป็นสำหรับระบบ LMS</p>
          </div>
        </div>
        <Button href="/dashboard" variant="outline">← กลับ</Button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
        <h3 class="text-xl font-bold text-gray-800 mb-4">ตรวจสอบตารางที่จำเป็น</h3>
        <p class="text-gray-600 mb-6">ตรวจสอบว่ามีตารางที่จำเป็นสำหรับระบบ LMS หรือไม่</p>
        <Button on:click={setupDatabase} variant="primary" disabled={processing} fullWidth>
          {#if processing}
            กำลังตรวจสอบ...
          {:else}
            ตรวจสอบฐานข้อมูล
          {/if}
        </Button>
      </div>

      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
        <h3 class="text-xl font-bold text-gray-800 mb-4">ทดสอบการเชื่อมต่อ</h3>
        <p class="text-gray-600 mb-6">ทดสอบการเชื่อมต่อกับตารางพื้นฐานทั้งหมด</p>
        <Button on:click={testConnections} variant="outline" disabled={processing} fullWidth>
          {#if processing}
            กำลังทดสอบ...
          {:else}
            ทดสอบการเชื่อมต่อ
          {/if}
        </Button>
      </div>
    </div>

    <!-- Results -->
    {#if results.length > 0}
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">ผลการดำเนินการ</h2>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          {#each results as result}
            <div class="p-3 bg-gray-50 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {result}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Instructions -->
    <div class="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
      <h3 class="text-xl font-bold text-yellow-800 mb-4">📋 คำแนะนำ</h3>
      <div class="space-y-3 text-yellow-700">
        <p>
          <strong>1. ตรวจสอบฐานข้อมูล:</strong> คลิก "ตรวจสอบฐานข้อมูล" เพื่อดูว่าตารางใดที่ยังไม่มี
        </p>
        <p>
          <strong>2. สร้างตาราง:</strong> หากมีตารางที่ไม่มีอยู่ ให้คัดลอก SQL ที่แสดงไปรันใน Supabase
          SQL Editor
        </p>
        <p>
          <strong>3. ทดสอบการเชื่อมต่อ:</strong> หลังจากสร้างตารางแล้ว ให้ทดสอบการเชื่อมต่อเพื่อยืนยัน
        </p>
        <p>
          <strong>4. เข้าถึง Supabase:</strong> ไปที่
          <a href="https://supabase.com/dashboard" target="_blank" class="underline"
            >Supabase Dashboard</a
          > → เลือกโปรเจค → SQL Editor
        </p>
      </div>
    </div>
  </div>
{/if}
