import { Badge } from "@hope-ui/solid"
import { Show } from "solid-js"
import { useT } from "~/hooks"
import { isLastWatchedItem } from "~/store/watch_history"

export const LastWatchedBadge = (props: {
  folderPath: string
  fileName: string
}) => {
  const t = useT()
  return (
    <Show when={isLastWatchedItem(props.folderPath, props.fileName)}>
      <Badge colorScheme="accent" flexShrink={0}>
        {t("home.obj.last_watched")}
      </Badge>
    </Show>
  )
}
