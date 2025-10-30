import {  SignupFormType, signupSchema } from "@/types";
import { authClient } from "./auth-client"; //import the auth client
import { toast } from "sonner"

export async function SignUp(authData: SignupFormType){
    
    signupSchema.parse(authData)
    await authClient.signUp.email({
        name:authData.name,
        email: authData.email,
        password: authData.password,
        callbackURL: "/chat" // A URL to redirect to after the user verifies their email (optional)
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
