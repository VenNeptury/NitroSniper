## Nitro Sniper

A discord selfbot that automatically detects discord nitro codes in messages and attempts to redeem

# Setup

-   This tool is powered by the NodeJs javascript runtime environment. [Install nodejs here](https://nodejs.org/en/download/)
-   Clone this repository
-   Rename `src/config.json.example` to `src/config.json`
-   Open it with your favourite text editor and fill out accordingly:
    -   token: [Your discord token](https://github.com/Tyrrrz/DiscordChatExporter/wiki/Obtaining-Token-and-Channel-IDs#how-to-get-a-user-token 'How to get discord token')
    -   logChannel: [ID of text channel to log stuff to](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID- 'How to get channel ID')
    -   throttling:
        -   maxClaims: amount of claimed gifts before cooldown kicks in
        -   cooldownInHours: aforementioned cooldown (in hours)
-   Open a terminal [in this directory](https://www.groovypost.com/howto/open-command-window-terminal-window-specific-folder-windows-mac-linux/).
-   Run the following commands and leave the terminal open:
    ```bash
    npm install
    npm run start
    ```
