import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:{default:'AI Atlas — Your entire AI universe. Mapped.',template:'%s · AI Atlas'},description:'A little clarity for a whole lot of intelligence. Understand your AI tools, activity, and working patterns in one personal atlas.',icons:{icon:'/favicon.svg'},openGraph:{title:'AI Atlas',description:'Your entire AI universe. One place.'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;}
