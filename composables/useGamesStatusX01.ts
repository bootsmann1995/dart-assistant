import { type Friend } from '~/types/friend';

type Multiplier = "single" | "double" | "triple";

interface DartThrow {
    value: number;
    multiplier: Multiplier;
    playerIndex: number;
    score: number;
    leg: number;
    wasBust: boolean;
    turnIndex?: number;
}

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
    checkoutAttempts: number;
    checkoutSuccesses: number;
    checkoutPercentage: number;
}

interface GameState {
    gameType: number;
    numberOfLegs: number;
    players: {
        name: string;
        score: number;
        legsWon: number;
        user_id?: string;
        avatar?: string;
    }[];
    invited_users: string[];
    history: DartThrow[];
    stats: {
        [playerIndex: number]: PlayerStats;
    };
    winner: string | null;
    completedAt: string;
}

export const useGamesStatusX01 = () => {
    const { getClient, isAuthenticatedAsync } = useAuth();
    
    const getGamesBasedOnUserAsync = async (userId: string) => {
        // Fetch games where user is the creator
        const ownGames = await getClient()
            .from('games-x01')
            .select('*')
            .eq('user_id', userId);

        // Fetch games where user is in invited_users array
        const participatedGames = await getClient()
            .from('games-x01')
            .select('*')
            .contains('invited_users', [userId]);

        // Combine and sort all games
        const allGames = [...(ownGames.data || []), ...(participatedGames.data || [])];
        return {
            data: allGames.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ),
            error: ownGames.error || participatedGames.error
        };
    }

    const getGameByIdAsync = async (gameId: string) => {
        return await getClient().from('games-x01').select('*').eq('id', gameId).single()
    }

    const saveGameAsync = async (userId: string, gameState: GameState) => {
        if (await isAuthenticatedAsync()) {
            // Get all player user_ids except the creator
            const invitedUsers = gameState.players
                .map(p => p.user_id)
                .filter(id => id && id !== userId);

            return await getClient().from('games-x01').insert({
                user_id: userId,
                game_type: gameState.gameType,
                number_of_legs: gameState.numberOfLegs,
                players: gameState.players,
                invited_users: invitedUsers,
                history: gameState.history,
                stats: gameState.stats,
                winner: gameState.winner,
                completed_at: gameState.completedAt
            });
        }
        throw new Error("User not authenticated");
    }

    const sendGameInviteAsync = async (sendingTo: string) => {
        if (await isAuthenticatedAsync()) {
            const { data: { user } } = await getClient().auth.getUser();
            if (!user) {
                throw new Error("User not authenticated");
            }

            return await getClient().from('requests').insert({
                type: 'x01Invite',
                sender: user.id,
                sending_to: sendingTo,
                status: 'pending',
            });
        }
        throw new Error("User not authenticated");
    }

    const getGameInvitesAsync = async () => {
        if (await isAuthenticatedAsync()) {
            const { data: { user } } = await getClient().auth.getUser();
            if (!user) {
                throw new Error("User not authenticated");
            }

            const { data: requests } = await getClient()
                .from('requests')
                .select('*')
                .eq('type', 'x01Invite')
                .eq('sending_to', user.id)
                .eq('status', 'pending');

            if (!requests) return [];

            // Filter out expired requests (older than 2 minutes)
            const twoMinutesAgo = new Date();
            twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);

            const validRequests = [];
            for (const request of requests) {
                const requestDate = new Date(request.created_at);
                if (requestDate < twoMinutesAgo) {
                    // Update expired request status
                    await updateGameInviteStatusAsync(request.id, 'expired');
                    continue;
                }

                // Fetch sender's user data
                const { data: senderData } = await getClient()
                    .from('user_meta_data')
                    .select('nick_name, email')
                    .eq('user_id', request.sender)
                    .single();

                validRequests.push({
                    ...request,
                    sender: {
                        nick_name: senderData?.nick_name,
                        email: senderData?.email
                    }
                });
            }

            return validRequests;
        }
        return [];
    }

    const updateGameInviteStatusAsync = async (requestId: string, status: 'accepted' | 'declined' | 'expired') => {
        if (await isAuthenticatedAsync()) {
            return await getClient()
                .from('requests')
                .update({ status })
                .eq('id', requestId);
        }
        throw new Error("User not authenticated");
    }

    const getInviteStatusAsync = async (requestId: string) => {
        const { data } = await getClient()
            .from('requests')
            .select('*')
            .eq('id', requestId)
            .single();
        
        return data?.status || null;
    }

    return {
        getGamesBasedOnUserAsync,
        getGameByIdAsync,
        saveGameAsync,
        sendGameInviteAsync,
        getGameInvitesAsync,
        updateGameInviteStatusAsync,
        getInviteStatusAsync
    }
}