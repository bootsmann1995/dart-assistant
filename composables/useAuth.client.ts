import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js"
export const useAuth = () => {

    const supabase = ref<SupabaseClient | null>(null)

    const getClient = () => {
        if(!supabase.value) {
            supabase.value = createClient("https://phnpigjcatwyigtsjaji.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobnBpZ2pjYXR3eWlndHNqYWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMTU3MDksImV4cCI6MjA1OTU5MTcwOX0.FfmhwRU2ekumf2w_zrBwcVUqL3jsCO61c0ScLhZsoKc")
        }
        return supabase.value;
    }

    const loginAsync =async ({email, password}: {email: string, password: string}) => {
        const { data, error } = await getClient().auth.signInWithPassword({
            email,
            password,
        })
        if(data) {
            return navigateTo("/assistant/dashboard")
        }
        if(error) {
            throw error
        }
    }

    const getUserAsync = async () => {
        const { data, error } = await getClient().auth.getUser()
        if(data) {
            return data
        }
        if(error) {
            throw error
        }
    }

    const isAuthenticatedAsync = async () => {
        const isLoggedIn = await getClient().auth.getSession()
        if(isLoggedIn.data) {
            return true;
        }
        return false;
    }

    return {
        getUserAsync,
        loginAsync,
        isAuthenticatedAsync,
        getClient,
    }
}