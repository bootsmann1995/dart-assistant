<template>
    <div class="container mx-auto p-4">
        <div class="max-w-2xl mx-auto">
            <h1 class="text-2xl font-bold mb-6">Profile Settings</h1>

            <!-- Profile Form -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-start gap-6 mb-6">
                    <!-- Avatar Preview -->
                    <div class="flex-shrink-0">
                        <div v-if="metadata.avatar" class="relative w-24 h-24">
                            <img 
                                :src="metadata.avatar" 
                                :alt="metadata.name || metadata.email"
                                class="w-24 h-24 rounded-full object-cover"
                                @error="handleAvatarError"
                            />
                            <button 
                                @click="metadata.avatar = ''"
                                class="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div v-else class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </div>

                    <!-- Form Fields -->
                    <div class="flex-grow space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input 
                                type="text" 
                                v-model="metadata.email" 
                                disabled
                                class="w-full p-2 border rounded-lg bg-gray-50"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input 
                                type="text" 
                                v-model="metadata.full_name" 
                                placeholder="Your full name"
                                class="w-full p-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                            <input 
                                type="text" 
                                v-model="metadata.nick_name" 
                                placeholder="Your preferred nickname"
                                class="w-full p-2 border rounded-lg"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                            <input 
                                type="text" 
                                v-model="metadata.avatar" 
                                placeholder="https://example.com/avatar.jpg"
                                class="w-full p-2 border rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                <!-- Save Button -->
                <div class="flex justify-end">
                    <button 
                        @click="saveMetadata"
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        :disabled="isSaving"
                    >
                        {{ isSaving ? 'Saving...' : 'Save Changes' }}
                    </button>
                </div>

                <!-- Save Status -->
                <div v-if="saveStatus" :class="[
                    'mt-4 p-3 rounded-lg text-sm',
                    saveStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                ]">
                    {{ saveStatus.message }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface SaveStatus {
    type: 'success' | 'error';
    message: string;
}

const { getUserAsync, updateUserMetadataAsync } = useAuth();
const metadata = ref({
    email: '',
    full_name: '',
    nick_name: '',
    avatar: ''
});
const isSaving = ref(false);
const saveStatus = ref<SaveStatus | null>(null);

onMounted(async () => {
    const data = await getUserAsync() || {};
    if (data?.metadata) {
        metadata.value = data.metadata;
    }
});

const handleAvatarError = () => {
    // If avatar image fails to load, clear it
    metadata.value.avatar = '';
};

const saveMetadata = async () => {
    try {
        isSaving.value = true;
        console.log(metadata.value);
        const { error } = await updateUserMetadataAsync(metadata.value);
        
        if (error) throw error;
        
        saveStatus.value = {
            type: 'success',
            message: 'Profile updated successfully!'
        };
    } catch (error) {
        saveStatus.value = {
            type: 'error',
            message: 'Failed to update profile. Please try again.'
        };
    } finally {
        isSaving.value = false;
        
        // Clear status after 3 seconds
        setTimeout(() => {
            saveStatus.value = null;
        }, 3000);
    }
};
</script>
