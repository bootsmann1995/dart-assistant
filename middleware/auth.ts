export default defineNuxtRouteMiddleware(async (to, from) => {
    if(import.meta.client){
        const {isAuthenticatedAsync} = useAuth();
    if(await isAuthenticatedAsync()) {
        console.log("is authenticated");  
        return;
    } else {
        navigateTo('/login');
    }
    }
})
