<template>
	<div class="container mx-auto p-4 pb-20">
		<div class="mb-8 space-y-4">
			<h1 class="text-3xl font-bold">X01 Game Setup</h1>

			<!-- Game Settings -->
			<div class="mb-8 bg-white p-6 rounded-lg shadow">
				<div v-if="!gameStarted" class="space-y-6">
					<h2 class="text-2xl font-bold mb-4">Game Settings</h2>

					<!-- Game Type Selection -->
					<div class="space-y-2">
						<label class="block font-medium">Game Type</label>
						<select v-model="gameType" class="mt-1 p-2 border rounded w-full">
							<option value="301">301</option>
							<option value="501">501</option>
						</select>
					</div>

					<!-- Number of Legs -->
					<div class="space-y-2">
						<label class="block font-medium">Best of Legs</label>
						<input
							type="number"
							v-model="numberOfLegs"
							min="1"
							step="2"
							class="w-full p-2 border rounded"
						/>
					</div>

					<!-- Player Selection -->
					<div class="space-y-2">
						<label class="block font-medium">Players</label>
						<div class="space-y-2">
							<div
								v-for="(player, index) in selectedPlayers"
								:key="player.id"
								class="flex items-center gap-2"
							>
								<div class="flex-1 flex gap-2">
									<input
										type="text"
										v-model="player.name"
										class="flex-1 p-2 border rounded"
										:placeholder="index === 0 ? 'Player name' : 'Guest player name'"
									/>
									<button
										v-if="user && !isUserInGame"
										@click="useCurrentUser(index)"
										class="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
									>
										Use My Account
									</button>
								</div>
								<button
									v-if="index > 0"
									@click="removePlayer(index)"
									class="p-2 text-red-600 hover:text-red-800"
								>
									Remove
								</button>
							</div>
						</div>
						<button
							@click="addPlayer"
							class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
							:disabled="selectedPlayers.length >= 4"
						>
							Add Player
						</button>
					</div>

					<!-- Start Game Button -->
					<button
						@click="startGame"
						class="w-full p-3 bg-green-600 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
						:disabled="!isValidGameSetup"
					>
						Start Game
					</button>
				</div>

				<div v-else class="text-center">
					<button
						@click="confirmCancelGame"
						class="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700"
					>
						Cancel Game
					</button>
				</div>
			</div>

			<!-- Game Board (shown when game is started) -->
			<div v-if="gameStarted" class="pb-20">
				<!-- Game status -->
				<div class="mb-4 text-lg">
					<template v-if="winner">
						<div class="text-2xl font-bold text-green-600 flex items-center gap-2">
							<span class="text-3xl">🏆</span>
							{{ winner }} wins!
						</div>
					</template>
					<template v-else-if="isGameInProgress">
						<div class="text-lg">
							<span class="font-semibold">Leg {{ currentLeg }} of {{ numberOfLegs }}</span>
							<span class="text-gray-600 ml-2"> (First to {{ Math.ceil(numberOfLegs / 2) }}) </span>
						</div>
					</template>
				</div>

				<!-- Match Status -->
				<div class="bg-gray-100 p-4 rounded">
					<h2 class="text-lg font-bold mb-2">Leg {{ currentLeg }} of {{ numberOfLegs }}</h2>
					<div class="flex gap-4">
						<div v-for="(player, index) in selectedPlayers" :key="player.id" class="flex-1">
							<div class="flex items-center gap-2 mb-2">
								<span class="font-medium text-lg">{{ player.name }}</span>
								<span class="text-lg">{{ player.legsWon }} legs</span>
							</div>
							<div class="text-sm grid grid-cols-2 gap-x-4 gap-y-1 bg-white p-3 rounded">
								<div class="font-medium">3-Dart Avg:</div>
								<div>{{ getPlayerStats(index).average.toFixed(2) }}</div>
								<div class="font-medium">First 9 Avg:</div>
								<div>{{ getPlayerStats(index).first9Average.toFixed(2) }}</div>
								<div class="font-medium">Best Leg:</div>
								<div>
									{{ getPlayerStats(index).bestLeg ? `${getPlayerStats(index).bestLeg} darts` : "-" }}
								</div>
								<div class="font-medium">Highest Finish:</div>
								<div>{{ getPlayerStats(index).highestFinish || "-" }}</div>
								<div class="font-medium">Checkout %:</div>
								<div>{{ getPlayerStats(index).doublesPercentage.toFixed(0) }}%</div>
								<div class="font-medium">60+:</div>
								<div>{{ getPlayerStats(index).sixtyPlus }}</div>
								<div class="font-medium">100+:</div>
								<div>{{ getPlayerStats(index).hundredPlus }}</div>
								<div class="font-medium">140+:</div>
								<div>{{ getPlayerStats(index).oneFortyPlus }}</div>
								<div class="font-medium">180s:</div>
								<div>{{ getPlayerStats(index).oneEighties }}</div>
								<div class="font-medium">Doubles:</div>
								<div>
									{{ getPlayerStats(index).doublesHit }}/{{
										getPlayerStats(index).doublesAttempted
									}}
									({{ getPlayerStats(index).doublesPercentage.toFixed(0) }}%)
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div
						v-for="(player, index) in selectedPlayers"
						:key="player.id"
						:class="[
							'mb-6 p-4 rounded-lg',
							winner?.id === player.id ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-100',
						]"
					>
						<div class="flex items-start justify-between mb-2">
							<div>
								<h3 class="text-xl font-bold flex items-center gap-2">
									{{ player.name }}
									<span v-if="winner?.id === player.id" class="text-green-600 text-base">
										Winner
									</span>
								</h3>
								<p>Score: {{ player.score }}</p>
								<p v-if="getPlayerStats(index).average">
									Avg: {{ getPlayerStats(index).average.toFixed(2) }}
								</p>
								<p v-if="getLastRoundTotal(index)" class="text-sm text-gray-600">
									Last Round: {{ getLastRoundTotal(index) }}
								</p>
							</div>
							<div class="text-lg flex flex-col">
								<span class="font-semibold">Legs: {{ player.legsWon }}</span>
							</div>
						</div>

						<!-- Scoring Area (only show if game not finished) -->
						<div v-if="currentPlayerIndex === index && !isGameFinished" class="mt-4">
							<!-- Current throw display -->
							<div class="mb-4 p-2 bg-gray-100 rounded">
								<div class="flex justify-between items-center">
									<div v-for="(dart, i) in currentTurnDarts" :key="i" class="text-lg">
										{{ formatDart(dart) }}
									</div>
									<div class="font-bold">Total: {{ calculateTurnTotal() }}</div>
								</div>
							</div>

							<!-- Multiplier buttons -->
							<div class="grid grid-cols-3 gap-2 mb-4">
								<button
									v-for="multiplier in multipliers"
									:key="multiplier"
									@click="setMultiplier(multiplier.toLowerCase() as Multiplier)"
									:disabled="isGameFinished"
									:class="[
										'px-4 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed',
										currentMultiplier === multiplier.toLowerCase()
											? 'bg-blue-600 text-white'
											: 'bg-gray-200 hover:bg-gray-300',
									]"
								>
									{{ multiplier }}
								</button>
							</div>

							<!-- Number grid -->
							<div class="grid grid-cols-5 gap-2">
								<button
									v-for="n in 20"
									:key="n"
									@click="addScore(n)"
									:disabled="isGameFinished"
									class="p-4 bg-gray-200 rounded hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{{ n }}
								</button>
								<button
									@click="addScore(25)"
									:disabled="isGameFinished"
									class="p-4 bg-red-200 rounded hover:bg-red-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Bull
								</button>
								<button
									@click="addScore(0)"
									:disabled="isGameFinished"
									class="p-4 bg-gray-200 rounded hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
								>
									0
								</button>
							</div>
						</div>

						<!-- Player Stats (show detailed stats when game is finished) -->
						<div v-if="isGameFinished" class="mt-4 space-y-2">
							<div class="grid grid-cols-2 gap-x-4 gap-y-2 bg-gray-50 p-3 rounded text-sm">
								<div class="font-medium">3-Dart Avg:</div>
								<div>{{ getPlayerStats(index).average.toFixed(2) }}</div>
								<div class="font-medium">First 9 Avg:</div>
								<div>{{ getPlayerStats(index).first9Average.toFixed(2) }}</div>
								<div class="font-medium">Best Leg:</div>
								<div>
									{{ getPlayerStats(index).bestLeg ? `${getPlayerStats(index).bestLeg} darts` : "-" }}
								</div>
								<div class="font-medium">Highest Finish:</div>
								<div>{{ getPlayerStats(index).highestFinish || "-" }}</div>
								<div class="font-medium">Checkout %:</div>
								<div>{{ getPlayerStats(index).doublesPercentage.toFixed(0) }}%</div>
								<div class="font-medium">60+:</div>
								<div>{{ getPlayerStats(index).sixtyPlus }}</div>
								<div class="font-medium">100+:</div>
								<div>{{ getPlayerStats(index).hundredPlus }}</div>
								<div class="font-medium">140+:</div>
								<div>{{ getPlayerStats(index).oneFortyPlus }}</div>
								<div class="font-medium">180s:</div>
								<div>{{ getPlayerStats(index).oneEighties }}</div>
								<div class="font-medium">Doubles:</div>
								<div>
									{{ getPlayerStats(index).doublesHit }}/{{
										getPlayerStats(index).doublesAttempted
									}}
									({{ getPlayerStats(index).doublesPercentage.toFixed(0) }}%)
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Game Controls -->
				<div class="mt-4 space-y-4">
					<!-- Winner Display -->
					<div v-if="isGameFinished" class="text-center bg-green-50 border border-green-200 p-4 rounded-lg">
						<h3 class="text-xl font-bold text-green-800 mb-2">Game Over!</h3>
						<p class="text-lg text-green-700">
							Congratulations to <span class="font-bold">{{ getWinner()?.name }}</span
							>!
						</p>
						<p class="text-sm text-green-600 mt-1">
							Won {{ getWinner()?.legsWon }} - {{ getLoser()?.legsWon }}
						</p>
					</div>

					<div class="flex justify-between items-center">
						<!-- Undo button -->
						<div class="flex gap-4">
							<button
								@click="undoLastThrow"
								class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
								:disabled="gameHistory.length === 0"
							>
								Undo Last Throw
							</button>
							<!-- Only show Cancel Game during active gameplay -->
							<button
								v-if="!isGameFinished"
								@click="confirmCancelGame"
								class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
							>
								Cancel Game
							</button>
						</div>

						<!-- Game Over Actions -->
						<div v-if="isGameFinished" class="flex gap-4">
							<button
								v-if="user && !gameSaved && gameState"
								@click="saveGame"
								class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
							>
								Save Game
							</button>
							<button
								@click="confirmCancelGame"
								class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
							>
								New Game
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Fixed Bottom Bar -->
	<div
		v-if="gameStarted && !isGameFinished && getCurrentPlayer.score <= 170"
		class="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg"
	>
		<div class="container mx-auto">
			<div v-if="getCheckoutSuggestion(getCurrentPlayer.score)" class="flex items-center justify-center gap-3">
				<div class="flex items-center gap-2 text-yellow-400">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path
							d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
						/>
					</svg>
					<span class="font-medium">Checkout:</span>
				</div>

				<div class="flex items-center gap-2">
					<template v-for="(dart, index) in getCheckoutSuggestion(getCurrentPlayer.score)" :key="index">
						<span class="px-3 py-1 bg-gray-700 rounded-full border border-gray-600 font-medium">
							{{ formatDartThrow(dart) }}
						</span>
						<span
							v-if="index < getCheckoutSuggestion(getCurrentPlayer.score)!.length - 1"
							class="text-gray-400"
							>→</span
						>
					</template>
				</div>
			</div>
		</div>
	</div>

	<!-- Current turn display -->
	<div v-if="isGameInProgress && gameStarted" class="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4">
		<div class="container mx-auto max-w-4xl">
			<div class="flex items-center justify-between">
				<div class="text-lg">
					<span class="font-semibold">{{ selectedPlayers[currentPlayerIndex].name }}'s Turn:</span>
					<span class="ml-2">
						<template v-if="currentTurnDisplay.length === 0"> First dart </template>
						<template v-else>
							{{ currentTurnDisplay.join(" - ") }}
							<span v-if="wasTurnBusted" class="text-red-400 ml-2">(Bust)</span>
						</template>
					</span>
				</div>
				<div class="text-xl font-bold">Score: {{ selectedPlayers[currentPlayerIndex].score }}</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { User } from "@supabase/supabase-js";

