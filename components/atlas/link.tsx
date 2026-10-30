import type {ComponentProps} from 'react';
/** Full-document navigation keeps auth/mode boundaries server-verified and works across both runtimes. */
export default function Link(props:ComponentProps<'a'>){return <a {...props}/>;}
