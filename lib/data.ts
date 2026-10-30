import { z } from 'zod';

export const providerIds = ['chatgpt', 'claude', 'gemini', 'cursor', 'copilot', 'perplexity', 'other'] as const;
export type ProviderId = typeof providerIds[number];
export const categories = ['Coding', 'Debugging', 'Research', 'Studying', 'Writing', 'Brainstorming', 'Content Creation', 'Data Analysis', 'Business Planning', 'General Assistance'] as const;
export type Category = typeof categories[number];
export const providers: { id: ProviderId; name: string; company: string; color: string; mark: string; description: string; method: string; url: string; live?: boolean }[] = [
  { id: 'chatgpt', name: 'ChatGPT', company: 'OpenAI', color: '#9ac5ae', mark: '◎', description: 'Your thinking partner, across every kind of work.', method: 'JSON export · OpenAI API', url: 'https://chatgpt.com', live: true },
  { id: 'claude', name: 'Claude', company: 'Anthropic', color: '#e4a387', mark: '✳', description: 'From thoughtful writing to complex code.', method: 'JSON export · Anthropic API', url: 'https://claude.ai', live: true },
  { id: 'gemini', name: 'Gemini', company: 'Google', color: '#9baeee', mark: '✦', description: 'Research, create, and explore new perspectives.', method: 'CSV / JSON import', url: 'https://gemini.google.com' },
  { id: 'cursor', name: 'Cursor', company: 'Anysphere', color: '#c9d0c5', mark: '◈', description: 'Your AI-powered development environment.', method: 'CSV / JSON import', url: 'https://cursor.com' },
  { id: 'copilot', name: 'GitHub Copilot', company: 'GitHub', color: '#c1ace5', mark: '⌘', description: 'A little extra intelligence in your editor.', method: 'CSV / JSON import', url: 'https://github.com/features/copilot' },
  { id: 'perplexity', name: 'Perplexity', company: 'Perplexity AI', color: '#8bc8ca', mark: '⌇', description: 'Follow your curiosity. Find the sources.', method: 'CSV / JSON import', url: 'https://perplexity.ai' },
  { id: 'other', name: 'Other tools', company: 'Your ecosystem', color: '#bac39d', mark: '+', description: 'Make room for the next tool in your workflow.', method: 'CSV / JSON import', url: '' },
];
export const categoryColors = ['#d5fa6b','#b0c29a','#a6b8ed','#d6c0e5','#e4b699','#a4d2c6','#dda5b6','#8db6c6','#b8b49a','#889283'];
export const eventSchema = z.object({
  external_id: z.string().min(1).max(160).optional(),
  provider: z.enum(providerIds), timestamp: z.string().datetime({ offset: true }),
  model: z.string().trim().min(1).max(100).nullable().optional(),
  category: z.enum(categories).optional(),
  tokens: z.number().int().nonnegative().max(1e12).nullable().optional(),
  cost: z.number().finite().nonnegative().max(1e6).nullable().optional(),
  source: z.enum(['csv', 'json', 'chatgpt-export', 'claude-export', 'demo']).optional(),
  confidence: z.number().min(0).max(1).optional(),
  classification_source: z.enum(['metadata', 'user', 'unclassified', 'demo']).optional(),
  classified_at: z.string().datetime({ offset: true }).optional(),
});
export type EventInput = z.infer<typeof eventSchema>;
export type ActivityEvent = Omit<EventInput, 'category' | 'source' | 'confidence' | 'classification_source'> & {
  id: string; category: Category; source: 'csv' | 'json' | 'chatgpt-export' | 'claude-export' | 'demo'; confidence: number; classification_source: string;
};
export type Integration = { id: string; provider: string; status: string; last_sync: string | null; error: string | null; };
export type Snapshot = { id?: string; provider: string; timestamp: string; model: string | null; requests: number | null; input_tokens: number | null; output_tokens: number | null; cost: number | null; source: string; };

