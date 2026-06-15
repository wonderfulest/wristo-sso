<template>
  <div class="global-layout">
    <LanguageSwitcher />
    <main class="main-content">
      <router-view />
    </main>
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-left">
          <span class="footer-brand">
            <img class="footer-mark" src="https://cdn.wristo.io/brands/wristo-logo/svg/wristo-mark.svg" alt="" aria-hidden="true" />
            © Wristo 2026
          </span>
          <div class="footer-links">
            <a href="#">{{ t('footer.terms') }}</a>
            <a href="#">{{ t('footer.privacy') }}</a>
          </div>
        </div>
        <div class="footer-right">
          {{ t('footer.disclaimer') }}
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.global-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $color-bg;
}
.header {
  background: $color-bg;
  color: $color-link;
  padding: 0;
}
.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
}
.logo {
  display: flex;
  align-items: center;
  font-size: 2.2rem;
  font-weight: bold;
}
.logo-icon {
  color: $color-success;
  font-size: 2.2rem;
  font-weight: 700;
  margin-right: 6px;
}
.logo-text {
  color: $color-link;
  font-weight: 700;
  font-size: 2.2rem;
}
.header-right {
  display: flex;
  gap: 24px;
  align-items: center;
}
.header-right a {
  color: $color-link;
  font-weight: 500;
  text-decoration: none;
  font-size: 1.1rem;
  transition: color 0.2s;
}
.header-right a:hover {
  color: $color-success;
}
.main-content {
  flex: 1 0 auto;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 20px 0 0 0;
  display: flex;
  flex-direction: column;
}
.footer {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.8);
  padding: 14px 0;
  padding-bottom: max(14px, env(safe-area-inset-bottom));
  width: 100%;
  font-size: $font-size-xs;
  position: relative;
  bottom: 0;
  left: 0;
  margin-top: auto;
}
.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 32px;
  font-size: $font-size-sm;
  color: $color-footer-text;
}
.footer-left {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #4b5563;
  font-weight: 600;
}
.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.footer-mark {
  width: 22px;
  height: 22px;
  padding: 3px;
  border: 1px solid rgba(25, 179, 107, 0.18);
  border-radius: 999px;
  background: #f0fdf7;
}
.footer-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.footer-links a {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  color: #4b5563;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.footer-links a:hover,
.footer-links a:focus-visible {
  background: rgba(25, 179, 107, 0.1);
  color: $color-success;
  outline: none;
  box-shadow: 0 0 0 3px rgba(25, 179, 107, 0.14);
}
.footer-right {
  max-width: 380px;
  color: #667085;
  font-weight: 600;
  text-align: right;
}
.dropdown-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  border-radius: 8px;
  padding: 10px 0;
  position: absolute;
  right: 0;
  top: 60px;
  min-width: 160px;
  z-index: 100;
}
.dropdown-content a {
  width: 100%;
  padding: 10px 24px;
  color: #222;
  text-decoration: none;
  font-size: 1rem;
  transition: background 0.2s, color 0.2s;
  box-sizing: border-box;
  display: block;
}
.dropdown-content a:hover {
  background: #f5f5f5;
  color: #19b36b;
}
.user-profile-dropdown {
  position: relative;
}

@media (max-width: 600px) {
  .main-content {
    padding-top: 8px;
  }

  .footer {
    padding: 16px 0;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }

  .footer-inner,
  .footer-left,
  .footer-links {
    flex-direction: column;
  }

  .footer-inner {
    gap: 12px;
    padding: 0 20px;
    text-align: left;
  }

  .footer-left,
  .footer-links {
    align-items: flex-start;
    gap: 8px;
  }

  .footer-right {
    max-width: none;
    text-align: left;
  }
}
</style> 
