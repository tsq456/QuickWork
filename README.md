# QuickWork

QuickWork is a Raycast extension for sending structured messages to a Feishu group as a **user identity** (not bot identity), with automatic token refresh.

## Features

- `Qw` command for fast sending in Raycast search bar
- Input format: `正文 #前缀`
  - Example: `今天同步了版本进展 #日报`
- If `#前缀` is omitted, QuickWork reuses the last prefix automatically
- Final sent format stays: `前缀：正文`
- User OAuth authorization flow with local callback capture
- Auto refresh for `access_token` using `refresh_token`
- Retry once on `99991679` by forcing token refresh

## Commands

### 1) `Qw`
Send a message to the configured Feishu group.

Input examples:

- First time (set prefix): `完成了接口联调 #日报`
- Next times (reuse prefix): `今天修复了3个线上问题`

### 2) `Authorize Feishu`
Open Feishu OAuth page and automatically capture the authorization callback code.

QuickWork then exchanges tokens and stores latest auth state in local storage.

## Required Preferences

Configure in Raycast extension preferences:

- `Feishu App ID`
- `Feishu App Secret`
- `Feishu User Refresh Token`
- `Feishu OAuth Redirect URI`
- `Feishu Chat ID`

## OAuth Redirect URI Setup

Use a localhost callback URI and keep it consistent in both places:

1. Feishu Open Platform app settings
2. QuickWork preference: `Feishu OAuth Redirect URI`

Recommended value:

`http://127.0.0.1:14520/feishu-callback`

## Feishu Scopes

Recommended user scopes:

- `offline_access`
- `im:chat:read`
- `im:message`

## Local Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm test
npm run build
```

## Troubleshooting

### Authorization failed: Invalid OAuth state

- Close old authorization tabs
- Run `Authorize Feishu` once and complete that same opened page
- Do not reuse an old auth URL from previous runs

### 99991679 permission error

- Ensure required user scopes are enabled and published in Feishu app
- Re-authorize user after scope changes

### Prefix seems required every time

- Use single-input pattern correctly:
  - Set once: `正文 #前缀`
  - Reuse later: `正文`

## Security Notes

- Rotate exposed `app_secret`, `access_token`, and `refresh_token` immediately
- Avoid committing secrets into code or logs

