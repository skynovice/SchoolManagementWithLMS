<script>
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';
  import Card from '$components/Card.svelte';
  import Button from '$components/Button.svelte';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let user = null;
  let profile = null;
  let quiz = null;
  let questions = [];
  let currentQuestionIndex = 0;
  let answers = {};
  let loading = true;
  let submitting = false;
  let timeLeft = 0;
  let timer = null;
  let quizStarted = false;
  let quizCompleted = false;
  let results = null;
  let attempt = null;

  $: quizId = $page.params.quizId;
  $: currentQuestion = questions[currentQuestionIndex];
  $: allAnswered = questions.every(q => answers[q.id] !== undefined);
  $: progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

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

      // Load quiz with questions and options
      const { data: quizData } = await supabase
        .from('quizzes')
        .select(`
          *,
          learning_parts(
            *,
            learning_topics(
              *,
              subjects(name, code),
              profiles!learning_topics_teacher_id_fkey(full_name)
            )
          )
        `)
        .eq('id', quizId)
        .single();

      if (!quizData) {
        goto('/lms/browse');
        return;
      }

      quiz = quizData;

      // Load questions with options
      const { data: questionsData } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          quiz_question_options(*)
        `)
        .eq('quiz_id', quizId)
        .order('question_order');

      questions = (questionsData || []).map(question => ({
        ...question,
        options: quiz.shuffle_questions 
          ? question.quiz_question_options.sort(() => Math.random() - 0.5)
          : question.quiz_question_options.sort((a, b) => a.option_order - b.option_order)
      }));

      if (quiz.shuffle_questions) {
        questions = questions.sort(() => Math.random() - 0.5);
      }

      // Check previous attempts
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('student_id', user.id)
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });

      const attempts = attemptsData || [];
      const attemptCount = attempts.length;

      if (attemptCount >= quiz.max_attempts) {
        // Show best attempt result
        const bestAttempt = attempts.reduce((best, current) => 
          (current.score || 0) > (best.score || 0) ? current : best
        );
        
        results = {
          score: bestAttempt.score || 0,
          totalQuestions: bestAttempt.total_questions || questions.length,
          correctAnswers: bestAttempt.correct_answers || 0,
          isPassed: bestAttempt.is_passed || false,
          timeTaken: bestAttempt.time_taken || 0,
          attemptNumber: bestAttempt.attempt_number,
          maxAttemptsReached: true
        };
        quizCompleted = true;
      }

    } catch (error) {
      console.error('Error loading quiz:', error);
      goto('/lms/browse');
    } finally {
      loading = false;
    }
  }

  function startQuiz() {
    quizStarted = true;
    
    if (quiz.time_limit) {
      timeLeft = quiz.time_limit * 60; // Convert minutes to seconds
      timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          submitQuiz();
        }
      }, 1000);
    }
  }

  function selectAnswer(questionId, optionId) {
    answers[questionId] = optionId;
  }

  function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
    }
  }

  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
    }
  }

  function goToQuestion(index) {
    currentQuestionIndex = index;
  }

  async function submitQuiz() {
    if (submitting) return;
    
    submitting = true;
    
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    try {
      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = questions.length;
      const timeTaken = quiz.time_limit ? (quiz.time_limit * 60 - timeLeft) : 0;

      questions.forEach(question => {
        const selectedOptionId = answers[question.id];
        if (selectedOptionId) {
          const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
          if (selectedOption && selectedOption.is_correct) {
            correctAnswers++;
          }
        }
      });

      const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const isPassed = score >= quiz.passing_score;

      // Get attempt number
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('attempt_number')
        .eq('student_id', user.id)
        .eq('quiz_id', quizId)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const attemptNumber = (attemptsData?.[0]?.attempt_number || 0) + 1;

      // Create quiz attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          student_id: user.id,
          quiz_id: quizId,
          attempt_number: attemptNumber,
          score: score,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          is_passed: isPassed,
          time_taken: timeTaken,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      attempt = attemptData;

      // Save answers
      const answersData = questions.map(question => {
        const selectedOptionId = answers[question.id];
        const selectedOption = selectedOptionId 
          ? question.options.find(opt => opt.id === selectedOptionId)
          : null;

        return {
          attempt_id: attempt.id,
          question_id: question.id,
          selected_option_id: selectedOptionId || null,
          answer_text: selectedOption?.option_text || null,
          is_correct: selectedOption?.is_correct || false,
          points_earned: selectedOption?.is_correct ? 1 : 0
        };
      });

      const { error: answersError } = await supabase
        .from('quiz_attempt_answers')
        .insert(answersData);

      if (answersError) throw answersError;

      // Set results
      results = {
        score: score,
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
        isPassed: isPassed,
        timeTaken: timeTaken,
        attemptNumber: attemptNumber,
        maxAttemptsReached: attemptNumber >= quiz.max_attempts
      };

      quizCompleted = true;

    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('เกิดข้อผิดพลาดในการส่งแบบทดสอบ');
    } finally {
      submitting = false;
    }
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function getScoreColor(score) {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  onDestroy(() => {
    if (timer) {
      clearInterval(timer);
    }
  });
</script>

<svelte:head>
  <title>{quiz?.title || 'กำลังโหลด...'} - แบบทดสอบ</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center py-12">
    <LoadingSpinner size="lg" text="กำลังโหลดแบบทดสอบ..." />
  </div>
{:else if quiz}
  <div class="max-w-4xl mx-auto space-y-6">
    {#if !quizStarted && !quizCompleted}
      <!-- Quiz Introduction -->
      <Card class="p-8 text-center">
        <div class="text-4xl mb-4">🧩</div>
        <h1 class="text-2xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
        {#if quiz.description}
          <p class="text-gray-600 mb-6">{quiz.description}</p>
        {/if}
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-blue-600">{quiz.total_questions}</div>
            <div class="text-sm text-gray-600">คำถาม</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-green-600">{quiz.passing_score}%</div>
            <div class="text-sm text-gray-600">คะแนนผ่าน</div>
          </div>
          <div class="bg-orange-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-orange-600">{quiz.max_attempts}</div>
            <div class="text-sm text-gray-600">ครั้งที่ทำได้</div>
          </div>
          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-purple-600">
              {quiz.time_limit || 'ไม่จำกัด'}
            </div>
            <div class="text-sm text-gray-600">เวลา (นาที)</div>
          </div>
        </div>

        {#if quiz.instructions}
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 class="font-semibold text-yellow-800 mb-2">คำแนะนำ</h3>
            <p class="text-yellow-700 text-sm">{quiz.instructions}</p>
          </div>
        {/if}

        <div class="flex justify-center gap-4">
          <Button 
            href="/lms/learn/{quiz.learning_parts?.learning_topics?.id}" 
            variant="outline"
          >
            ← กลับไปเรียน
          </Button>
          <Button on:click={startQuiz} variant="primary">
            เริ่มทำแบบทดสอบ
          </Button>
        </div>
      </Card>

    {:else if quizStarted && !quizCompleted}
      <!-- Quiz Header -->
      <div class="bg-gradient-to-r from-indigo-50 to-purple-100 rounded-2xl shadow-lg border border-indigo-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{quiz.title}</h1>
          {#if quiz.time_limit}
            <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-lg">
              <span class="text-xl">⏰</span>
              <span class="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
            </div>
          {/if}
        </div>
        
        <!-- Progress Bar -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">
              คำถามที่ {currentQuestionIndex + 1} จาก {questions.length}
            </span>
            <span class="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style="width: {progress}%"
            ></div>
          </div>
        </div>

        <!-- Question Navigation -->
        <div class="flex flex-wrap gap-2">
          {#each questions as question, index}
            <button
              on:click={() => goToQuestion(index)}
              class="w-8 h-8 rounded-full text-sm font-medium transition-colors {
                index === currentQuestionIndex 
                  ? 'bg-blue-500 text-white' 
                  : answers[question.id] 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }"
            >
              {index + 1}
            </button>
          {/each}
        </div>
      </div>

      <!-- Current Question -->
      {#if currentQuestion}
        <Card class="p-8">
          <!-- Debug Info (remove in production) -->
          {#if profile?.role === 'admin' || profile?.role === 'super_admin'}
            <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 class="font-semibold text-yellow-800 mb-2">Debug Info (Admin Only)</h4>
              <p class="text-sm text-yellow-700">Question ID: {currentQuestion.id}</p>
              <p class="text-sm text-yellow-700">Options Count: {currentQuestion.options?.length || 0}</p>
              <p class="text-sm text-yellow-700">Quiz ID: {quizId}</p>
              {#if currentQuestion.options?.length === 0}
                <p class="text-sm text-red-700 font-semibold">⚠️ ไม่มีตัวเลือกคำตอบ - ต้องเพิ่มข้อมูล</p>
              {/if}
            </div>
          {/if}
          
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              คำถามที่ {currentQuestionIndex + 1}: {currentQuestion.question_text}
            </h2>
            
            <div class="space-y-3">
              {#if currentQuestion.options && currentQuestion.options.length > 0}
                {#each currentQuestion.options as option}
                  <label class="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {answers[currentQuestion.id] === option.id ? 'bg-blue-50 border-blue-300' : ''}">
                    <input
                      type="radio"
                      name="question_{currentQuestion.id}"
                      value={option.id}
                      on:change={() => selectAnswer(currentQuestion.id, option.id)}
                      checked={answers[currentQuestion.id] === option.id}
                      class="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span class="text-gray-900">{option.option_text}</span>
                  </label>
                {/each}
              {:else}
                <div class="text-center py-8">
                  <div class="text-4xl mb-4">❓</div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">ไม่มีตัวเลือกคำตอบ</h3>
                  <p class="text-gray-600 mb-4">คำถามนี้ยังไม่มีตัวเลือกคำตอบ กรุณาติดต่อครูผู้สอน</p>
                  <Button href="/lms/browse" variant="primary">
                    กลับไปเลือกเนื้อหา
                  </Button>
                </div>
              {/if}
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between">
            <Button 
              on:click={previousQuestion} 
              variant="outline" 
              disabled={currentQuestionIndex === 0}
            >
              ← ก่อนหน้า
            </Button>
            
            <div class="flex gap-3">
              {#if currentQuestionIndex === questions.length - 1}
                <Button 
                  on:click={submitQuiz} 
                  variant="primary"
                  disabled={submitting}
                  class="bg-green-600 hover:bg-green-700"
                >
                  {#if submitting}
                    กำลังส่ง...
                  {:else}
                    ส่งแบบทดสอบ
                  {/if}
                </Button>
              {:else}
                <Button 
                  on:click={nextQuestion} 
                  variant="primary"
                >
                  ถัดไป →
                </Button>
              {/if}
            </div>
          </div>
        </Card>
      {/if}

    {:else if quizCompleted && results}
      <!-- Quiz Results -->
      <Card class="p-8 text-center">
        <div class="text-6xl mb-4">
          {results.isPassed ? '🎉' : '😔'}
        </div>
        
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          {results.isPassed ? 'ยินดีด้วย! คุณสอบผ่าน' : 'เสียใจด้วย คุณสอบไม่ผ่าน'}
        </h1>
        
        <p class="text-gray-600 mb-8">
          {results.isPassed 
            ? 'คุณได้คะแนนเกินเกณฑ์ที่กำหนด' 
            : `คุณต้องได้คะแนนอย่างน้อย ${quiz.passing_score}% เพื่อผ่านการทดสอบ`
          }
        </p>

        <!-- Score Display -->
        <div class="bg-gray-50 rounded-2xl p-6 mb-8">
          <div class="text-4xl font-bold {getScoreColor(results.score)} mb-2">
            {Math.round(results.score)}%
          </div>
          <div class="text-gray-600">
            ตอบถูก {results.correctAnswers} จาก {results.totalQuestions} ข้อ
          </div>
        </div>

        <!-- Additional Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-lg font-bold text-blue-600">ครั้งที่ {results.attemptNumber}</div>
            <div class="text-sm text-gray-600">การทำแบบทดสอบ</div>
          </div>
          
          {#if results.timeTaken > 0}
            <div class="bg-green-50 rounded-lg p-4">
              <div class="text-lg font-bold text-green-600">{formatTime(results.timeTaken)}</div>
              <div class="text-sm text-gray-600">เวลาที่ใช้</div>
            </div>
          {/if}
          
          <div class="bg-purple-50 rounded-lg p-4">
            <div class="text-lg font-bold text-purple-600">
              {quiz.max_attempts - results.attemptNumber}
            </div>
            <div class="text-sm text-gray-600">ครั้งที่เหลือ</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-center gap-4">
          <Button 
            href="/lms/learn/{quiz.learning_parts?.learning_topics?.id}" 
            variant="outline"
          >
            กลับไปเรียน
          </Button>
          
          {#if !results.isPassed && !results.maxAttemptsReached}
            <Button 
              on:click={() => {
                quizStarted = false;
                quizCompleted = false;
                results = null;
                answers = {};
                currentQuestionIndex = 0;
                timeLeft = 0;
              }}
              variant="primary"
            >
              ทำใหม่อีกครั้ง
            </Button>
          {/if}
          
          <Button href="/lms/browse" variant="primary">
            เรียนหัวข้ออื่น
          </Button>
        </div>

        {#if results.maxAttemptsReached}
          <div class="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p class="text-orange-800 text-sm">
              คุณได้ทำแบบทดสอบครบจำนวนครั้งที่กำหนดแล้ว ({quiz.max_attempts} ครั้ง)
            </p>
          </div>
        {/if}
      </Card>
    {/if}
  </div>
{:else}
  <div class="text-center py-12">
    <div class="text-6xl mb-4">❌</div>
    <h3 class="text-lg font-medium text-gray-900 mb-2">ไม่พบแบบทดสอบ</h3>
    <p class="text-gray-600 mb-6">แบบทดสอบที่คุณต้องการไม่มีอยู่หรือถูกลบไปแล้ว</p>
    <Button href="/lms/browse" variant="primary">
      กลับไปเลือกเนื้อหา
    </Button>
  </div>
{/if}