import {WorkspaceProvider} from '@/components/atlas/workspace';
import {Onboarding} from '@/components/atlas/onboarding';
import {resolveMode} from '@/lib/workspace-route';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const mode=await resolveMode(await searchParams);return <WorkspaceProvider mode={mode}><Onboarding/></WorkspaceProvider>;}
