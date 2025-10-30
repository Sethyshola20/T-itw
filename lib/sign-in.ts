import { SignInFormType, signinSchema } from "@/types";
import { authClient } from "./auth-client";
import { toast } from "sonner"


export async function SignIn(authData: SignInFormType){
    signinSchema.parse(authData)
    await authClient.signIn.email({
        email: authData.email,
        password: authData.password,
        callbackURL: "http://localhost:3000/chat"
    }, {
        onRequest: (ctx) => {
            //show loading
            toast.loading("Connection...")
        },
        onSuccess: (ctx) => {
            //redirect to the dashboard or sign in page
            window.location.href = ("/chat")
        },
        onError: (ctx) => {
            // display the error message
            toast.error(ctx.error.message);
        },
    });
}

export async function SignOut(){
    await authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                window.location.href = ("/"); 
            },
            onError: ctx => {
                toast.error(ctx.error.message);
            }
        },
    });
}