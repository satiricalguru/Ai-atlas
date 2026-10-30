import {redirect} from 'next/navigation';
import {configured,serverClient} from './supabase/server';
import type {WorkspaceMode} from '@/components/atlas/workspace';
export async function resolveMode(query:Record<string,string|string[]|undefined>):Promise<WorkspaceMode>{if(query.mode==='demo'||query.mode==='local')return query.mode;if(!configured())redirect('/sign-in');const db=await serverClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/sign-in');return 'account';}
