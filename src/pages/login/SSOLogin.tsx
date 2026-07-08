import { Icon } from "@hope-ui/solid"
import { FiGithub, FiLogIn } from "solid-icons/fi"
import { BsMicrosoft } from "solid-icons/bs"
import { AiOutlineGoogle, AiOutlineDingtalk } from "solid-icons/ai"
import { base_path, changeToken, r } from "~/utils"
import { getSetting, getSettingBool } from "~/store"
import { useRouter } from "~/hooks"
import { onCleanup, onMount } from "solid-js"

const SSOLogin = () => {
  const ssoSignEnabled = getSettingBool("sso_login_enabled")
  const loginPlatform = getSetting("sso_login_platform")
  const useCompatibility = getSettingBool("sso_compatibility_mode")
  const { searchParams, to } = useRouter()
  // Only trust a ?token= query param when SSO compatibility mode is the
  // active flow that actually produces it (server-side redirect after a
  // validated OAuth callback). Otherwise this becomes an unauthenticated
  // token-injection / login-CSRF vector via a crafted link.
  const token = searchParams["token"]
  if (ssoSignEnabled && useCompatibility && token != undefined && token != "") {
    changeToken(token)
    to(decodeURIComponent(searchParams.redirect || base_path || "/"), true)
  }
  onMount(() => {
    if (!ssoSignEnabled) {
      return
    }
    function messageEvent(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return
      }
      const data = event.data
      if (
        data &&
        typeof data === "object" &&
        typeof data.token === "string" &&
        data.token
      ) {
        changeToken(data.token)
        to(decodeURIComponent(searchParams.redirect || base_path || "/"), true)
      }
    }
    window.addEventListener("message", messageEvent)
    onCleanup(() => {
      window.removeEventListener("message", messageEvent)
    })
  })
  if (ssoSignEnabled) {
    const login = () => {
      const url = r.getUri() + "/auth/sso?method=sso_get_token"
      if (useCompatibility) {
        window.location.href = url
        return
      }
      window.open(url, "authPopup", "width=500,height=600")
    }
    let icon
    switch (loginPlatform) {
      case "Github":
        icon = FiGithub
        break
      case "Microsoft":
        icon = BsMicrosoft
        break
      case "Google":
        icon = AiOutlineGoogle
        break
      case "Dingtalk":
        icon = AiOutlineDingtalk
        break
      default:
        icon = FiLogIn
    }
    return (
      <Icon cursor="pointer" boxSize="$8" as={icon} p="$0_5" onclick={login} />
    )
  }
}

export { SSOLogin }
