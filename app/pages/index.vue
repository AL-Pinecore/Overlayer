<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import InfoItemCard from '~/components/main-page/InfoItemCard.vue'
import { useOverlayStore } from '~/composables/stores/useOverlayStore.ts'
import { storeToRefs } from 'pinia'

import { createPanel, type Panel } from '~/models/widgets'
import { createWidget, regenerateWidgetIds } from '~/widgets/registry'
import {
  registerBuiltinWidgets,
  type KeyProps,
  type KeyTextProps,
  type CountProps, type RainProps,
} from '~/widgets/builtin'
import type {RGBA} from "~/models/color.ts";

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
      // Recursively assign fresh ids (children included), no per-type hardcoding
      regenerateWidgetIds(copy.widgets)

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

  panel.x = 100
  panel.y = 700

  panel.widgets.push(
      createWidget<KeyProps>('key', {
        x: 0,
        y: 0,
        zIndex: 1,
        props: {
          keyBinding: 2,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: 'Tab',
              pressedContent: 'Tab',
              fontSize: 16,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 25,
        y: -5,
        zIndex: 2,
        props: {
          width: 50,
          keyBinding: 2,
        }
      }),

      createWidget<KeyProps>('key', {
        x: 55,
        y: 0,
        zIndex: 1,
        props: {
          keyBinding: 18,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: '1',
              pressedContent: '1',
              fontSize: 18,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 80,
        y: -5,
        zIndex: 2,
        props: {
          width: 50,
          keyBinding: 18,
        }
      }),

      createWidget<KeyProps>('key', {
        x: 110,
        y: 0,
        zIndex: 1,
        props: {
          keyBinding: 19,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: '2',
              pressedContent: '2',
              fontSize: 18,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 135,
        y: -5,
        zIndex: 2,
        props: {
          width: 50,
          keyBinding: 19,
        }
      }),

      createWidget<KeyProps>('key', {
        x: 165,
        y: 0,
        zIndex: 1,
        props: {
          keyBinding: 14,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: 'E',
              pressedContent: 'E',
              fontSize: 17,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 190,
        y: -5,
        zIndex: 2,
        props: {
          width: 50,
          keyBinding: 14,
        }
      }),

      createWidget<KeyProps>('key', {
        x: 220,
        y: 0,
        zIndex: 1,
        props: {
          keyBinding: 35,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: 'P',
              pressedContent: 'P',
              fontSize: 17,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 245,
        y: -5,
        zIndex: 2,
        props: {
          width: 50,
          keyBinding: 35,
        }
      }),

      createWidget<KeyProps>('key', {
        x: 275,
        y: 0,
        zIndex: 1,
        props: {
          keyBinding: 24,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 12,
            zIndex: 2,
            props: {
              content: '=',
              pressedContent: '=',
              fontSize: 17,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 300,
        y: -5,
        zIndex: 2,
        props: {
          width: 50,
          keyBinding: 24,
        }
      }),

      createWidget<KeyProps>('key', {
        x: 330,
        y: 0,
        zIndex: 1,
        props: {
          keyBinding: 51,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: '←',
              pressedContent: '←',
              fontSize: 16,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 355,
        y: -5,
        zIndex: 2,
        props: {
          width: 50,
          keyBinding: 51,
        }
      }),

      createWidget<KeyProps>('key', {
        x: 385,
        y: 0,
        zIndex: 1,
        props: {
          keyBinding: 42,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: '\\',
              pressedContent: '\\',
              fontSize: 18,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 410,
        y: -5,
        zIndex: 2,
        props: {
          width: 50,
          keyBinding: 42,
        }
      }),

      createWidget<KeyProps>('key', {
        x: 0,
        y: 55,
        zIndex: 1,
        props: {
          keyBinding: 0,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: '⇪',
              pressedContent: '⇪',
              fontSize: 18,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 25,
        y: -5,
        zIndex: 3,
        props: {
          width: 42,
          keyBinding: 0,
          backgroundColor: {color: '#52525C', alpha: 1}
        }
      }),

      createWidget<KeyProps>('key', {
        x: 55,
        y: 55,
        zIndex: 1,
        props: {
          keyBinding: 1,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: 'Ctrl',
              pressedContent: 'Ctrl',
              fontSize: 16,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 80,
        y: -5,
        zIndex: 3,
        props: {
          width: 42,
          keyBinding: 1,
          backgroundColor: {color: '#52525C', alpha: 1}
        }
      }),

      createWidget<KeyProps>('key', {
        x: 110,
        y: 55,
        zIndex: 1,
        props: {
          keyBinding: 8,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: 'C',
              pressedContent: 'C',
              fontSize: 18,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 135,
        y: -5,
        zIndex: 3,
        props: {
          width: 42,
          keyBinding: 8,
          backgroundColor: {color: '#52525C', alpha: 1}
        }
      }),

      createWidget<KeyProps>('key', {
        x: 165,
        y: 55,
        zIndex: 1,
        props: {
          keyBinding: 49,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 10,
            zIndex: 2,
            props: {
              content: '␣',
              pressedContent: '␣',
              fontSize: 17,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 190,
        y: -5,
        zIndex: 3,
        props: {
          width: 42,
          keyBinding: 49,
          backgroundColor: {color: '#52525C', alpha: 1}
        }
      }),

      createWidget<KeyProps>('key', {
        x: 220,
        y: 55,
        zIndex: 1,
        props: {
          keyBinding: 26,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 10,
            zIndex: 2,
            props: {
              content: '.',
              pressedContent: '.',
              fontSize: 24,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 245,
        y: -5,
        zIndex: 3,
        props: {
          width: 42,
          keyBinding: 26,
          backgroundColor: {color: '#52525C', alpha: 1}
        }
      }),

      createWidget<KeyProps>('key', {
        x: 275,
        y: 55,
        zIndex: 1,
        props: {
          keyBinding: 47,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: 'Alt',
              pressedContent: 'Alt',
              fontSize: 16,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 300,
        y: -5,
        zIndex: 3,
        props: {
          width: 42,
          keyBinding: 47,
          backgroundColor: {color: '#52525C', alpha: 1}
        }
      }),

      createWidget<KeyProps>('key', {
        x: 330,
        y: 55,
        zIndex: 1,
        props: {
          keyBinding: 5,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: '↓',
              pressedContent: '↓',
              fontSize: 18,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 355,
        y: -5,
        zIndex: 3,
        props: {
          width: 42,
          keyBinding: 5,
          backgroundColor: {color: '#52525C', alpha: 1}
        }
      }),

      createWidget<KeyProps>('key', {
        x: 385,
        y: 55,
        zIndex: 1,
        props: {
          keyBinding: 36,
          label: createWidget<KeyTextProps>('keyText', {
            x: 25,
            y: 15,
            zIndex: 2,
            props: {
              content: '↵',
              pressedContent: '↵',
              fontSize: 18,
            },
          }),
          countWidget: createWidget<CountProps>('count', {
            x: 25,
            y: 38,
            zIndex: 2,
            props: {
              fontSize: 12,
            },
          }),
        },
      }),
      createWidget<RainProps>('rain', {
        x: 410,
        y: -5,
        zIndex: 3,
        props: {
          width: 42,
          keyBinding: 36,
          backgroundColor: {color: '#52525C', alpha: 1}
        }
      }),
  )
  overlayStore.addPanel(panel)
}

onMounted(async () => {
  await overlayStore.listenForPanelUpdates()
  await overlayStore.listenForRuntimeStateUpdates() // Receives runtime state (counts) from overlay
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