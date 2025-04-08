<script setup lang="ts">
interface GameThrow {
	value: number;
	multiplier: "single" | "double" | "triple";
	playerIndex: number;
	score: number;
	leg: number;
	wasBust: boolean;
	turnIndex: number;
}

interface GameData {
	gameType: number;
	numberOfLegs: number;
	players: Array<{
		name: string;
		score: number;
		legsWon: number;
		user_id?: string;
	}>;
	history: GameThrow[];
	stats: Record<
		number,
		{
			average: number;
			first9Average: number;
			bestLeg: number | null;
			highestFinish: string | null;
			doublesPercentage: number;
			doublesHit: number;
			doublesAttempted: number;
			checkoutAttempts: number;
			checkoutSuccesses: number;
			checkoutPercentage: number;
			oneEighties: number;
			oneFortyPlus: number;
			hundredPlus: number;
			sixtyPlus: number;
		}
	>;
	winner: string;
	completedAt: string;
}

interface DartMultiplier {
	single: string;
	double: string;
	triple: string;
}

interface DartThrow {
	value: number;
	multiplier: keyof DartMultiplier;
	isDouble?: boolean;
}

interface HighlightClasses {
	"180": string;
	"Ton+": string;
	Finish: string;
	Bust: string;
	default: string;
}

interface LegTurn {
	turnIndex: number;
	playerName: string;
	scoreLeft: number;
	darts: DartThrow[];
	turnScore: number;
	averageAfter: number;
	highlights: string[];
	possibleCheckout?: string[];
	isFinish?: boolean;
	isBust?: boolean;
}

interface LegPlayer {
	name: string;
	score: number;
	darts: number;
	first9Score: number;
	first9Darts: number;
	highestScore: number;
	checkoutSuccess: boolean;
	checkoutAttempts: number;
}

interface LegHistory {
	legIndex: number;
	winner: string;
	duration: number;
	players: LegPlayer[];
	turns: LegTurn[];
}

const route = useRoute();
const { getGameByIdAsync } = useGamesStatusX01();

const game = ref<any>(null);
const gameData = ref<GameData>();
const isLoading = ref(true);

definePageMeta({
	middleware: "auth",
});

onMounted(async () => {
	const gameId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
	if (gameId) {
		const response = await getGameByIdAsync(gameId);
		if (response?.data) {
			game.value = response.data;
			try {
				const parsedData = JSON.parse(response.data.game_data) as GameData;
				gameData.value = parsedData;
			} catch (e) {
				console.error("Failed to parse game data:", e);
			}
		}
	}
	isLoading.value = false;
});

const getFinalScore = (): string => {
	if (!gameData.value || !gameData.value.players) return "-";
	return gameData.value.players.map((p) => `${p.legsWon || 0}`).join(" - ");
};

const getCheckoutPercentage = (playerIndex: number): string => {
	if (!gameData.value?.stats?.[playerIndex]) return "0";
	const stats = gameData.value.stats[playerIndex];
	if (!stats.checkoutAttempts) return "0";
	return ((stats.checkoutSuccesses / stats.checkoutAttempts) * 100).toFixed(1);
};

const formatDart = (dart: DartThrow): string => {
	if (!dart) return "-";
	const multiplierMap: DartMultiplier = { single: "", double: "D", triple: "T" };
	return `${multiplierMap[dart.multiplier]}${dart.value}`;
};

const formatCheckout = (checkout: string[]): string => {
	if (!checkout || !checkout.length) return "-";
	return checkout.join(" - ");
};

const getHighlightClass = (highlight: string): string => {
	const classes: HighlightClasses = {
		"180": "bg-yellow-100 text-yellow-800",
		"Ton+": "bg-blue-100 text-blue-800",
		Finish: "bg-green-100 text-green-800",
		Bust: "bg-red-100 text-red-800",
		default: "bg-gray-100 text-gray-800",
	};
	return classes[highlight as keyof HighlightClasses] || classes.default;
};

