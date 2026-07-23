<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import InfoItemCard from '~/components/main-page/InfoItemCard.vue'
import { useOverlayStore } from '~/stores/overlay'
import { storeToRefs } from 'pinia'

import {
  createPanel,
  createKeyWidget,
  createKeyTextWidget,
  createCountWidget,
  type Panel,
} from '~/models/widgets'

const overlayStore = useOverlayStore()
const { panels, isEnabled: overlayEnabled } = storeToRefs(overlayStore)

function handleOpenSettings(panelName: string) {
  overlayStore.activePanelId = panelName
  // to be impl...
}

function handleMoreAction(panelName: string, action: string) {
  switch (action) {
    case 'copy': {
      const targetPanel = panels.value.find((p) => p.name === panelName)
      if (!targetPanel) break

      const copy: Panel = JSON.parse(JSON.stringify(targetPanel))
      copy.name = `${panelName} - Copy`
      copy.widgets.forEach((w) => {
        w.id = crypto.randomUUID()
        if (w.type === 'key') {
          w.countWidget.id = crypto.randomUUID()
          w.label.id = crypto.randomUUID()
        }
      })

      overlayStore.addPanel(copy)
      break
    }

    case 'rename': {
      const newName = window.prompt('请输入新的面板名称：', panelName)
      if (newName && newName.trim() !== '') {
        const success = overlayStore.renamePanel(panelName, newName.trim())
        if (!success) {
          alert('名称已存在或修改失败！')
        }
      }
      break
    }

    case 'delete': {
      if (confirm(`确定要删除面板 "${panelName}" 吗？`)) {
        overlayStore.removePanel(panelName)
      }
      break
    }
  }
}

async function toggleOverlay() {
  try {
    if (!overlayEnabled.value) {
      await invoke('show_overlay')
    } else {
      await invoke('hide_overlay')
    }
    overlayEnabled.value = !overlayEnabled.value
  } catch (error) {
    console.error(error)
  }
}

function handleAddPanel() {
  // Experimental
  const panel = createPanel('Panel')
  panel.widgets.push(
      createKeyWidget({
        x: 100,
        y: 100,
        zIndex: 1,
        keyBinding: 0,
        label: createKeyTextWidget({
          x: 19,
          y: 20,
          content: 'A',
          pressedContent: 'A',
          fontSize: 18,
          zIndex: 2,
        }),
        countWidget: createCountWidget({
          x: 25,
          y: 38,
          fontSize: 12,
          zIndex: 2,
        }),
      })
  )
  overlayStore.addPanel(panel)
}

onMounted(async () => {
  await overlayStore.listenForPanelUpdates()
  await overlayStore.initMainSyncListener()
})
</script>

<template>

  <div class="h-screen w-full text-white flex flex-col overflow-hidden relative">
    <main class="flex-1 overflow-y-auto p-4 pb-28 space-y-2">
      <InfoItemCard
          v-for="panel in panels"
          :key="panel.name"
          :name="panel.name"
          :model-value="panel.isVisible"
          @update:model-value="overlayStore.togglePanelVisibility(panel.name)"
          @settings="handleOpenSettings(panel.name)"
          @more="(action) => handleMoreAction(panel.name, action)"
      />
    </main>
  </div>

  <div class="fixed bottom-6 inset-x-0 flex justify-center items-center gap-3 px-4 z-50">

    <UButton @click="toggleOverlay" color="neutral" class="inline-flex items-center px-6 py-2 active:scale-95 transition-all">
      <Icon
          :name="overlayEnabled ? 'lucide:power-off' : 'lucide:power'"
          class="text-sm mr-3"
      />
      <span>{{ overlayEnabled ? '关闭Overlayer' : '启动Overlayer' }}</span>
    </UButton>

    <UButton color="neutral" class="inline-flex items-center px-6 py-2 active:scale-95 transition-all">
      <Icon name="lucide:settings" class="text-sm mr-3" />
      <span>设置</span>
    </UButton>

    <UButton @click="handleAddPanel" color="neutral" class="inline-flex items-center px-6 py-2 active:scale-95 transition-all">
      <Icon name="lucide:plus" class="text-sm mr-3" />
      <span>添加面板</span>
    </UButton>

  </div>
</template>