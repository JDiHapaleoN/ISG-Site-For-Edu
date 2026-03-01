"use strict";(()=>{var e={};e.id=410,e.ids=[410],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},7518:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>f,patchFetch:()=>h,requestAsyncStorage:()=>d,routeModule:()=>p,serverHooks:()=>g,staticGenerationAsyncStorage:()=>m});var r={};a.r(r),a.d(r,{POST:()=>l});var s=a(3278),o=a(5002),n=a(4877),i=a(1309),u=a(7650),c=a(2208);async function l(e){try{let{concept:t,category:a,explanation:r}=await e.json();if(!t||!a||!r)return i.NextResponse.json({error:"Missing required fields"},{status:400});let s=`
You are simulating a 12-year-old student who is very curious but doesn't know any advanced jargon. 
The user is trying to explain the concept of "${t}" (Category: ${a}) to you using the Feynman Technique.

Listen to their explanation. If they use complex jargon, say you don't understand that word and ask them to clarify.
If they make a logical leap, point out that you are confused how A leads to B.
If the explanation is perfect and simple, praise them and summarize what you understood.

Your response MUST be in Russian, as the user's L1 is Russian.

Format your response in simple HTML suitable for dangerouslySetInnerHTML.
Structure:
<div class="space-y-4">
  <p><strong>Твоя реакция 12-летнего:</strong> [Напиши здесь свои мысли, вопросы или путаницу от лица ребенка]</p>
  
  <div class="bg-fuchsia-50 dark:bg-fuchsia-950/30 p-4 rounded-xl border border-fuchsia-100 dark:border-fuchsia-900/30 text-zinc-900 dark:text-zinc-100">
    <h4 class="font-bold mb-2">Анализ от "Учителя"</h4>
    <ul class="list-disc pl-5 space-y-1">
      <li>Укажи на найденный жаргон (если есть)</li>
      <li>Логические пробелы (если есть)</li>
      <li>Совет, как улучшить объяснение</li>
    </ul>
  </div>
</div>

Finally, estimate a "Simplicity Score" out of 10. (10 = a 5-year-old would get it, 1 = read like a textbook).

Output ONLY a JSON object with this exact structure:
{
  "feedback": "the raw HTML string starting with <div class='space-y-4'>...",
  "score": 8
}
`,o=(await u.o.generateContent(`System Prompt: ${s}

Explanation:
${r}`)).response.text();if(!o)throw Error("No response from Gemini");let n=o.replace(/```json\n?|```/g,"").trim(),l=JSON.parse(n),p=await c._.user.findFirst({where:{email:"demo@antigravity.local"}});p||(p=await c._.user.create({data:{email:"demo@antigravity.local",name:"Demo User"}}));let d=parseFloat(String(l.score).replace(/[^0-9.]/g,""));return isNaN(d)&&(d=0),await c._.practiceLog.create({data:{userId:p.id,module:"general",type:"feynman",topic:t,userInput:r,score:d,aiFeedback:l.feedback}}),i.NextResponse.json({feedback:l.feedback,score:l.score})}catch(e){if(console.error("Gemini Feynman error:",e),e.message?.includes("429")||e.message?.includes("quota"))return i.NextResponse.json({error:"Превышен лимит запросов. Пожалуйста, подождите 1-2 минуты."},{status:429});if(e.message?.includes("503")||e.message?.includes("overloaded"))return i.NextResponse.json({error:"Сервера перегружены. Пожалуйста, попробуйте снова через 30 секунд."},{status:503});return i.NextResponse.json({error:"Failed to process Feynman explanation"},{status:500})}}let p=new s.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/practice/feynman/route",pathname:"/api/practice/feynman",filename:"route",bundlePath:"app/api/practice/feynman/route"},resolvedPagePath:"/Users/hapoleon/Desktop/Projects/ISG-SiteForEdu-24feb/src/app/api/practice/feynman/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:d,staticGenerationAsyncStorage:m,serverHooks:g}=p,f="/api/practice/feynman/route";function h(){return(0,n.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:m})}},7650:(e,t,a)=>{a.d(t,{o:()=>o});var r=a(1540);let s=process.env.OPENAI_API_KEY,o=new r.$D(s||"").getGenerativeModel({model:"gemini-flash-latest",generationConfig:{responseMimeType:"application/json"}})},2208:(e,t,a)=>{a.d(t,{_:()=>s});var r=a(3524);let s=global.prisma||new r.PrismaClient}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[787,833,540],()=>a(7518));module.exports=r})();