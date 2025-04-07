<template>
    <div class="container mx-auto p-4">
        <div class="space-y-4">
            <h1 class="text-3xl font-bold">Dart Assistant</h1>
            <div class="space-y-2">
                <NuxtLink 
                    to="/games/x01" 
                    class="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                >
                    Play X01 Game
                </NuxtLink>
                <NuxtLink 
                    to="/login" 
                    class="block px-4 py-2 border rounded hover:bg-gray-100 text-center"
                >
                    Login
                </NuxtLink>
            </div>
        </div>
    </div>
</template>
    
<script lang="ts" setup>
definePageMeta({
    middleware: ['auth']
})
</script>