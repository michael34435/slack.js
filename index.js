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
          debug: process.env.NODE_ENV !== 'production',
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
    const slackbot = this.slack
      .spawn({ token: this.token })
      .startRTM((err) => {
        if (err) {
          throw new Error(`Could not connect to Slack:${err}`);
        }

        slackbot.api.team.info({}, (error, res) => {
          this.slack.storage.teams.get(res.team.id, (storageErr, team) => {
            if (!team) {
              this.slack.storage.teams.save(
                {
                  id: res.team.id,
                  bot: {
                    user_id: slackbot.identity.id,
                    name: slackbot.identity.name,
                  },
                },
                (teamError) => {
                  if (teamError) {
                    throw new Error(`ERROR: ${teamError}`);
                  }
                },
              );
            }
          });
        });
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
