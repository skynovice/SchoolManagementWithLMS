<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';

  let user = null;
  let profile = null;
  let students = [];
  let courses = [];
  let enrollments = [];
  let loading = true;
  let selectedCourse = '';
  let selectedZone = '';
  let zones = [];

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }
    
    user = session.user;
    await loadProfile();
    await loadData();
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

  async function loadData() {
    // Load zones
    const { data: zonesData } = await supabase
      .from('zones')
      .select('*')
      .order('name');
    zones = zonesData || [];

    // Load courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select(`
        *,
        subjects (name),
        profiles (full_name)
      `)
      .eq('is_published', true);
    courses = coursesData || [];

    // Load enrollments with student and course data
    const { data: enrollmentsData } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        courses (
          title,
          subjects (name)
        ),
        profiles (
          full_name,
          zone_id,
          zones (name)
        )
      `);
    enrollments = enrollmentsData || [];
  }

  function filterEnrollments() {
    let filtered = enrollments;
    
    if (selectedCourse) {
      filtered = filtered.filter(e => e.course_id === selectedCourse);
    }
    
    if (selectedZone) {
      filtered = filtered.filter(e => e.profiles?.zone_id === selectedZone);
    }
    
    return filtered;
  }

  function getPerformanceLevel(score) {
    if (score >= 80) return { level: 'ดีเยี่ยม', class: 'excellent' };
    if (score >= 70) return { level: 'ดี', class: 'good' };
    if (score >= 60) return { level: 'พอใช้', class: 'fair' };
    if (score >= 50) return { level: 'ต้องปรับปรุง', class: 'poor' };
    return { level: 'ไม่ผ่าน', class: 'fail' };
  }

  function calculateAverageScore(enrollments) {
    const validScores = enrollments.filter(e => e.score !== null);
    if (validScores.length === 0) return 0;
    return validScores.reduce((sum, e) => sum + e.score, 0) / validScores.length;
  }

  function exportToCSV() {
    const filtered = filterEnrollments();
    const csvContent = [
      ['ชื่อนักเรียน', 'หลักสูตร', 'วิชา', 'โซน', 'คะแนน', 'ความก้าวหน้า (%)', 'สถานะ', 'วันที่ลงทะเบียน', 'วันที่จบ'].join(','),
      ...filtered.map(e => [
        e.profiles?.full_name || '',
        e.courses?.title || '',
        e.courses?.subjects?.name || '',
        e.profiles?.zones?.name || '',
        e.score || 'ยังไม่มีคะแนน',
        e.progress || 0,
        e.completed_at ? 'จบแล้ว' : 'กำลังเรียน',
        new Date(e.enrolled_at).toLocaleDateString('th-TH'),
        e.completed_at ? new Date(e.completed_at).toLocaleDateString('th-TH') : 'ยังไม่จบ'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'student-performance-report.csv';
    link.click();
  }

  $: filteredEnrollments = filterEnrollments();
  $: averageScore = calculateAverageScore(filteredEnrollments);
  $: completionRate = filteredEnrollments.length > 0 
    ? (filteredEnrollments.filter(e => e.completed_at).length / filteredEnrollments.length) * 100 
    : 0;
</script>



<div class="report-container">
  <div class="page-header">
    <h1 class="page-title">รายงานผลการเรียนของผู้เข้ารับการอบรม</h1>
    <a href="/reports" class="btn-back">← กลับ</a>
  </div>

  {#if loading}
    <div class="loading">กำลังโหลดข้อมูล...</div>
  {:else}
    <div class="filters">
      <div class="filter-group">
        <label>หลักสูตร</label>
        <select bind:value={selectedCourse}>
          <option value="">ทุกหลักสูตร</option>
          {#each courses as course}
            <option value={course.id}>{course.title}</option>
          {/each}
        </select>
      </div>
      
      <div class="filter-group">
        <label>โซน</label>
        <select bind:value={selectedZone}>
          <option value="">ทุกโซน</option>
          {#each zones as zone}
            <option value={zone.id}>{zone.name}</option>
          {/each}
        </select>
      </div>
      
      <button class="btn-export" on:click={exportToCSV}>
        📊 ส่งออก CSV
      </button>
    </div>

    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-number">{filteredEnrollments.length}</div>
        <div class="summary-label">จำนวนผู้เรียนทั้งหมด</div>
      </div>
      
      <div class="summary-card">
        <div class="summary-number">{averageScore.toFixed(1)}</div>
        <div class="summary-label">คะแนนเฉลี่ย</div>
      </div>
      
      <div class="summary-card">
        <div class="summary-number">{completionRate.toFixed(1)}%</div>
        <div class="summary-label">อัตราการจบหลักสูตร</div>
      </div>
      
      <div class="summary-card">
        <div class="summary-number">{filteredEnrollments.filter(e => e.completed_at).length}</div>
        <div class="summary-label">ผู้เรียนที่จบแล้ว</div>
      </div>
    </div>

    {#if filteredEnrollments.length === 0}
      <div class="empty-state">
        <p>ไม่พบข้อมูลผู้เรียนตามเงื่อนไขที่เลือก</p>
      </div>
    {:else}
      <div class="report-table">
        <table class="table">
          <thead>
            <tr>
              <th>ชื่อนักเรียน</th>
              <th>หลักสูตร</th>
              <th>วิชา</th>
              <th>โซน</th>
              <th>คะแนน</th>
              <th>ความก้าวหน้า</th>
              <th>ระดับผลการเรียน</th>
              <th>สถานะ</th>
              <th>วันที่ลงทะเบียน</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredEnrollments as enrollment}
              <tr>
                <td>{enrollment.profiles?.full_name || 'ไม่ทราบชื่อ'}</td>
                <td>{enrollment.courses?.title || 'ไม่ทราบหลักสูตร'}</td>
                <td>{enrollment.courses?.subjects?.name || 'ไม่ทราบวิชา'}</td>
                <td>{enrollment.profiles?.zones?.name || 'ไม่ระบุ'}</td>
                <td>
                  {#if enrollment.score !== null}
                    {enrollment.score.toFixed(1)}
                  {:else}
                    <span class="text-gray-500">ยังไม่มีคะแนน</span>
                  {/if}
                </td>
                <td>
                  <div class="w-24 h-2 bg-gray-200 rounded overflow-hidden">
                    <div class="h-full bg-primary-500 transition-all duration-300" style="width: {enrollment.progress || 0}%"></div>
                  </div>
                  <small>{(enrollment.progress || 0).toFixed(1)}%</small>
                </td>
                <td>
                  {#if enrollment.score !== null}
                    {@const performance = getPerformanceLevel(enrollment.score)}
                    <span class="performance-badge {performance.class}">
                      {performance.level}
                    </span>
                  {:else}
                    <span class="text-gray-500">ยังไม่ประเมิน</span>
                  {/if}
                </td>
                <td>
                  {#if enrollment.completed_at}
                    <span class="status-completed">จบแล้ว</span>
                  {:else}
                    <span class="status-in-progress">กำลังเรียน</span>
                  {/if}
                </td>
                <td>{new Date(enrollment.enrolled_at).toLocaleDateString('th-TH')}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>