<script>
  export let show = false;
  export let isAdmin = false;
</script>

{#if show}
  <div class="fixed top-4 right-4 z-50 max-w-md">
    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-lg">
      <div class="flex items-start gap-3">
        <div class="text-yellow-600 text-xl">⚠️</div>
        <div class="flex-1">
          <h4 class="font-semibold text-yellow-800 mb-1">ฐานข้อมูลไม่สมบูรณ์</h4>
          <p class="text-sm text-yellow-700 mb-3">
            ระบบตรวจพบว่าฐานข้อมูลยังไม่สมบูรณ์ ฟีเจอร์บางอย่างอาจไม่ทำงาน
          </p>
          {#if isAdmin}
            <a 
              href="/admin/setup-database" 
              class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors no-underline"
            >
              <span>🔧</span>
              <span>แก้ไขเลย</span>
            </a>
          {:else}
            <p class="text-xs text-yellow-600">กรุณาติดต่อผู้ดูแลระบบ</p>
          {/if}
        </div>
        <button 
          on:click={() => show = false}
          class="text-yellow-600 hover:text-yellow-800 text-lg"
        >
          ×
        </button>
      </div>
    </div>
  </div>
{/if}