# slack.js

Build slack command bot with simple interface.

## Usage

```js
const SlackCommand = require('slack-command.js');

const bot = new SlackCommand({ ... });

bot
  .command('test', (bot, message) => {})
  .action('...')
  .start(3000);
```

## Install

```bash
npm i slack-command.js
```