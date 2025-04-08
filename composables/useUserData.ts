import type { SupabaseClient } from '@supabase/supabase-js';

interface UserMetaData {
    user_id: string;
    email: string;
    nick_name?: string;
    full_name?: string;
    avatar?: string;
}

interface EnhancedUserData extends UserMetaData {
    avatar: string;
    display_name: string;
}

export const useUserData = () => {
    const { getClient } = useAuth();

    const enhanceUserData = (userData: UserMetaData): EnhancedUserData => ({
        ...userData,
        avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.email)}&background=random`,
        display_name: userData.nick_name || userData.email
    });

    const getUserDataAsync = async (userId: string): Promise<EnhancedUserData | null> => {
        if (!userId) return null;

        const { data, error } = await getClient()
            .from('user_meta_data')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) return null;

        return enhanceUserData(data as UserMetaData);
    };

    const getUsersDataAsync = async (userIds: string[]): Promise<Map<string, EnhancedUserData>> => {
        if (!userIds.length) return new Map();

        const { data, error } = await getClient()
            .from('user_meta_data')
            .select('*')
            .in('user_id', userIds);

        if (error || !data) return new Map();

        return new Map(
            data.map((user: UserMetaData) => [user.user_id, enhanceUserData(user)])
        );
    };

    return {
        getUserDataAsync,
        getUsersDataAsync
    };
};
