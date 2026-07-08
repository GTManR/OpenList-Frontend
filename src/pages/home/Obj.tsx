import { Text, useColorModeValue, VStack, Button } from "@hope-ui/solid"
import {
  createEffect,
  createMemo,
  createSignal,
  lazy,
  Match,
  on,
  Show,
  Suspense,
  Switch,
} from "solid-js"
import { Error, FullLoading, LinkWithBase } from "~/components"
import { useObjTitle, usePath, useRouter, useT } from "~/hooks"
import {
  folderTurnstileToken,
  getPagination,
  getSetting,
  objStore,
  password,
  recordHistory,
  setPassword,
  setFolderTurnstileToken,
  /*layout,*/ State,
  me,
} from "~/store"
import { UserMethods } from "~/types"
import {
  TurnstileCaptcha,
  TurnstileCaptchaRef,
} from "~/pages/login/TurnstileCaptcha"
import { notify } from "~/utils"

const Folder = lazy(() => import("./folder/Folder"))
const File = lazy(() => import("./file/File"))
const Password = lazy(() => import("./Password"))
// const ListSkeleton = lazy(() => import("./Folder/ListSkeleton"));
// const GridSkeleton = lazy(() => import("./Folder/GridSkeleton"));

const [objBoxRef, setObjBoxRef] = createSignal<HTMLDivElement>()
export { objBoxRef }

export const Obj = () => {
  const t = useT()
  const cardBg = useColorModeValue("white", "$neutral3")
  const { pathname, searchParams, isShare, to } = useRouter()
  const { handlePathChange, refresh } = usePath()
  const turnstileSiteKey = () => getSetting("turnstile_site_key")
  const turnstileRequired = () => !!turnstileSiteKey()
  let turnstileRef: TurnstileCaptchaRef | undefined
  const submitPassword = async () => {
    if (turnstileRequired() && !folderTurnstileToken()) {
      notify.error(t("login.turnstile_required"))
      return
    }
    await refresh(true)
    // token is single-use; refresh it if we stay on the password form
    setFolderTurnstileToken("")
    turnstileRef?.reset()
  }
  const pagination = getPagination()
  const page = createMemo(() => {
    return pagination.type === "pagination"
      ? parseInt(searchParams["page"], 10) || 1
      : undefined
  })
  let lastPathname: string
  let lastPage: number | undefined
  createEffect(
    on([pathname, page], async ([pathname, page]) => {
      if (searchParams["pwd"]) {
        setPassword(searchParams["pwd"])
      }
      if (lastPathname) {
        recordHistory(lastPathname, lastPage)
      }
      lastPathname = pathname
      lastPage = page
      useObjTitle()
      await handlePathChange(pathname, page)
    }),
  )

  const isStorageError = createMemo(() => {
    const err = objStore.err
    return (
      err.includes("storage not found") || err.includes("please add a storage")
    )
  })

  const shouldShowStorageButton = createMemo(() => {
    return isStorageError() && UserMethods.is_admin(me())
  })

  const storageErrorActions = () => (
    <Button colorScheme="accent" onClick={() => to("/@manage/storages")}>
      {t("global.go_to_storages")}
    </Button>
  )
  return (
    <VStack
      ref={(el: HTMLDivElement) => setObjBoxRef(el)}
      class="obj-box"
      w="$full"
      rounded="$xl"
      bgColor={cardBg()}
      p="$2"
      shadow="$lg"
      spacing="$2"
    >
      <Suspense fallback={<FullLoading />}>
        <Switch>
          <Match when={objStore.err}>
            <Error
              msg={objStore.err}
              disableColor
              actions={
                shouldShowStorageButton() ? storageErrorActions() : undefined
              }
            />
          </Match>
          <Match
            when={[State.FetchingObj, State.FetchingObjs].includes(
              objStore.state,
            )}
          >
            <FullLoading />
            {/* <Show when={layout() === "list"} fallback={<GridSkeleton />}>
              <ListSkeleton />
            </Show> */}
          </Match>
          <Match when={objStore.state === State.NeedPassword}>
            <Password
              title={
                isShare()
                  ? t("shares.input_password")
                  : t("home.input_password")
              }
              password={password}
              setPassword={setPassword}
              enterCallback={submitPassword}
              submitDisabled={turnstileRequired() && !folderTurnstileToken()}
              captcha={
                <Show when={turnstileSiteKey()}>
                  <TurnstileCaptcha
                    siteKey={turnstileSiteKey()}
                    ref={(ref) => (turnstileRef = ref)}
                    onSuccess={(token) => setFolderTurnstileToken(token)}
                    onExpire={() => setFolderTurnstileToken("")}
                    onError={() => setFolderTurnstileToken("")}
                  />
                </Show>
              }
            >
              <Show when={!isShare()}>
                <Text>{t("global.have_account")}</Text>
                <Text
                  color="$info9"
                  as={LinkWithBase}
                  href={`/@login?redirect=${encodeURIComponent(
                    location.pathname,
                  )}`}
                >
                  {t("global.go_login")}
                </Text>
              </Show>
            </Password>
          </Match>
          <Match
            when={[State.Folder, State.FetchingMore].includes(objStore.state)}
          >
            <Folder />
          </Match>
          <Match when={objStore.state === State.File}>
            <File />
          </Match>
        </Switch>
      </Suspense>
    </VStack>
  )
}
