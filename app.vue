<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
// Prevent double-tap zooming on mobile devices
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' }
  ],
  style: [
    {
      children: `
        html, body {
          touch-action: manipulation;
        }
      `
    }
  ]
})
</script>
