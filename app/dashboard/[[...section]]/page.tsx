import {WorkspaceProvider} from '@/components/atlas/workspace';
import {DashboardShell} from '@/components/atlas/dashboard-shell';
import {resolveMode} from '@/lib/workspace-route';
import {notFound} from 'next/navigation';
export default async function Page({params,searchParams}:{params:Promise<{section?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const [p,q]=await Promise.all([params,searchParams]);const section=p.section?.join('/')||'overview';if(!['overview','applications','activity','insights','settings'].includes(section))notFound();const mode=await resolveMode(q);return <WorkspaceProvider mode={mode}><DashboardShell section={section} initialSearch={typeof q.q==='string'?q.q:''}/></WorkspaceProvider>;}
