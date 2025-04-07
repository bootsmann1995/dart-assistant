interface DartThrow {
    value: number;
    multiplier: 'single' | 'double' | 'triple';
    playerIndex: number;
    score: number;
    leg: number;
    wasBust: boolean;
    turnIndex: number;
}

interface GameStats {
    totalAverage: number;
    checkoutRate: number;
    totalGames: number;
    gamesWon: number;
    bestLegAverage: number;
    bestLegDarts: number;
    scores180: number;
    scores140Plus: number;
    scores100Plus: number;
    averageFirst9: number;
    commonCheckoutMisses: Array<{
        score: number;
        attempts: number;
        successes: number;
    }>;
    strengths: string[];
    weaknesses: string[];
    trainingTips: string[];
    recentTrend: 'improving' | 'steady' | 'declining';
}

export const useDashboardStats = () => {
    const { getGamesBasedOnUserAsync } = useGamesStatusX01();
    const auth = useAuth();

    const calculateStats = async (): Promise<GameStats | null> => {
        const authResult = await auth.getUserAsync();
        if (!authResult?.user?.id) return null;

        const gamesResponse = await getGamesBasedOnUserAsync(authResult.user.id);
        if (!gamesResponse.data || gamesResponse.data.length === 0) return null;

        // Get last 30 games where the user is a player
        const recentGames = gamesResponse.data
            .filter(game => {
                const gameData = JSON.parse(game.game_data);
                return gameData.players.some(p => p.name === authResult.user.email);
            })
            .slice(0, 30)
            .map(game => JSON.parse(game.game_data));

        if (recentGames.length === 0) return null;

        let totalScore = 0;
        let totalDarts = 0;
        let checkoutAttempts = 0;
        let checkoutSuccesses = 0;
        let gamesWon = 0;
        let bestLegAverage = 0;
        let bestLegDarts = Infinity;
        let totalFirst9Score = 0;
        let totalFirst9Rounds = 0;
        let scores180 = 0;
        let scores140Plus = 0;
        let scores100Plus = 0;
        const checkoutMisses = new Map<number, { attempts: number; successes: number }>();

        for (const game of recentGames) {
            const playerIndex = game.players.findIndex(p => p.name === authResult.user.email);
            if (playerIndex === -1) continue;

            const player = game.players[playerIndex];
            if (player.name === game.winner) gamesWon++;

            // Process each leg
            let currentLeg = 1;
            let legScore = 0;
            let legDarts = 0;
            let first9Score = 0;
            let first9Count = 0;

            // Get all throws for this player
            const playerThrows = (game.history as DartThrow[])
                .filter(t => t.playerIndex === playerIndex)
                .sort((a, b) => a.leg - b.leg || a.turnIndex - b.turnIndex);

            // Group throws by turn for checkout tracking
            const turnGroups = new Map<string, DartThrow[]>();
            playerThrows.forEach((throw_: DartThrow) => {
                const turnKey = `${throw_.leg}-${throw_.turnIndex}`;
                if (!turnGroups.has(turnKey)) {
                    turnGroups.set(turnKey, []);
                }
                const throws = turnGroups.get(turnKey);
                if (throws) throws.push(throw_);
            });

            for (const throw_ of playerThrows) {
                // Handle leg change
                if (throw_.leg !== currentLeg) {
                    if (legDarts > 0) {
                        const legAverage = (legScore / legDarts) * 3;
                        if (legAverage > bestLegAverage) {
                            bestLegAverage = legAverage;
                            bestLegDarts = legDarts;
                        }
                        totalScore += legScore;
                        totalDarts += legDarts;
                    }
                    currentLeg = throw_.leg;
                    legScore = 0;
                    legDarts = 0;
                    first9Score = 0;
                    first9Count = 0;
                }

                // Calculate score for this throw
                const dartScore = throw_.value * (throw_.multiplier === 'double' ? 2 : throw_.multiplier === 'triple' ? 3 : 1);

                // Track high scores in this turn
                const turnKey = `${throw_.leg}-${throw_.turnIndex}`;
                const turnThrows = turnGroups.get(turnKey) || [];
                const turnScore = turnThrows.reduce((sum: number, t: DartThrow) => {
                    return sum + t.value * (t.multiplier === 'double' ? 2 : t.multiplier === 'triple' ? 3 : 1);
                }, 0);

                if (turnScore === 180) scores180++;
                else if (turnScore >= 140) scores140Plus++;
                else if (turnScore >= 100) scores100Plus++;

                // Track first 9
                if (first9Count < 3) {
                    first9Score += dartScore;
                    first9Count++;
                    if (first9Count === 3) {
                        totalFirst9Score += first9Score;
                        totalFirst9Rounds++;
                    }
                }

                legScore += dartScore;
                legDarts++;

                // Track checkouts - only on the last throw of a turn
                if (throw_ === turnThrows[turnThrows.length - 1]) {
                    const turnStartScore = turnThrows[0].score;
                    if (turnStartScore <= 170) {
                        checkoutAttempts++;
                        // Check if this turn finished the leg
                        const isLastThrowInLeg = playerThrows.filter(t => t.leg === throw_.leg).pop() === throw_;
                        if (isLastThrowInLeg && throw_.multiplier === 'double') {
                            checkoutSuccesses++;
                        } else {
                            const missData = checkoutMisses.get(turnStartScore) || { attempts: 0, successes: 0 };
                            missData.attempts++;
                            checkoutMisses.set(turnStartScore, missData);
                        }
                    }
                }
            }

            // Add final leg stats
            if (legDarts > 0) {
                const legAverage = (legScore / legDarts) * 3;
                if (legAverage > bestLegAverage) {
                    bestLegAverage = legAverage;
                    bestLegDarts = legDarts;
                }
                totalScore += legScore;
                totalDarts += legDarts;
            }
        }

        // Calculate final stats
        const totalAverage = totalDarts > 0 ? (totalScore / totalDarts) * 3 : 0;
        const checkoutRate = checkoutAttempts > 0 ? (checkoutSuccesses / checkoutAttempts) * 100 : 0;
        const averageFirst9 = totalFirst9Rounds > 0 ? totalFirst9Score / totalFirst9Rounds : 0;

        // Sort checkout misses by attempts
        const sortedCheckoutMisses = Array.from(checkoutMisses.entries())
            .sort((a, b) => b[1].attempts - a[1].attempts)
            .slice(0, 5)
            .map(([score, data]) => ({
                score,
                attempts: data.attempts,
                successes: data.successes
            }));

        // Analyze strengths and weaknesses
        const strengths: string[] = [];
        const weaknesses: string[] = [];
        const trainingTips: string[] = [];

        if (totalAverage >= 60) strengths.push("Strong scoring average");
        else weaknesses.push("Scoring average needs improvement");

        if (checkoutRate >= 40) strengths.push("Good checkout percentage");
        else weaknesses.push("Checkout success rate needs work");

        if (scores180 > 0) strengths.push(`Hit ${scores180} maximum scores`);
        if (scores140Plus > scores180 * 2) strengths.push("Consistent high scoring");

        // Generate training tips
        if (checkoutRate < 40) {
            trainingTips.push("Practice double shooting with round the clock");
            if (sortedCheckoutMisses.length > 0) {
                trainingTips.push(`Focus on ${sortedCheckoutMisses[0].score} checkout practice`);
            }
        }

        if (totalAverage < 60) {
            trainingTips.push("Practice grouping around treble 20");
            trainingTips.push("Work on consistent throw mechanics");
        }

        if (averageFirst9 < 50) {
            trainingTips.push("Focus on strong starting scores");
        }

        return {
            totalAverage,
            checkoutRate,
            totalGames: recentGames.length,
            gamesWon,
            bestLegAverage,
            bestLegDarts,
            scores180,
            scores140Plus,
            scores100Plus,
            averageFirst9,
            commonCheckoutMisses: sortedCheckoutMisses,
            strengths,
            weaknesses,
            trainingTips,
            recentTrend: 'steady' // TODO: Implement trend analysis
        };
    };

    return {
        calculateStats
    };
};
