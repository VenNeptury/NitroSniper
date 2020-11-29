## Nitro Sniper

A discord selfbot that automatically detects discord nitro codes in messages and attempts to redeem

# Setup

-   This tool is powered by the NodeJs javascript runtime environment. [Install nodejs here](https://nodejs.org/en/download/)
-   Clone this repository
-   Rename `src/config.json.example` to `src/config.json`
-   Open it with your favourite text editor and fill out accordingly:
    -   token: [Your discord token](https://github.com/Tyrrrz/DiscordChatExporter/wiki/Obtaining-Token-and-Channel-IDs#how-to-get-a-user-token 'How to get discord token').
        Sniped codes will be redeemed here. This account will NOT be used as bot, codes are NOT being sniped via it
    -   userAgent: The user-agent that will be used to make the http request to redeem sniped codes. Make this the user-agent that the discord app uses. How to obtain:
        -   Open the chrome console (CTRL + SHIFT + I)
        -   Go to the network tab
        -   Start typing and click on the typing entry
        -   Go to the headers tab of this item and search for user-agent, copy the entire thing
    -   slaves: An array of accounts that will be used as bots to snipe codes. Syntax: `[ "Token 1", "Token 2", ... ]`
    -   webhook: [OPTIONAL] Webhook that will be used to log sniped codes to a discord channel of your choice. [Setup](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks)
    -   throttling:
        -   maxClaims: amount of claimed gifts before cooldown kicks in
        -   cooldownInHours: aforementioned cooldown (in hours)
-   Open a terminal [in the current directory](https://www.groovypost.com/howto/open-command-window-terminal-window-specific-folder-windows-mac-linux/).
-   Run the following commands and leave the terminal open:
    ```bash
    npm install
    npm run start
    ```
