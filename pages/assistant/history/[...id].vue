<template>
	<!-- ... -->
</template>

<script setup lang="ts">
interface GameThrow {
    value: number;
    multiplier: 'single' | 'double' | 'triple';
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
    stats: Record<number, {
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
    }>;
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
    '180': string;
    'Ton+': string;
    'Finish': string;
    'Bust': string;
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
    if (!gameData.value || !gameData.value.players) return '-';
    return gameData.value.players.map(p => `${p.legsWon || 0}`).join(' - ');
};

const getCheckoutPercentage = (playerIndex: number): string => {
    if (!gameData.value?.stats?.[playerIndex]) return '0';
    const stats = gameData.value.stats[playerIndex];
    if (!stats.checkoutAttempts) return '0';
    return ((stats.checkoutSuccesses / stats.checkoutAttempts) * 100).toFixed(1);
};

const formatDart = (dart: DartThrow): string => {
    if (!dart) return '-';
    const multiplierMap: DartMultiplier = { single: '', double: 'D', triple: 'T' };
    return `${multiplierMap[dart.multiplier]}${dart.value}`;
};

const formatCheckout = (checkout: string[]): string => {
    if (!checkout || !checkout.length) return '-';
    return checkout.join(' - ');
};

const getHighlightClass = (highlight: string): string => {
    const classes: HighlightClasses = {
        '180': 'bg-yellow-100 text-yellow-800',
        'Ton+': 'bg-blue-100 text-blue-800',
        'Finish': 'bg-green-100 text-green-800',
        'Bust': 'bg-red-100 text-red-800',
        default: 'bg-gray-100 text-gray-800'
    };
    return classes[highlight as keyof HighlightClasses] || classes.default;
};

const formatDate = (date: string): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getLegHistory = (): LegHistory[] => {
    if (!gameData.value) return [];

    const history = gameData.value.history;
    const legs: LegHistory[] = [];
    let currentLeg: LegHistory | null = null;

    history.forEach((throw_, index) => {
        if (!currentLeg || throw_.leg !== currentLeg.legIndex) {
            if (currentLeg) {
                legs.push(currentLeg);
            }
            currentLeg = {
                legIndex: throw_.leg,
                winner: '',
                duration: 0,
                players: gameData.value!.players.map(p => ({
                    name: p.name,
                    score: gameData.value!.gameType,
                    darts: 0,
                    first9Score: 0,
                    first9Darts: 0,
                    highestScore: 0,
                    checkoutSuccess: false,
                    checkoutAttempts: 0
                })),
                turns: []
            };
        }

        // Process turn data...
        // Rest of the function remains unchanged
    });

    if (currentLeg) {
        legs.push(currentLeg);
    }

    return legs;
};
</script>
