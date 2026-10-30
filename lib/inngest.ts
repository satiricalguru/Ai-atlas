import {Inngest,NonRetriableError,RetryAfterError} from 'inngest';
import {adminClient} from './supabase/server';
import {decryptSecret} from './crypto';
import {adapters,ProviderError} from './providers';
export const inngest=new Inngest({id:'ai-atlas'});
export const syncProvider=inngest.createFunction({id:'sync-provider',triggers:[{event:'atlas/provider.sync'}],retries:4,concurrency:[{limit:1,key:'event.data.integrationId'}],onFailure:async({event})=>{const data=event.data.event.data;const db=adminClient();await db.from('sync_jobs').update({status:'failed',error:'Synchronization failed after retries. Reconnect or try again.'}).eq('id',data.jobId);await db.from('integrations').update({status:'attention',error:'Synchronization failed after retries. Check permissions and try again.'}).eq('id',data.integrationId);}},async({event,step})=>{
 const jobId=String(event.data.jobId||'');const integrationId=String(event.data.integrationId||'');
 const job=await step.run('load-owned-job',async()=>{const db=adminClient();const {data:j}=await db.from('sync_jobs').select('*').eq('id',jobId).eq('integration_id',integrationId).single();if(!j)throw new NonRetriableError('Sync job does not exist.');const {data:i}=await db.from('integrations').select('*').eq('id',integrationId).eq('user_id',j.user_id).single();if(!i)throw new NonRetriableError('Integration is disconnected.');if(j.status==='complete')return {...j,alreadyComplete:true,last_sync:i.last_sync,provider:i.provider};await db.from('sync_jobs').update({status:'running'}).eq('id',jobId);return {...j,alreadyComplete:false,last_sync:i.last_sync,provider:i.provider};});
 if(job.alreadyComplete)return {alreadyComplete:true};
 const end=new Date();const start=job.last_sync?new Date(job.last_sync):new Date(end.getTime()-30*86400000);start.setUTCHours(0,0,0,0);let cursor:string|null=job.cursor||null;let pages=0;
 do{
   const result=await step.run(`usage-page-${pages}`,async()=>{const db=adminClient();const {data:i}=await db.from('integrations').select('id').eq('id',integrationId).eq('user_id',job.user_id).single();if(!i)throw new NonRetriableError('Integration disconnected.');const {data:secret}=await db.from('integration_secrets').select('encrypted_key').eq('integration_id',integrationId).single();if(!secret)throw new NonRetriableError('Integration credential unavailable.');const adapter=adapters[job.provider];if(!adapter)throw new NonRetriableError('Unsupported adapter.');try{const page=await adapter.fetchPage(await decryptSecret(secret.encrypted_key),start,end,cursor);if(page.snapshots.length){const {error}=await db.from('usage_snapshots').upsert(page.snapshots.map(s=>({...s,user_id:job.user_id,integration_id:integrationId})),{onConflict:'user_id,provider,timestamp,model,source'});if(error)throw new Error('Could not save usage snapshots.');}await db.from('sync_jobs').update({cursor:page.cursor}).eq('id',jobId);return {cursor:page.cursor,count:page.snapshots.length};}catch(e){if(e instanceof ProviderError&&e.retryAfter)throw new RetryAfterError(e.message,`${e.retryAfter}s`);throw e;}});
   cursor=result.cursor;pages++;if(cursor&&pages>=32)throw new NonRetriableError('Provider page limit reached. Start another sync to resume.');
 }while(cursor);
 await step.run('complete-sync',async()=>{const db=adminClient();await db.from('sync_jobs').update({status:'complete',completed_at:new Date().toISOString(),cursor:null}).eq('id',jobId);await db.from('integrations').update({status:'connected',last_sync:end.toISOString(),error:null,cursor:null}).eq('id',integrationId).eq('user_id',job.user_id);});
 return {pages};
});

// Durable daily sweep; pagination prevents an account count from creating one long HTTP request.
export const scheduleSync=inngest.createFunction({id:'daily-provider-sync',triggers:[{cron:'0 3 * * *'}],retries:3,concurrency:1},async({step})=>{
 let offset=0;let total=0;
 for(let batch=0;batch<100;batch++){
  const rows=await step.run(`connections-${batch}`,async()=>{const {data,error}=await adminClient().from('integrations').select('id,user_id').eq('status','connected').order('id').range(offset,offset+99);if(error)throw error;return data;});
  if(!rows.length)break;
  for(const row of rows){await step.run(`queue-${row.id}`,async()=>{const db=adminClient();const {data:active}=await db.from('sync_jobs').select('id').eq('integration_id',row.id).in('status',['pending','running']).gte('started_at',new Date(Date.now()-15*60000).toISOString()).limit(1);if(active?.length)return;const {data:job,error}=await db.from('sync_jobs').insert({user_id:row.user_id,integration_id:row.id,status:'pending'}).select('id').single();if(error||!job)throw new Error('Could not create a scheduled sync job.');await inngest.send({id:job.id,name:'atlas/provider.sync',data:{jobId:job.id,integrationId:row.id}});});total++;}
  offset+=rows.length;if(rows.length<100)break;
 }
 return {queued:total};
});
