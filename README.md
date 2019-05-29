# slack.js

Build slack command bot with simple interface.

## Usage

```js
const SlackBot = require('slack.js');

const bot = new SlackBot({ ... });

bot
  .command('test', (bot, message) => {})
  .action()
  .start(3000);
```

## Install

```bash
npm i slack.js
```