<template>
    <div class="container mx-auto p-4">
        <div class="mb-6 flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-bold mb-2">Friends</h1>
                <p class="text-gray-600">Manage your dart friends and see their statistics</p>
            </div>
            <button 
                @click="showAddFriendModal = true"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Friend
            </button>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
            {{ successMessage }}
        </div>

        <!-- Friend Requests -->
        <div v-if="friendRequests.length > 0" class="mb-6">
            <h2 class="text-lg font-bold mb-3">Friend Requests</h2>
            <div class="space-y-3">
                <div 
                    v-for="request in friendRequests" 
                    :key="request.id"
                    class="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                >
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <img 
                                :src="request.sender_info.avatar"
                                :alt="`${request.sender_info.display_name}'s avatar`"
                                class="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <h3 class="font-medium">
                                    {{ request.sender_info.display_name }}
                                </h3>
                                <p class="text-sm text-gray-600">
                                    Sent {{ new Date(request.created_at).toLocaleDateString() }}
                                </p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button 
                                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                @click="acceptRequest(request.id)"
                            >
                                Accept
                            </button>
                            <button 
                                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                @click="declineRequest(request.id)"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Friends List -->
        <div v-if="friends.length > 0" class="space-y-4">
            <div v-for="friend in friends" :key="friend.id" 
                class="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
                <div class="flex items-center gap-4">
                    <img 
                        :src="friend.friend.avatar"
                        :alt="`${friend.friend.display_name}'s avatar`"
                        class="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                        <h3 class="font-medium text-lg">
                            {{ friend.friend.nick_name || friend.friend.email }}
                        </h3>
                        <p v-if="friend.friend.name" class="text-sm text-gray-600">
                            {{ friend.friend.name }}
                        </p>
                        <p v-if="!friend.friend.nick_name" class="text-xs text-gray-500">
                            {{ friend.friend.email }}
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                            Added {{ new Date(friend.created_at).toLocaleDateString() }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
            No friends added yet. Use the "Add Friend" button to send friend requests.
        </div>

        <!-- Add Friend Modal -->
        <div v-if="showAddFriendModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 class="text-xl font-bold mb-4">Add Friend</h2>
                
                <!-- Error Message -->
                <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {{ errorMessage }}
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="friendEmail">
                        Friend's Email
                    </label>
                    <input 
                        id="friendEmail"
                        v-model="friendEmail"
                        type="email"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter email address"
                        @keyup.enter="friendEmail && sendFriendRequest()"
                    />
                </div>
                <div class="flex justify-end gap-2">
                    <button 
                        @click="showAddFriendModal = false"
                        class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button 
                        @click="sendFriendRequest"
                        :disabled="!friendEmail"
                        :class="[
                            'px-4 py-2 rounded-lg',
                            friendEmail 
                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        ]"
                    >
                        Send Request
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth.client';
import { useFriends } from '~/composables/useFriends';

interface Friend {
    id: string;
    name?: string;
    email: string;
    avatar: string;
    nick_name?: string;
    display_name: string;
}

interface Friendship {
    id: string;
    user_id: string;
    friend: Friend;
    created_at: string;
}

interface FriendRequest {
    id: string;
    sender: string;
    sending_to: string;
    created_at: string;
    sender_info: {
        email: string;
        full_name?: string;
        nick_name?: string;
        display_name: string;
        avatar: string;
    };
}

const auth = useAuth();
const { getFriendsAsync, sendFriendRequestAsync, getFriendRequestsAsync, acceptFriendRequestAsync } = useFriends();
const friends = ref<Friendship[]>([]);
const friendRequests = ref<FriendRequest[]>([]);
const showAddFriendModal = ref(false);
const friendEmail = ref('');
const errorMessage = ref('');
const successMessage = ref('');

onMounted(async () => {
    const { user } = await auth.getUserAsync() || {};
    if (user?.email) {
        const [friendsResult, requestsResult] = await Promise.all([
            getFriendsAsync(user.id),
            getFriendRequestsAsync(user.email)
        ]);

        if (friendsResult.data && !friendsResult.error) {
            friends.value = friendsResult.data;
        }
        if (requestsResult.data && !requestsResult.error) {
            friendRequests.value = requestsResult.data;
        }
    }
});

async function sendFriendRequest() {
    errorMessage.value = '';
    successMessage.value = '';
    const { user } = await auth.getUserAsync() || {};
    
    if (!user?.email) {
        errorMessage.value = 'You must be logged in to send friend requests';
        return;
    }

    if (!friendEmail.value) {
        errorMessage.value = 'Please enter a friend\'s email address';
        return;
    }

    if (friendEmail.value === user.email) {
        errorMessage.value = 'You cannot send a friend request to yourself';
        return;
    }

    const { error } = await sendFriendRequestAsync(user.email, friendEmail.value);
    if (error) {
        errorMessage.value = error.message || 'Failed to send friend request';
        return;
    }

    successMessage.value = 'Friend request sent successfully!';
    showAddFriendModal.value = false;
    friendEmail.value = '';
    setTimeout(() => {
        successMessage.value = '';
    }, 5000);
}

async function acceptRequest(requestId: string) {
    const { user } = await auth.getUserAsync() || {};
    if (!user?.email) {
        errorMessage.value = 'You must be logged in to accept friend requests';
        return;
    }

    const { error } = await acceptFriendRequestAsync(requestId, user.email);
    if (error) {
        errorMessage.value = error.message || 'Failed to accept friend request';
        return;
    }

    // Remove the request from the list
    friendRequests.value = friendRequests.value.filter(r => r.id !== requestId);
    
    // Refresh friends list
    const { data } = await getFriendsAsync(user.id);
    if (data) {
        friends.value = data;
    }

    successMessage.value = 'Friend request accepted!';
    setTimeout(() => {
        successMessage.value = '';
    }, 5000);
}

async function declineRequest(requestId: string) {
    // TODO: Implement decline request logic
    console.log('Decline request:', requestId);
}
</script>