import {serverClient} from './supabase/server';
export class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)throw new HttpError(403,'Cross-origin request rejected.');}
export async function authorized(request:Request,mutation=false){
  if(mutation)sameOrigin(request);
  const db=await serverClient();const {data:{user},error}=await db.auth.getUser();if(error||!user)throw new HttpError(401,'Sign in to access your account.');return {db,user};
}
export async function rateLimit(db:Awaited<ReturnType<typeof serverClient>>,action:string,limit=30){const {data,error}=await db.rpc('consume_rate_limit',{p_action:action,p_limit:limit});if(error)throw new HttpError(503,'Rate limiting is unavailable. Check the database migration.');if(!data)throw new HttpError(429,'Too many requests. Please try again in a minute.');}
export async function boundedBody(request:Request,max=5*1024*1024){const length=Number(request.headers.get('content-length'));if(length>max)throw new HttpError(413,'Request exceeds the size limit.');const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'A request body is required.');let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new HttpError(413,'Request exceeds the size limit.');}chunks.push(value);}const bytes=new Uint8Array(size);let pos=0;for(const c of chunks){bytes.set(c,pos);pos+=c.length;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new HttpError(400,'Invalid JSON request.');}}
export function failure(e:unknown){if(e instanceof HttpError)return json({error:e.message},e.status);return json({error:'The operation could not be completed. Check the service configuration and try again.'},503);}