const { getUserAsync } = useAuth();
const user = ref<User | null>(null);

onMounted(async () => {
	const resp = await getUserAsync();
	if (resp?.user) {
		user.value = resp.user;
	}
});

type Multiplier = "single" | "double" | "triple";

interface DartThrow {
	value: number;
	multiplier: Multiplier;
	playerIndex: number;
	score: number; // player's score before this throw
	leg: number;
	wasBust: boolean;
	turnIndex?: number; // Track which turn this dart belongs to
}

interface PlayerState {
	name: string;
	score: number;
	legsWon: number;
	id: number;
}

interface GameState {
	gameType: number;
	numberOfLegs: number;
	players: {
		name: string;
		score: number;
		legsWon: number;
	}[];
	history: DartThrow[];
	stats: {
		[playerIndex: number]: PlayerStats;
	};
	winner: string | null;
	completedAt: string;
}

const gameType = ref(501);
const numberOfLegs = ref(3); // Default to best of 3
const currentLeg = ref(1);
const selectedPlayers = ref<PlayerState[]>([
	{ id: 0, name: "", score: gameType.value, legsWon: 0 },
	{ id: 1, name: "", score: gameType.value, legsWon: 0 },
]);
const gameStarted = ref(false);
const currentPlayerIndex = ref(0);
const gameHistory = ref<DartThrow[]>([]);
const currentMultiplier = ref<Multiplier>("single");
const multipliers = ["Single", "Double", "Triple"] as const;
const gameSaved = ref(false);
const gameState = ref<GameState | null>(null);
const turnStartScore = ref(0);
const wasTurnBusted = ref(false);
const currentTurnIndex = ref(0);

