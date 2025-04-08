import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js"
let supabase: SupabaseClient | null = null;

interface UserMetadata {
    email: string;
    nick_name?: string;
    full_name?: string;
    avatar?: string;
    user_id: string;
}

export const useAuth = () => {

    const config = useRuntimeConfig();
    const user = ref();
    const getClient = () => {
        if(!supabase) {
            supabase = createClient(config.public.supabaseUrl, config.public.supabaseKey)
        }
        return supabase;
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
        let metadata: UserMetadata | null = null;
        if(data.user && data.user.email) {
            const { data: metadataData, error: metadataError } = await getUserMetadataAsync(data.user.email)
            if(!metadataError && metadataData) {
                metadata = metadataData
            } else if(data.user.email) {
                await updateUserMetadataAsync({user_id: data.user.id, email: data.user?.email!})
                metadata = {user_id: data.user.id, email: data.user?.email!}
            }
        }
        if(data && data.user) {
            user.value = {...data, metadata: metadata};
            console.log("USER", user.value);
            return {...data, metadata}
        }
        
        
        if(error) {
            throw error
        }
    }

    const isAuthenticatedAsync = async () => {
        const isLoggedIn = await getClient().auth.getSession()
        if(isLoggedIn.data && isLoggedIn.data.session && isLoggedIn.data.session != null) {
            return true;
        }
        return false;
    }

    const getUserMetadataAsync = async (email: string) => {
        const { data, error } = await getClient()
            .from('user_meta_data')
            .select('*')
            .eq('email', email)
            .single();
        
        return { data, error };
    };

    const updateUserMetadataAsync = async (metadata: UserMetadata) => {
        const { data: existing } = await getUserMetadataAsync(metadata.email);
        
        if (existing) {
            return await getClient()
                .from('user_meta_data')
                .update(metadata)
                .eq('email', metadata.email);
        } else {
            return await getClient()
                .from('user_meta_data')
                .insert(metadata);
        }
    };

    return {
        getUserAsync,
        loginAsync,
        isAuthenticatedAsync,
        getClient,
        getUserMetadataAsync,
        updateUserMetadataAsync,
    }
}