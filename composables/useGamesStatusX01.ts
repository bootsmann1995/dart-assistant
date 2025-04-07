export const useGamesStatusX01 = () => {
    const { getClient, isAuthenticatedAsync } = useAuth();
    
    const getGamesBasedOnUserAsync = async (userId: string) => {
        return await getClient().from('games-x01').select('*').eq('user_id', userId)
    }

    const saveGameAsync = async (userId: string, game: any) => {
        if(await isAuthenticatedAsync()) {
            return await getClient().from('games-x01').insert({
                user_id: userId,
                game_data: JSON.stringify(game),
            })
        } else {
            alert("login to save game to your history");
            return null
        }
    }
    
    return {
        getGamesBasedOnUserAsync,
        saveGameAsync
    }
}