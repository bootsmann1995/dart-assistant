<template>
	<div class="min-h-screen bg-gray-50 flex flex-col justify-center">
		<div class="sm:mx-auto sm:w-full sm:max-w-md">
			<h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Dart Assistant</h2>
			<p class="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
		</div>

		<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
			<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
				<form @submit.prevent="handleSubmit" class="space-y-6">
					<!-- Email -->
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
						<div class="mt-1">
							<input
								id="email"
								v-model="email"
								type="email"
								required
								:class="[
									'appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
									emailError ? 'border-red-300' : 'border-gray-300',
								]"
								@input="clearErrors"
							/>
							<p v-if="emailError" class="mt-2 text-sm text-red-600">{{ emailError }}</p>
						</div>
					</div>

					<!-- Password -->
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
						<div class="mt-1">
							<input
								id="password"
								v-model="password"
								type="password"
								required
								:class="[
									'appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
									passwordError ? 'border-red-300' : 'border-gray-300',
								]"
								@input="clearErrors"
							/>
							<p v-if="passwordError" class="mt-2 text-sm text-red-600">{{ passwordError }}</p>
						</div>
					</div>

					<!-- Submit Button -->
					<div>
						<button
							type="submit"
							:disabled="isLoading"
							class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<svg
								v-if="isLoading"
								class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							{{ isLoading ? "Signing in..." : "Sign in" }}
						</button>
					</div>

					<!-- General Error -->
					<div v-if="generalError" class="rounded-md bg-red-50 p-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg
									class="h-5 w-5 text-red-400"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div class="ml-3">
								<p class="text-sm font-medium text-red-800">{{ generalError }}</p>
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
const email = ref("");
const password = ref("");
const isLoading = ref(false);
const emailError = ref("");
const passwordError = ref("");
const generalError = ref("");


const { loginAsync } = useAuth();
const router = useRouter();

const validateEmail = (email: string) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

const clearErrors = () => {
	emailError.value = "";
	passwordError.value = "";
	generalError.value = "";
};

const handleSubmit = async () => {
	clearErrors();

	// Validate email
	if (!email.value) {
		emailError.value = "Email is required";
		return;
	}
	if (!validateEmail(email.value)) {
		emailError.value = "Please enter a valid email address";
		return;
	}

	// Validate password
	if (!password.value) {
		passwordError.value = "Password is required";
		return;
	}
	if (password.value.length < 6) {
		passwordError.value = "Password must be at least 6 characters";
		return;
	}

	try {
		isLoading.value = true;
		await loginAsync({ email: email.value, password: password.value });
		// Successful login
		navigateTo("/assistant/dashboard");
	} catch (error: any) {
		generalError.value = error?.message || "Failed to sign in. Please check your credentials.";
	} finally {
		isLoading.value = false;
	}
};
</script>
