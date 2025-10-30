
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Script from 'next/script';
import { cookies } from 'next/headers';
import { ThemeProvider } from 'next-themes';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { DataStreamProvider } from '@/components/ui/data-stream-provider';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const  cookieStore = await  cookies()
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

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
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
   </ThemeProvider>
  );
}
