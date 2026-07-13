import { onCleanup, onMount } from "solid-js"
import {
  commitLastWatched,
  folderKeyFromFile,
  WATCH_DWELL_MS,
} from "~/store/watch_history"

export function useWatchDwell(filePath: string) {
  const folderPath = folderKeyFromFile(filePath)
  let timer: ReturnType<typeof setTimeout> | undefined
  let committed = false

  const commit = () => {
    if (committed) return
    committed = true
    void commitLastWatched(folderPath, filePath)
  }

  onMount(() => {
    timer = setTimeout(commit, WATCH_DWELL_MS)
  })

  onCleanup(() => {
    if (timer) clearTimeout(timer)
  })
}

export function startWatchDwell(folderPath: string, filePath: string) {
  setTimeout(() => {
    void commitLastWatched(folderPath, filePath)
  }, WATCH_DWELL_MS)
}
