import{S as ce,i as pe,s as _e,d as p,m as W,o as H,p as me,b as A,P as fe,h as R,q as k,k as C,r as Te,n as he,u as K,v as Z,w as f,e as T,f as b,x as j,j as h,y as J,c,D as y,g as Y,t as G,G as ge,a as Ie,E as Ae}from"../chunks/BVH3f4ly.js";import{e as oe}from"../chunks/CtnloIfX.js";import"../chunks/IHki7fMi.js";import{s as F}from"../chunks/DtlnWW8f.js";import{g as le}from"../chunks/C5JyHtm3.js";import{L as Le}from"../chunks/CMJtAESs.js";import{B as re}from"../chunks/FVOYNbUa.js";function ue(u,e,t){const r=u.slice();return r[8]=e[t],r}function Se(u){let e,t,r,a,i='<div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">🗄️</div> <div><h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">ตั้งค่าฐานข้อมูล</h1> <p class="text-gray-700 text-lg mt-1">ตรวจสอบและสร้างตารางที่จำเป็นสำหรับระบบ LMS</p></div>',l,s,E,o,n,d,L="ตรวจสอบตารางที่จำเป็น",z,I,Q="ตรวจสอบว่ามีตารางที่จำเป็นสำหรับระบบ LMS หรือไม่",U,O,v,N,S,ie="ทดสอบการเชื่อมต่อ",ee,M,ae="ทดสอบการเชื่อมต่อกับตารางพื้นฐานทั้งหมด",te,D,se,V,$,ne=`<h3 class="text-xl font-bold text-yellow-800 mb-4">📋 คำแนะนำ</h3> <div class="space-y-3 text-yellow-700"><p><strong>1. ตรวจสอบฐานข้อมูล:</strong> คลิก &quot;ตรวจสอบฐานข้อมูล&quot; เพื่อดูว่าตารางใดที่ยังไม่มี</p> <p><strong>2. สร้างตาราง:</strong> หากมีตารางที่ไม่มีอยู่ ให้คัดลอก SQL ที่แสดงไปรันใน Supabase
          SQL Editor</p> <p><strong>3. ทดสอบการเชื่อมต่อ:</strong> หลังจากสร้างตารางแล้ว ให้ทดสอบการเชื่อมต่อเพื่อยืนยัน</p> <p><strong>4. เข้าถึง Supabase:</strong> ไปที่
          <a href="https://supabase.com/dashboard" target="_blank" class="underline">Supabase Dashboard</a> → เลือกโปรเจค → SQL Editor</p></div>`,X;s=new re({props:{href:"/dashboard",variant:"outline",$$slots:{default:[Ce]},$$scope:{ctx:u}}}),O=new re({props:{variant:"primary",disabled:u[1],fullWidth:!0,$$slots:{default:[be]},$$scope:{ctx:u}}}),O.$on("click",u[3]),D=new re({props:{variant:"outline",disabled:u[1],fullWidth:!0,$$slots:{default:[ve]},$$scope:{ctx:u}}}),D.$on("click",u[4]);let g=u[2].length>0&&de(u);return{c(){e=h("div"),t=h("div"),r=h("div"),a=h("div"),a.innerHTML=i,l=C(),J(s.$$.fragment),E=C(),o=h("div"),n=h("div"),d=h("h3"),d.textContent=L,z=C(),I=h("p"),I.textContent=Q,U=C(),J(O.$$.fragment),v=C(),N=h("div"),S=h("h3"),S.textContent=ie,ee=C(),M=h("p"),M.textContent=ae,te=C(),J(D.$$.fragment),se=C(),g&&g.c(),V=C(),$=h("div"),$.innerHTML=ne,this.h()},l(_){e=T(_,"DIV",{class:!0});var m=b(e);t=T(m,"DIV",{class:!0});var B=b(t);r=T(B,"DIV",{class:!0});var q=b(r);a=T(q,"DIV",{class:!0,"data-svelte-h":!0}),y(a)!=="svelte-1yypyms"&&(a.innerHTML=i),l=R(q),j(s.$$.fragment,q),q.forEach(p),B.forEach(p),E=R(m),o=T(m,"DIV",{class:!0});var w=b(o);n=T(w,"DIV",{class:!0});var x=b(n);d=T(x,"H3",{class:!0,"data-svelte-h":!0}),y(d)!=="svelte-gukhnl"&&(d.textContent=L),z=R(x),I=T(x,"P",{class:!0,"data-svelte-h":!0}),y(I)!=="svelte-9k6ibd"&&(I.textContent=Q),U=R(x),j(O.$$.fragment,x),x.forEach(p),v=R(w),N=T(w,"DIV",{class:!0});var P=b(N);S=T(P,"H3",{class:!0,"data-svelte-h":!0}),y(S)!=="svelte-1cbjwpx"&&(S.textContent=ie),ee=R(P),M=T(P,"P",{class:!0,"data-svelte-h":!0}),y(M)!=="svelte-838203"&&(M.textContent=ae),te=R(P),j(D.$$.fragment,P),P.forEach(p),w.forEach(p),se=R(m),g&&g.l(m),V=R(m),$=T(m,"DIV",{class:!0,"data-svelte-h":!0}),y($)!=="svelte-p1znos"&&($.innerHTML=ne),m.forEach(p),this.h()},h(){f(a,"class","flex items-center gap-4"),f(r,"class","flex items-center justify-between"),f(t,"class","bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl shadow-lg border border-purple-200 p-8 mb-8"),f(d,"class","text-xl font-bold text-gray-800 mb-4"),f(I,"class","text-gray-600 mb-6"),f(n,"class","bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center"),f(S,"class","text-xl font-bold text-gray-800 mb-4"),f(M,"class","text-gray-600 mb-6"),f(N,"class","bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center"),f(o,"class","grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"),f($,"class","mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6"),f(e,"class","max-w-6xl mx-auto")},m(_,m){A(_,e,m),c(e,t),c(t,r),c(r,a),c(r,l),Z(s,r,null),c(e,E),c(e,o),c(o,n),c(n,d),c(n,z),c(n,I),c(n,U),Z(O,n,null),c(o,v),c(o,N),c(N,S),c(N,ee),c(N,M),c(N,te),Z(D,N,null),c(e,se),g&&g.m(e,null),c(e,V),c(e,$),X=!0},p(_,m){const B={};m&2048&&(B.$$scope={dirty:m,ctx:_}),s.$set(B);const q={};m&2&&(q.disabled=_[1]),m&2050&&(q.$$scope={dirty:m,ctx:_}),O.$set(q);const w={};m&2&&(w.disabled=_[1]),m&2050&&(w.$$scope={dirty:m,ctx:_}),D.$set(w),_[2].length>0?g?g.p(_,m):(g=de(_),g.c(),g.m(e,V)):g&&(g.d(1),g=null)},i(_){X||(H(s.$$.fragment,_),H(O.$$.fragment,_),H(D.$$.fragment,_),X=!0)},o(_){W(s.$$.fragment,_),W(O.$$.fragment,_),W(D.$$.fragment,_),X=!1},d(_){_&&p(e),K(s),K(O),K(D),g&&g.d()}}}function Re(u){let e,t,r;return t=new Le({props:{size:"lg",text:"กำลังโหลดข้อมูล..."}}),{c(){e=h("div"),J(t.$$.fragment),this.h()},l(a){e=T(a,"DIV",{class:!0});var i=b(e);j(t.$$.fragment,i),i.forEach(p),this.h()},h(){f(e,"class","flex justify-center items-center py-12")},m(a,i){A(a,e,i),Z(t,e,null),r=!0},p:he,i(a){r||(H(t.$$.fragment,a),r=!0)},o(a){W(t.$$.fragment,a),r=!1},d(a){a&&p(e),K(t)}}}function Ce(u){let e;return{c(){e=G("← กลับ")},l(t){e=Y(t,"← กลับ")},m(t,r){A(t,e,r)},d(t){t&&p(e)}}}function Ne(u){let e;return{c(){e=G("ตรวจสอบฐานข้อมูล")},l(t){e=Y(t,"ตรวจสอบฐานข้อมูล")},m(t,r){A(t,e,r)},d(t){t&&p(e)}}}function Oe(u){let e;return{c(){e=G("กำลังตรวจสอบ...")},l(t){e=Y(t,"กำลังตรวจสอบ...")},m(t,r){A(t,e,r)},d(t){t&&p(e)}}}function be(u){let e;function t(i,l){return i[1]?Oe:Ne}let r=t(u),a=r(u);return{c(){a.c(),e=k()},l(i){a.l(i),e=k()},m(i,l){a.m(i,l),A(i,e,l)},p(i,l){r!==(r=t(i))&&(a.d(1),a=r(i),a&&(a.c(),a.m(e.parentNode,e)))},d(i){i&&p(e),a.d(i)}}}function De(u){let e;return{c(){e=G("ทดสอบการเชื่อมต่อ")},l(t){e=Y(t,"ทดสอบการเชื่อมต่อ")},m(t,r){A(t,e,r)},d(t){t&&p(e)}}}function Ue(u){let e;return{c(){e=G("กำลังทดสอบ...")},l(t){e=Y(t,"กำลังทดสอบ...")},m(t,r){A(t,e,r)},d(t){t&&p(e)}}}function ve(u){let e;function t(i,l){return i[1]?Ue:De}let r=t(u),a=r(u);return{c(){a.c(),e=k()},l(i){a.l(i),e=k()},m(i,l){a.m(i,l),A(i,e,l)},p(i,l){r!==(r=t(i))&&(a.d(1),a=r(i),a&&(a.c(),a.m(e.parentNode,e)))},d(i){i&&p(e),a.d(i)}}}function de(u){let e,t,r="ผลการดำเนินการ",a,i,l=oe(u[2]),s=[];for(let E=0;E<l.length;E+=1)s[E]=Ee(ue(u,l,E));return{c(){e=h("div"),t=h("h2"),t.textContent=r,a=C(),i=h("div");for(let E=0;E<s.length;E+=1)s[E].c();this.h()},l(E){e=T(E,"DIV",{class:!0});var o=b(e);t=T(o,"H2",{class:!0,"data-svelte-h":!0}),y(t)!=="svelte-1qjbunc"&&(t.textContent=r),a=R(o),i=T(o,"DIV",{class:!0});var n=b(i);for(let d=0;d<s.length;d+=1)s[d].l(n);n.forEach(p),o.forEach(p),this.h()},h(){f(t,"class","text-2xl font-bold text-gray-800 mb-6"),f(i,"class","space-y-2 max-h-96 overflow-y-auto"),f(e,"class","bg-white rounded-2xl shadow-lg border border-gray-200 p-6")},m(E,o){A(E,e,o),c(e,t),c(e,a),c(e,i);for(let n=0;n<s.length;n+=1)s[n]&&s[n].m(i,null)},p(E,o){if(o&4){l=oe(E[2]);let n;for(n=0;n<l.length;n+=1){const d=ue(E,l,n);s[n]?s[n].p(d,o):(s[n]=Ee(d),s[n].c(),s[n].m(i,null))}for(;n<s.length;n+=1)s[n].d(1);s.length=l.length}},d(E){E&&p(e),ge(s,E)}}}function Ee(u){let e,t=u[8]+"",r,a;return{c(){e=h("div"),r=G(t),a=C(),this.h()},l(i){e=T(i,"DIV",{class:!0});var l=b(e);r=Y(l,t),a=R(l),l.forEach(p),this.h()},h(){f(e,"class","p-3 bg-gray-50 rounded-lg font-mono text-sm whitespace-pre-wrap")},m(i,l){A(i,e,l),c(e,r),c(e,a)},p(i,l){l&4&&t!==(t=i[8]+"")&&Ie(r,t)},d(i){i&&p(e)}}}function qe(u){let e,t,r,a,i;const l=[Re,Se],s=[];function E(o,n){return o[0]?0:1}return t=E(u),r=s[t]=l[t](u),{c(){e=C(),r.c(),a=k(),this.h()},l(o){fe("svelte-p63vr5",document.head).forEach(p),e=R(o),r.l(o),a=k(),this.h()},h(){document.title="ตั้งค่าฐานข้อมูล - Admin"},m(o,n){A(o,e,n),s[t].m(o,n),A(o,a,n),i=!0},p(o,[n]){let d=t;t=E(o),t===d?s[t].p(o,n):(Ae(),W(s[d],1,1,()=>{s[d]=null}),me(),r=s[t],r?r.p(o,n):(r=s[t]=l[t](o),r.c()),H(r,1),r.m(a.parentNode,a))},i(o){i||(H(r),i=!0)},o(o){W(r),i=!1},d(o){o&&(p(e),p(a)),s[t].d(o)}}}function we(u,e,t){let r=null,a=null,i=!0,l=!1,s=[];Te(async()=>{const{data:{session:d}}=await F.auth.getSession();if(!d){le("/login");return}if(r=d.user,await E(),!a||!["admin","super_admin"].includes(a.role)){le("/dashboard");return}t(0,i=!1)});async function E(){if(!r)return;const{data:d}=await F.from("profiles").select("*").eq("id",r.id).single();a=d}async function o(){t(1,l=!0),t(2,s=[]);try{s.push("🔍 ตรวจสอบตาราง course_assignments...");const{data:d,error:L}=await F.from("course_assignments").select("id").limit(1);L&&L.code==="PGRST116"?(s.push("❌ ตาราง course_assignments ไม่มีอยู่ - ต้องสร้างใหม่"),s.push("⚠️ กรุณาสร้างตารางนี้ในฐานข้อมูล Supabase:"),s.push(`
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
        `)):L?s.push(`❌ เกิดข้อผิดพลาดในการตรวจสอบ course_assignments: ${L.message}`):s.push("✅ ตาราง course_assignments มีอยู่แล้ว"),s.push("🔍 ตรวจสอบตาราง student_progress...");const{data:z,error:I}=await F.from("student_progress").select("id").limit(1);I&&I.code==="PGRST116"?(s.push("❌ ตาราง student_progress ไม่มีอยู่ - ต้องสร้างใหม่"),s.push("⚠️ กรุณาสร้างตารางนี้ในฐานข้อมูล Supabase:"),s.push(`
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
        `)):I?s.push(`❌ เกิดข้อผิดพลาดในการตรวจสอบ student_progress: ${I.message}`):s.push("✅ ตาราง student_progress มีอยู่แล้ว"),s.push("🔍 ตรวจสอบตาราง quiz_attempts...");const{data:Q,error:U}=await F.from("quiz_attempts").select("id").limit(1);U&&U.code==="PGRST116"?(s.push("❌ ตาราง quiz_attempts ไม่มีอยู่ - ต้องสร้างใหม่"),s.push("⚠️ กรุณาสร้างตารางนี้ในฐานข้อมูล Supabase:"),s.push(`
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
        `)):U?s.push(`❌ เกิดข้อผิดพลาดในการตรวจสอบ quiz_attempts: ${U.message}`):s.push("✅ ตาราง quiz_attempts มีอยู่แล้ว"),s.push("🔍 ตรวจสอบตาราง quiz_attempt_answers...");const{data:O,error:v}=await F.from("quiz_attempt_answers").select("id").limit(1);v&&v.code==="PGRST116"?(s.push("❌ ตาราง quiz_attempt_answers ไม่มีอยู่ - ต้องสร้างใหม่"),s.push("⚠️ กรุณาสร้างตารางนี้ในฐานข้อมูล Supabase:"),s.push(`
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
        `)):v?s.push(`❌ เกิดข้อผิดพลาดในการตรวจสอบ quiz_attempt_answers: ${v.message}`):s.push("✅ ตาราง quiz_attempt_answers มีอยู่แล้ว"),s.push("🔍 ตรวจสอบตาราง system_logs...");const{data:N,error:S}=await F.from("system_logs").select("id").limit(1);S&&S.code==="PGRST116"?(s.push("❌ ตาราง system_logs ไม่มีอยู่ - ต้องสร้างใหม่"),s.push("⚠️ กรุณาสร้างตารางนี้ในฐานข้อมูล Supabase:"),s.push(`
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
        `)):S?s.push(`❌ เกิดข้อผิดพลาดในการตรวจสอบ system_logs: ${S.message}`):s.push("✅ ตาราง system_logs มีอยู่แล้ว"),s.push("🎉 การตรวจสอบฐานข้อมูลเสร็จสิ้น!"),s.push("📝 หากมีตารางที่ไม่มีอยู่ กรุณาคัดลอก SQL ข้างต้นไปรันใน Supabase SQL Editor")}catch(d){console.error("Error setting up database:",d),s.push(`❌ เกิดข้อผิดพลาด: ${d.message}`)}t(1,l=!1)}async function n(){t(1,l=!0),t(2,s=[]);try{s.push("🔍 ทดสอบการเชื่อมต่อฐานข้อมูล...");const d=["profiles","subjects","zones","groups","courses","learning_topics","learning_parts","learning_resources","quizzes","quiz_questions","quiz_question_options","messages"];for(const L of d)try{const{data:z,error:I}=await F.from(L).select("id").limit(1);I?s.push(`❌ ${L}: ${I.message}`):s.push(`✅ ${L}: เชื่อมต่อสำเร็จ`)}catch(z){s.push(`❌ ${L}: ${z.message}`)}s.push("🎉 การทดสอบเสร็จสิ้น!")}catch(d){console.error("Error testing connections:",d),s.push(`❌ เกิดข้อผิดพลาด: ${d.message}`)}t(1,l=!1)}return[i,l,s,o,n]}class We extends ce{constructor(e){super(),pe(this,e,we,qe,_e,{})}}export{We as component};
