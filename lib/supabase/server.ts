import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
export function configured(){return !!(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);}
export async function serverClient(){
  if(!configured())throw new Error('Account services are not configured. Explore the demo or use the local workspace.');
  const store=await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll(){return store.getAll();},setAll(values){try{values.forEach(({name,value,options})=>store.set(name,value,{...options,secure:process.env.NODE_ENV==='production',sameSite:'lax'}));}catch{/* Server components cannot write cookies; route handlers refresh them. */}}}});
}
export function adminClient(){
  if(!process.env.SUPABASE_SERVICE_ROLE_KEY||!process.env.NEXT_PUBLIC_SUPABASE_URL)throw new Error('Server account administration is not configured.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
