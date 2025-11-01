"use client"

import { ConnectionDialog } from "@/components/ConnectionDialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from '@/lib/auth-client';
import { Loader } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: session, isPending, error  } = authClient.useSession()

  if(isPending){
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-8">Welcome to My Landing Page</h1>
        <Loader/>
        <Toaster />
      </main>
  );
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to My Landing Page</h1>
      {error || !session ? <ConnectionDialog /> : <Button asChild variant="outline"><Link href={"/chat"}>chat</Link></Button>}
      <Toaster />
    </main>
  );
}
