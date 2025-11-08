import { SignInFormType, signinSchema } from "@/types";
import { authClient } from "./auth-client";
import { toast } from "sonner";
import { useKey } from "@/store";

export function useSignIn() {
  const signIn = async (authData: SignInFormType) => {
    signinSchema.parse(authData);

    let loadingToastId: string | number;

    await authClient.signIn.email(
      {
        email: authData.email,
        password: authData.password,
        callbackURL: "http://localhost:3000/chat",
      },
      {
        onRequest: (ctx) => {
          loadingToastId = toast.loading("Connection...");
        },
        onSuccess: async (ctx) => {
          loadingToastId && toast.dismiss(loadingToastId);
          const res = await createApiKey(); // then redirects
        },
        onError: (ctx) => {
          toast.dismiss(loadingToastId);
          toast.error(ctx.error.message);
        },
      },
    );
  };
  return signIn;
}

export async function SignOut() {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        const store = useKey.getState();
        store.setApiKey("");

        window.location.href = "/";
      },
      onError: (ctx) => {
        toast.error(ctx.error.message);
      },
    },
  });
}

export async function createApiKey() {
  try {
    const response = await fetch("/api/create-api-key", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      const data = (await response.json()) as { keyId: string; key: string };
      const store = useKey.getState();
      store.setApiKey(data.key);

      window.location.href = "/chat";
    } else {
      toast.error("Failed to setup user session");
    }
  } catch (error) {
    toast.error("Failed to complete sign in");
  }
}
