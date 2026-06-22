<template>
  <div class="global-layout">
    <LanguageSwitcher />
    <main class="main-content">
      <router-view />
    </main>
    <footer class="footer">
      <div class="footer-main desktop-layout">
        <div class="footer-brand">
          <img class="footer-mark" src="https://cdn.wristo.io/brands/wristo-logo/svg/wristo-mark.svg" alt="" aria-hidden="true" />
          <span>© Wristo 2026</span>
        </div>
        <nav class="footer-nav" aria-label="Footer links">
          <a href="#">{{ t('footer.terms') }}</a>
          <a href="#">{{ t('footer.privacy') }}</a>
        </nav>
        <div class="footer-note">
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
  color: $color-footer-text;
  font-size: 0.95rem;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.94);
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.8);
  padding: 14px 16px;
  padding-bottom: max(14px, env(safe-area-inset-bottom));
  width: 100%;
  position: relative;
  bottom: 0;
  left: 0;
  margin-top: auto;
  text-align: center;
  outline: none;
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.3s ease;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.footer-main {
  width: min(100%, 1180px);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  color: #4b5563;
  font-size: 0.95rem;
  letter-spacing: 0;
}
.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #374151;
  font-weight: 700;
}
.footer-mark {
  width: 22px;
  height: 22px;
  padding: 3px;
  border: 1px solid rgba(15, 107, 104, 0.18);
  border-radius: 999px;
  background: #dff5f1;
}
.footer-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.footer-nav a {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  color: #4b5563;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  margin: 0;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.footer-nav a:hover,
.footer-nav a:focus-visible {
  background: rgba(15, 107, 104, 0.1);
  color: #064e4b;
  outline: none;
  box-shadow: 0 0 0 3px rgba(15, 107, 104, 0.14);
}
.footer-note {
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
    z-index: 100;
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.96);
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -10px 24px rgba(17, 24, 39, 0.08);
    padding: 12px 16px max(12px, env(safe-area-inset-bottom));
    min-height: auto;
    margin-top: 32px;
  }

  .footer-main {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .footer-brand {
    font-size: 0.9rem;
  }

  .footer-nav {
    justify-content: center;
  }

  .footer-note {
    max-width: none;
    text-align: center;
  }
}
</style> 
