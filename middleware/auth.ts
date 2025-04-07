export default defineNuxtRouteMiddleware(async (to, from) => {
	console.log("1");
	if (import.meta.client) {
		console.log("2");

		const { isAuthenticatedAsync } = useAuth();
		if (await isAuthenticatedAsync()) {
			console.log("is authenticated");
			return;
		} else {
			return navigateTo("/login");
		}
	}
});