const legStarters = ref<number[]>([0]); // Start with player 0 for first leg

const isValidGameSetup = computed(() => {
	return (
		selectedPlayers.value.every((player) => player.name.trim()) &&
		numberOfLegs.value > 0 &&
		selectedPlayers.value.length >= 1
	);
});

const isGameFinished = computed(() => {
	const legsNeededToWin = Math.ceil(numberOfLegs.value / 2);
	return selectedPlayers.value.some((player) => player.legsWon >= legsNeededToWin);
});

const winner = computed(() => {
	const legsToWin = Math.ceil(numberOfLegs.value / 2);
	return selectedPlayers.value.find((p) => p.legsWon >= legsToWin) || null;
});

const isGameInProgress = computed(() => selectedPlayers.value.length > 0 && !winner.value && !isGameFinished.value);

// Get the current player's throws in this turn
const currentTurnDarts = computed(() => {
	// Get all throws in current leg for current player
	const throwsInLeg = gameHistory.value.filter(
		(t) => t.leg === currentLeg.value && t.playerIndex === currentPlayerIndex.value
	);

	// Get throws for current turn
	return throwsInLeg.filter((t) => t.turnIndex === currentTurnIndex.value);
});

interface PlayerStats {
	average: number;
	first9Average: number;
	bestLeg: number | null;
	highestFinish: string | null;
	doublesPercentage: number;
	doublesHit: number;
	doublesAttempted: number;
	oneEighties: number;
	oneFortyPlus: number;
	hundredPlus: number;
	sixtyPlus: number;
}

