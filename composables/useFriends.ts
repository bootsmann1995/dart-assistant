import { useAuth } from './useAuth.client';

interface Friend {
    id: string;
    name?: string;
    email: string;
}

interface Friendship {
    id: string;
    user_id: string;
    friend: Friend;
    created_at: string;
}

interface FriendRequest {
    id?: string;
    type: 'friendship';
    sender: string;
    receiver: string;
    status: 'pending';
    created_at?: string;
}

export const useFriends = () => {
    const { getClient } = useAuth();

    const getFriendsAsync = async (userId: string) => {
        return await getClient()
            .from('friendships')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
    };

    const sendFriendRequestAsync = async (sender: string, receiverEmail: string) => {
        const request: FriendRequest = {
            type: 'friendship',
            sender: sender,
            receiver: receiverEmail,
            status: 'pending'
        };

        return await getClient()
            .from('requests')
            .insert(request);
    };

    return {
        getFriendsAsync,
        sendFriendRequestAsync
    };
};
