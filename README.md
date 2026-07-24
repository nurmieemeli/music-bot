# Discord Music Bot

Multi-source Discord music bot (YouTube, Spotify, SoundCloud) built on `discord.js` + `Lavalink`.

## Setup

1. **Discord bot**: create an application at the [Discord Developer Portal](https://discord.com/developers/applications), add a Bot user, enable no privileged intents (none needed), copy the **Bot Token** and **Application (Client) ID**, and invite it to your server with the `bot` and `applications.commands` scopes and permissions: Connect, Speak, Send Messages, Embed Links.
2. **Spotify app** (metadata only, no playback): create one at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), copy the Client ID/Secret.
3. **Genius API key**: create a client at [genius.com/api-clients](https://genius.com/api-clients), copy the Client Access Token.
4. Copy `.env.example` to `.env` and fill in all values.
5. Install dependencies: `npm install`
6. Register slash commands: `npm run deploy-commands` (set `DEPLOY_GUILD_ID` in `.env` first for instant registration to one test server; leave blank for global, which takes up to ~1 hour to propagate).
7. Start everything: `docker compose up -d --build`
8. Check logs: `docker compose logs -f bot`

## Commands

`/play`, `/search`, `/playlist`, `/queue`, `/remove`, `/nowplaying`, `/skip`, `/pause`, `/resume`, `/stop`, `/loop`, `/volume`, `/filter`, `/lyrics`

## Notes

- Spotify links are resolved to matching YouTube audio (Spotify has no bot-accessible audio streaming API).
- Re-run `npm run deploy-commands` any time a command's options change.
