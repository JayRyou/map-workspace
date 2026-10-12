import {openBrowser} from './browser-utils.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
const env=await openBrowser(),p=env.page,checks=[];
try {
 await p.goto(env.url);await p.getByText('이 기기에서 저장됨',{exact:true}).waitFor();
 await p.locator('.react-flow__node[data-id="n_journey"]').click();
 await p.getByLabel('요소 이름',{exact:true}).waitFor();
 await p.getByText('이 기기에서 저장됨',{exact:true}).waitFor();
 await p.screenshot({path:'screenshots/p2-selection-inspector.png'});
 await p.getByRole('button',{name:'상세 닫기',exact:true}).click();
 assert.equal(await p.getByLabel('요소 이름',{exact:true}).count(),0);checks.push('데스크톱 상세 닫기 선택 해제');
 await p.locator('.react-flow__node[data-id="n_journey"]').click();
 assert.equal(await p.getByLabel('요소 이름',{exact:true}).inputValue(),'첫 사용 경험');checks.push('상세 재선택 복귀');
 await p.getByRole('button',{name:'목록',exact:true}).click();
 await p.getByRole('button',{name:'설계 · 흐름과 판단 그룹',exact:true}).click();
 await p.getByRole('button',{name:'맵',exact:true}).click();
 await p.getByText('이 기기에서 저장됨',{exact:true}).waitFor();
 await p.screenshot({path:'screenshots/p2-group-inspector.png'});
 await p.getByRole('button',{name:'목록',exact:true}).click();
 await p.getByRole('button',{name:'화면으로 표현 연결선',exact:true}).click();
 await p.getByRole('button',{name:'맵',exact:true}).click();
 await p.getByText('이 기기에서 저장됨',{exact:true}).waitFor();
 await p.screenshot({path:'screenshots/p2-edge-inspector.png'});
 checks.push('실제 노드·그룹·연결 Inspector 캡처');
} finally {await env.close()}
const server=spawn(process.execPath,['scripts/serve-dist.mjs'],{env:{...process.env,PORT:'4178'}});
try {await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject)});const res=await fetch('http://127.0.0.1:4178/');assert.equal(res.status,200);const html=await res.text();assert(html.includes('assets/'));const asset=html.match(/src="([^"]+\.js)"/)[1];const js=await fetch(new URL(asset,'http://127.0.0.1:4178/'));assert.equal(js.status,200);assert(js.headers.get('content-type').includes('javascript'));checks.push('배포용 로컬 서버 index/JS 200 및 MIME 확인')}finally{server.kill()}
fs.writeFileSync('evidence/delivery.json',JSON.stringify({checks,passed:checks.length},null,2));console.log(checks);
