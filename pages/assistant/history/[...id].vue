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

interface UserData {
	user_id: string;
	email: string;
	nick_name?: string;
	full_name?: string;
	avatar: string;
	display_name: string;
}

const route = useRoute();
const { getGameByIdAsync } = useGamesStatusX01();
const { getUsersDataAsync } = useUserData();

const game = ref<any>(null);
const gameData = ref<GameData>();
const isLoading = ref(true);
const usersData = ref<Map<string, UserData>>(new Map());

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
				const parsedData =
					typeof response.data.game_data === "string"
						? JSON.parse(response.data.game_data)
						: response.data.game_data;
				
				// Recalculate high scores for all players
				if (parsedData.stats) {
					for (const playerIndex in parsedData.stats) {
						parsedData.stats[playerIndex] = {
							...parsedData.stats[playerIndex],
							...recalculateHighScores(parsedData, parseInt(playerIndex))
						};
					}
				}
				
				gameData.value = parsedData;

				// Get all user IDs from the game
				const userIds = new Set<string>();
				parsedData.players?.forEach((player) => {
					if (player.user_id) userIds.add(player.user_id);
				});

				// Fetch all users' data
				usersData.value = await getUsersDataAsync(Array.from(userIds));
			} catch (e) {
				console.error("Failed to parse game data:", e);
			}
		}
	}
	isLoading.value = false;
});

const getPlayerDisplayName = (playerName: string): string => {
	if (!gameData.value) return playerName;
	const player = gameData.value.players.find((p) => p.name === playerName);
	if (!player?.user_id) return playerName;

	const userData = usersData.value.get(player.user_id);
	return userData?.display_name || playerName;
};

