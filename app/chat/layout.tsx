import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { DataStreamProvider } from '@/components/ui/data-stream-provider';
import { SidebarToggle } from '@/components/ui/sidebar-toggle';
import { Toaster } from '@/components/ui/sonner';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={true}>
         <AppSidebar /> 
          <SidebarInset className='min-w-0 w-0 bg-sidebar'>
            {children}  
            <Toaster/>
          </SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
   </ThemeProvider>
  );
}
