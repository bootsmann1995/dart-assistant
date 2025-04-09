<template>
	<div class="container mx-auto p-4 md:p-6">
		<div class="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
			<h1 class="text-2xl md:text-3xl font-bold">Welcome, {{ userName || "Player" }}!</h1>
		</div>

		<div v-if="!isAuthenticated" class="text-center py-8">
			<p class="text-gray-600">Please log in to view your statistics.</p>
		</div>

		<div v-else-if="isLoading" class="text-center py-8">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<p class="mt-4 text-gray-600">Loading your statistics...</p>
		</div>
		<div v-if="gameInvites.length > 0" class="bg-white rounded-lg shadow p-4 md:p-6">
			<h2 class="text-lg md:text-xl font-semibold mb-4">Game Invites</h2>
			<div class="space-y-3">
				<div
					v-for="invite in gameInvites"
					:key="invite.id"
					class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
				>
					<div>
						<div class="font-medium">{{ invite.sender.nick_name ?? invite.sender.email }}</div>
						<div class="text-sm text-gray-600">wants to play X01</div>
					</div>
					<div class="flex gap-2">
						<button
							@click="handleInvite(invite.id, 'accepted')"
							class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
						>
							Accept
						</button>
						<button
							@click="handleInvite(invite.id, 'declined')"
							class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
						>
							Decline
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div v-if="!isLoading" class="flex flex-col sm:flex-row gap-4 mb-6">
			<NuxtLink
				to="/games/"
				class="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 shadow-sm"
			>
				New Game
			</NuxtLink>
			<NuxtLink
				to="/assistant/history"
				class="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 shadow-sm"
			>
				Game History
			</NuxtLink>
			<NuxtLink
				to="/assistant/friends"
				class="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 shadow-sm"
			>
				Friends
			</NuxtLink>
			<NuxtLink
				to="/assistant/profile"
				class="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 shadow-sm"
			>
				Profile Settings
			</NuxtLink>
		</div>

		<!-- Stats Section -->
		<div v-if="stats && !isLoading" class="grid grid-cols-1 gap-4 md:gap-6">
			<!-- Game Invites Section -->

			<!-- Overall Stats Card -->
			<div class="bg-white rounded-lg shadow p-4 md:p-6">
				<h2 class="text-lg md:text-xl font-semibold mb-4">Overall Performance</h2>
				<div class="grid grid-cols-2 gap-4">
					<div class="p-3 bg-gray-50 rounded-lg">
						<div class="text-gray-600 text-sm mb-1">Average</div>
						<div class="text-2xl font-bold">{{ stats.totalAverage.toFixed(2) }}</div>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<div class="text-gray-600 text-sm mb-1">Checkout</div>
						<div class="text-2xl font-bold">{{ stats.checkoutRate.toFixed(1) }}%</div>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<div class="text-gray-600 text-sm mb-1">Games</div>
						<div class="text-2xl font-bold">{{ stats.totalGames }}</div>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<div class="text-gray-600 text-sm mb-1">Win Rate</div>
						<div class="text-2xl font-bold">
							{{ ((stats.gamesWon / stats.totalGames) * 100).toFixed(1) }}%
						</div>
					</div>
				</div>
			</div>

			<!-- Scoring Stats Card -->
			<div class="bg-white rounded-lg shadow p-4 md:p-6">
				<h2 class="text-lg md:text-xl font-semibold mb-4">Scoring Statistics</h2>
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
					<div class="p-3 bg-gray-50 rounded-lg">
						<div class="text-gray-600 text-sm mb-1">180s</div>
						<div class="text-2xl font-bold">{{ stats.scores180 }}</div>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<div class="text-gray-600 text-sm mb-1">140+</div>
						<div class="text-2xl font-bold">{{ stats.scores140Plus }}</div>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg">
						<div class="text-gray-600 text-sm mb-1">100+</div>
						<div class="text-2xl font-bold">{{ stats.scores100Plus }}</div>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg col-span-2 sm:col-span-1">
						<div class="text-gray-600 text-sm mb-1">Best Leg Average</div>
						<div class="text-2xl font-bold">{{ stats.bestLegAverage.toFixed(2) }}</div>
						<div class="text-gray-500 text-sm">{{ stats.bestLegDarts }} darts</div>
					</div>
					<div class="p-3 bg-gray-50 rounded-lg col-span-2 sm:col-span-1">
						<div class="text-gray-600 text-sm mb-1">First 9</div>
						<div class="text-2xl font-bold">{{ stats.averageFirst9.toFixed(2) }}</div>
					</div>
				</div>
			</div>

			<!-- Checkout Analysis Card -->
			<div class="bg-white rounded-lg shadow p-4 md:p-6">
				<h2 class="text-lg md:text-xl font-semibold mb-4">Checkout Analysis</h2>
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
					<div v-for="miss in stats.commonCheckoutMisses" :key="miss.score" class="p-3 bg-gray-50 rounded-lg">
						<div class="text-gray-600 text-sm mb-1">{{ miss.score }}</div>
						<div class="text-2xl font-bold">{{ ((miss.successes / miss.attempts) * 100).toFixed(1) }}%</div>
						<div class="text-sm text-gray-500">{{ miss.successes }}/{{ miss.attempts }}</div>
					</div>
				</div>
			</div>

			<!-- Quick Tips Section -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<!-- Strengths Card -->
				<div class="bg-white rounded-lg shadow p-4 md:p-6">
					<h2 class="text-lg md:text-xl font-semibold mb-4 text-green-600 flex items-center">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
						Strengths
					</h2>
					<ul class="space-y-2">
						<li v-for="strength in stats.strengths" :key="strength" class="flex items-start">
							<span class="text-sm text-gray-700">{{ strength }}</span>
						</li>
					</ul>
				</div>

				<!-- Areas for Improvement Card -->
				<div class="bg-white rounded-lg shadow p-4 md:p-6">
					<h2 class="text-lg md:text-xl font-semibold mb-4 text-amber-600 flex items-center">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							></path>
						</svg>
						To Improve
					</h2>
					<ul class="space-y-2">
						<li v-for="weakness in stats.weaknesses" :key="weakness" class="flex items-start">
							<span class="text-sm text-gray-700">{{ weakness }}</span>
						</li>
					</ul>
				</div>

				<!-- Training Tips Card -->
				<div class="bg-white rounded-lg shadow p-4 md:p-6">
					<h2 class="text-lg md:text-xl font-semibold mb-4 text-blue-600 flex items-center">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
							></path>
						</svg>
						Training Tips
					</h2>
					<ul class="space-y-2">
						<li v-for="tip in stats.trainingTips" :key="tip" class="flex items-start">
							<span class="text-sm text-gray-700">{{ tip }}</span>
						</li>
					</ul>
				</div>
			</div>
		</div>

		<div v-else class="text-center py-12">
			<p class="text-gray-600 mb-4">Play some games to see your statistics!</p>
			<NuxtLink
				to="/games"
				class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
			>
				Start New Game
			</NuxtLink>
		</div>
	</div>
