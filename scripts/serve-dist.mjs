import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const port = Number(process.env.PORT || 4173);
http.createServer((req,res)=>{
  const name = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = path.resolve(root,'.'+name);
  if (file!==root && !file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
  if(name.endsWith('/')) file=path.join(file,'index.html');
  try {res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.woff2':'font/woff2','.json':'application/json'})[path.extname(file)] || 'application/octet-stream');res.end(fs.readFileSync(file));}
  catch {res.writeHead(404);res.end('파일을 찾을 수 없습니다.');}
}).listen(port,'127.0.0.1',()=>console.log(`로컬 편집기: http://127.0.0.1:${port} (이 주소의 저장소 사용)`));
