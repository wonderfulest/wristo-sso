<template>
  <div class="lang-switcher" role="navigation" :aria-label="t('language.selector')">
    <button class="current" type="button" :aria-expanded="isOpen" @click="isOpen = !isOpen">
      <span>{{ getLanguageLabel(currentLocale) }}</span>
      <span class="chevron" :class="{ rotated: isOpen }" aria-hidden="true">v</span>
    </button>
    <div class="buttons" :class="{ open: isOpen }">
      <button
        v-for="locale in supportedLocales"
        :key="locale"
        class="option"
        :class="{ active: locale === currentLocale }"
        type="button"
        @click="switchLanguage(locale)"
      >
        {{ getLanguageLabel(locale) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import { addLocaleToPath, normalizeLocale, SUPPORTED_LOCALES, useLocaleStore } from '@/store/locale'

const route = useRoute()
const router = useRouter()
const localeStore = useLocaleStore()
const { t } = useI18n()
const isOpen = ref(false)
const supportedLocales = SUPPORTED_LOCALES
const languageLabels: Record<string, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  zh: '中文',
}

const currentLocale = computed(() => {
  const p = route.params.lang
  const fromParam = Array.isArray(p) ? p[0] : (typeof p === 'string' ? p : undefined)
  const q = route.query.lang
  const fromQuery = Array.isArray(q) ? (q[0] ?? undefined) : (typeof q === 'string' && q ? q : undefined)
  return normalizeLocale(fromParam || fromQuery || localeStore.currentLocale)
})

function switchLanguage(targetLang: string) {
  const locale = normalizeLocale(targetLang)
  localeStore.setLocale(locale)
  isOpen.value = false

  const nextPath = addLocaleToPath(route.path, locale)
  if (nextPath !== route.path) {
    router.push({ path: nextPath, query: route.query, hash: route.hash })
  }
}

function getLanguageLabel(locale: string) {
  return languageLabels[normalizeLocale(locale)]
}
</script>

<style scoped>
.lang-switcher {
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 50;
}

.buttons {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  display: none;
  min-width: 148px;
  padding: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14);
}

.buttons.open {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.current,
.option {
  appearance: none;
  border: 1px solid transparent;
  color: #334155;
  background: transparent;
  font-weight: 750;
  cursor: pointer;
  transition: all .2s ease;
}

.current {
  min-height: 38px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.84);
  border-color: rgba(15, 23, 42, 0.08);
}

.current:hover,
.current:focus-visible {
  color: #0f6b68;
  background: #eef6f4;
  outline: none;
}

.chevron {
  font-size: 0.72rem;
  transition: transform .2s ease;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.option {
  width: 100%;
  min-height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  text-align: left;
  white-space: nowrap;
}

.option:hover,
.option.active {
  color: #0f6b68;
  background: rgba(15, 107, 104, 0.08);
}

@media (max-width: 600px) {
  .lang-switcher {
    top: 10px;
    right: 12px;
  }
}
</style>