export function makeDemo(): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const models = ['gpt-4.1', 'claude-sonnet-4-5', 'gemini-2.5-pro', 'claude-sonnet-4-5', 'gpt-4.1', 'sonar-pro'];
  const tasks: Category[][] = [['Writing','Research','Coding','Brainstorming'],['Coding','Writing','Debugging'],['Research','Studying','Data Analysis'],['Coding','Coding','Debugging'],['Coding','Debugging'],['Research','Studying']];
  const end = new Date('2026-10-30T12:00:00Z');
  for (let d = 0; d < 90; d++) {
    const count = 17 + (d * 13 % 39) + (d < 30 ? 15 : 0);
    for (let i = 0; i < count; i++) {
      const w = (i * 17 + d * 3) % 100;
      const p = w < 32 ? 0 : w < 57 ? 1 : w < 69 ? 2 : w < 84 ? 3 : w < 92 ? 4 : 5;
      const date = new Date(end); date.setUTCDate(date.getUTCDate()-d); date.setUTCHours(7 + i % 14, (i*17)%60, 0, 0);
      events.push({ id: `demo-${d}-${i}`, external_id: `demo-${d}-${i}`, provider: providerIds[p], timestamp: date.toISOString(), model: models[p], category: tasks[p][(i+d)%tasks[p].length], tokens: 450 + (i*173+d*97)%3900, cost: +(0.003+((i*17+d)%48)/1000).toFixed(4), source: 'demo', confidence: 0.92, classification_source: 'demo', classified_at: date.toISOString() });
    }
  }
  return events.sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
}
export const demoEvents = makeDemo();
export function getProvider(id: string) { return providers.find(p=>p.id===id) || providers[6]; }
export function formatNumber(n: number) { return new Intl.NumberFormat('en-US').format(n); }
export function money(n: number) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n); }

export function analytics(events: ActivityEvent[], days = 30, reference?: Date) {
  const end = reference || new Date();
  const start = new Date(end); start.setUTCHours(0,0,0,0); start.setUTCDate(start.getUTCDate() - days + 1);
  const previousStart = new Date(start); previousStart.setUTCDate(start.getUTCDate()-days);
  const endInclusive = new Date(end); endInclusive.setUTCHours(23,59,59,999);
  const current = events.filter(e=>new Date(e.timestamp)>=start && new Date(e.timestamp)<=endInclusive);
  const previous = events.filter(e=>new Date(e.timestamp)>=previousStart && new Date(e.timestamp)<start);
  const ranking = providers.map(p=>({...p,count:current.filter(e=>e.provider===p.id).length})).filter(p=>p.count).sort((a,b)=>b.count-a.count);
  const distribution = categories.map((name,i)=>({name,color:categoryColors[i],count:current.filter(e=>e.category===name).length})).filter(c=>c.count).sort((a,b)=>b.count-a.count);
  const trend = Array.from({length:days},(_,i)=>{ const date=new Date(start); date.setUTCDate(start.getUTCDate()+i); const key=date.toISOString().slice(0,10); return {date:key,count:current.filter(e=>e.timestamp.slice(0,10)===key).length}; });
  const costs = current.filter(e=>e.cost!=null);
  const models = [...new Set(current.map(e=>e.model).filter(Boolean))].map(name=>({name,count:current.filter(e=>e.model===name).length})).sort((a,b)=>b.count-a.count);
  const activeDays = new Set(current.map(e=>e.timestamp.slice(0,10))).size;
  const delta = previous.length ? (current.length-previous.length)/previous.length*100 : null;
  const totalCost = costs.length ? costs.reduce((sum,e)=>sum+(e.cost||0),0) : null;
  return {current,previous,ranking,distribution,trend,total:current.length,activeDays,delta,totalCost,costCoverage:costs.length,models,days,start:start.toISOString(),end:endInclusive.toISOString()};
}
