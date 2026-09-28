export type XiaohongshuStatus =
  | 'pending'
  | 'scanned'
  | 'authorized'
  | 'expired'
  | 'denied'
export interface XiaohongshuPollResult {
  status: XiaohongshuStatus
  interval: number
}

// Schedule only after a request finishes: never overlap polls or accept a cancelled response.
export function createXiaohongshuPolling(options: {
  poll: () => Promise<XiaohongshuPollResult>
  onStatus: (status: XiaohongshuStatus) => void
  onError: (error: unknown) => void
  now?: () => number
  schedule?: (
    callback: () => Promise<void>,
    delay: number,
  ) => ReturnType<typeof setTimeout>
  cancel?: (handle: ReturnType<typeof setTimeout>) => void
}) {
  const now = options.now ?? Date.now
  const schedule =
    options.schedule ?? ((callback, delay) => setTimeout(callback, delay))
  const cancel = options.cancel ?? clearTimeout
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  function stop() {
    generation++
    if (timer !== undefined) cancel(timer)
    timer = undefined
  }
  function start(interval: number, expiresIn: number) {
    stop()
    const current = generation
    const deadline = now() + expiresIn * 1000
    function enqueue(seconds: number) {
      timer = schedule(
        async () => {
          if (current !== generation) return
          if (now() >= deadline) {
            options.onStatus('expired')
            return
          }
          try {
            const result = await options.poll()
            if (current !== generation) return
            options.onStatus(result.status)
            if (
              current === generation &&
              ['pending', 'scanned'].includes(result.status)
            )
              enqueue(result.interval)
          } catch (error) {
            if (current === generation) options.onError(error)
          }
        },
        Math.min(Math.max(1, seconds) * 1000, Math.max(0, deadline - now())),
      )
    }
    enqueue(interval)
  }
  return { start, stop }
}
