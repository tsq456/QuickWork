import { closeMainWindow, getPreferenceValues, LaunchProps, LocalStorage, showToast, Toast } from "@raycast/api";
import { FeishuAuthState, readAuthState, writeAuthState } from "./lib/auth-state";
import { buildMessage, refreshFeishuUserAccessToken, sendFeishuTextByUser } from "./lib/feishu";

interface CommandArguments {
  body: string;
}

interface CommandPreferences {
  feishuAppId: string;
  feishuAppSecret: string;
  feishuUserRefreshToken: string;
  feishuOAuthRedirectUri: string;
  feishuChatId: string;
}

const REFRESH_SKEW_MS = 90 * 1000;
const LAST_PREFIX_KEY = "quickwork-last-prefix";

function isAccessTokenUsable(state: FeishuAuthState | undefined): boolean {
  if (!state) {
    return false;
  }
  return state.expiresAt > Date.now() + REFRESH_SKEW_MS;
}

async function resolveUserAccessToken(preferences: CommandPreferences): Promise<string> {
  const authState = await readAuthState();
  if (authState && isAccessTokenUsable(authState)) {
    return authState.accessToken;
  }

  const preferenceRefreshToken = preferences.feishuUserRefreshToken.trim();
  const refreshCandidates: string[] = [];
  const cachedRefreshToken = authState?.refreshToken;

  if (preferenceRefreshToken && !refreshCandidates.includes(preferenceRefreshToken)) {
    refreshCandidates.push(preferenceRefreshToken);
  }
  if (cachedRefreshToken && !refreshCandidates.includes(cachedRefreshToken)) {
    refreshCandidates.push(cachedRefreshToken);
  }

  const errors: string[] = [];
  for (const refreshToken of refreshCandidates) {
    try {
      const refreshed = await refreshFeishuUserAccessToken({
        appId: preferences.feishuAppId,
        appSecret: preferences.feishuAppSecret,
        refreshToken,
      });

      const nextState: FeishuAuthState = {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: Date.now() + refreshed.expiresIn * 1000,
      };
      await writeAuthState(nextState);
      return nextState.accessToken;
    } catch (error) {
      errors.push((error as Error).message);
    }
  }

  if (errors.length === 0) {
    throw new Error("No refresh token available. Please configure feishuUserRefreshToken in extension preferences.");
  }

  throw new Error(`Failed to refresh Feishu user token. ${errors[errors.length - 1]}`);
}

async function forceRefreshWithPreferenceToken(preferences: CommandPreferences): Promise<string> {
  const refreshed = await refreshFeishuUserAccessToken({
    appId: preferences.feishuAppId,
    appSecret: preferences.feishuAppSecret,
    refreshToken: preferences.feishuUserRefreshToken,
  });

  const nextState: FeishuAuthState = {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresAt: Date.now() + refreshed.expiresIn * 1000,
  };
  await writeAuthState(nextState);
  return nextState.accessToken;
}

async function resolveMessagePrefix(inputPrefix?: string): Promise<string> {
  const cleanInputPrefix = (inputPrefix ?? "").trim();
  if (cleanInputPrefix) {
    await LocalStorage.setItem(LAST_PREFIX_KEY, cleanInputPrefix);
    return cleanInputPrefix;
  }

  const cachedPrefix = (await LocalStorage.getItem<string>(LAST_PREFIX_KEY))?.trim();
  if (cachedPrefix) {
    return cachedPrefix;
  }

  throw new Error("Prefix is empty. Please input a prefix at least once.");
}

function parseBodyAndOptionalPrefix(input: string): { body: string; prefix?: string } {
  const cleanInput = input.trim();
  if (!cleanInput) {
    return { body: "" };
  }

  const hashIndex = cleanInput.lastIndexOf("#");
  if (hashIndex === -1) {
    return { body: cleanInput };
  }

  const bodyPart = cleanInput.slice(0, hashIndex).trim();
  const prefixPart = cleanInput.slice(hashIndex + 1).trim();

  if (!bodyPart) {
    return { body: "", prefix: prefixPart };
  }
  if (!prefixPart) {
    return { body: bodyPart };
  }

  return { body: bodyPart, prefix: prefixPart };
}

export default async function Command(props: LaunchProps<{ arguments: CommandArguments }>) {
  const rawInput = props.arguments.body ?? "";
  const preferences = getPreferenceValues<CommandPreferences>();

  try {
    const { body, prefix } = parseBodyAndOptionalPrefix(rawInput);
    const effectivePrefix = await resolveMessagePrefix(prefix);
    const message = buildMessage(body, effectivePrefix);
    let accessToken = await resolveUserAccessToken(preferences);

    await closeMainWindow();
    try {
      await sendFeishuTextByUser({
        userAccessToken: accessToken,
        chatId: preferences.feishuChatId,
        text: message,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (!errorMessage.includes("99991679")) {
        throw error;
      }

      accessToken = await forceRefreshWithPreferenceToken(preferences);
      await sendFeishuTextByUser({
        userAccessToken: accessToken,
        chatId: preferences.feishuChatId,
        text: message,
      });
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Message sent",
      message: "Feishu group has received your user message.",
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Send failed",
      message: (error as Error).message,
    });
  }
}
