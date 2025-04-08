export const useGamesStatusX01 = () => {
    const { getClient, isAuthenticatedAsync } = useAuth();
    
    const getGamesBasedOnUserAsync = async (userId: string) => {
        // Fetch games where user is the creator
        const ownGames = await getClient()
            .from('games-x01')
            .select('*')
            .eq('user_id', userId);

        // Fetch games where user is in other_users
        const participatedGames = await getClient()
            .from('games-x01')
            .select('*')
            .ilike('other_users', `%${userId}%`);

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

    const saveGameAsync = async (userId: string, game: any) => {
        if(await isAuthenticatedAsync()) {
            return await getClient().from('games-x01').insert({
                user_id: userId,
                game_data: JSON.stringify(game),
                other_users: "",
            })
        } else {
            alert("login to save game to your history");
            return null
        }
    }
    
    return {
        getGamesBasedOnUserAsync,
        getGameByIdAsync,
        saveGameAsync
    }
}