function getPlayerStats(playerId: number): PlayerStats {
	// Get all legs for this player across all legs
	const allLegs = gameHistory.value
		.reduce((legs: { turns: DartThrow[] }[], throw_) => {
			const legIndex = throw_.leg - 1;
			if (!legs[legIndex]) {
				legs[legIndex] = { turns: [] };
			}
			legs[legIndex].turns.push(throw_);
			return legs;
		}, [])
		.filter((leg) => leg !== undefined);

	// Get completed legs (where player won)
	const completedLegs = allLegs.filter((leg) => {
		const lastThrow = leg.turns[leg.turns.length - 1];
		if (!lastThrow) return false;
		return (
			lastThrow.playerIndex === playerId &&
			lastThrow.multiplier === "double" &&
			lastThrow.score - lastThrow.value * multiplierValues[lastThrow.multiplier] === 0
		);
	});

	// Calculate darts per leg (only for completed legs)
	const dartsPerLeg = completedLegs.map((leg) => {
		// Get all throws by this player in the leg
		const playerThrows = leg.turns.filter((t) => t.playerIndex === playerId);

		// Group by turn
		const turnGroups = playerThrows.reduce((groups: DartThrow[][], throw_) => {
			const turnIndex = throw_.turnIndex ?? 0;
			if (!groups[turnIndex]) {
				groups[turnIndex] = [];
			}
			groups[turnIndex].push(throw_);
			return groups;
		}, []);

		// Count total darts
		return turnGroups.reduce((total, turn) => total + turn.length, 0);
	});

	// Calculate best leg (handle empty array)
	const bestLeg = dartsPerLeg.length > 0 ? Math.min(...dartsPerLeg) : null;

	// Calculate 3-dart average
	const allTurns = allLegs.flatMap((leg) => {
		// Get all throws by this player
		const playerThrows = leg.turns.filter((t) => t.playerIndex === playerId);

		// Group by turn
		const turnGroups = playerThrows.reduce((groups: DartThrow[][], throw_) => {
			const turnIndex = throw_.turnIndex ?? 0;
			if (!groups[turnIndex]) {
				groups[turnIndex] = [];
			}
			groups[turnIndex].push(throw_);
			return groups;
		}, []);

		// Only return complete turns (3 darts)
		return turnGroups.filter((turn) => turn.length === 3);
	});

	const average =
		allTurns.length > 0
			? allTurns.reduce(
					(sum, turn) =>
						sum +
						turn.reduce((turnSum, dart) => turnSum + dart.value * multiplierValues[dart.multiplier], 0),
					0
				) / allTurns.length
			: 0;

	// Calculate first 9 average
	const first9Rounds = allLegs.flatMap((leg) => {
		// Get all throws by this player
		const playerThrows = leg.turns.filter((t) => t.playerIndex === playerId);

		// Group by turn
		const turnGroups = playerThrows.reduce((groups: DartThrow[][], throw_) => {
			const turnIndex = throw_.turnIndex ?? 0;
			if (!groups[turnIndex]) {
				groups[turnIndex] = [];
			}
			groups[turnIndex].push(throw_);
			return groups;
		}, []);

		// Only take first 3 complete turns
		return turnGroups.filter((turn) => turn.length === 3).slice(0, 3);
	});

	const first9Average =
		first9Rounds.length > 0
			? first9Rounds.reduce(
					(sum, turn) =>
						sum +
						turn.reduce((turnSum, dart) => turnSum + dart.value * multiplierValues[dart.multiplier], 0),
					0
				) / first9Rounds.length
			: 0;

	// Find highest finish
	const finishes = completedLegs.map((leg) => {
		const lastThrow = leg.turns[leg.turns.length - 1];
		if (lastThrow.value === 25) {
			return "Bull";
		} else {
			return `D${lastThrow.value}`;
		}
	});
	const highestFinish = finishes.length > 0 ? finishes[finishes.length - 1] : null;

	// Calculate doubles statistics
	const doubleAttempts = allLegs.flatMap((leg) =>
		leg.turns.filter(
			(throw_) =>
				throw_.playerIndex === playerId &&
				throw_.multiplier === "double" &&
				(throw_.score - throw_.value * 2 === 0 || // Would finish
					throw_.score <= 50) // Within finishing range
		)
	);

	const doublesHit = completedLegs.length;
	const doublesAttempted = doubleAttempts.length;
	const doublesPercentage = doublesAttempted > 0 ? (doublesHit / doublesAttempted) * 100 : 0;

	// Count scores by range
	const scoreCounts = allTurns.reduce(
		(counts, turn) => {
			const score = turn.reduce((sum, dart) => sum + dart.value * multiplierValues[dart.multiplier], 0);

			if (score === 180) counts.oneEighties++;
			else if (score >= 140) counts.oneFortyPlus++;
			else if (score >= 100) counts.hundredPlus++;
			else if (score >= 60) counts.sixtyPlus++;
			return counts;
		},
		{
			oneEighties: 0,
			oneFortyPlus: 0,
			hundredPlus: 0,
			sixtyPlus: 0,
		}
	);

	return {
		average,
		first9Average,
		bestLeg,
		highestFinish,
		doublesPercentage,
		doublesHit,
		doublesAttempted,
		...scoreCounts,
	};
}

function addPlayer() {
	if (selectedPlayers.value.length < 4) {
		selectedPlayers.value.push({
			name: "",
			score: gameType.value,
			legsWon: 0,
			id: selectedPlayers.value.length,
		});
	}
}

function removePlayer(index: number) {
	selectedPlayers.value.splice(index, 1);
}

function startGame() {
	if (!isValidGameSetup.value) return;

	gameStarted.value = true;
	currentLeg.value = 1;
	currentPlayerIndex.value = 0; // First player starts
	legStarters.value = [0]; // Reset leg starters

	// Reset all players' scores to game type
	selectedPlayers.value.forEach((player) => {
		player.score = gameType.value;
		player.legsWon = 0;
	});

	// Reset game state
	gameHistory.value = [];
	currentTurnIndex.value = 0;
	turnStartScore.value = gameType.value;
	wasTurnBusted.value = false;
	currentMultiplier.value = "single";
	gameState.value = null;
	gameSaved.value = false;
}

function startNewLeg() {
	currentLeg.value++;

	// Next leg starter should be opposite of last leg's starter
	const lastStarter = legStarters.value[legStarters.value.length - 1];
	const nextStarter = (lastStarter + 1) % selectedPlayers.value.length;
	legStarters.value.push(nextStarter);

	// Set current player to the new leg starter
	currentPlayerIndex.value = nextStarter;

	// Reset scores for new leg
	selectedPlayers.value.forEach((player) => {
		player.score = gameType.value;
	});

	// Reset turn tracking
	currentTurnIndex.value = 0;
	turnStartScore.value = gameType.value;
	wasTurnBusted.value = false;
}

