import {serve} from 'inngest/next';
import {inngest,syncProvider,scheduleSync} from '@/lib/inngest';
const handlers=serve({client:inngest,functions:[syncProvider,scheduleSync]});
// Inngest enforces signing in production. Fail closed when secrets are absent.
export async function GET(request:Parameters<typeof handlers.GET>[0],context:unknown){if(!process.env.INNGEST_SIGNING_KEY)return Response.json({error:'Background workflows are not configured.'},{status:503});return handlers.GET(request,context);}
export async function POST(request:Parameters<typeof handlers.POST>[0],context:unknown){if(!process.env.INNGEST_SIGNING_KEY)return Response.json({error:'Background workflows are not configured.'},{status:503});return handlers.POST(request,context);}
export async function PUT(request:Parameters<typeof handlers.PUT>[0],context:unknown){if(!process.env.INNGEST_SIGNING_KEY)return Response.json({error:'Background workflows are not configured.'},{status:503});return handlers.PUT(request,context);}
