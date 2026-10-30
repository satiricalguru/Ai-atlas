import {authorized,boundedBody,failure,HttpError,json,rateLimit} from '@/lib/http';
import {normalizeRows} from '@/lib/imports';
export async function POST(request:Request){try{
  const {db,user}=await authorized(request,true);await rateLimit(db,'import',10);
  const body=await boundedBody(request);if(!Array.isArray(body.events))throw new HttpError(400,'An events array is required.');
  if(body.events.some((e:{source?:string})=>!['csv','json','chatgpt-export','claude-export'].includes(e.source||'')))throw new HttpError(400,'Only imported activity is accepted.');
  // Preserve format provenance per row; validate the whole file before one transactional statement.
  const events=await normalizeRows(body.events,'json');
  const rows=events.map(e=>{const original=body.events.find((r:{external_id?:string;provider?:string})=>r.external_id===e.external_id&&r.provider===e.provider);const {id,...rest}=e;void id;return {...rest,source:original?.source||'json',user_id:user.id};});
  const {error}=await db.from('activity_events').upsert(rows,{onConflict:'user_id,provider,source,external_id',ignoreDuplicates:true});if(error)throw new HttpError(400,'The import could not be saved. Check the migration and record format.');return json({imported:rows.length});
}catch(e){if(e instanceof Error&&!(e instanceof HttpError)&&/^Row |Import |This file/.test(e.message))return json({error:e.message},400);return failure(e);}}
