import {describe,it,expect} from 'vitest';
import {parseImport,parseCSV,mergeEvents,classifyMetadata,exportCSV,MAX_IMPORT_ROWS,normalizeRows} from '../../lib/imports';
import {analytics,makeDemo} from '../../lib/data';
const row={provider:'chatgpt',timestamp:'2026-10-29T10:00:00Z'};
describe('Import boundary',()=>{
 it('preserves unknown cost, model, tokens as null',async()=>{const [e]=await parseImport(JSON.stringify([row]),'events.json');expect(e).toMatchObject({cost:null,tokens:null,model:null,category:'General Assistance',confidence:0});});
 it('validates quoted CSV including commas and escaped quotes',()=>{const r=parseCSV('provider,timestamp,model\r\nchatgpt,2026-10-29T10:00:00Z,"custom, ""model"""');expect(r[0].model).toBe('custom, "model"');});
 it('rejects unclosed quotation',()=>expect(()=>parseCSV('provider,timestamp\nchatgpt,"hello')).toThrow('unclosed'));
 it('rejects column drift',()=>expect(()=>parseCSV('provider,timestamp\nchatgpt,date,extra')).toThrow('column count'));
 it('rejects duplicate headers',()=>expect(()=>parseCSV('provider,timestamp,provider\nchatgpt,date,claude')).toThrow('unique'));
 it('rejects invalid dates and negative costs atomically',async()=>{await expect(parseImport(JSON.stringify([row,{...row,cost:-5}]),'data.json')).rejects.toThrow('Row 2');await expect(parseImport(JSON.stringify([{...row,timestamp:'yesterday'}]),'x.json')).rejects.toThrow('timestamp');});
 it('rejects nonfinite numeric values',async()=>{await expect(normalizeRows([{...row,tokens:NaN}],'csv')).rejects.toThrow('tokens');});
 it('rejects huge rows, unknown provider and future dates',async()=>{await expect(parseImport(JSON.stringify(Array.from({length:MAX_IMPORT_ROWS+1},()=>row)),'x.json')).rejects.toThrow('2');await expect(parseImport(JSON.stringify([{...row,provider:'not-real'}]),'x.json')).rejects.toThrow('provider');await expect(parseImport(JSON.stringify([{...row,timestamp:'2099-01-01T00:00:00Z'}]),'x.json')).rejects.toThrow('future');});
 it('keeps explicit zero cost distinct from unavailable',async()=>{const e=await parseImport('provider,timestamp,cost,tokens\nchatgpt,2026-10-29T10:00:00Z,0,0\nclaude,2026-10-29T10:00:00Z,,','x.csv');expect(e[0].cost).toBe(0);expect(e[1].cost).toBeNull();});
 it('deduplicates source IDs and ignores title content',async()=>{const a=await parseImport(JSON.stringify([{...row,title:'secret',external_id:'123'},row]),'x.json');const b=await parseImport(JSON.stringify([row]),'x.json');expect(mergeEvents(a,b)).toHaveLength(2);expect(JSON.stringify(a)).not.toContain('secret');});
 it('classifies authorized ChatGPT title locally and discards text',async()=>{const [e]=await parseImport(JSON.stringify([{id:'chat-1',title:'Debug sensitiveSecret()',create_time:1793268000,mapping:{n:{message:{metadata:{model_slug:'gpt-4.1'},content:{parts:['private body']}}}}}]),'conversations.json');expect(e.category).toBe('Debugging');expect(e.source).toBe('chatgpt-export');expect(e.model).toBe('gpt-4.1');expect(JSON.stringify(e)).not.toMatch(/sensitiveSecret|private body/);});
 it('honors the metadata-classification opt out before inferring a category',async()=>{const [e]=await parseImport(JSON.stringify([{uuid:'c',name:'Debug my code',created_at:'2026-10-29T10:00:00Z',chat_messages:[]}]),'claude.json',false);expect(e).toMatchObject({category:'General Assistance',confidence:0,classification_source:'unclassified'});});
 it('refuses to invent missing export timestamps',async()=>{await expect(parseImport(JSON.stringify([{id:'x',mapping:{}}]),'x.json')).rejects.toThrow('timestamp');});
 it('imports Claude metadata without retaining messages',async()=>{const [e]=await parseImport(JSON.stringify([{uuid:'abc',name:'Write a private essay',created_at:'2026-10-29T10:00:00Z',chat_messages:[{text:'never retain'}]}]),'claude.json');expect(e).toMatchObject({category:'Writing',source:'claude-export',model:null});expect(JSON.stringify(e)).not.toContain('never retain');});
 it('neutralizes spreadsheet formula injection in CSV exports',async()=>{const [e]=await parseImport(JSON.stringify([{...row,model:'=HYPERLINK("evil")'}]),'x.json');expect(exportCSV([e])).toContain("'=HYPERLINK");});
 it('strips untrusted owner fields at import boundary',async()=>{const [e]=await parseImport(JSON.stringify([{...row,user_id:'victim',metadata:{prompt:'secret'}}]),'x.json');expect(e).not.toHaveProperty('user_id');expect(e).not.toHaveProperty('metadata');});
});
describe('Transparent analytics',()=>{
 it('computes comparisons using an equally sized previous period',()=>{const e=makeDemo();const a=analytics(e,30,new Date('2026-10-30T12:00:00Z'));expect(a.total).toBe(a.current.length);expect(a.delta).toBeCloseTo((a.total-a.previous.length)/a.previous.length*100);expect(a.ranking.reduce((s,p)=>s+p.count,0)).toBe(a.total);expect(a.distribution.reduce((s,p)=>s+p.count,0)).toBe(a.total);expect(a.trend.reduce((s,p)=>s+p.count,0)).toBe(a.total);});
 it('returns unavailable spending, not zero, without known costs',async()=>{const events=await parseImport(JSON.stringify([row]),'x.json');const a=analytics(events,30,new Date('2026-10-30T12:00:00Z'));expect(a.totalCost).toBeNull();expect(a.delta).toBeNull();});
 it('handles empty workspaces without injecting demo data',()=>{expect(analytics([],30).total).toBe(0);expect(analytics([],30).models).toEqual([]);});
 it('classifies unknown metadata without invented certainty',()=>{expect(classifyMetadata('hello')).toMatchObject({category:'General Assistance',confidence:0,classification_source:'unclassified'});});
});
