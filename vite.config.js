import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
export default defineConfig({root:'dist',server:{host:'0.0.0.0',allowedHosts:['terminal.local']},plugins:[{name:'responsive-review',configureServer(server){server.middlewares.use('/__responsive',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end(readFileSync(new URL('./qa/responsive.html',import.meta.url),'utf8'));});}}]});
