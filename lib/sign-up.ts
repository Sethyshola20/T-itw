import {  SignupFormType, signupSchema } from "@/types";
import { authClient } from "./auth-client"; 
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export async function SignUp(authData: SignupFormType){
    const router = useRouter()
    signupSchema.parse(authData)
    await authClient.signUp.email({
        name:authData.name,
        email: authData.email,
        password: authData.password,
        callbackURL: "/chat" // A URL to redirect to after the user verifies their email (optional)
        }, {
            onRequest: (ctx) => {
                //show loading
                toast.loading("Connection...")
            },
            onSuccess: (ctx) => {
                //redirect to the dashboard or sign in page
                router.push("/chat")
            },
            onError: (ctx) => {
                // display the error message
                toast.error(ctx.error.message);
            },
    });
}
