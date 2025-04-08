
interface UserMetaData {
    email: string;
    full_name?: string;
    nick_name?: string;
    avatar?: string;
}

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
    sending_to: string;
    status: 'pending';
    created_at?: string;
}

interface ExtendedFriend extends Friend {
    nick_name?: string;
    display_name: string;
    avatar: string;
}

interface ExtendedFriendship extends Friendship {
    friend: ExtendedFriend;
}

export const useFriends = () => {
    const { getClient } = useAuth();

    const getFriendsAsync = async (userId: string) => {
        const { data: friendships, error: friendshipsError } = await getClient()
            .from('friendships')
            .select('*')
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (friendshipsError) return { data: null, error: friendshipsError };
        if (!friendships || friendships.length === 0) return { data: [], error: null };

        // Get all user IDs (both user_id and friend_id)
        const userIds = [...new Set(friendships.flatMap(f => [f.user_id, f.friend_id]))];

        // Fetch all user data
        const { data: userData, error: userError } = await getClient()
            .from('user_meta_data')
            .select('*')
            .in('user_id', userIds);

        if (userError) return { data: null, error: userError };

        // Create a map for quick user lookup
        const userMap = new Map(userData.map(user => [user.user_id, user]));

        // Transform the friendships data
        const transformedData = friendships.map(friendship => {
            const isCurrentUserInitiator = friendship.user_id === userId;
            const friendId = isCurrentUserInitiator ? friendship.friend_id : friendship.user_id;
            const friendInfo = userMap.get(friendId);

            if (!friendInfo) return null;

            const result: ExtendedFriendship = {
                id: friendship.id,
                user_id: userId,
                created_at: friendship.created_at,
                friend: {
                    id: friendId,
                    email: friendInfo.email,
                    name: friendInfo.full_name,
                    nick_name: friendInfo.nick_name,
                    display_name: friendInfo.nick_name || friendInfo.email,
                    avatar: friendInfo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friendInfo.email)}&background=random`
                }
            };

            return result;
        }).filter((f): f is ExtendedFriendship => f !== null);

        return { data: transformedData, error: null };
    };

    const checkUserExistsAsync = async (email: string) => {
        return await getClient()
            .from('user_meta_data')
            .select('email')
            .eq('email', email)
            .single();
    };

    const checkExistingRequestAsync = async (sender: string, receiver: string) => {
        const client = getClient();
        // Check if there's a request from sender to receiver
        const { data: request1 } = await client
            .from('requests')
            .select('*')
            .eq('type', 'friendship')
            .eq('status', 'pending')
            .eq('sender', sender)
            .eq('sending_to', receiver)
            .maybeSingle();

        // Check if there's a request from receiver to sender
        const { data: request2 } = await client
            .from('requests')
            .select('*')
            .eq('type', 'friendship')
            .eq('status', 'pending')
            .eq('sender', receiver)
            .eq('sending_to', sender)
            .maybeSingle();

        return {
            data: request1 || request2,
            error: null
        };
    };

    const sendFriendRequestAsync = async (sender: string, receiverEmail: string) => {
        // First check if user exists
        const { data: user, error: userError } = await checkUserExistsAsync(receiverEmail);
        if (userError || !user) {
            return { error: { message: 'User does not exist' } };
        }

        // Check if there's already a pending request between these users
        const { data: existingRequest } = await checkExistingRequestAsync(sender, receiverEmail);
        if (existingRequest) {
            return { error: { message: 'A friend request already exists between you and this user' } };
        }

        const request: FriendRequest = {
            type: 'friendship',
            sender: sender,
            sending_to: receiverEmail,
            status: 'pending'
        };

        return await getClient()
            .from('requests')
            .insert(request);
    };

    const getFriendRequestsAsync = async (userEmail: string) => {
        // First get all pending friend requests
        const { data: requests, error: requestError } = await getClient()
            .from('requests')
            .select('*')
            .eq('type', 'friendship')
            .eq('status', 'pending')
            .eq('sending_to', userEmail);

        if (requestError) return { data: null, error: requestError };
        if (!requests || requests.length === 0) return { data: [], error: null };

        // Get all unique sender emails
        const senderEmails = [...new Set(requests.map(r => r.sender))];

        // Fetch user data for all senders
        const { data: senderData, error: senderError } = await getClient()
            .from('user_meta_data')
            .select('email, full_name, nick_name, avatar')
            .in('email', senderEmails);

        if (senderError) return { data: null, error: senderError };

        // Create a map of email to user data for quick lookup
        const senderMap = new Map(
            (senderData || []).map((user: UserMetaData) => [user.email, user])
        );

        // Transform the requests data to include sender info
        const transformedData = requests.map(request => {
            const senderInfo: UserMetaData = senderMap.get(request.sender) || { email: request.sender };
            return {
                ...request,
                sender_info: {
                    email: senderInfo.email,
                    full_name: senderInfo.full_name || null,
                    nick_name: senderInfo.nick_name || null,
                    display_name: senderInfo.nick_name || senderInfo.email,
                    avatar: senderInfo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderInfo.email)}&background=random`
                }
            };
        });

        return { data: transformedData, error: null };
    };

    const acceptFriendRequestAsync = async (requestId: string, currentUserEmail: string) => {
        const client = getClient();

        // 1. Get the request details
        const { data: request, error: requestError } = await client
            .from('requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (requestError || !request) {
            return { error: { message: 'Friend request not found' } };
        }

        // 2. Get both users' data from user_meta_data
        const { data: users, error: usersError } = await client
            .from('user_meta_data')
            .select('*')
            .in('email', [request.sender, currentUserEmail]);

        if (usersError || !users || users.length !== 2) {
            return { error: { message: 'Could not find user data' } };
        }

        const sender = users.find(u => u.email === request.sender);
        const receiver = users.find(u => u.email === currentUserEmail);

        if (!sender?.user_id || !receiver?.user_id) {
            return { error: { message: 'User IDs not found' } };
        }

         // 4. Create the friendship
         const { error: friendshipError } = await client
         .from('friendships')
         .insert({
             user_id: sender.user_id,
             friend_id: receiver.user_id
         });

         if (friendshipError) {
            // If creating friendship fails, try to revert request status
            await client
                .from('requests')
                .update({ status: 'pending' })
                .eq('id', requestId);
            return { error: { message: 'Failed to create friendship' } };
        }

        // 3. Update request status to handled
        const { error: updateError } = await client
            .from('requests')
            .update({ status: 'handled' })
            .eq('id', requestId);

        if (updateError) {
            return { error: { message: 'Failed to update request status' } };
        }

        return { data: true, error: null };
    };

    return {
        getFriendsAsync,
        sendFriendRequestAsync,
        checkUserExistsAsync,
        getFriendRequestsAsync,
        acceptFriendRequestAsync
    };
};