function setMultiplier(multiplier: Multiplier) {
	currentMultiplier.value = multiplier;
}

const multiplierValues = {
	single: 1,
	double: 2,
	triple: 3,
} as const;

const currentTurnDisplay = computed(() => {
	const throwsInCurrentTurn = gameHistory.value
		.filter((t) => t.leg === currentLeg.value && t.playerIndex === currentPlayerIndex.value)
		.slice(-3); // Only last 3 darts

	return throwsInCurrentTurn.map((t) => {
		const prefix = t.multiplier === "triple" ? "T" : t.multiplier === "double" ? "D" : "";
		return `${prefix}${t.value}`;
	});
});

function addScore(value: number) {
	if (isGameFinished.value) return;

	// Don't allow more than 3 darts per turn
	if (currentTurnDarts.value.length >= 3) return;

	// Only allow double for bull (25)
	if (value === 25 && currentMultiplier.value === "triple") return;

	const throwScore = value * multiplierValues[currentMultiplier.value];
	const currentPlayer = selectedPlayers.value[currentPlayerIndex.value];
	const newScore = currentPlayer.score - throwScore;

	// On first throw of turn, save starting score and reset bust flag
	if (currentTurnDarts.value.length === 0) {
		turnStartScore.value = currentPlayer.score;
		wasTurnBusted.value = false;
	}

	// Handle bust (going below 0 or to 1)
	if (newScore < 0 || newScore === 1) {
		// Record the throw that caused the bust
		const dartThrow: DartThrow = {
			value,
			multiplier: currentMultiplier.value,
			playerIndex: currentPlayerIndex.value,
			score: turnStartScore.value, // Use starting score for bust throw
			leg: currentLeg.value,
			wasBust: true,
			turnIndex: currentTurnIndex.value,
		};
		gameHistory.value.push(dartThrow);

		// Mark turn as busted
		wasTurnBusted.value = true;

		// Reset score to start of turn
		currentPlayer.score = turnStartScore.value;

		// Reset multiplier
		currentMultiplier.value = "single";

		// Move to next player
		moveToNextPlayer();
		return;
	}

	// If trying to finish, must use appropriate double
	if (newScore === 0 && currentMultiplier.value !== "double") {
		// Handle bust on finish attempt
		const dartThrow: DartThrow = {
			value,
			multiplier: currentMultiplier.value,
			playerIndex: currentPlayerIndex.value,
			score: turnStartScore.value, // Use starting score for bust throw
			leg: currentLeg.value,
			wasBust: true,
			turnIndex: currentTurnIndex.value,
		};
		gameHistory.value.push(dartThrow);

		// Mark turn as busted
		wasTurnBusted.value = true;

		// Reset score and move to next player
		currentPlayer.score = turnStartScore.value;
		currentMultiplier.value = "single";
		moveToNextPlayer();
		return;
	}

	// Record the throw
	const dartThrow: DartThrow = {
		value,
		multiplier: currentMultiplier.value,
		playerIndex: currentPlayerIndex.value,
		score: currentPlayer.score, // Record score before this throw
		leg: currentLeg.value,
		wasBust: false,
		turnIndex: currentTurnIndex.value,
	};

	// Update history first, then score
	gameHistory.value.push(dartThrow);
	currentPlayer.score = newScore;

	// Reset multiplier after each throw
	currentMultiplier.value = "single";

	// Check for leg win
	if (newScore === 0) {
		// Increment legs won
		currentPlayer.legsWon++;

		// Check if player has won the match
		const legsToWin = Math.ceil(numberOfLegs.value / 2);
		if (currentPlayer.legsWon >= legsToWin) {
			// Prepare game state immediately when game is won
			gameState.value = prepareGameState();
			return; // Don't continue to next leg
		}

		// Start new leg
		startNewLeg();
		return;
	}

	// Move to next player if 3 darts thrown
	if (currentTurnDarts.value.length === 3) {
		moveToNextPlayer();
	}
}

function moveToNextPlayer() {
	currentPlayerIndex.value = (currentPlayerIndex.value + 1) % selectedPlayers.value.length;
	currentTurnIndex.value++;

	// Save starting score for next player's turn
	turnStartScore.value = selectedPlayers.value[currentPlayerIndex.value].score;

	// Reset multiplier
	currentMultiplier.value = "single";

	// Reset bust flag
	wasTurnBusted.value = false;
}