</template>

<script setup lang="ts">
interface GameInvite {
	id: string;
	sender: string;
	senderName: string;
	type: "x01Invite";
	sending_to: string;
	status: "pending" | "accepted" | "declined" | "expired";
	created_at: string;
}

definePageMeta({
	middleware: "auth",
});

const { getClient } = useAuth();
const { getGameInvitesAsync, updateGameInviteStatusAsync } = useGamesStatusX01();
const { calculateStats } = useDashboardStats();

const isAuthenticated = ref(false);
const isLoading = ref(true);
const stats = ref<any>(null);
const gameInvites = ref<GameInvite[]>([]);

// Function to fetch game invites
const fetchGameInvites = async () => {
	const invites = await getGameInvitesAsync();
	gameInvites.value = invites || [];
};

// Handle invite response
const handleInvite = async (inviteId: string, action: "accepted" | "declined") => {
	try {
		await updateGameInviteStatusAsync(inviteId, action);

		// Remove the invite from the list
		gameInvites.value = gameInvites.value.filter((i) => i.id !== inviteId);
	} catch (error) {
		console.error("Failed to handle invite:", error);
	}
};

onMounted(async () => {
	const {
		data: { user },
	} = await getClient().auth.getUser();
	isAuthenticated.value = !!user;

	if (isAuthenticated.value) {
		try {
			stats.value = await calculateStats();

			// Initial fetch of game invites
			await fetchGameInvites();

			// Setup polling every 5 seconds
		} catch (error) {
			console.error("Failed to fetch dashboard data:", error);
		}
	}

	isLoading.value = false;
});

const userName = computed(() => {
	return stats.value?.userName || null;
});
</script>
