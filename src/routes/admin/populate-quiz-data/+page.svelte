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
  let quizzes = [];

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
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
    
    await loadQuizzes();
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

  async function loadQuizzes() {
    try {
      const { data } = await supabase
        .from('quizzes')
        .select(`
          *,
          learning_parts(
            *,
            learning_topics(
              *,
              subjects(name, code)
            )
          ),
          quiz_questions(
            *,
            quiz_question_options(*)
          )
        `)
        .order('created_at');

      quizzes = data || [];
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  }

  async function populateQuizData() {
    processing = true;
    results = [];

    // Comprehensive quiz questions and answers for all subjects
    const quizData = {
      // IT Basic Technology
      'Google Maps': [
        {
          question: 'Google Maps ใช้เทคโนโลยีใดในการระบุตำแหน่ง?',
          explanation: 'GPS (Global Positioning System) เป็นเทคโนโลยีหลักที่ Google Maps ใช้ในการระบุตำแหน่งที่แม่นยำ',
          options: [
            { text: 'GPS (Global Positioning System)', correct: true },
            { text: 'Bluetooth', correct: false },
            { text: 'Wi-Fi', correct: false },
            { text: 'NFC (Near Field Communication)', correct: false }
          ]
        },
        {
          question: 'ฟีเจอร์ใดของ Google Maps ที่ช่วยในการหาเส้นทางที่หลีกเลี่ยงการจราจรติดขัด?',
          explanation: 'Google Maps Traffic เป็นฟีเจอร์ที่แสดงสถานการณ์จราจรแบบเรียลไทม์และแนะนำเส้นทางที่หลีกเลี่ยงการติดขัด',
          options: [
            { text: 'Google Maps Traffic', correct: true },
            { text: 'Street View', correct: false },
            { text: 'Satellite View', correct: false },
            { text: 'My Maps', correct: false }
          ]
        },
        {
          question: 'Street View ใน Google Maps ช่วยให้ผู้ใช้สามารถทำอะไรได้?',
          explanation: 'Street View ช่วยให้ผู้ใช้สามารถดูภาพถนนจริงในมุมมอง 360 องศา ทำให้สามารถสำรวจสถานที่ได้อย่างละเอียด',
          options: [
            { text: 'ดูภาพถนนจริงในมุมมอง 360 องศา', correct: true },
            { text: 'วัดระยะทางระหว่างสองจุด', correct: false },
            { text: 'ค้นหาร้านอาหารใกล้เคียง', correct: false },
            { text: 'บันทึกตำแหน่งที่ชื่นชอบ', correct: false }
          ]
        }
      ],
      'Google Translate': [
        {
          question: 'Google Translate รองรับการแปลภาษากี่ภาษา?',
          explanation: 'Google Translate รองรับการแปลมากกว่า 100 ภาษาทั่วโลก',
          options: [
            { text: 'มากกว่า 100 ภาษา', correct: true },
            { text: '50 ภาษา', correct: false },
            { text: '25 ภาษา', correct: false },
            { text: '200 ภาษา', correct: false }
          ]
        },
        {
          question: 'ฟีเจอร์ Camera Translation ใน Google Translate ทำงานอย่างไร?',
          explanation: 'Camera Translation ใช้กล้องถ่ายภาพข้อความแล้วแปลภาษาแบบเรียลไทม์ผ่านหน้าจอ',
          options: [
            { text: 'ถ่ายภาพข้อความแล้วแปลแบบเรียลไทม์', correct: true },
            { text: 'บันทึกเสียงแล้วแปลเป็นข้อความ', correct: false },
            { text: 'พิมพ์ข้อความด้วยมือ', correct: false },
            { text: 'สแกน QR Code', correct: false }
          ]
        },
        {
          question: 'ข้อดีของการใช้ Google Translate แบบออฟไลน์คืออะไร?',
          explanation: 'การใช้งานแบบออฟไลน์ช่วยให้สามารถแปลภาษาได้แม้ไม่มีอินเทอร์เน็ต ประหยัดค่าใช้จ่ายและใช้งานได้ทุกที่',
          options: [
            { text: 'ใช้งานได้โดยไม่ต้องมีอินเทอร์เน็ต', correct: true },
            { text: 'แปลได้เร็วกว่า', correct: false },
            { text: 'แปลได้แม่นยำกว่า', correct: false },
            { text: 'ใช้พื้นที่เก็บข้อมูลน้อยกว่า', correct: false }
          ]
        }
      ],
      'Google Lens': [
        {
          question: 'Google Lens ใช้เทคโนโลยีใดในการวิเคราะห์ภาพ?',
          explanation: 'Google Lens ใช้ AI (Artificial Intelligence) และ Machine Learning ในการวิเคราะห์และจดจำวัตถุในภาพ',
          options: [
            { text: 'AI และ Machine Learning', correct: true },
            { text: 'Blockchain', correct: false },
            { text: 'Virtual Reality', correct: false },
            { text: 'Cloud Computing', correct: false }
          ]
        },
        {
          question: 'Google Lens สามารถทำอะไรได้บ้างเมื่อสแกนข้อความ?',
          explanation: 'Google Lens สามารถแปลข้อความ คัดลอกข้อความ และค้นหาข้อมูลเพิ่มเติมได้',
          options: [
            { text: 'แปลภาษา คัดลอกข้อความ และค้นหาข้อมูล', correct: true },
            { text: 'เปลี่ยนฟอนต์ข้อความ', correct: false },
            { text: 'แก้ไขข้อผิดพลาดทางไวยากรณ์', correct: false },
            { text: 'สร้างเอกสาร PDF', correct: false }
          ]
        },
        {
          question: 'เมื่อใช้ Google Lens สแกนพืชหรือสัตว์ จะได้ข้อมูลอะไรบ้าง?',
          explanation: 'Google Lens สามารถระบุชนิดของพืชหรือสัตว์ และให้ข้อมูลรายละเอียดเกี่ยวกับสิ่งมีชีวิตนั้น',
          options: [
            { text: 'ชื่อและข้อมูลรายละเอียดของพืชหรือสัตว์', correct: true },
            { text: 'ราคาในตลาด', correct: false },
            { text: 'สูตรอาหารที่ใช้พืชนั้น', correct: false },
            { text: 'สถานที่ซื้อขาย', correct: false }
          ]
        }
      ],
      'Google Search': [
        {
          question: 'เทคนิคการค้นหาใน Google ที่ใช้เครื่องหมายคำพูด ("") มีจุดประสงค์อะไร?',
          explanation: 'การใช้เครื่องหมายคำพูดช่วยให้ Google ค้นหาวลีที่ตรงกันทุกคำตามลำดับที่กำหนด',
          options: [
            { text: 'ค้นหาวลีที่ตรงกันทุกคำตามลำดับ', correct: true },
            { text: 'ค้นหาคำที่คล้ายกัน', correct: false },
            { text: 'ค้นหาในเว็บไซต์เฉพาะ', correct: false },
            { text: 'ค้นหาไฟล์ประเภทเฉพาะ', correct: false }
          ]
        },
        {
          question: 'การใช้ site: ใน Google Search ช่วยให้สามารถทำอะไรได้?',
          explanation: 'site: ช่วยให้สามารถค้นหาข้อมูลเฉพาะในเว็บไซต์ที่กำหนดเท่านั้น',
          options: [
            { text: 'ค้นหาข้อมูลเฉพาะในเว็บไซต์ที่กำหนด', correct: true },
            { text: 'ค้นหาเว็บไซต์ที่คล้ายกัน', correct: false },
            { text: 'ค้นหาข้อมูลล่าสุด', correct: false },
            { text: 'ค้นหาภาพเท่านั้น', correct: false }
          ]
        },
        {
          question: 'Google Search Console เป็นเครื่องมือสำหรับใคร?',
          explanation: 'Google Search Console เป็นเครื่องมือสำหรับเจ้าของเว็บไซต์ในการติดตามและปรับปรุงการแสดงผลในผลการค้นหา',
          options: [
            { text: 'เจ้าของเว็บไซต์และนักพัฒนา', correct: true },
            { text: 'ผู้ใช้ทั่วไป', correct: false },
            { text: 'นักเรียน', correct: false },
            { text: 'ครูอาจารย์', correct: false }
          ]
        }
      ],
      'Google Services Integration': [
        {
          question: 'ข้อดีหลักของการใช้ Google Account เดียวกันกับหลายบริการคืออะไร?',
          explanation: 'การใช้ Google Account เดียวกันช่วยให้เข้าถึงบริการต่างๆ ได้อย่างสะดวก และข้อมูลสามารถซิงค์กันได้',
          options: [
            { text: 'เข้าถึงบริการได้สะดวกและข้อมูลซิงค์กัน', correct: true },
            { text: 'ประหยัดค่าใช้จ่าย', correct: false },
            { text: 'ใช้พื้นที่เก็บข้อมูลน้อยกว่า', correct: false },
            { text: 'ความเร็วในการใช้งานเพิ่มขึ้น', correct: false }
          ]
        },
        {
          question: 'Google Drive สามารถเชื่อมต่อกับบริการ Google ใดได้บ้าง?',
          explanation: 'Google Drive สามารถเชื่อมต่อกับ Google Docs, Sheets, Slides, Photos และบริการอื่นๆ ของ Google',
          options: [
            { text: 'Google Docs, Sheets, Slides, Photos', correct: true },
            { text: 'เฉพาะ Gmail เท่านั้น', correct: false },
            { text: 'เฉพาะ Google Maps เท่านั้น', correct: false },
            { text: 'ไม่สามารถเชื่อมต่อกับบริการอื่นได้', correct: false }
          ]
        },
        {
          question: 'การใช้ Google Workspace มีประโยชน์อย่างไรสำหรับการทำงานเป็นทีม?',
          explanation: 'Google Workspace ช่วยให้ทีมสามารถทำงานร่วมกันแบบเรียลไทม์ แชร์ไฟล์ และสื่อสารได้อย่างมีประสิทธิภาพ',
          options: [
            { text: 'ทำงานร่วมกันแบบเรียลไทม์และแชร์ไฟล์ได้', correct: true },
            { text: 'ลดค่าใช้จ่ายในการซื้อซอฟต์แวร์', correct: false },
            { text: 'เพิ่มความเร็วของอินเทอร์เน็ต', correct: false },
            { text: 'ป้องกันไวรัสคอมพิวเตอร์', correct: false }
          ]
        }
      ]
    };

    try {
      for (const quiz of quizzes) {
        const topicTitle = quiz.learning_parts?.learning_topics?.title || '';
        
        // Find matching quiz data
        let questionsToAdd = [];
        for (const [topic, questions] of Object.entries(quizData)) {
          if (topicTitle.includes(topic)) {
            questionsToAdd = questions;
            break;
          }
        }

        if (questionsToAdd.length === 0) {
          results.push(`❌ ไม่พบข้อมูลคำถามสำหรับ: ${topicTitle}`);
          continue;
        }

        // Check if quiz already has questions
        if (quiz.quiz_questions && quiz.quiz_questions.length > 0) {
          results.push(`⚠️ มีคำถามอยู่แล้ว: ${topicTitle}`);
          continue;
        }

        // Add questions for this quiz
        for (let i = 0; i < questionsToAdd.length; i++) {
          const questionData = questionsToAdd[i];
          
          // Insert question
          const { data: questionResult, error: questionError } = await supabase
            .from('quiz_questions')
            .insert({
              quiz_id: quiz.id,
              question_type: 'multiple_choice',
              question_text: questionData.question,
              explanation: questionData.explanation,
              points: 1,
              question_order: i + 1,
              is_required: true
            })
            .select()
            .single();

          if (questionError) {
            results.push(`❌ เกิดข้อผิดพลาดในการเพิ่มคำถาม: ${questionError.message}`);
            continue;
          }

          // Insert options
          for (let j = 0; j < questionData.options.length; j++) {
            const option = questionData.options[j];
            
            const { error: optionError } = await supabase
              .from('quiz_question_options')
              .insert({
                question_id: questionResult.id,
                option_text: option.text,
                is_correct: option.correct,
                option_order: j + 1
              });

            if (optionError) {
              results.push(`❌ เกิดข้อผิดพลาดในการเพิ่มตัวเลือก: ${optionError.message}`);
            }
          }
        }

        // Update quiz total_questions
        const { error: updateError } = await supabase
          .from('quizzes')
          .update({ total_questions: questionsToAdd.length })
          .eq('id', quiz.id);

        if (updateError) {
          results.push(`❌ เกิดข้อผิดพลาดในการอัปเดตจำนวนคำถาม: ${updateError.message}`);
        } else {
          results.push(`✅ เพิ่มคำถามสำเร็จ: ${topicTitle} (${questionsToAdd.length} คำถาม)`);
        }
      }

      results.push(`🎉 เสร็จสิ้นการเพิ่มข้อมูลแบบทดสอบ!`);
      
    } catch (error) {
      console.error('Error populating quiz data:', error);
      results.push(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    }

    processing = false;
    await loadQuizzes(); // Reload to see updated data
  }
</script>

<svelte:head>
  <title>เพิ่มข้อมูลแบบทดสอบ - Admin</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดข้อมูล..." />
  </div>
{:else}
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-lg border border-blue-200 p-8 mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
            🧩
          </div>
          <div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">เพิ่มข้อมูลแบบทดสอบ</h1>
            <p class="text-gray-700 text-lg mt-1">เพิ่มคำถามและตัวเลือกคำตอบให้กับแบบทดสอบที่ยังไม่มีข้อมูล</p>
          </div>
        </div>
        <Button href="/dashboard" variant="outline">
          ← กลับ
        </Button>
      </div>
    </div>

    <!-- Quiz Status -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">สถานะแบบทดสอบ</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each quizzes as quiz}
          <div class="border border-gray-200 rounded-xl p-4">
            <h3 class="font-semibold text-gray-800 mb-2">{quiz.title}</h3>
            <p class="text-sm text-gray-600 mb-2">
              หัวข้อ: {quiz.learning_parts?.learning_topics?.title || 'ไม่ระบุ'}
            </p>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">
                คำถาม: {quiz.quiz_questions?.length || 0} ข้อ
              </span>
              <span class="px-2 py-1 text-xs font-medium rounded-full {
                (quiz.quiz_questions?.length || 0) > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }">
                {(quiz.quiz_questions?.length || 0) > 0 ? 'มีคำถาม' : 'ไม่มีคำถาม'}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Action Button -->
    <div class="text-center mb-8">
      <Button 
        on:click={populateQuizData} 
        variant="primary" 
        disabled={processing}
        class="px-8 py-4 text-lg"
      >
        {#if processing}
          กำลังเพิ่มข้อมูล...
        {:else}
          เพิ่มคำถามและตัวเลือกคำตอบ
        {/if}
      </Button>
    </div>

    <!-- Results -->
    {#if results.length > 0}
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">ผลการดำเนินการ</h2>
        <div class="space-y-2">
          {#each results as result}
            <div class="p-3 bg-gray-50 rounded-lg font-mono text-sm">
              {result}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}