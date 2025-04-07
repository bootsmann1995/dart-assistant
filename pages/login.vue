<template>
    <div>
        <form @submit.prevent="login">
            <input type="email" v-model="email" />
            <input type="password" v-model="password" />
            <button type="submit">Login</button>
        </form>
    </div> 
</template>
<script lang="ts" setup>
    const email = ref('');
    const password = ref('');
    const {loginAsync} = useAuth();

    const login = async (ev: Event) => {
        
        await loginAsync({email: email.value, password: password.value});
        // navigateTo('/');
    }
</script> 