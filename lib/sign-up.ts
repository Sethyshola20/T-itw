import { SignupFormType, signupSchema } from "@/types";
import { authClient } from "./auth-client";
import { toast } from "sonner";
import { createApiKey } from "./sign-in";

export function useSignUp() {
  const signUp = async (authData: SignupFormType) => {
    signupSchema.parse(authData);

    let loadingToastId: string | number;

    console.log({authData})
    await authClient.signUp.email(
      {
        name: authData.name,
        email: authData.email,
        password: authData.password,
      },
      {
        onRequest: () => {
          console.log('loading')
          loadingToastId = toast.loading("Connection...");
        },
        onSuccess: async () => {
          loadingToastId && toast.dismiss(loadingToastId);
          await createApiKey();
        },
        onError: (ctx) => {
          console.log('error auth: ', ctx)
          toast.dismiss(loadingToastId);
          toast.error(ctx.error.message);
        },
      },
    );
  };

  return signUp;
}
