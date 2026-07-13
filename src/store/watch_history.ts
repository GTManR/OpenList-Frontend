import { createSignal } from "solid-js"
import { UserMethods } from "~/types"
import { pathDir, pathJoin, r } from "~/utils"
import { me } from "./user"

const STORAGE_KEY = "last_watched"
const MAX_ENTRIES = 500

export const WATCH_DWELL_MS = 3000

export type LastWatchedMap = Record<string, string>

const [lastWatched, setLastWatchedSignal] =
  createSignal<LastWatchedMap>(loadLocal())

export function folderKeyFromFile(filePath: string): string {
  const dir = pathDir(filePath)
  return dir || "/"
}

export function folderKeyFromListing(listPath: string): string {
  return listPath || "/"
}

export function filePathInFolder(folderPath: string, fileName: string): string {
  return pathJoin(folderPath === "/" ? "" : folderPath, fileName)
}

function loadLocal(): LastWatchedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function saveLocal(map: LastWatchedMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

function trimMap(map: LastWatchedMap): LastWatchedMap {
  const keys = Object.keys(map)
  if (keys.length <= MAX_ENTRIES) {
    return map
  }
  const next = { ...map }
  for (let i = 0; i < keys.length - MAX_ENTRIES; i++) {
    delete next[keys[i]]
  }
  return next
}

function applyMap(map: LastWatchedMap) {
  const next = trimMap(map)
  setLastWatchedSignal(next)
  saveLocal(next)
}

export function syncWatchHistoryFromAccount(prefs?: {
  last_watched?: LastWatchedMap
}) {
  if (!prefs?.last_watched) return
  applyMap(prefs.last_watched)
}

export function getLastWatchedFile(folderPath: string): string | undefined {
  return lastWatched()[folderPath]
}

export function isLastWatchedItem(
  folderPath: string,
  fileName: string,
): boolean {
  const map = lastWatched()
  const folder = folderKeyFromListing(folderPath)
  const stored = map[folder]
  if (!stored) return false
  return stored === filePathInFolder(folder, fileName)
}

export async function commitLastWatched(folderPath: string, filePath: string) {
  const folder = folderPath
  const file = filePath
  const user = me()
  if (user.id && !UserMethods.is_guest(user)) {
    try {
      const resp = await r.post("/me/last-watched", {
        folder: folder,
        file: file,
      })
      if (resp.data?.data?.last_watched) {
        applyMap(resp.data.data.last_watched)
        return
      }
    } catch {
      // Fall back to local cache when the account sync request fails.
    }
  }
  applyMap({ ...lastWatched(), [folder]: file })
}

export { lastWatched }
