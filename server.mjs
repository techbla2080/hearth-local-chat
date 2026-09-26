import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';

const root=new URL('./public/',import.meta.url);
export function createServer({upstream='http://127.0.0.1:11434'}={}) {
 const token=randomBytes(24).toString('hex'); let busy=false;
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
 return http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'");
  const host=req.headers.host||'';
  if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host))return json(res,403,{error:'Local access only.'});
  if(req.headers.origin&&req.headers.origin!==`http://${host}`)return json(res,403,{error:'Cross-origin requests are blocked.'});
  const path=new URL(req.url,`http://${host}`).pathname;
  try {
   if(req.method==='GET'&&path==='/api/status'){
    const r=await fetch(`${upstream}/api/tags`,{signal:AbortSignal.timeout(4000)});if(!r.ok)throw Error('Ollama unavailable');
    const data=await r.json();
    // Cloud-backed models must not be offered as local inference.
    const models=[];
    for(const m of data.models||[]){
     if(/cloud/i.test(m.name)||m.remote_host||m.remote_model)continue;
     const info=await fetch(`${upstream}/api/show`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:m.name}),signal:AbortSignal.timeout(4000)});
     if(!info.ok)continue;const details=await info.json();if(details.remote_host||details.remote_model)continue;
     models.push({name:m.name,size:m.size,parameters:m.details?.parameter_size,quantization:m.details?.quantization_level});
    }
    return json(res,200,{online:true,models,token});
   }
   if(req.method==='POST'&&path==='/api/chat'){
    if(req.headers['x-local-token']!==token)return json(res,403,{error:'Refresh the page before sending.'});
    if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'JSON required.'});
    if(busy)return json(res,429,{error:'Another response is running. Wait or stop it first.'});
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>40000)return json(res,413,{error:'Conversation too long. Start a new chat.'});}
    let b;try{b=JSON.parse(raw);}catch{return json(res,400,{error:'Invalid JSON.'});}
    if(!b||typeof b!=='object'||(Array.isArray(b.messages)&&b.messages.some(m=>!m||typeof m!=='object')))return json(res,400,{error:'Invalid request.'});
    if(typeof b.model!=='string'||/cloud/i.test(b.model)||!Array.isArray(b.messages)||b.messages.length<1||b.messages.length>40||b.messages.some(m=>!['user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim())||typeof b.system!=='string'||b.system.length>1500||b.messages.reduce((n,m)=>n+m.content.length,0)>6000||!Number.isFinite(b.temperature)||b.temperature<0||b.temperature>1||![128,256,512].includes(b.maxTokens))return json(res,400,{error:'Invalid request or conversation exceeds 6,000 characters. Start a new chat.'});
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),180000);
    if(busy){clearTimeout(timer);return json(res,429,{error:'Another response is running.'});}
    res.on('close',()=>controller.abort());busy=true;
    try{
     const check=await fetch(`${upstream}/api/show`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:b.model}),signal:controller.signal});
     if(!check.ok)return json(res,400,{error:'Model is not installed.'});
     const info=await check.json();if(info.remote_host||info.remote_model)return json(res,400,{error:'Cloud models are disabled.'});
     const r=await fetch(`${upstream}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:b.model,messages:[{role:'system',content:b.system},...b.messages],stream:true,keep_alive:'2m',options:{temperature:b.temperature,num_predict:b.maxTokens,num_ctx:4096}}),signal:controller.signal});
     if(!r.ok)return json(res,502,{error:'Ollama could not run this model. Try the 1B model or free some RAM.'});
     res.writeHead(200,{'Content-Type':'application/x-ndjson'});
     for await(const chunk of r.body){if(res.destroyed)break;res.write(chunk);}res.end();
    }catch(e){if(!res.headersSent)json(res,502,{error:e.name==='AbortError'?'Response timed out or was stopped.':'Cannot reach Ollama. Open Ollama and refresh.'});else if(!res.destroyed)res.end(JSON.stringify({error:'Generation interrupted. Please retry.'})+'\n');}
    finally{clearTimeout(timer);busy=false;}return;
   }
   if(req.method==='GET'&&['/','/app.js','/style.css'].includes(path)){
    const file=path==='/'?'index.html':path.slice(1);res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8');res.end(await readFile(new URL(file,root)));return;
   }
   json(res,404,{error:'Not found.'});
  }catch{json(res,503,{online:false,error:'Ollama is offline. Open Ollama, then refresh the connection.'});}
 });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT||8766);createServer().listen(port,'127.0.0.1',()=>console.log(`Hearth local chat: http://127.0.0.1:${port}`));}
