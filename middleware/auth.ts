export default defineNuxtRouteMiddleware(async (to, from) => {
	const { isAuthenticatedAsync } = useAuth();
	if (import.meta.client) {
		if (await isAuthenticatedAsync()) {
			return;
		} else {
			return await navigateTo({force: true, path: "/login"});
		}
	}
});
