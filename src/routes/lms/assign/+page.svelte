<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import Card from '$components/Card.svelte';
  import Button from '$components/Button.svelte';
  import Input from '$components/Input.svelte';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  // Accept params prop to avoid warnings
  export const params = {};

  let user = null;
  let profile = null;
  let courses = [];
  let zones = [];
  let groups = [];
  let students = [];
  let loading = true;
  let submitting = false;
  let showForm = false;

  // Form data
  let formData = {
    course_id: '',
    assigned_to_type: 'group',
    assigned_to_id: '',
    due_date: '',
    instructions: '',
    is_mandatory: true
  };

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        goto('/login');
        return;
      }

      user = session.user;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      profile = data;

      // Check permissions - เฉพาะครูขึ้นไป
      if (!profile || !['teacher', 'admin', 'super_admin'].includes(profile.role)) {
        goto('/lms');
        return;
      }

      // Load teacher's courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
          *,
          subjects(name, code)
        `)
        .eq('teacher_id', user.id)
        .eq('is_published', true)
        .order('title');

      courses = coursesData || [];

      // Load zones
      const { data: zonesData } = await supabase
        .from('zones')
        .select('*')
        .order('name');

      zones = zonesData || [];

      // Load groups
      const { data: groupsData } = await supabase
        .from('groups')
        .select(`
          *,
          zones(name)
        `)
        .order('name');

      groups = groupsData || [];

      // Load students
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name');

      students = studentsData || [];

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  }

  async function handleSubmit() {
    if (!formData.course_id || !formData.assigned_to_id) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    submitting = true;

    try {
      const { error } = await supabase
        .from('course_assignments')
        .insert({
          course_id: formData.course_id,
          teacher_id: user.id,
          assigned_to_type: formData.assigned_to_type,
          assigned_to_id: formData.assigned_to_id,
          due_date: formData.due_date || null,
          instructions: formData.instructions || null,
          is_mandatory: formData.is_mandatory
        });

      if (error) throw error;

      alert('มอบหมายงานเรียบร้อยแล้ว');
      
      // Reset form
      formData = {
        course_id: '',
        assigned_to_type: 'group',
        assigned_to_id: '',
        due_date: '',
        instructions: '',
        is_mandatory: true
      };
      
      showForm = false;

    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('เกิดข้อผิดพลาดในการมอบหมายงาน');
    } finally {
      submitting = false;
    }
  }

  function getTargetOptions() {
    switch (formData.assigned_to_type) {
      case 'zone':
        return zones.map(z => ({ value: z.id, label: z.name }));
      case 'group':
        return groups.map(g => ({ value: g.id, label: `${g.name} (${g.zones?.name || 'ไม่ระบุโซน'})` }));
      case 'individual':
        return students.map(s => ({ value: s.id, label: s.full_name }));
      default:
        return [];
    }
  }
</script>

<svelte:head>
  <title>มอบหมายงาน - ระบบ LMS</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดข้อมูล..." />
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">📋 มอบหมายงาน</h1>
        <p class="text-gray-600 mt-2">มอบหมายบทเรียนให้นักเรียนตามโซน กลุ่ม หรือรายบุคคล</p>
      </div>
      <Button 
        on:click={() => showForm = !showForm} 
        variant="primary"
      >
        {showForm ? 'ยกเลิก' : '+ มอบหมายงานใหม่'}
      </Button>
    </div>

    <!-- Assignment Form -->
    {#if showForm}
      <Card class="p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">สร้างการมอบหมายใหม่</h2>
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <!-- Course Selection -->
          <div>
            <label for="course_id" class="block text-sm font-medium text-gray-700 mb-2">
              เลือกหลักสูตร <span class="text-red-500">*</span>
            </label>
            <select 
              id="course_id"
              bind:value={formData.course_id}
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- เลือกหลักสูตร --</option>
              {#each courses as course}
                <option value={course.id}>
                  {course.title} ({course.subjects?.name || 'ไม่ระบุวิชา'})
                </option>
              {/each}
            </select>
          </div>

          <!-- Assignment Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ประเภทการมอบหมาย <span class="text-red-500">*</span>
            </label>
            <div class="flex space-x-4">
              <label class="flex items-center">
                <input 
                  type="radio" 
                  bind:group={formData.assigned_to_type} 
                  value="zone"
                  class="mr-2"
                />
                ตามโซน
              </label>
              <label class="flex items-center">
                <input 
                  type="radio" 
                  bind:group={formData.assigned_to_type} 
                  value="group"
                  class="mr-2"
                />
                ตามกลุ่ม
              </label>
              <label class="flex items-center">
                <input 
                  type="radio" 
                  bind:group={formData.assigned_to_type} 
                  value="individual"
                  class="mr-2"
                />
                รายบุคคล
              </label>
            </div>
          </div>

          <!-- Target Selection -->
          <div>
            <label for="assigned_to_id" class="block text-sm font-medium text-gray-700 mb-2">
              เลือกเป้าหมาย <span class="text-red-500">*</span>
            </label>
            <select 
              id="assigned_to_id"
              bind:value={formData.assigned_to_id}
              required
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- เลือกเป้าหมาย --</option>
              {#each getTargetOptions() as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>

          <!-- Due Date -->
          <Input
            type="datetime-local"
            label="กำหนดส่ง (ไม่บังคับ)"
            bind:value={formData.due_date}
          />

          <!-- Instructions -->
          <div>
            <label for="instructions" class="block text-sm font-medium text-gray-700 mb-2">
              คำแนะนำเพิ่มเติม
            </label>
            <textarea
              id="instructions"
              bind:value={formData.instructions}
              rows="4"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="คำแนะนำหรือข้อกำหนดพิเศษสำหรับงานนี้..."
            ></textarea>
          </div>

          <!-- Mandatory -->
          <div class="flex items-center">
            <input 
              type="checkbox" 
              bind:checked={formData.is_mandatory}
              id="mandatory"
              class="mr-2"
            />
            <label for="mandatory" class="text-sm text-gray-700">
              งานบังคับ (นักเรียนต้องทำให้เสร็จ)
            </label>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              on:click={() => showForm = false}
            >
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              loading={submitting}
              disabled={submitting}
            >
              {submitting ? 'กำลังมอบหมาย...' : 'มอบหมายงาน'}
            </Button>
          </div>
        </form>
      </Card>
    {/if}

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card class="p-4 text-center bg-blue-50 border-blue-200">
        <div class="text-2xl font-bold text-blue-600">{courses.length}</div>
        <div class="text-sm text-gray-600">หลักสูตรของฉัน</div>
      </Card>
      
      <Card class="p-4 text-center bg-green-50 border-green-200">
        <div class="text-2xl font-bold text-green-600">{zones.length}</div>
        <div class="text-sm text-gray-600">โซนทั้งหมด</div>
      </Card>
      
      <Card class="p-4 text-center bg-purple-50 border-purple-200">
        <div class="text-2xl font-bold text-purple-600">{groups.length}</div>
        <div class="text-sm text-gray-600">กลุ่มทั้งหมด</div>
      </Card>
      
      <Card class="p-4 text-center bg-orange-50 border-orange-200">
        <div class="text-2xl font-bold text-orange-600">{students.length}</div>
        <div class="text-sm text-gray-600">นักเรียนทั้งหมด</div>
      </Card>
    </div>

    <!-- Available Courses -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 mb-4">หลักสูตรที่สามารถมอบหมายได้</h2>
      
      {#if courses.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each courses as course}
            <Card class="p-6 hover:shadow-lg transition-shadow">
              <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {course.subjects?.code || 'N/A'}
                  </span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                <p class="text-sm text-gray-600 line-clamp-2">{course.description}</p>
              </div>
              
              <div class="space-y-2 mb-4">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-500">📚 วิชา:</span>
                  <span class="font-medium">{course.subjects?.name || 'ไม่ระบุ'}</span>
                </div>
              </div>
              
              <Button 
                on:click={() => {
                  formData.course_id = course.id;
                  showForm = true;
                }}
                variant="primary" 
                fullWidth
              >
                มอบหมายหลักสูตรนี้
              </Button>
            </Card>
          {/each}
        </div>
      {:else}
        <div class="text-center py-12">
          <div class="text-6xl mb-4">📚</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">ไม่มีหลักสูตร</h3>
          <p class="text-gray-600 mb-6">คุณยังไม่มีหลักสูตรที่เผยแพร่แล้ว</p>
          <Button href="/lms/teacher" variant="primary">
            สร้างหลักสูตรใหม่
          </Button>
        </div>
      {/if}
    </div>
  </div>
{/if}