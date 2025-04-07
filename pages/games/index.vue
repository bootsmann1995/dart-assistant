<template>
	<div class="container mx-auto p-4">
		<div class="flex items-center justify-between mb-6">
			<h1 class="text-2xl font-bold">Games</h1>
			<NuxtLink to="/assistant/dashboard" class="text-blue-600 hover:text-blue-800 flex items-center gap-1">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg>
				Dashboard
			</NuxtLink>
		</div>

		<!-- Standard Games -->
		<div class="mb-8">
			<h2 class="text-xl font-semibold mb-4">Standard Games</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<NuxtLink to="/games/x01" class="bg-white rounded-lg shadow p-4 border border-gray-200">
					<h3 class="text-lg font-semibold mb-2">X01</h3>
					<p class="text-gray-600 text-sm">Classic dart game starting with a fixed score.</p>
				</NuxtLink>
				<div class="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4">
					<span class="text-gray-500">More games coming soon...</span>
				</div>
			</div>
		</div>

		<!-- Training Games -->
		<div>
			<h2 class="text-xl font-semibold mb-4">Training Games</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4">
					<span class="text-gray-500">Training games coming soon...</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	middleware: "auth",
});
</script>

<style></style>
