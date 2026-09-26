import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createServer} from './server.mjs';
test('local boundary, validation and streamed model response',async()=>{
 const mock=http.createServer((req,res)=>{if(req.url==='/api/tags')res.end(JSON.stringify({models:[{name:'test:1b',size:1000},{name:'test:cloud'}]}));else if(req.url==='/api/show')res.end('{}');else{res.setHeader('Content-Type','application/x-ndjson');res.end('{"message":{"content":"Hello"},"done":false}\n{"done":true,"eval_count":1,"eval_duration":100000000}\n');}});
 await new Promise(r=>mock.listen(0,'127.0.0.1',r));const app=createServer({upstream:`http://127.0.0.1:${mock.address().port}`});await new Promise(r=>app.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.address().port}`;
 try{const s=await(await fetch(base+'/api/status')).json();assert.equal(s.models.length,1);const b={model:'test:1b',system:'Be helpful',messages:[{role:'user',content:'Hello'}],temperature:.3,maxTokens:128};const send=(body=b,headers={})=>fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Local-Token':s.token,...headers},body:JSON.stringify(body)});
 assert.equal((await send(b,{'Origin':'https://evil.example'})).status,403);assert.equal((await send(b,{'X-Local-Token':'wrong'})).status,403);assert.equal((await send({...b,model:'x:cloud'})).status,400);assert.equal((await send({...b,messages:[{role:'system',content:'x'}]})).status,400);assert.equal((await send({...b,messages:[{role:'user',content:'x'.repeat(6001)}]})).status,400);const stream=await send();assert.equal(stream.status,200);assert.match(await stream.text(),/Hello/);assert.equal((await fetch(base+'/not-a-file')).status,404);assert.match((await fetch(base)).headers.get('content-security-policy'),/frame-ancestors 'none'/);
 }finally{app.closeAllConnections();mock.closeAllConnections();await Promise.all([new Promise(r=>app.close(r)),new Promise(r=>mock.close(r))]);}
});
