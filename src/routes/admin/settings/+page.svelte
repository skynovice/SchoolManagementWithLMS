<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let loading = true;
  let saving = false;
  let settings = {
    school_name: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    academic_year: '',
    semester: '',
    max_students_per_group: 30,
    enable_notifications: true,
    enable_parent_access: true,
    enable_student_registration: false,
    backup_frequency: 'daily',
    maintenance_mode: false
  };

  let originalSettings = {};

  onMount(async () => {
    await loadSettings();
    loading = false;
  });

  async function loadSettings() {
    // In a real app, you'd load from a settings table
    // For demo, we'll use some default values
    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .single();
    
    if (data) {
      settings = { ...settings, ...data };
    }
    
    originalSettings = { ...settings };
  }

  async function saveSettings() {
    saving = true;
    
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1, // Single settings record
          ...settings,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      } else {
        alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
        originalSettings = { ...settings };
      }
    } catch (error) {
      console.error('Settings save error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    }
    
    saving = false;
  }

  function resetSettings() {
    if (confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตการตั้งค่าทั้งหมด?')) {
      settings = { ...originalSettings };
    }
  }

  $: hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
</script>

<div class="max-w-4xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
        ⚙️
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-800">ตั้งค่าระบบ</h1>
        <p class="text-gray-600">จัดการการตั้งค่าทั่วไปของระบบ</p>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" text="กำลังโหลดการตั้งค่า..." />
    </div>
  {:else}
    <div class="space-y-8">
      <!-- School Information -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
          <h2 class="text-xl font-bold text-blue-800 flex items-center gap-3">
            <span class="text-2xl">🏫</span>
            ข้อมูลโรงเรียน
          </h2>
        </div>
        <div class="p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="school_name" class="block text-sm font-semibold text-gray-700 mb-2">ชื่อโรงเรียน</label>
              <input
                id="school_name"
                type="text"
                bind:value={settings.school_name}
                placeholder="ชื่อโรงเรียน"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label for="school_phone" class="block text-sm font-semibold text-gray-700 mb-2">เบอร์โทรศัพท์</label>
              <input
                id="school_phone"
                type="tel"
                bind:value={settings.school_phone}
                placeholder="0X-XXXX-XXXX"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">ที่อยู่</label>
            <textarea
              bind:value={settings.school_address}
              placeholder="ที่อยู่โรงเรียน"
              rows="3"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">อีเมล</label>
            <input
              type="email"
              bind:value={settings.school_email}
              placeholder="school@example.com"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Academic Settings -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
          <h2 class="text-xl font-bold text-green-800 flex items-center gap-3">
            <span class="text-2xl">📚</span>
            การตั้งค่าการศึกษา
          </h2>
        </div>
        <div class="p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">ปีการศึกษา</label>
              <input
                type="text"
                bind:value={settings.academic_year}
                placeholder="2567"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">ภาคเรียน</label>
              <select
                bind:value={settings.semester}
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="">เลือกภาคเรียน</option>
                <option value="1">ภาคเรียนที่ 1</option>
                <option value="2">ภาคเรียนที่ 2</option>
                <option value="summer">ภาคฤดูร้อน</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">จำนวนนักเรียนสูงสุดต่อกลุ่ม</label>
              <input
                type="number"
                bind:value={settings.max_students_per_group}
                min="1"
                max="100"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- System Settings -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
          <h2 class="text-xl font-bold text-purple-800 flex items-center gap-3">
            <span class="text-2xl">🔧</span>
            การตั้งค่าระบบ
          </h2>
        </div>
        <div class="p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={settings.enable_notifications}
                  class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <div class="font-medium text-gray-900">เปิดใช้งานการแจ้งเตือน</div>
                  <div class="text-sm text-gray-500">ส่งการแจ้งเตือนผ่านอีเมลและในระบบ</div>
                </div>
              </label>
              
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={settings.enable_parent_access}
                  class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <div class="font-medium text-gray-900">อนุญาตให้ผู้ปกครองเข้าถึง</div>
                  <div class="text-sm text-gray-500">ผู้ปกครองสามารถเข้าดูข้อมูลนักเรียนได้</div>
                </div>
              </label>
              
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={settings.enable_student_registration}
                  class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <div class="font-medium text-gray-900">เปิดให้นักเรียนลงทะเบียนเอง</div>
                  <div class="text-sm text-gray-500">นักเรียนสามารถสมัครสมาชิกเองได้</div>
                </div>
              </label>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">ความถี่ในการสำรองข้อมูล</label>
                <select
                  bind:value={settings.backup_frequency}
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="hourly">ทุกชั่วโมง</option>
                  <option value="daily">ทุกวัน</option>
                  <option value="weekly">ทุกสัปดาห์</option>
                  <option value="monthly">ทุกเดือน</option>
                </select>
              </div>
              
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={settings.maintenance_mode}
                  class="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
                <div>
                  <div class="font-medium text-gray-900">โหมดปิดปรุงระบบ</div>
                  <div class="text-sm text-gray-500">ปิดระบบชั่วคราวเพื่อปรับปรุง</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <button
          type="button"
          on:click={resetSettings}
          disabled={!hasChanges}
          class="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          รีเซ็ต
        </button>
        <button
          type="button"
          on:click={saveSettings}
          disabled={saving || !hasChanges}
          class="px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if saving}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>กำลังบันทึก...</span>
          {:else}
            <span>💾</span>
            <span>บันทึกการตั้งค่า</span>
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>