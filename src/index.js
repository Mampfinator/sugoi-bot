require('dotenv').config();
const { EmbedBuilder, Colors, Events } = require('discord.js');

const { recordMetrics, getMetrics } = require('./metrics');
const { SUGOIS_COMMAND } = require('./sugois');

// Create a new client instance
const client = require('./client').getClient();

// Regular expression to match the target words
const SUGOI_REGEX = /sugoi|すごい|unbelievable|🦜|amazing|relink|granblue+/g;

client.on(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.displayName}`);
});

// Listen for messages
client.on(Events.MessageCreate, async (message) => {
    // If the message is from a bot, ignore it
    if (message.author.bot) return;

    const matches = [...message.content.toLowerCase().matchAll(SUGOI_REGEX)];

    // If the message does not contain the target words, ignore it
    if (!matches || matches.length <= 0) return;

    // Reply to the message with a message
    await message
        .reply({
            content: '🦜すごい🦜すごい🦜アンビリーバボー🦜',
            allowedMentions: {
                parse: [],
            },
        })
        .catch(() => {});

    await message.react('🦜').catch(() => {});

    await recordMetrics(message);
});

client.on(Events.InteractionCreate, async (interaction) => {
    // if the interaction is not a slash command, ignore it
    if (!interaction.isChatInputCommand()) return;

    try {
        // for now, just hardcode commands. Probably good enough.
        if (interaction.commandName == 'sugois') {
            SUGOIS_COMMAND.handler(interaction);
        }
    } catch (error) {
        console.error(error);

        if (interaction.isRepliable() && !interaction.replied) {
            await interaction
                .reply({
                    ephemeral: true,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(Colors.Red)
                            .setDescription('Something went wrong!'),
                    ],
                })
                .catch(console.error);
        }
    }
});

async function main() {
    // ensure metrics.json exists before we login and receive events.
    const metrics = await getMetrics();
    if (!metrics['total']) {
        console.error(
            'Old "metrics.json" format detected! Run "npm run update-json" and restart the bot.'
        );
        return process.exit(1);
    }

    // login.
    // this will throw an error if the token is invalid
    await client.login(process.env.DISCORD_TOKEN);
}

main();
