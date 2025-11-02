import Link from 'next/link'
import { NotFoundComponent } from './NotFound'
 
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 px-4">
      <NotFoundComponent/>
       <footer className="absolute bottom-6 text-sm text-slate-500 dark:text-slate-400">
        © {new Date().getFullYear()} BuildingAI — Empowering Smarter Engineering
      </footer>
    </main>
  )
}