function undoLastThrow() {
	if (gameHistory.value.length === 0) return;

	const lastThrow = gameHistory.value[gameHistory.value.length - 1];
	const player = selectedPlayers.value[lastThrow.playerIndex];

	// Get throws in current leg before this one
	const throwsInLeg = gameHistory.value
		.slice(0, gameHistory.value.indexOf(lastThrow))
		.filter((t) => t.leg === lastThrow.leg);

	// Calculate score before this throw
	const scoreBeforeThrow =
		gameType.value -
		throwsInLeg
			.filter((t) => t.playerIndex === lastThrow.playerIndex)
			.reduce((sum, t) => sum + t.value * multiplierValues[t.multiplier], 0);

	// Check if this was a leg-winning throw
	const wasLegWinner = player.score === 0 && lastThrow.multiplier === "double" && !lastThrow.wasBust;

	// If this was a leg winner, decrement legs and reset scores
	if (wasLegWinner) {
		// Decrement legs won
		player.legsWon--;

		// If we're in a new leg, go back to previous leg
		if (currentLeg.value > lastThrow.leg) {
			currentLeg.value = lastThrow.leg;

			// Remove the last leg starter since we're going back
			legStarters.value.pop();

			// Reset all players' scores to what they were
			selectedPlayers.value.forEach((p) => {
				const playerThrows = gameHistory.value.filter((t) => t.leg === lastThrow.leg && t.playerIndex === p.id);

				if (playerThrows.length > 0) {
					// Use the last throw's recorded score
					p.score = playerThrows[playerThrows.length - 1].score;
				} else {
					// If no throws, use starting score for leg
					p.score = gameType.value;
				}
			});
		}
	}

	// Remove the throw from history
	gameHistory.value.pop();

	// Clear game state if we undid the winning throw
	if (gameState.value) {
		gameState.value = null;
		gameSaved.value = false;
	}

	// Get all throws in current leg after removing the last throw
	const throwsInCurrentLeg = gameHistory.value.filter((t) => t.leg === currentLeg.value);

	// If we just undid a bust, go back to that player
	if (lastThrow.wasBust) {
		currentPlayerIndex.value = lastThrow.playerIndex;
		// Reset bust flag since we're undoing the bust
		wasTurnBusted.value = false;
	} else {
		// Count throws for each player in this leg
		const throwsByPlayer = throwsInCurrentLeg.reduce(
			(acc, t) => {
				acc[t.playerIndex] = (acc[t.playerIndex] || 0) + 1;
				return acc;
			},
			{} as Record<number, number>
		);

		// Get last throw in leg
		const lastThrowInLeg = throwsInCurrentLeg[throwsInCurrentLeg.length - 1];

		// Determine who should be the active player
		if (lastThrowInLeg) {
			// If there are throws in the leg
			const lastPlayerThrows = throwsByPlayer[lastThrowInLeg.playerIndex] || 0;

			if (lastPlayerThrows === 3) {
				// If last player had 3 throws, stay on current player
				// (which should be the next player)
				return;
			} else {
				// Go back to the player with the last throw
				currentPlayerIndex.value = lastThrowInLeg.playerIndex;
			}
		} else {
			// If no throws in leg, set to leg starter
			currentPlayerIndex.value = legStarters.value[currentLeg.value - 1];
		}
	}

	// Restore the player's score
	player.score = lastThrow.score;

	// Reset multiplier
	currentMultiplier.value = "single";
}

function formatDart(dart: DartThrow) {
	const prefix = dart.multiplier === "single" ? "" : dart.multiplier === "double" ? "D" : "T";
	const value = dart.value === 25 ? "Bull" : dart.value;
	return `${prefix}${value}`;
}

function calculateTurnTotal() {
	return currentTurnDarts.value.reduce((total, dart) => {
		const multiplierValue = dart.multiplier === "triple" ? 3 : dart.multiplier === "double" ? 2 : 1;
		return total + dart.value * multiplierValue;
	}, 0);
}

// Helper function to check if a throw won a leg
function isLegWinningThrow(dart: DartThrow, currentLegsWon: number) {
	// Get all throws in the same leg before this one
	const throwsInLeg = gameHistory.value.slice(0, gameHistory.value.indexOf(dart)).filter((t) => t.leg === dart.leg);

	// Calculate score before this throw
	const scoreBeforeThrow =
		gameType.value -
		throwsInLeg
			.filter((t) => t.playerIndex === dart.playerIndex)
			.reduce((sum, t) => sum + t.value * multiplierValues[t.multiplier], 0);

	// This was a leg-winning throw if:
	// 1. Score before throw minus this throw equals exactly 0
	// 2. The throw was a double
	return scoreBeforeThrow - dart.value * multiplierValues[dart.multiplier] === 0 && dart.multiplier === "double";
}

function getPlayerLegs(playerIndex: number) {
	const legs: Array<{
		turns: Array<{
			darts: DartThrow[];
			total: number;
		}>;
		closed: boolean;
		dartCount: number;
	}> = [];

	let currentTurn: DartThrow[] = [];
	let currentLegDarts = 0;

	// Go through all throws for this player
	gameHistory.value.forEach((dart, index) => {
		if (dart.playerIndex === playerIndex) {
			// If this is a new leg, create a new leg entry
			if (legs[dart.leg - 1] === undefined) {
				legs[dart.leg - 1] = {
					turns: [],
					closed: false,
					dartCount: 0,
				};
			}

			currentTurn.push(dart);
			currentLegDarts++;

			// When we have 3 darts or this is the last throw for this player in this leg
			if (
				currentTurn.length === 3 ||
				isLastThrowInLeg(index) ||
				gameHistory.value[index + 1]?.playerIndex !== playerIndex ||
				gameHistory.value[index + 1]?.leg !== dart.leg
			) {
				// Add the turn to the leg
				legs[dart.leg - 1].turns.push({
					darts: [...currentTurn],
					total: currentTurn.reduce((sum, d) => {
						const multiplierValue = d.multiplier === "triple" ? 3 : d.multiplier === "double" ? 2 : 1;
						return sum + d.value * multiplierValue;
					}, 0),
				});

				// Check if this turn closed the leg
				const lastDart = currentTurn[currentTurn.length - 1];
				const player = selectedPlayers.value[playerIndex];
				if (isLegWinningThrow(lastDart, player.legsWon)) {
					legs[dart.leg - 1].closed = true;
					legs[dart.leg - 1].dartCount = currentLegDarts;
				}

				currentTurn = [];
			}
		}
	});

	return legs;
}

function isLastThrowInLeg(index: number): boolean {
	const currentThrow = gameHistory.value[index];
	const nextThrow = gameHistory.value[index + 1];
	return !nextThrow || nextThrow.leg !== currentThrow.leg;
}

