<template>
  <div class="container mx-auto p-4">
    <div class="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
      <h1 class="text-2xl md:text-3xl font-bold">Game History</h1>
      <NuxtLink to="/games/x01" class="w-full md:w-auto px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 shadow-sm">
        New Game
      </NuxtLink>
    </div>

    <div v-if="isLoading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading games...</p>
    </div>

    <div v-else-if="games.length === 0" class="text-center py-8">
      <p class="text-gray-600 mb-4">No games found in your history.</p>
      <NuxtLink to="/games/x01" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
        Start New Game
      </NuxtLink>
    </div>

    <div v-else class="space-y-4">
      <div v-for="game in games" :key="game.id" 
           class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
        <NuxtLink :to="`/assistant/history/${game.id}`" class="block">
          <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="flex-grow">
              <h3 class="text-lg font-semibold mb-1">
                {{ getGameTitle(game.game_data) }}
              </h3>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <p class="text-gray-600">
                  {{ formatDate(game.created_at) }}
                </p>
                <p v-if="currentUserId && getPlayerAverage(game.game_data, currentUserId)" 
                   class="text-emerald-600 font-medium">
                  Avg: {{ getPlayerAverage(game.game_data, currentUserId) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="text-lg font-medium">
                  {{ getGameScore(game.game_data) }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ getGameType(game.game_data) }}
                </p>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface GameX01 {
  id: string
  game_data: string
  created_at: string
  user_id: string
}

const { getUserAsync } = useAuth()
const { getGamesBasedOnUserAsync } = useGamesStatusX01()

const games = ref<GameX01[]>([])
const isLoading = ref(true)
const currentUserId = ref<string | null>(null)

onMounted(async () => {
  const userResp = await getUserAsync()
  if (userResp?.user) {
    currentUserId.value = userResp.user.id
    const gamesResp = await getGamesBasedOnUserAsync(userResp.user.id)
    if (gamesResp?.data) {
      games.value = gamesResp.data
    }
  }
  isLoading.value = false
})

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getGameTitle(gameData: string) {
  try {
    const data = JSON.parse(gameData)
    const winner = data.winner || 'Unknown'
    const loser = data.players?.find((p: { name: string }) => p.name !== winner)?.name || 'Unknown'
    return `${winner} vs ${loser}`
  } catch (e) {
    return 'Game Details'
  }
}

function getGameScore(gameData: string) {
  try {
    const data = JSON.parse(gameData)
    const winnerLegs = data.players?.find((p: { name: string, legsWon: number }) => p.name === data.winner)?.legsWon || 0
    const loserLegs = data.players?.find((p: { name: string, legsWon: number }) => p.name !== data.winner)?.legsWon || 0
    return `${winnerLegs} - ${loserLegs}`
  } catch (e) {
    return ''
  }
}

function getGameType(gameData: string) {
  try {
    const data = JSON.parse(gameData)
    return `${data.gameType || 501} - Best of ${data.numberOfLegs || 3}`
  } catch (e) {
    return '501'
  }
}

function getPlayerAverage(gameData: string, userId: string) {
  try {
    const data = JSON.parse(gameData)
    const player = data.players?.find((p: any) => p.user_id === userId)
    if (player) {
      const playerIndex = data.players.indexOf(player)
      return data.stats[playerIndex]?.average || 0
    }
    return null
  } catch (e) {
    return null
  }
}
</script>

<style>

</style>