<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

interface Props {
  name: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'settings'): void
  (e: 'more', action: string): void
}>()

const enabled = defineModel<boolean>({ default: false })

const items: DropdownMenuItem[][] = [
  [
    {
      label: '复制配置',
      icon: 'i-lucide-copy',
      onSelect: () => emit('more', 'copy')
    },
    {
      label: '重命名',
      icon: 'i-lucide-pencil',
      onSelect: () => emit('more', 'rename')
    }
  ],
  [
    {
      label: '删除',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => emit('more', 'delete')
    }
  ]
]
</script>

<template>
  <div class="h-16 w-full px-4 rounded-sm bg-zinc-200/30 dark:bg-zinc-800/30 flex items-center justify-between  backdrop-blur-md">
    <span class="font-semibold text-sm text-neutral-200 truncate pr-4 text-zinc-700 dark:text-zinc-100">
      {{ name }}
    </span>

    <div class="flex items-center gap-2 shrink-0">
      <USwitch
          v-model="enabled"
          color="neutral"
          class="mr-3"
      />

      <UButton
          icon="i-lucide-settings"
          color="neutral"
          variant="link"
          title="设置"
          @click="emit('settings')"
      />

      <UDropdownMenu
          :items="items"
          :ui="{
            content: 'font-semibold'
          }"
      >
        <UButton
            icon="i-lucide-more-vertical"
            color="neutral"
            variant="link"
            title="更多"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>