function prepareGameState(): GameState {
	const winner = getWinner();
	if (!winner) {
		throw new Error("Cannot prepare game state: no winner found");
	}

	return {
		gameType: gameType.value,
		numberOfLegs: numberOfLegs.value,
		players: selectedPlayers.value.map((p) => ({
			name: p.name,
			score: p.score,
			legsWon: p.legsWon,
		})),
		history: gameHistory.value,
		stats: Object.fromEntries(selectedPlayers.value.map((_, index) => [index, getPlayerStats(index)])),
		winner: winner.name,
		completedAt: new Date().toISOString(),
	};
}

async function checkLegWinner() {
	const currentPlayer = selectedPlayers.value[currentPlayerIndex.value];
	const legsNeededToWin = Math.ceil(numberOfLegs.value / 2);

	if (currentPlayer.score === 0 && currentMultiplier.value === "double") {
		currentPlayer.legsWon++;

		// Check if game is finished
		if (currentPlayer.legsWon >= legsNeededToWin) {
			// Prepare game state immediately when game is won
			gameState.value = prepareGameState();
			return; // Don't continue to next leg
		}

		// Only continue to next leg if game isn't over
		currentLeg.value++;

		// Reset scores for next leg
		selectedPlayers.value.forEach((player) => {
			player.score = gameType.value;
		});
	}
}

function useCurrentUser(playerIndex: number) {
	if (user.value?.email) {
		selectedPlayers.value[playerIndex].name = user.value.email;
	}
}

function confirmCancelGame() {
	if (confirm("Are you sure you want to cancel the current game? All progress will be lost.")) {
		// Reset game state
		gameStarted.value = false;
		selectedPlayers.value.forEach((player) => {
			player.score = gameType.value;
			player.legsWon = 0;
		});
		currentPlayerIndex.value = 0;
		currentLeg.value = 1;
		legStarters.value = [0]; // Reset leg starters
		gameHistory.value = [];
		currentTurnIndex.value = 0;
		turnStartScore.value = gameType.value;
		wasTurnBusted.value = false;
		currentMultiplier.value = "single";
		gameState.value = null;
		gameSaved.value = false;
	}
}

const { saveGameAsync } = useGamesStatusX01();

async function saveGame() {
	if (!gameState.value || !user.value?.id || gameSaved.value) return;

	await saveGameAsync(user.value.id, gameState.value);
	gameSaved.value = true;
}

// Computed property to check if the logged-in user is already in the game
const isUserInGame = computed(() => {
	if (!user.value) return false;
	return selectedPlayers.value.some((player) => player.name === user.value?.email);
});

// Helper functions to get winner and loser
function getWinner() {
	const legsNeededToWin = Math.ceil(numberOfLegs.value / 2);
	return selectedPlayers.value.find((p) => p.legsWon >= legsNeededToWin);
}

function getLoser() {
	const winner = getWinner();
	if (!winner) return null;
	return selectedPlayers.value.find((p) => p !== winner);
}

