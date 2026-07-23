<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useOverlayStore } from '~/stores/overlay'
import { drawPanel } from '~/render/widgets'

const overlayStore = useOverlayStore()
const overlayCanvas = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null

const resizeCanvas = () => {
  const canvas = overlayCanvas.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
}

async function initListeners() {
  await overlayStore.initGlobalKeyEventListener()
  await overlayStore.listenForPanelUpdates()
  await overlayStore.requestInitialPanels()
}

onMounted(() => {
  // fire-and-forget
  initListeners().catch((err) => {
    console.error('overlay init failed:', err)
  })

  const canvas = overlayCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  const render = () => {
    const dpr = window.devicePixelRatio || 1

    ctx.save()
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

    for (const panel of overlayStore.visiblePanels) {
      drawPanel(ctx, panel, overlayStore)
    }

    ctx.restore()

    animationFrameId = requestAnimationFrame(render)
  }

  render()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <canvas
      ref="overlayCanvas"
      class="overlay w-screen h-screen pointer-events-none relative overflow-hidden select-none"
  ></canvas>
</template>

<style>
html,
body,
#__nuxt {
  background: transparent !important;
  margin: 0;
  overflow: hidden;
}
</style>

<style scoped>
.overlay {
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  user-select: none;
}
</style>