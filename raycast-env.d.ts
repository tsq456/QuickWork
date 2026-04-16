/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Feishu App ID - App ID used to refresh user token (e.g. cli_xxx) */
  "feishuAppId": string,
  /** Feishu App Secret - App Secret used to refresh user token */
  "feishuAppSecret": string,
  /** Feishu User Refresh Token - User refresh token used to obtain access token automatically */
  "feishuUserRefreshToken": string,
  /** Feishu OAuth Redirect URI - Must be configured in your app, e.g. http://127.0.0.1:14520/feishu-callback */
  "feishuOAuthRedirectUri": string,
  /** Feishu Chat ID - Target group chat ID (e.g. oc_xxx) */
  "feishuChatId": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `send-feishu-message` command */
  export type SendFeishuMessage = ExtensionPreferences & {}
  /** Preferences accessible in the `authorize-feishu` command */
  export type AuthorizeFeishu = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `send-feishu-message` command */
  export type SendFeishuMessage = {
  /** 输入正文，后缀可写 #前缀（例：今天总结 #日报） */
  "body": string
}
  /** Arguments passed to the `authorize-feishu` command */
  export type AuthorizeFeishu = {}
}