// Checkout suggestions
const checkouts: Record<number, string[]> = {
	170: ["T20", "T20", "Bull"],
	167: ["T20", "T19", "Bull"],
	164: ["T20", "T18", "Bull"],
	161: ["T20", "T17", "Bull"],
	160: ["T20", "T20", "D20"],
	158: ["T20", "T20", "D19"],
	157: ["T20", "T19", "D20"],
	156: ["T20", "T20", "D18"],
	155: ["T20", "T19", "D19"],
	154: ["T20", "T18", "D20"],
	153: ["T20", "T19", "D18"],
	152: ["T20", "T20", "D16"],
	151: ["T20", "T17", "D20"],
	150: ["T20", "T18", "D18"],
	149: ["T20", "T19", "D16"],
	148: ["T20", "T20", "D14"],
	147: ["T20", "T17", "D18"],
	146: ["T20", "T18", "D16"],
	145: ["T20", "T19", "D14"],
	144: ["T20", "T20", "D12"],
	143: ["T20", "T17", "D16"],
	142: ["T20", "T14", "D20"],
	141: ["T20", "T19", "D12"],
	140: ["T20", "T20", "D10"],
	139: ["T20", "T13", "D20"],
	138: ["T20", "T18", "D12"],
	137: ["T20", "T19", "D10"],
	136: ["T20", "T20", "D8"],
	135: ["T20", "T17", "D12"],
	134: ["T20", "T14", "D16"],
	133: ["T20", "T19", "D8"],
	132: ["T20", "T16", "D12"],
	131: ["T20", "T13", "D16"],
	130: ["T20", "T20", "D5"],
	129: ["T19", "T16", "D12"],
	128: ["T18", "T14", "D16"],
	127: ["T20", "T17", "D8"],
	126: ["T19", "T19", "D6"],
	125: ["T20", "T19", "D4"],
	124: ["T20", "T16", "D8"],
	123: ["T19", "T16", "D9"],
	122: ["T18", "T20", "D4"],
	121: ["T20", "T11", "D14"],
	120: ["T20", "S20", "D20"],
	119: ["T19", "T12", "D13"],
	118: ["T20", "S18", "D20"],
	117: ["T20", "S17", "D20"],
	116: ["T20", "S16", "D20"],
	115: ["T20", "S15", "D20"],
	114: ["T20", "S14", "D20"],
	113: ["T20", "S13", "D20"],
	112: ["T20", "S12", "D20"],
	111: ["T20", "S11", "D20"],
	110: ["T20", "S10", "D20"],
	109: ["T19", "S12", "D20"],
	108: ["T20", "S16", "D16"],
	107: ["T19", "S10", "D20"],
	106: ["T20", "S14", "D16"],
	105: ["T19", "S8", "D20"],
	104: ["T18", "S10", "D20"],
	103: ["T19", "S6", "D20"],
	102: ["T20", "S10", "D16"],
	101: ["T17", "S10", "D20"],
	100: ["T20", "D20"],
	99: ["T19", "S10", "D16"],
	98: ["T20", "D19"],
	97: ["T19", "D20"],
	96: ["T20", "D18"],
	95: ["T19", "D19"],
	94: ["T18", "D20"],
	93: ["T19", "D18"],
	92: ["T20", "D16"],
	91: ["T17", "D20"],
	90: ["T20", "D15"],
	89: ["T19", "D16"],
	88: ["T16", "D20"],
	87: ["T17", "D18"],
	86: ["T18", "D16"],
	85: ["T15", "D20"],
	84: ["T20", "D12"],
	83: ["T17", "D16"],
	82: ["T14", "D20"],
	81: ["T19", "D12"],
	80: ["T20", "D10"],
	79: ["T13", "D20"],
	78: ["T18", "D12"],
	77: ["T19", "D10"],
	76: ["T20", "D8"],
	75: ["T17", "D12"],
	74: ["T14", "D16"],
	73: ["T19", "D8"],
	72: ["T16", "D12"],
	71: ["T13", "D16"],
	70: ["T18", "D8"],
	69: ["T19", "D6"],
	68: ["T20", "D4"],
	67: ["T17", "D8"],
	66: ["T10", "D18"],
	65: ["T19", "D4"],
	64: ["T16", "D8"],
	63: ["T13", "D12"],
	62: ["T10", "D16"],
	61: ["T15", "D8"],
	60: ["S20", "D20"],
	59: ["S19", "D20"],
	58: ["S18", "D20"],
	57: ["S17", "D20"],
	56: ["T16", "D4"],
	55: ["S15", "D20"],
	54: ["S14", "D20"],
	53: ["S13", "D20"],
	52: ["S12", "D20"],
	51: ["S11", "D20"],
	50: ["Bull"],
	49: ["S9", "D20"],
	48: ["S16", "D16"],
	47: ["S15", "D16"],
	46: ["S6", "D20"],
	45: ["S13", "D16"],
	44: ["S12", "D16"],
	43: ["S11", "D16"],
	42: ["S10", "D16"],
	41: ["S9", "D16"],
	40: ["D20"],
	39: ["S7", "D16"],
	38: ["D19"],
	37: ["S5", "D16"],
	36: ["D18"],
	35: ["S3", "D16"],
	34: ["D17"],
	33: ["S1", "D16"],
	32: ["D16"],
	31: ["S7", "D12"],
	30: ["D15"],
	29: ["S13", "D8"],
	28: ["D14"],
	27: ["S11", "D8"],
	26: ["D13"],
	25: ["S9", "D8"],
	24: ["D12"],
	23: ["S7", "D8"],
	22: ["D11"],
	21: ["S5", "D8"],
	20: ["D10"],
	19: ["S3", "D8"],
	18: ["D9"],
	17: ["S1", "D8"],
	16: ["D8"],
	15: ["S7", "D4"],
	14: ["D7"],
	13: ["S5", "D4"],
	12: ["D6"],
	11: ["S3", "D4"],
	10: ["D5"],
	9: ["S1", "D4"],
	8: ["D4"],
	7: ["S3", "D2"],
	6: ["D3"],
	5: ["S1", "D2"],
	4: ["D2"],
	3: ["S1", "D1"],
	2: ["D1"],
};

// Get checkout suggestion for a score
function getCheckoutSuggestion(score: number): string[] | null {
	if (score > 170 || score < 2) return null;
	return checkouts[score] || null;
}

// Format dart throw for display
function formatDartThrow(dart: string): string {
	if (dart === "Bull") return "Bull";
	const prefix = dart[0];
	const value = dart.slice(1);

	switch (prefix) {
		case "T":
			return `Triple ${value}`;
		case "D":
			return `Double ${value}`;
		case "S":
			return `Single ${value}`;
		default:
			return dart;
	}
}

// Get current player
const getCurrentPlayer = computed(() => selectedPlayers.value[currentPlayerIndex.value]);

// Get last throw for a player
function getLastThrow(playerIndex: number): DartThrow | null {
	const playerThrows = gameHistory.value.filter((t) => t.playerIndex === playerIndex);
	return playerThrows.length > 0 ? playerThrows[playerThrows.length - 1] : null;
}

// Format last throw score
function formatLastThrow(throw_: DartThrow | null): string {
	if (!throw_) return "-";
	const multiplierSymbol = {
		single: "",
		double: "D",
		triple: "T",
	}[throw_.multiplier];

	return throw_.value === 25 && throw_.multiplier === "double"
		? "Bull"
		: `${multiplierSymbol}${throw_.value}`;
}

// Get last round total for a player
function getLastRoundTotal(playerIndex: number): number | null {
	// Get all throws in current leg for this player
	const throwsInLeg = gameHistory.value.filter(
		(t) => t.leg === currentLeg.value && t.playerIndex === playerIndex
	);

	if (throwsInLeg.length === 0) return null;

	// Group by turn index
	const turns = throwsInLeg.reduce((groups: DartThrow[][], throw_) => {
		const turnIndex = throw_.turnIndex ?? 0;
		if (!groups[turnIndex]) {
			groups[turnIndex] = [];
		}
		groups[turnIndex].push(throw_);
		return groups;
	}, []);

	// Get the last complete turn
	const lastTurn = turns[turns.length - 1];
	if (!lastTurn) return null;

	// Calculate total for the turn
	return lastTurn.reduce((total, dart) => {
		const multiplierValue = dart.multiplier === "triple" ? 3 : dart.multiplier === "double" ? 2 : 1;
		return total + dart.value * multiplierValue;
	}, 0);
}
</script>
