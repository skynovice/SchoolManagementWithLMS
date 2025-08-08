<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { signIn } from '$stores/auth.js';
  import { showError, showSuccess } from '$stores/notifications.js';
  import { user } from '$stores/auth.js';
  import Input from '$components/Input.svelte';
  import Button from '$components/Button.svelte';
  import Card from '$components/Card.svelte';

  let email = '';
  let password = '';
  let loading = false;

  onMount(() => {
    // Redirect if already logged in
    const unsubscribe = user.subscribe(currentUser => {
      if (currentUser) {
        goto('/dashboard');
      }
    });

    return unsubscribe;
  });

  const handleSignIn = async () => {
    if (!email || !password) {
      showError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    loading = true;
    const result = await signIn(email, password);

    if (result.success) {
      showSuccess('เข้าสู่ระบบสำเร็จ');
      goto('/dashboard');
    } else {
      showError(result.error);
    }

    loading = false;
  };

  const handleKeyPress = event => {
    if (event.key === 'Enter') {
      handleSignIn();
    }
  };
</script>

<div class="flex justify-center items-center min-h-[80vh] p-5">
  <Card class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-semibold text-primary-800 mb-2">เข้าสู่ระบบ</h1>
      <p class="text-gray-600">ระบบจัดการโรงเรียน</p>
    </div>

    <form on:submit|preventDefault={handleSignIn} class="space-y-6">
      <Input
        type="email"
        label="อีเมล"
        placeholder="กรอกอีเมลของคุณ"
        bind:value={email}
        on:keydown={handleKeyPress}
        required
      />

      <Input
        type="password"
        label="รหัสผ่าน"
        placeholder="กรอกรหัสผ่านของคุณ"
        bind:value={password}
        on:keydown={handleKeyPress}
        required
      />

      <Button type="submit" variant="primary" fullWidth {loading} disabled={loading}>
        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </Button>
    </form>

    <div class="mt-8 pt-6 border-t border-gray-200">
      <h3 class="text-sm text-gray-600 mb-3">บัญชีทดสอบ:</h3>
      <div class="space-y-2">
        <div class="bg-primary-50 p-3 rounded-lg text-xs border border-primary-100">
          <strong class="text-primary-800">Super Admin:</strong> superadmin1@school.com / password123
        </div>
        <div class="bg-primary-50 p-3 rounded-lg text-xs border border-primary-100">
          <strong class="text-primary-800">Admin:</strong> admin1@school.com / password123
        </div>
        <div class="bg-primary-50 p-3 rounded-lg text-xs border border-primary-100">
          <strong class="text-primary-800">Teacher:</strong> teacher1@school.com / password123
        </div>
        <div class="bg-primary-50 p-3 rounded-lg text-xs border border-primary-100">
          <strong class="text-primary-800">Parent:</strong> parent1@school.com / password123
        </div>
        <div class="bg-primary-50 p-3 rounded-lg text-xs border border-primary-100">
          <strong class="text-primary-800">Student:</strong> student1@school.com / password123
        </div>
      </div>
    </div>
  </Card>
</div>