const getPlayerAvatar = (playerName: string): string | undefined => {
	if (!gameData.value) return undefined;
	const player = gameData.value.players.find((p) => p.name === playerName);
	if (!player?.user_id) return undefined;

	const userData = usersData.value.get(player.user_id);
	return userData?.avatar;
};

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

	// Group throws by leg and turn
	const throwsByLegAndTurn = history.reduce(
		(acc, throw_) => {
			if (!acc[throw_.leg]) {
				acc[throw_.leg] = {};
			}
			if (!acc[throw_.leg][throw_.turnIndex]) {
				acc[throw_.leg][throw_.turnIndex] = [];
			}
			acc[throw_.leg][throw_.turnIndex].push(throw_);
			return acc;
		},
		{} as Record<number, Record<number, GameThrow[]>>
	);

	// Calculate score for a single dart throw
	const calculateDartScore = (throw_: GameThrow): number => {
		const multiplierValue = {
			single: 1,
			double: 2,
			triple: 3,
		}[throw_.multiplier];
		return throw_.value * multiplierValue;
	};

	// Process each leg
	Object.entries(throwsByLegAndTurn).forEach(([legIndex, legThrows]) => {
		const legData: LegHistory = {
			legIndex: parseInt(legIndex),
			winner: "",
			duration: 0,
			players: [],
			turns: [],
		};

		// Track scores for each player in this leg
		const playerScores = new Map(gameData.value!.players.map((p) => [p.name, gameData.value!.gameType]));

		// Process turns in order
		Object.entries(legThrows)
			.sort(([a], [b]) => Number(a) - Number(b))
			.forEach(([turnIndex, turnThrows]) => {
				const throw_ = turnThrows[0]; // Use first throw for player info
				const playerIndex = throw_.playerIndex;
				const player = gameData.value!.players[playerIndex];
				const currentScore = playerScores.get(player.name)!;

				// Calculate turn score
				const turnScore = turnThrows.reduce((sum, t) => {
					if (t.wasBust) return 0;
					return sum + calculateDartScore(t);
				}, 0);

				// Update player statistics
				const playerStats = legData.players[playerIndex] || {
					name: player.name,
					score: gameData.value!.gameType,
					darts: 0,
					first9Score: 0,
					first9Darts: 0,
					highestScore: 0,
					checkoutSuccess: false,
					checkoutAttempts: 0,
				};
				
				// Create turn
				const turn: LegTurn = {
					turnIndex: Number(turnIndex),
					playerName: player.name,
					scoreLeft: currentScore,
					darts: turnThrows.map((t) => ({
						value: t.value,
						multiplier: t.multiplier,
					})),
					turnScore: turnScore,
					averageAfter: 0,
					highlights: [],
				};

				// Handle bust and score update
				const isBust = turnThrows.some((t) => t.wasBust);
				const newScore = isBust ? currentScore : currentScore - turnScore;
				
				// For busted turns, always count as 3 darts for statistical purposes
				// This ensures a busted turn counts as a full round of missed darts
				if (isBust) {
					// Always count as 3 darts for a busted turn, regardless of actual darts thrown
					playerStats.darts += 3;
					
					turn.isBust = true;
					turn.highlights.push("Bust");
					turn.turnScore = 0;
				} else {
					// Normal counting for non-busted turns
					playerStats.darts += turnThrows.length;
					
					// Add score-based highlights
					if (turnScore === 180) turn.highlights.push("180");
					else if (turnScore >= 140) turn.highlights.push("Ton+");

					// Check for finish - Fix for the last leg winning throw
					// The issue is that some winning throws might not exactly reach 0 due to calculation errors
					// We need to check if this is the last throw in the leg for this player and if they won the leg
					const isLastThrowInLeg =
						gameData
							.value!.history.filter((t) => t.leg === parseInt(legIndex) && t.playerIndex === playerIndex)
							.pop() === turnThrows[turnThrows.length - 1];

					const isWinner = gameData.value!.winner === player.name;
					const isCloseToZero = newScore <= 0 && newScore >= -2; // Allow small calculation errors

					if (newScore === 0 || (isLastThrowInLeg && isWinner && isCloseToZero)) {
						turn.isFinish = true;
						turn.highlights.push("Finish");
						legData.winner = player.name;
						playerStats.checkoutSuccess = true;
						// Force score to exactly 0 for winning throws
						turn.scoreLeft = 0;
					} else {
						// Normal case - use calculated score
						turn.scoreLeft = newScore;
					}

					// Track checkout attempts
					if (currentScore <= 170) {
						playerStats.checkoutAttempts++;
					}
				}

				// Update first9 stats and highest score
				if (playerStats.darts <= 9) {
					playerStats.first9Score += turnScore;
					playerStats.first9Darts += isBust ? 3 : turnThrows.length;
				}
				
				if (turnScore > playerStats.highestScore && !isBust) {
					playerStats.highestScore = turnScore;
				}
				
				// Save player stats back to leg data
				legData.players[playerIndex] = playerStats;

				// Update scores - Only update the map with the score, the turn.scoreLeft is already set above
				playerScores.set(player.name, turn.scoreLeft);

				// Calculate average
				const totalScore = gameData.value!.gameType - turn.scoreLeft;
				const totalDarts = playerStats.darts;

				// Recalculate average based on actual scores, not just the difference between starting and current score
				// This ensures busted darts are properly accounted for in the average
				const actualScoreSum =
					legData.turns
						.filter((t) => t.playerName === player.name && !t.isBust)
						.reduce((sum, t) => sum + t.turnScore, 0) + (turn.isBust ? 0 : turn.turnScore);

				turn.averageAfter = totalDarts > 0 ? actualScoreSum / (totalDarts / 3) : 0;

				legData.turns.push(turn);
			});

		legs.push(legData);
	});

	return legs;
};

// Function to recalculate high scores (180s, 140+, 100+)
const recalculateHighScores = (gameData: GameData, playerIndex: number) => {
	// Get all throws by this player
	const playerThrows = gameData.history.filter(t => t.playerIndex === playerIndex);
	
	// Group throws by turn
	const turnGroups: Record<string, GameThrow[]> = {};
	playerThrows.forEach(throw_ => {
		const turnKey = `${throw_.leg}-${throw_.turnIndex}`;
		if (!turnGroups[turnKey]) {
			turnGroups[turnKey] = [];
		}
		turnGroups[turnKey].push(throw_);
	});
	
	// Count high scores
	let oneEighties = 0;
	let oneFortyPlus = 0;
	let hundredPlus = 0;
	
	// Process each turn
	Object.values(turnGroups).forEach(turn => {
		// Skip incomplete turns (less than 3 darts)
		if (turn.length !== 3) return;
		
		// Calculate turn total
		const turnTotal = turn.reduce((sum, dart) => {
			// Skip busted darts
			if (dart.wasBust) return sum;
			
			// Calculate dart score
			const multiplierValue = dart.multiplier === "triple" ? 3 : dart.multiplier === "double" ? 2 : 1;
			return sum + dart.value * multiplierValue;
		}, 0);
		
		// Count high scores
		if (turnTotal === 180) oneEighties++;
		else if (turnTotal >= 140) oneFortyPlus++;
		else if (turnTotal >= 100) hundredPlus++;
	});
	
	return { oneEighties, oneFortyPlus, hundredPlus };
};
</script>

