<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let user = null;
  let profile = null;
  let loading = true;
  let academicData = {
    totalStudents: 0,
    totalSubjects: 0,
    averageGrade: 0,
    passRate: 0,
    gradeDistribution: [],
    subjectPerformance: [],
    topPerformers: [],
    needsAttention: []
  };

  let selectedPeriod = 'current';
  let selectedSubject = '';
  let subjects = [];

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }
    
    user = session.user;
    await loadProfile();
    await loadSubjects();
    await loadAcademicData();
    loading = false;
  });

  async function loadProfile() {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    profile = data;
  }

  async function loadSubjects() {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    
    if (data) {
      subjects = data;
    }
  }

  async function loadAcademicData() {
    try {
      // Load comprehensive academic data from database
      const [
        studentsRes, 
        subjectsRes, 
        coursesRes, 
        progressRes,
        quizAttemptsRes,
        topicsRes,
        enrollmentsRes
      ] = await Promise.all([
        supabase.from('profiles').select('id, full_name, group_id, zone_id').eq('role', 'student'),
        supabase.from('subjects').select('id, name, code'),
        supabase.from('courses').select('id, title, subject_id'),
        supabase.from('student_progress').select('student_id, topic_id, completion_percentage, is_completed'),
        supabase.from('quiz_attempts').select('student_id, quiz_id, score, is_passed, created_at'),
        supabase.from('learning_topics').select('id, title, subject_id'),
        supabase.from('course_enrollments').select('student_id, course_id, progress, score')
      ]);

      const students = studentsRes.data || [];
      const subjects = subjectsRes.data || [];
      const courses = coursesRes.data || [];
      const progress = progressRes.data || [];
      const quizAttempts = quizAttemptsRes.data || [];
      const topics = topicsRes.data || [];
      const enrollments = enrollmentsRes.data || [];

      const totalStudents = students.length;
      const totalSubjects = subjects.length;
      const totalCourses = courses.length;

      // Calculate real average grade from quiz attempts
      const validScores = quizAttempts.filter(attempt => attempt.score !== null);
      const averageGrade = validScores.length > 0 
        ? validScores.reduce((sum, attempt) => sum + attempt.score, 0) / validScores.length / 25 // Convert to 4.0 scale
        : 0;

      // Calculate real pass rate from quiz attempts
      const passedAttempts = quizAttempts.filter(attempt => attempt.is_passed);
      const passRate = quizAttempts.length > 0 
        ? (passedAttempts.length / quizAttempts.length) * 100 
        : 0;

      // Subject performance based on real data
      const subjectPerformance = subjects.map(subject => {
        const subjectTopics = topics.filter(topic => topic.subject_id === subject.id);
        const subjectProgress = progress.filter(p => 
          subjectTopics.some(topic => topic.id === p.topic_id)
        );
        
        const completedProgress = subjectProgress.filter(p => p.is_completed);
        const subjectPassRate = subjectProgress.length > 0 
          ? (completedProgress.length / subjectProgress.length) * 100 
          : 0;

        const avgCompletion = subjectProgress.length > 0
          ? subjectProgress.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / subjectProgress.length
          : 0;

        return {
          subject: subject.name,
          code: subject.code || subject.name.substring(0, 3).toUpperCase(),
          department: 'ทั่วไป',
          average: Math.round((avgCompletion / 25) * 100) / 100, // Convert to 4.0 scale
          passRate: Math.round(subjectPassRate * 100) / 100,
          students: subjectProgress.length
        };
      });

      // Generate grade distribution based on actual quiz scores
      const gradeDistribution = [];
      if (validScores.length > 0) {
        const gradeRanges = [
          { grade: 'A', min: 90, max: 100 },
          { grade: 'B+', min: 85, max: 89 },
          { grade: 'B', min: 80, max: 84 },
          { grade: 'C+', min: 75, max: 79 },
          { grade: 'C', min: 70, max: 74 },
          { grade: 'D', min: 60, max: 69 },
          { grade: 'F', min: 0, max: 59 }
        ];

        gradeRanges.forEach(range => {
          const count = validScores.filter(attempt => 
            attempt.score >= range.min && attempt.score <= range.max
          ).length;
          const percentage = (count / validScores.length) * 100;
          
          if (count > 0) {
            gradeDistribution.push({
              grade: range.grade,
              count,
              percentage: Math.round(percentage * 10) / 10
            });
          }
        });
      }

      // Top performers based on actual progress data
      const studentPerformance = students.map(student => {
        const studentProgress = progress.filter(p => p.student_id === student.id);
        const studentQuizzes = quizAttempts.filter(q => q.student_id === student.id);
        
        const avgProgress = studentProgress.length > 0
          ? studentProgress.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / studentProgress.length
          : 0;
        
        const avgQuizScore = studentQuizzes.length > 0
          ? studentQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / studentQuizzes.length
          : 0;
        
        const overallScore = (avgProgress + avgQuizScore) / 2;
        
        return {
          ...student,
          overallScore,
          avgProgress,
          avgQuizScore
        };
      });

      const topPerformers = studentPerformance
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 5)
        .map(student => ({
          name: student.full_name,
          grade: Math.round((student.overallScore / 25) * 100) / 100, // Convert to 4.0 scale
          class: 'ไม่ระบุ',
          id: student.id
        }));

      // Students needing attention (lowest performers)
      const needsAttention = studentPerformance
        .sort((a, b) => a.overallScore - b.overallScore)
        .slice(0, 3)
        .filter(student => student.overallScore < 60) // Only include those below 60%
        .map(student => {
          const studentSubjects = progress
            .filter(p => p.student_id === student.id && p.completion_percentage < 50)
            .map(p => {
              const topic = topics.find(t => t.id === p.topic_id);
              const subject = subjects.find(s => s.id === topic?.subject_id);
              return subject?.name;
            })
            .filter(Boolean)
            .slice(0, 2);

          return {
            name: student.full_name,
            grade: Math.round((student.overallScore / 25) * 100) / 100,
            class: 'ไม่ระบุ',
            subjects: studentSubjects,
            id: student.id
          };
        });

      academicData = {
        totalStudents,
        totalSubjects,
        totalCourses,
        averageGrade: Math.round(averageGrade * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        subjectPerformance,
        gradeDistribution,
        topPerformers,
        needsAttention
      };
    } catch (error) {
      console.error('Error loading academic data:', error);
      // Fallback data
      academicData = {
        totalStudents: 0,
        totalSubjects: 0,
        totalCourses: 0,
        averageGrade: 0,
        passRate: 0,
        subjectPerformance: [],
        gradeDistribution: [],
        topPerformers: [],
        needsAttention: []
      };
    }
  }

  function getGradeColor(grade) {
    const colors = {
      'A': 'bg-green-500',
      'B+': 'bg-blue-500',
      'B': 'bg-blue-400',
      'C+': 'bg-yellow-500',
      'C': 'bg-yellow-400',
      'D+': 'bg-orange-500',
      'D': 'bg-orange-400',
      'F': 'bg-red-500'
    };
    return colors[grade] || 'bg-gray-400';
  }

  function getPerformanceColor(rate) {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 80) return 'text-blue-600 bg-blue-50';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }

  async function exportReport() {
    // In a real app, you'd generate and download a report
    alert('กำลังสร้างรายงาน... (ฟีเจอร์นี้จะพัฒนาในอนาคต)');
  }
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
        🎯
      </div>
      <div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">รายงานผลการเรียน</h1>
        <p class="text-gray-600 text-lg">วิเคราะห์ผลการเรียนและประสิทธิภาพการศึกษา</p>
      </div>
    </div>
    <div class="flex gap-3">
      <button
        on:click={exportReport}
        class="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors"
      >
        <span>📊</span>
        <span>ส่งออกรายงาน</span>
      </button>
      <a 
        href="/reports" 
        class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors no-underline"
      >
        <span>←</span>
        <span>กลับ</span>
      </a>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลผลการเรียน..." />
    </div>
  {:else}
    <!-- Filters -->
    <div class="bg-gradient-to-r from-white to-green-50 rounded-2xl shadow-lg border border-green-200 p-6 mb-8">
      <div class="flex flex-col md:flex-row gap-6">
        <div class="flex-1">
          <label class="block text-sm font-bold text-gray-700 mb-3">ช่วงเวลา</label>
          <select
            bind:value={selectedPeriod}
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm bg-white"
          >
            <option value="current">ภาคเรียนปัจจุบัน</option>
            <option value="previous">ภาคเรียนที่แล้ว</option>
            <option value="year">ปีการศึกษานี้</option>
            <option value="all">ทั้งหมด</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="block text-sm font-bold text-gray-700 mb-3">วิชา</label>
          <select
            bind:value={selectedSubject}
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm bg-white"
          >
            <option value="">ทุกวิชา</option>
            {#each subjects as subject}
              <option value={subject.id}>{subject.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-medium">นักเรียนทั้งหมด</p>
            <p class="text-3xl font-bold">{academicData.totalStudents}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            👨‍🎓
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-100 text-sm font-medium">เกรดเฉลี่ย</p>
            <p class="text-3xl font-bold">{academicData.averageGrade.toFixed(2)}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            📊
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-purple-100 text-sm font-medium">อัตราผ่าน</p>
            <p class="text-3xl font-bold">{academicData.passRate}%</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            ✅
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-orange-100 text-sm font-medium">วิชาทั้งหมด</p>
            <p class="text-3xl font-bold">{academicData.totalSubjects}</p>
          </div>
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
            📚
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Grade Distribution -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
          <h2 class="text-xl font-bold text-blue-800 flex items-center gap-3">
            <span class="text-2xl">📊</span>
            การกระจายเกรด
          </h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            {#each academicData.gradeDistribution as item}
              <div class="flex items-center gap-4">
                <div class="w-12 text-center font-bold text-gray-700">{item.grade}</div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm text-gray-600">{item.count} คน</span>
                    <span class="text-sm font-medium text-gray-700">{item.percentage}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      class="h-3 rounded-full {getGradeColor(item.grade)}" 
                      style="width: {item.percentage}%"
                    ></div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Subject Performance -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
          <h2 class="text-xl font-bold text-green-800 flex items-center gap-3">
            <span class="text-2xl">📈</span>
            ผลการเรียนแต่ละวิชา
          </h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            {#each academicData.subjectPerformance as subject}
              <div class="border border-gray-100 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-800">{subject.subject}</h3>
                  <span class="px-3 py-1 text-sm font-medium rounded-full {getPerformanceColor(subject.passRate)}">
                    {subject.passRate}%
                  </span>
                </div>
                <div class="flex items-center justify-between text-sm text-gray-600">
                  <span>เกรดเฉลี่ย: {subject.average.toFixed(2)}</span>
                  <span>{subject.students} คน</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Top Performers -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 px-6 py-4 border-b border-yellow-200">
          <h2 class="text-xl font-bold text-yellow-800 flex items-center gap-3">
            <span class="text-2xl">🏆</span>
            นักเรียนเก่ง
          </h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            {#each academicData.topPerformers as student, index}
              <div class="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl">
                <div class="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-800">{student.name}</h3>
                  <p class="text-sm text-gray-600">{student.class}</p>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-yellow-600">{typeof student.grade === 'number' ? student.grade.toFixed(2) : student.grade}</div>
                  <div class="text-xs text-gray-500">GPA</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Students Needing Attention -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-red-200">
          <h2 class="text-xl font-bold text-red-800 flex items-center gap-3">
            <span class="text-2xl">⚠️</span>
            ต้องให้ความช่วยเหลือ
          </h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            {#each academicData.needsAttention as student}
              <div class="border border-red-200 rounded-xl p-4 bg-red-50">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-800">{student.name}</h3>
                  <span class="text-lg font-bold text-red-600">{typeof student.grade === 'number' ? student.grade.toFixed(2) : student.grade}</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">{student.class}</p>
                <div class="flex flex-wrap gap-1">
                  {#each student.subjects as subject}
                    <span class="px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full">
                      {subject}
                    </span>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>