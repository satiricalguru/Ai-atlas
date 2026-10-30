import { categories, eventSchema, type ActivityEvent, type Category, type EventInput } from './data';
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 2000;
const rules: [Category, RegExp][] = [
  ['Debugging', /debug|bug|error|stack trace|fix/i], ['Coding', /code|program|react|python|typescript|function|implement|component|api/i],
  ['Data Analysis', /data|analy[sz]|spreadsheet|sql|chart/i], ['Research', /research|source|compare|investigate|study of/i],
  ['Studying', /learn|explain|teach|study|lesson/i], ['Writing', /write|draft|email|essay|edit|document/i],
  ['Brainstorming', /idea|brainstorm|name|concept/i], ['Content Creation', /content|video|social|blog/i], ['Business Planning', /business|strategy|plan|budget/i],
];
export function classifyMetadata(title: string): {category:Category;confidence:number;classification_source:'metadata'|'unclassified'} {
  const match=rules.find(([,rule])=>rule.test(title));
  return match ? {category:match[0],confidence:0.65,classification_source:'metadata'} : {category:'General Assistance',confidence:0,classification_source:'unclassified'};
}
export function parseCSV(text: string): Record<string, unknown>[] {
  const rows: string[][]=[]; let row: string[]=[]; let cell=''; let quoted=false;
  const src=text.replace(/^\uFEFF/,'');
  for(let i=0;i<src.length;i++) {
    const c=src[i];
    if(c==='"') { if(quoted&&src[i+1]==='"'){cell+='"';i++;} else if(!quoted&&cell.length) throw new Error('Invalid CSV quotation.'); else quoted=!quoted; }
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&src[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw new Error('CSV has an unclosed quotation.');
  row.push(cell); if(row.some(Boolean))rows.push(row);
  if(rows.length<2)throw new Error('Include a header and at least one activity row.');
  const headers=rows.shift()!.map(h=>h.trim());
  if(new Set(headers).size!==headers.length)throw new Error('CSV headers must be unique.');
  if(!headers.includes('provider')||!headers.includes('timestamp'))throw new Error('CSV requires provider and timestamp columns.');
  return rows.map((r,index)=>{if(r.length!==headers.length)throw new Error(`Row ${index+2}: column count does not match the header.`);return Object.fromEntries(headers.map((h,i)=>[h,['tokens','cost','confidence'].includes(h)?r[i].trim()===''?null:Number(r[i]):r[i].trim()===''?undefined:r[i].trim()]));});
}
export async function stableId(row: EventInput) {
  if(row.external_id)return row.external_id;
  const canonical=JSON.stringify([row.provider,row.timestamp,row.model??null,row.tokens??null,row.cost??null]);
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function normalizeRows(rows: unknown[], source: ActivityEvent['source']): Promise<ActivityEvent[]> {
  if(!rows.length)throw new Error('This file has no activity records.');
  if(rows.length>MAX_IMPORT_ROWS)throw new Error(`Import up to ${MAX_IMPORT_ROWS.toLocaleString()} records at a time.`);
  const normalized: ActivityEvent[]=[];
  for(let i=0;i<rows.length;i++){
    const result=eventSchema.safeParse(rows[i]);
    if(!result.success){const issue=result.error.issues[0];throw new Error(`Row ${i+1}: ${issue.path.join('.')} — ${issue.message}`);}
    const row=result.data;
    if(new Date(row.timestamp)>new Date(Date.now()+86400000))throw new Error(`Row ${i+1}: timestamp cannot be in the future.`);
    const external_id=await stableId(row);
    normalized.push({...row,external_id,id:`${row.provider}:${source}:${external_id}`,category:row.category||'General Assistance',source,confidence:row.category?(row.confidence??1):0,classification_source:row.classification_source||(row.category?'user':'unclassified'),classified_at:row.classified_at||new Date().toISOString(),model:row.model??null,tokens:row.tokens??null,cost:row.cost??null});
  }
  return [...new Map(normalized.map(e=>[`${e.provider}:${e.source}:${e.external_id}`,e])).values()];
}
export async function parseImport(text: string, name: string) {
  if(new TextEncoder().encode(text).byteLength>MAX_IMPORT_BYTES)throw new Error('File exceeds the 5 MB limit.');
  if(name.toLowerCase().endsWith('.csv'))return normalizeRows(parseCSV(text),'csv');
  if(!name.toLowerCase().endsWith('.json'))throw new Error('Choose a .csv or .json file.');
  let json:unknown;try{json=JSON.parse(text);}catch{throw new Error('This file is not valid JSON.');}
  const rows=Array.isArray(json)?json:json&&typeof json==='object'&&'events' in json?(json as {events:unknown}).events:null;
  if(!Array.isArray(rows))throw new Error('JSON must contain an array of activities or an object with an events array.');
  if(rows.length>MAX_IMPORT_ROWS)throw new Error(`Import up to ${MAX_IMPORT_ROWS} records at a time.`);
  if(rows.length&&rows[0]&&typeof rows[0]==='object'&&'mapping' in rows[0]) {
    const mapped=rows.map((c:Record<string,unknown>,i)=>{
      const at=Number(c.create_time);if(!Number.isFinite(at)||at<=0)throw new Error(`Conversation ${i+1} is missing a creation timestamp.`);
      const map=c.mapping as Record<string,{message?:{metadata?:{model_slug?:string}}}>|undefined;
      const model=map?Object.values(map).map(n=>n.message?.metadata?.model_slug).find(Boolean):null;
      return {external_id:String(c.id||c.conversation_id||''),provider:'chatgpt',timestamp:new Date(at*1000).toISOString(),model:model||null,...classifyMetadata(String(c.title||''))};
    });return normalizeRows(mapped,'chatgpt-export');
  }
  if(rows.length&&rows[0]&&typeof rows[0]==='object'&&'chat_messages' in rows[0]){
    return normalizeRows(rows.map((c:Record<string,unknown>)=>({external_id:String(c.uuid||''),provider:'claude',timestamp:c.created_at,model:null,...classifyMetadata(String(c.name||''))})),'claude-export');
  }
  return normalizeRows(rows,'json');
}
export function mergeEvents(existing: ActivityEvent[], incoming: ActivityEvent[]) {
  const key=(e:ActivityEvent)=>`${e.provider}:${e.source}:${e.external_id||e.id}`;
  return [...new Map([...existing,...incoming].map(e=>[key(e),e])).values()].sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
}
export function exportCSV(events:ActivityEvent[]){
  const fields=['external_id','provider','timestamp','model','category','tokens','cost','source'] as const;
  const safe=(v:unknown)=>{let s=v==null?'':String(v);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  return [fields.join(','),...events.map(e=>fields.map(f=>safe(e[f])).join(','))].join('\r\n');
}
export const sampleCSV='provider,timestamp,model,category,tokens,cost,external_id\nchatgpt,2026-10-29T10:00:00Z,gpt-4.1,Writing,1250,0.012,example-1\nclaude,2026-10-29T11:30:00Z,claude-sonnet-4-5,Coding,2400,0.024,example-2\nperplexity,2026-10-30T09:00:00Z,sonar-pro,Research,,,example-3\n';
