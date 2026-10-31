import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
export async function proxy(request:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
 if(!url||!key)return NextResponse.next();
 let response=NextResponse.next({request});
 const client=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});values.forEach(({name,value,options})=>response.cookies.set(name,value,{...options,secure:process.env.NODE_ENV==='production',sameSite:'lax'}));}}});
 // Validate with Auth, not an unverified browser session; refresh cookies on the response.
 await client.auth.getUser();
 response.headers.set('Cache-Control','private, no-store');
 return response;
}
export const config={matcher:['/dashboard/:path*','/onboarding','/api/account','/api/import','/api/activity/:path*','/api/integrations']};
