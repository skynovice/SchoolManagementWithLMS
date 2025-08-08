<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';

  // Accept params prop to avoid warnings
  export const params = {};

  let user = null;
  let profile = null;
  let courses = [];
  let loading = true;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }
    
    user = session.user;
    await loadProfile();
    await loadCourses();
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

  async function loadCourses() {
    if (!user) return;
    
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          subjects (
            name,
            code
          ),
          course_enrollments (
            id,
            student_id
          )
        `);
      
      // If teacher, show only their courses
      if (profile?.role === 'teacher') {
        query = query.eq('teacher_id', user.id);
      } else {
        // For students/parents, show published courses
        query = query.eq('is_published', true);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading courses:', error);
        return;
      }
      
      if (data) {
        courses = data;
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  }

  async function togglePublish(courseId, currentStatus) {
    const { error } = await supabase
      .from('courses')
      .update({ is_published: !currentStatus })
      .eq('id', courseId);
    
    if (!error) {
      await loadCourses();
    }
  }

  async function deleteCourse(courseId) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบหลักสูตรนี้?')) {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      
      if (!error) {
        await loadCourses();
      }
    }
  }

  async function enrollCourse(courseId) {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: courseId,
          student_id: user.id
        });
      
      if (!error) {
        await loadCourses();
        alert('ลงทะเบียนเรียบร้อยแล้ว!');
      } else {
        console.error('Enrollment error:', error);
        alert('เกิดข้อผิดพลาดในการลงทะเบียน: ' + error.message);
      }
    } catch (error) {
      console.error('Failed to enroll:', error);
      alert('เกิดข้อผิดพลาดในการลงทะเบียน');
    }
  }

  function isEnrolled(course) {
    return course.course_enrollments?.some((e) => e.student_id === user.id);
  }

  function getEnrollmentCount(course) {
    return course.course_enrollments?.length || 0;
  }
</script>

<style>
  .courses-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    background: rgba(255, 255, 255, 0.95);
    padding: 1.5rem;
    border-radius: 15px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
  }

  .page-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .btn-primary {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
  }

  .loading {
    text-align: center;
    padding: 3rem;
    font-size: 1.2rem;
    color: white;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    backdrop-filter: blur(10px);
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .empty-state p {
    font-size: 1.2rem;
    color: #718096;
    margin-bottom: 1.5rem;
  }

  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }

  .course-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .course-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }

  .course-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
  }

  .course-title {
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    line-height: 1.3;
  }

  .course-subject {
    font-size: 0.9rem;
    opacity: 0.9;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    display: inline-block;
  }

  .course-body {
    padding: 1.5rem;
  }

  .course-description {
    color: #4a5568;
    margin-bottom: 1rem;
    line-height: 1.6;
    font-size: 0.95rem;
  }

  .course-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 10px;
    font-size: 0.85rem;
  }

  .course-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-badge {
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-published {
    background: linear-gradient(135deg, #48bb78, #38a169);
    color: white;
  }

  .status-draft {
    background: linear-gradient(135deg, #ed8936, #dd6b20);
    color: white;
  }

  .course-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .btn-small {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .btn-view {
    background: linear-gradient(135deg, #4facfe, #00f2fe);
    color: white;
  }

  .btn-edit {
    background: linear-gradient(135deg, #a8edea, #fed6e3);
    color: #2d3748;
  }

  .btn-publish {
    background: linear-gradient(135deg, #48bb78, #38a169);
    color: white;
  }

  .btn-unpublish {
    background: linear-gradient(135deg, #ed8936, #dd6b20);
    color: white;
  }

  .btn-delete {
    background: linear-gradient(135deg, #fc8181, #f56565);
    color: white;
  }

  .btn-enroll {
    background: linear-gradient(135deg, #9f7aea, #805ad5);
    color: white;
  }

  .btn-enrolled {
    background: linear-gradient(135deg, #48bb78, #38a169);
    color: white;
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-small:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .courses-container {
      padding: 1rem;
    }

    .page-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .page-title {
      font-size: 2rem;
    }

    .courses-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .course-meta {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .course-actions {
      justify-content: center;
    }
  }

  /* Animation for loading */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .loading {
    animation: pulse 2s infinite;
  }

  /* Glassmorphism effect */
  .course-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    pointer-events: none;
    border-radius: 20px;
  }
</style>

<div class="courses-container">
  <div class="page-header">
    <h1 class="page-title">
      {profile?.role === 'teacher' ? 'หลักสูตรของฉัน' : 'หลักสูตรทั้งหมด'}
    </h1>
    {#if profile?.role === 'teacher'}
      <a href="/courses/create" class="btn-primary">
        สร้างหลักสูตรใหม่
      </a>
    {/if}
  </div>

  {#if loading}
    <div class="loading">กำลังโหลดข้อมูล...</div>
  {:else if courses.length === 0}
    <div class="empty-state">
      <p>
        {profile?.role === 'teacher' 
          ? 'คุณยังไม่มีหลักสูตร' 
          : 'ยังไม่มีหลักสูตรในระบบ'}
      </p>
      {#if profile?.role === 'teacher'}
        <a href="/courses/create" class="btn-primary">
          สร้างหลักสูตรแรก
        </a>
      {/if}
    </div>
  {:else}
    <div class="courses-grid">
      {#each courses as course}
        <div class="course-card">
          <div class="course-header">
            <div class="course-title">{course.title}</div>
            <div class="course-subject">
              {course.subjects?.code} - {course.subjects?.name}
            </div>
          </div>
          
          <div class="course-body">
            <div class="course-description">
              {course.description || 'ไม่มีคำอธิบาย'}
            </div>
            
            <div class="course-meta">
              <div class="course-status">
                <span class="status-badge {course.is_published ? 'status-published' : 'status-draft'}">
                  {course.is_published ? 'เผยแพร่แล้ว' : 'ร่าง'}
                </span>
                <span>👥 {getEnrollmentCount(course)} คน</span>
              </div>
              <div>
                {new Date(course.created_at).toLocaleDateString('th-TH')}
              </div>
            </div>
            
            <div class="course-actions">
              <a href="/lms/course/{course.id}" class="btn-small btn-view">
                👁️ ดู
              </a>
              
              {#if profile?.role === 'teacher' && course.teacher_id === user.id}
                <a href="/lms/edit/{course.id}" class="btn-small btn-edit">
                  ✏️ แก้ไข
                </a>
                
                <button 
                  class="btn-small {course.is_published ? 'btn-unpublish' : 'btn-publish'}"
                  on:click={() => togglePublish(course.id, course.is_published)}
                >
                  {course.is_published ? '📤 ยกเลิกเผยแพร่' : '📢 เผยแพร่'}
                </button>
                
                <button 
                  class="btn-small btn-delete"
                  on:click={() => deleteCourse(course.id)}
                >
                  🗑️ ลบ
                </button>
              {:else if profile?.role === 'student'}
                {#if isEnrolled(course)}
                  <button class="btn-small btn-enrolled" disabled>
                    ✅ ลงทะเบียนแล้ว
                  </button>
                {:else}
                  <button 
                    class="btn-small btn-enroll"
                    on:click={() => enrollCourse(course.id)}
                  >
                    📝 ลงทะเบียน
                  </button>
                {/if}
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>