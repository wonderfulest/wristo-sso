export const isChinaSso =
  import.meta.env.VITE_WRISTO_REGION === 'cn' ||
  window.location.hostname === 'sso.wristo.cn'
