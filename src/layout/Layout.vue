<template>
  <div class="global-layout">
    <!-- Header -->
    <header class="header">
      <div class="header-inner">
        <div class="logo">
          <span class="logo-icon">W</span>
          <span class="logo-text">pay</span>
        </div>
        <div class="header-right">
          <a href="/account">ACCOUNT</a>
          <a href="#">DOCUMENTATION</a>
          <a href="/API" v-if="hasMerchantRole">API</a>
        </div>
        <div class="user-profile-dropdown">
          <div class="user-profile-name" @click="toggleDropdown">
            {{ userStore.userInfo?.username }}
            <span class="dropdown-arrow">▼</span>
          </div>
          <div class="dropdown-content" v-if="isDropdownOpen">
            <a href="/account/profile">Edit Profile</a>
            <a href="/account/password">Change Password</a>
            <a href="#" @click.prevent="handleLogout">Log Out</a>
          </div>
        </div>
      </div>
    </header>
    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>
    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-left">
          <span class="footer-icon">🐦</span>
          <span>© Wristo 2025</span>
        </div>
        <div class="footer-links">
          <a href="#">Terms of Use</a>
          <a href="#">Privacy Policy</a>
          <a href="mailto:support@wristo.io">support@wristo.io</a>
        </div>
        <div class="footer-right">
          <span>Wristo</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
const router = useRouter()
const userStore = useUserStore()
const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}

const hasMerchantRole = computed(() => {
  const roles: any[] = (userStore.userInfo && Array.isArray((userStore.userInfo as any).roles)) ? (userStore.userInfo as any).roles : []
  return roles.some((role: any) => role.roleCode === 'ROLE_MERCHANT')
})

// 下拉菜单控制
const isDropdownOpen = ref(false)
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}
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
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 32px 0 0 0;
}
.footer {
  background: $color-footer-bg;
  padding: 8px 0;
  width: 100%;
  position: sticky;
  bottom: 0;
  left: 0;
  margin-top: auto;
  font-size: $font-size-xs;
}
.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  font-size: $font-size-sm;
  color: $color-footer-text;
}
.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.footer-icon {
  font-size: $font-size-sm;
}
.footer-links {
  display: flex;
  gap: 18px;
}
.footer-links a {
  color: $color-footer-text;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-links a:hover {
  color: $color-success;
}
.footer-right {
  font-weight: bold;
  color: $color-footer-text;
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
</style> 