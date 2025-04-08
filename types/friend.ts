export interface Friend {
    user_id: string;
    nick_name?: string;
    full_name?: string;
    email: string;
    avatar?: string;
}

export interface ExtendedFriendship extends Friend {
    id: string;
    status: 'pending' | 'accepted' | 'declined';
    created_at: string;
}
