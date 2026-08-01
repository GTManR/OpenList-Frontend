export const userAgent =
  typeof window !== "undefined" ? window.navigator.userAgent : ""
export const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent,
  )
export const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent)
export const isWechat = /MicroMessenger/i.test(userAgent)
export const isIE = /MSIE|Trident/i.test(userAgent)
export const isMac = (window?.navigator?.platform ?? "")?.includes("Mac")
export const getPlatform = () => {
  const ua = userAgent
  const platform = window?.navigator?.platform ?? ""

  // The order of checks is important.
  if (/android/i.test(ua)) {
    return "Android"
  }

  // iOS check for iPhone, iPod, and iPad (including modern iPads reporting as Mac).
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (platform.includes("Mac") && navigator.maxTouchPoints > 1)
  ) {
    return "iOS"
  }

  if (/windows/i.test(ua)) {
    return "Windows"
  }

  if (/macintosh|mac os x/i.test(ua)) {
    return "MacOS"
  }

  if (/linux/i.test(ua)) {
    return "Linux"
  }

  return "Unknown"
}

/** True when the page is opened via localhost / private IP / .local (intranet). */
export const isPrivateHost = (hostname = window?.location?.hostname ?? "") => {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase()
  if (!host) return false
  if (host === "localhost" || host === "::1" || host.endsWith(".local")) {
    return true
  }
  const parts = host.split(".").map((p) => Number(p))
  if (
    parts.length === 4 &&
    parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
  ) {
    const [a, b] = parts
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    )
  }
  return false
}
