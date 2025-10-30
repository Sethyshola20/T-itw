import { SignInFormType, signinSchema } from "@/types";
import { authClient } from "./auth-client";
import { toast } from "sonner"

export async function SignIn(authData: SignInFormType){
    signinSchema.parse(authData)
    await authClient.signIn.email({
        email: authData.email,
        password: authData.password,
        rememberMe: true,
        callbackURL: "http://localhost:3000/chat"
    }, {
        onRequest: (ctx) => {
            //show loading
        },
        onSuccess: (ctx) => {
            //redirect to the dashboard or sign in page
            
        },
        onError: (ctx) => {
            // display the error message
            toast.error(ctx.error.message);
        },
    });
}