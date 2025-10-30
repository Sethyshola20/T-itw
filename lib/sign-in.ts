import { SignInFormType, signinSchema } from "@/types";
import { authClient } from "./auth-client";
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export async function SignIn(authData: SignInFormType){
    const router = useRouter()
    signinSchema.parse(authData)
    await authClient.signIn.email({
        email: authData.email,
        password: authData.password,
        rememberMe: true,
        callbackURL: "http://localhost:3000/chat"
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