const botkit = require('botkit');

module.exports = class {
  constructor(options = {}) {
    this.storage = options.storage;
    this.clientSigningSecret = options.clientSigningSecret;
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.token = options.token;
    this.actions = {};
    this.commands = {};
    this.slack = botkit
      .slackbot(
        {
          debug: true,
          json_file_store: this.storage,
          clientSigningSecret: this.clientSigningSecret,
        },
      )
      .configureSlackApp(
        {
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          scopes: [
            'commands',
            'bot',
          ],
        },
      );
  }

  start(port) {
    this.slack.startTicking();
    this.slack.setupWebserver(port, () => {
      this.slack.createWebhookEndpoints(this.slack.webserver);
      this.slack.createOauthEndpoints(this.slack.webserver, (error, req, res) => {
        if (error) {
          res.status(500).send(`Error: ${error.message}`);
        } else {
          res.send('Success');
        }
      });
    });
    this.slack
      .spawn({ token: this.token })
      .startRTM((err) => {
        if (err) {
          throw new Error(`Could not connect to Slack:${err}`);
        }
      });
    this.slack.hears(['string', 'pattern .*', new RegExp('.*', 'i')], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
      const team = this.slack.storage.teams.get(message.team);

      if (!team) {
        this.slack.storage.teams.save(
          {
            id: message.team,
            bot: {
              user_id: bot.identity.id,
              name: bot.identity.name,
            },
          },
          (error) => {
            if (error) {
              throw new Error(`ERROR: ${error}`);
            }
          },
        );

        bot.reply(message, 'Congratulations! You have installed your botkit chat bot!');
      }
    });

    this.slack.on('interactive_message_callback', (bot, message) => {
      this.actions[message.callback_id](bot, message);
    });

    this.slack.on('slash_command', (bot, message) => {
      const command = message.command.replace(/^\//, '');

      this.commands[command](bot, message);
    });
  }

  action(action, fn) {
    this.actions[action] = fn;

    return this;
  }

  command(command, fn) {
    this.commands[command] = fn;

    return this;
  }
};
