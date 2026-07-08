import { createEffect, onCleanup, onMount } from "solid-js"

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

let scriptLoadPromise: Promise<void> | null = null

function loadTurnstileScript() {
  if (window.turnstile) {
    return Promise.resolve()
  }
  if (scriptLoadPromise) {
    return scriptLoadPromise
  }
  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptLoadPromise = null
      script.remove()
      reject(new Error("Turnstile script failed to load"))
    }
    document.head.appendChild(script)
  })
  return scriptLoadPromise
}

export interface TurnstileCaptchaRef {
  reset: () => void
}

interface TurnstileCaptchaProps {
  siteKey: string
  onSuccess: (token: string) => void
  onExpire: () => void
  onError: () => void
  ref?: (ref: TurnstileCaptchaRef) => void
}

export const TurnstileCaptcha = (props: TurnstileCaptchaProps) => {
  let containerRef: HTMLDivElement | undefined
  let widgetId: string | null = null

  const removeWidget = () => {
    if (widgetId && window.turnstile) {
      window.turnstile.remove(widgetId)
      widgetId = null
    }
  }

  const renderWidget = async () => {
    if (!props.siteKey || !containerRef) {
      return
    }
    try {
      await loadTurnstileScript()
    } catch {
      props.onError()
      return
    }
    removeWidget()
    widgetId = window.turnstile!.render(containerRef, {
      sitekey: props.siteKey,
      theme: "auto",
      callback: (token: string) => props.onSuccess(token),
      "expired-callback": () => props.onExpire(),
      "error-callback": () => props.onError(),
    })
  }

  const reset = () => {
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId)
    } else {
      renderWidget()
    }
    props.onExpire()
  }

  onMount(() => {
    props.ref?.({ reset })
  })

  createEffect(() => {
    props.siteKey
    renderWidget()
  })

  onCleanup(() => {
    removeWidget()
  })

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        "justify-content": "center",
        "min-height": "65px",
        width: "100%",
      }}
    />
  )
}