const formatDate = (date: string): string => {
	if (!date) return "-";
	return new Date(date).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const getLegHistory = (): LegHistory[] => {
	if (!gameData.value) return [];

	const history = gameData.value.history;
	const legs: LegHistory[] = [];
	let currentLeg: LegHistory | null = null;

	// Group throws by leg and turn
	const throwsByLegAndTurn = history.reduce((acc, throw_) => {
		if (!acc[throw_.leg]) {
			acc[throw_.leg] = {};
		}
		if (!acc[throw_.leg][throw_.turnIndex]) {
			acc[throw_.leg][throw_.turnIndex] = [];
		}
		acc[throw_.leg][throw_.turnIndex].push(throw_);
		return acc;
	}, {} as Record<number, Record<number, GameThrow[]>>);

	// Calculate score for a single dart throw
	const calculateDartScore = (throw_: GameThrow): number => {
		const multiplierValue = {
			"single": 1,
			"double": 2,
			"triple": 3
		}[throw_.multiplier];
		return throw_.value * multiplierValue;
	};

	// Process each leg
	Object.entries(throwsByLegAndTurn).forEach(([legIndex, legThrows]) => {
		currentLeg = {
			legIndex: Number(legIndex),
			winner: "",
			duration: 0,
			players: gameData.value!.players.map((p) => ({
				name: p.name,
				score: gameData.value!.gameType,
				darts: 0,
				first9Score: 0,
				first9Darts: 0,
				highestScore: 0,
				checkoutSuccess: false,
				checkoutAttempts: 0,
			})),
			turns: [],
		};

		// Track scores for each player in this leg
		const playerScores = new Map(
			gameData.value!.players.map(p => [p.name, gameData.value!.gameType])
		);

		// Process turns in order
		Object.entries(legThrows)
			.sort(([a], [b]) => Number(a) - Number(b))
			.forEach(([turnIndex, turnThrows]) => {
				const throw_ = turnThrows[0]; // Use first throw for player info
				const playerIndex = throw_.playerIndex;
				const player = currentLeg.players[playerIndex];
				const currentScore = playerScores.get(player.name)!;

				// Calculate turn score
				const turnScore = turnThrows.reduce((sum, t) => {
					if (t.wasBust) return 0;
					return sum + calculateDartScore(t);
				}, 0);

				// Update player statistics
				player.darts += turnThrows.length;
				if (player.darts <= 9) {
					player.first9Score += turnScore;
					player.first9Darts += turnThrows.length;
				}
				if (turnScore > player.highestScore) {
					player.highestScore = turnScore;
				}

				// Create turn
				const turn: LegTurn = {
					turnIndex: Number(turnIndex),
					playerName: player.name,
					scoreLeft: currentScore,
					darts: turnThrows.map(t => ({
						value: t.value,
						multiplier: t.multiplier,
					})),
					turnScore: turnScore,
					averageAfter: 0,
					highlights: [],
				};

				// Handle bust and score update
				const isBust = turnThrows.some(t => t.wasBust);
				const newScore = isBust ? currentScore : currentScore - turnScore;

				if (isBust) {
					turn.isBust = true;
					turn.highlights.push("Bust");
					turn.turnScore = 0;
				} else {
					// Add score-based highlights
					if (turnScore === 180) turn.highlights.push("180");
					else if (turnScore >= 140) turn.highlights.push("Ton+");

					// Check for finish
					if (newScore === 0) {
						turn.isFinish = true;
						turn.highlights.push("Finish");
						currentLeg.winner = player.name;
						player.checkoutSuccess = true;
					}

					// Track checkout attempts
					if (currentScore <= 170) {
						player.checkoutAttempts++;
					}
				}

				// Update scores
				turn.scoreLeft = newScore;
				playerScores.set(player.name, newScore);
				player.score = newScore;

				// Calculate average
				const totalScore = gameData.value!.gameType - newScore;
				const totalDarts = player.darts;
				turn.averageAfter = totalDarts > 0 ? (totalScore / (totalDarts / 3)) : 0;

				currentLeg.turns.push(turn);
			});

		legs.push(currentLeg);
	});

	return legs;
};
</script>

<template>
	<div class="container mx-auto p-4">
		<div v-if="isLoading" class="text-center py-8">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<p class="mt-4 text-gray-600">Loading game details...</p>
		</div>

		<div v-else-if="gameData">
			<!-- Game Header -->
			<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
				<div class="flex justify-between items-center mb-4">
					<h1 class="text-2xl font-bold">Game Summary</h1>
					<span class="text-gray-600">{{ formatDate(gameData.completedAt) }}</span>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h2 class="text-lg font-semibold mb-2">Match Result</h2>
						<div class="flex items-center space-x-4">
							<div v-for="(player, index) in gameData.players" :key="index" 
								class="flex-1 p-4 bg-gray-50 rounded-lg text-center">
								<div class="font-medium">{{ player.name }}</div>
								<div class="text-2xl font-bold mt-1">{{ player.legsWon }}</div>
								<div class="text-sm text-gray-600 mt-1">legs won</div>
							</div>
						</div>
					</div>
					<div>
						<h2 class="text-lg font-semibold mb-2">Game Details</h2>
						<div class="grid grid-cols-2 gap-4">
							<div class="p-3 bg-gray-50 rounded-lg">
								<div class="text-sm text-gray-600">Game Type</div>
								<div class="font-bold">{{ gameData.gameType }}</div>
							</div>
							<div class="p-3 bg-gray-50 rounded-lg">
								<div class="text-sm text-gray-600">Total Legs</div>
								<div class="font-bold">{{ gameData.numberOfLegs }}</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Player Statistics -->
			<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
				<h2 class="text-xl font-bold mb-4">Player Statistics</h2>
				<div class="overflow-x-auto">
					<table class="min-w-full">
						<thead>
							<tr class="bg-gray-50">
								<th class="py-2 px-4 text-left">Player</th>
								<th class="py-2 px-4 text-right">Average</th>
								<th class="py-2 px-4 text-right">First 9</th>
								<th class="py-2 px-4 text-right">Best Leg</th>
								<th class="py-2 px-4 text-right">Checkout %</th>
								<th class="py-2 px-4 text-right">180s</th>
								<th class="py-2 px-4 text-right">140+</th>
								<th class="py-2 px-4 text-right">100+</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(player, index) in gameData.players" :key="index" 
								class="border-b border-gray-100">
								<td class="py-2 px-4">{{ player.name }}</td>
								<td class="py-2 px-4 text-right">{{ gameData.stats[index].average.toFixed(2) }}</td>
								<td class="py-2 px-4 text-right">{{ gameData.stats[index].first9Average.toFixed(2) }}</td>
								<td class="py-2 px-4 text-right">{{ gameData.stats[index].bestLeg || '-' }}</td>
								<td class="py-2 px-4 text-right">{{ getCheckoutPercentage(index) }}%</td>
								<td class="py-2 px-4 text-right">{{ gameData.stats[index].oneEighties }}</td>
								<td class="py-2 px-4 text-right">{{ gameData.stats[index].oneFortyPlus }}</td>
								<td class="py-2 px-4 text-right">{{ gameData.stats[index].hundredPlus }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<!-- Leg History -->
			<div v-for="leg in getLegHistory()" :key="leg.legIndex" class="bg-white rounded-lg shadow-sm p-6 mb-6">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-bold">Leg {{ leg.legIndex + 1 }}</h2>
					<div class="text-sm text-gray-600">
						Winner: <span class="font-medium">{{ leg.winner }}</span>
					</div>
				</div>

				<!-- Leg Statistics -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
					<div v-for="player in leg.players" :key="player.name" class="p-4 bg-gray-50 rounded-lg">
						<div class="font-medium mb-2">{{ player.name }}</div>
						<div class="grid grid-cols-2 gap-2 text-sm">
							<div>
								<div class="text-gray-600">Average</div>
								<div class="font-bold">{{ (player.score / (player.darts / 3)).toFixed(2) }}</div>
							</div>
							<div>
								<div class="text-gray-600">First 9</div>
								<div class="font-bold">{{ (player.first9Score / (player.first9Darts / 3)).toFixed(2) }}</div>
							</div>
							<div>
								<div class="text-gray-600">Highest Score</div>
								<div class="font-bold">{{ player.highestScore }}</div>
							</div>
							<div>
								<div class="text-gray-600">Checkout</div>
								<div class="font-bold">{{ player.checkoutAttempts ? ((player.checkoutSuccess ? 1 : 0) / player.checkoutAttempts * 100).toFixed(0) : 0 }}%</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Turn History -->
				<div class="overflow-x-auto">
					<table class="min-w-full">
						<thead>
							<tr class="bg-gray-50">
								<th class="py-2 px-4 text-left">Player</th>
								<th class="py-2 px-4 text-right">Score Left</th>
								<th class="py-2 px-4 text-center">Darts</th>
								<th class="py-2 px-4 text-right">Turn Score</th>
								<th class="py-2 px-4 text-right">Average</th>
								<th class="py-2 px-4">Highlights</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="turn in leg.turns" :key="turn.turnIndex" 
								:class="{'bg-green-50': turn.isFinish, 'bg-red-50': turn.isBust}">
								<td class="py-2 px-4">{{ turn.playerName }}</td>
								<td class="py-2 px-4 text-right">{{ turn.scoreLeft }}</td>
								<td class="py-2 px-4 text-center">
									<div class="flex justify-center space-x-2">
										<span v-for="(dart, i) in turn.darts" :key="i">
											{{ formatDart(dart) }}
										</span>
									</div>
									<div v-if="turn.possibleCheckout" class="text-xs text-gray-500 mt-1">
										Checkout: {{ formatCheckout(turn.possibleCheckout) }}
									</div>
								</td>
								<td class="py-2 px-4 text-right">{{ turn.turnScore }}</td>
								<td class="py-2 px-4 text-right">{{ turn.averageAfter.toFixed(2) }}</td>
								<td class="py-2 px-4">
									<div class="flex flex-wrap gap-2">
										<span v-for="highlight in turn.highlights" :key="highlight"
											:class="['px-2 py-1 rounded-full text-xs', getHighlightClass(highlight)]">
											{{ highlight }}
										</span>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<div v-else class="text-center py-12">
			<p class="text-gray-600">Game not found</p>
		</div>
	</div>
</template>
