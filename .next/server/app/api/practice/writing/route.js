"use strict";(()=>{var e={};e.id=756,e.ids=[756],e.modules={3524:e=>{e.exports=require("@prisma/client")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},7898:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>v,patchFetch:()=>h,requestAsyncStorage:()=>d,routeModule:()=>p,serverHooks:()=>m,staticGenerationAsyncStorage:()=>g});var s={};r.r(s),r.d(s,{POST:()=>l});var a=r(3278),i=r(5002),o=r(4877),n=r(1309),u=r(7650),c=r(2208);async function l(e){try{let{prompt:t,language:r,text:s,type:a}=await e.json();if(!t||!r||!s||!a)return n.NextResponse.json({error:"Missing required fields"},{status:400});let i=`
You are an expert examiner for ${"english"===r?"IELTS Academic":"TestDaF"} writing.
The student is attempting "${a}".
The prompt given to the student was: "${t}"

Act as a strict but encouraging examiner. Your output MUST be in Russian, as the student's L1 is Russian.
However, you can quote the student's essay in its original language to point out mistakes.

Please provide your evaluation in the following structure using HTML tags for formatting.
Ensure it is safe to display via dangerouslySetInnerHTML.

<div class="space-y-6">
  <div>
    <h4 class="text-lg font-bold mb-2">Общая оценка</h4>
    <p>Абзац с общей оценкой эссе, насколько оно отвечает заданию и насколько хорошо написано.</p>
  </div>
  
  <div>
    <h4 class="text-lg font-bold mb-2">Грамматика и Лексика</h4>
    <ul class="list-disc pl-5 space-y-2">
      <li>Укажите 2-3 конкретные ошибки (цитата -> исправление).</li>
      <li>Отметьте удачное использование сложных конструкций.</li>
    </ul>
  </div>

  <div>
    <h4 class="text-lg font-bold mb-2">Структура и Когезия</h4>
    <p>Оцените логику абзацев, связки и раскрытие темы.</p>
  </div>
</div>

Finally, estimate a score/band:
For IELTS, give a Band score (e.g., 6.5, 7.0).
For TestDaF, give a TDN score (e.g., TDN 3, 4, 5).

Output ONLY a JSON object with this exact structure:
{
  "feedback": "the raw HTML string starting with <div class='space-y-6'>...",
  "score": "6.5" or "TDN 4"
}
`,o=(await u.o.generateContent(`System Prompt: ${i}

Student's essay:
${s}`)).response.text();if(!o)throw Error("No response from Gemini");let l=o.replace(/```json\n?|```/g,"").trim(),p=JSON.parse(l),d=await c._.user.findFirst({where:{email:"demo@antigravity.local"}});d||(d=await c._.user.create({data:{email:"demo@antigravity.local",name:"Demo User"}}));let g=parseFloat(String(p.score).replace(/[^0-9.]/g,""));return isNaN(g)&&(g=0),await c._.practiceLog.create({data:{userId:d.id,module:r,type:a,score:g,topic:t,userInput:s,aiFeedback:p.feedback}}),n.NextResponse.json({feedback:p.feedback,score:p.score})}catch(e){if(console.error("Gemini writing error:",e),e.message?.includes("429")||e.message?.includes("quota"))return n.NextResponse.json({error:"Превышен лимит запросов. Пожалуйста, подождите 1-2 минуты."},{status:429});if(e.message?.includes("503")||e.message?.includes("overloaded"))return n.NextResponse.json({error:"Сервера перегружены. Пожалуйста, попробуйте снова через 30 секунд."},{status:503});return n.NextResponse.json({error:"Failed to evaluate the text"},{status:500})}}let p=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/practice/writing/route",pathname:"/api/practice/writing",filename:"route",bundlePath:"app/api/practice/writing/route"},resolvedPagePath:"/Users/hapoleon/Desktop/Projects/ISG-SiteForEdu-24feb/src/app/api/practice/writing/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:g,serverHooks:m}=p,v="/api/practice/writing/route";function h(){return(0,o.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:g})}},7650:(e,t,r)=>{r.d(t,{o:()=>i});var s=r(1540);let a=process.env.OPENAI_API_KEY,i=new s.$D(a||"").getGenerativeModel({model:"gemini-flash-latest",generationConfig:{responseMimeType:"application/json"}})},2208:(e,t,r)=>{r.d(t,{_:()=>a});var s=r(3524);let a=global.prisma||new s.PrismaClient}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[787,833,540],()=>r(7898));module.exports=s})();