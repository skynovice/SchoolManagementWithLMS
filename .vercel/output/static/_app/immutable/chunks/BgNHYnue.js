import{w as i}from"./C5JyHtm3.js";import{s}from"./DtlnWW8f.js";import{a as f}from"./BlS67Avr.js";const o=i(null),n=i(null),u=i(!0),p=async()=>{try{u.set(!0);const{data:{session:t}}=await s.auth.getSession();t!=null&&t.user&&(o.set(t.user),await c(t.user.id)),s.auth.onAuthStateChange(async(e,r)=>{r!=null&&r.user?(o.set(r.user),await c(r.user.id)):(o.set(null),n.set(null))})}catch(t){console.error("Auth initialization error:",t)}finally{u.set(!1)}},c=async t=>{try{const{data:e,error:r}=await s.from("profiles").select(`
        *,
        zones (
          id,
          name
        ),
        groups (
          id,
          name
        )
      `).eq("id",t).single();if(r)throw r;n.set(e)}catch(e){console.error("Profile loading error:",e),n.set(null)}},y=async(t,e)=>{try{const{data:r,error:a}=await s.auth.signInWithPassword({email:t,password:e});if(a)throw a;return{success:!0}}catch(r){return{success:!1,error:r.message||"เกิดข้อผิดพลาดในการเข้าสู่ระบบ"}}},b=async()=>{try{const{error:t}=await s.auth.signOut();if(t)throw t;return o.set(null),n.set(null),{success:!0}}catch(t){return{success:!1,error:t.message||"เกิดข้อผิดพลาดในการออกจากระบบ"}}},l=i([]),d=t=>{const e=f(),r={id:e,type:t.type||"info",message:t.message,duration:t.duration||5e3,timestamp:Date.now()};return l.update(a=>[...a,r]),r.duration>0&&setTimeout(()=>{h(e)},r.duration),e},h=t=>{l.update(e=>e.filter(r=>r.id!==t))},A=(t,e=5e3)=>d({type:"success",message:t,duration:e}),I=(t,e=8e3)=>d({type:"error",message:t,duration:e});export{y as a,A as b,b as c,p as i,u as l,l as n,h as r,I as s,o as u};