<template>
	<div class="container mx-auto p-4">
		<div v-if="isLoading" class="text-center py-8">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<p class="mt-4 text-gray-600">Loading game details...</p>
		</div>

		<div v-else-if="gameData" class="max-w-5xl mx-auto">
			<!-- Game Header -->
			<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
				<div class="flex justify-between items-center mb-4">
					<h1 class="text-2xl font-bold">Game Summary</h1>
					<div class="text-sm text-gray-600">
						{{ formatDate(gameData.completedAt) }}
					</div>
				</div>

				<!-- Player Scores -->
				<div class="mb-6">
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						<div v-for="(player, index) in gameData.players" :key="index" class="p-4 bg-gray-50 rounded-lg">
							<div class="flex items-center justify-center gap-3">
								<img
									v-if="getPlayerAvatar(player.name)"
									:src="getPlayerAvatar(player.name)"
									:alt="`${getPlayerDisplayName(player.name)}'s avatar`"
									class="w-10 h-10 rounded-full"
								/>
								<div class="text-center">
									<div class="font-medium">{{ getPlayerDisplayName(player.name) }}</div>
									<div class="text-2xl font-bold mt-1">{{ player.legsWon }}</div>
									<div class="text-sm text-gray-600">legs won</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Game Details -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
							<tr
								v-for="(player, index) in gameData.players"
								:key="index"
								class="border-b border-gray-100"
							>
								<td class="py-2 px-4">{{ getPlayerDisplayName(player.name) }}</td>
								<td class="py-2 px-4 text-right">{{ gameData.stats[index].average.toFixed(2) }}</td>
								<td class="py-2 px-4 text-right">
									{{ gameData.stats[index].first9Average.toFixed(2) }}
								</td>
								<td class="py-2 px-4 text-right">{{ gameData.stats[index].bestLeg || "-" }}</td>
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
						Winner: <span class="font-medium">{{ getPlayerDisplayName(leg.winner) }}</span>
					</div>
				</div>

				<!-- Leg Statistics -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
					<div v-for="player in leg.players" :key="player.name" class="p-4 bg-gray-50 rounded-lg">
						<div class="font-medium mb-2">{{ getPlayerDisplayName(player.name) }}</div>
						<div class="grid grid-cols-2 gap-2 text-sm">
							<div>
								<div class="text-gray-600">Average</div>
								<div class="font-bold">{{ (player.score / (player.darts / 3)).toFixed(2) }}</div>
							</div>
							<div>
								<div class="text-gray-600">First 9</div>
								<div class="font-bold">
									{{ (player.first9Score / (player.first9Darts / 3)).toFixed(2) }}
								</div>
							</div>
							<div>
								<div class="text-gray-600">Highest Score</div>
								<div class="font-bold">{{ player.highestScore }}</div>
							</div>
							<div>
								<div class="text-gray-600">Checkout</div>
								<div class="font-bold">
									{{
										player.checkoutAttempts
											? (
													((player.checkoutSuccess ? 1 : 0) / player.checkoutAttempts) *
													100
												).toFixed(0)
											: 0
									}}%
								</div>
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
							<tr
								v-for="turn in leg.turns"
								:key="turn.turnIndex"
								:class="{ 'bg-green-50': turn.isFinish, 'bg-red-50': turn.isBust }"
							>
								<td class="py-2 px-4">{{ getPlayerDisplayName(turn.playerName) }}</td>
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
										<span
											v-for="highlight in turn.highlights"
											:key="highlight"
											:class="['px-2 py-1 rounded-full text-xs', getHighlightClass(highlight)]"
										>
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
