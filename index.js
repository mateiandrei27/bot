require('dotenv').config();
console.log("TOKEN din .env:", process.env.TOKEN);

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const allowedRoles = ['Robot']; // numele rolului care are voie să apese
const notifyRoles = ['1223393363449876610', '1205873310848516204']; // ID-uri de roluri care primesc ping

// Generare cod random 000.000
function generateCode() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${String(num).slice(0, 3)}.${String(num).slice(3)}`;
}

// Inițializare stații
let stations = {
  zi: generateCode(),
  actiuni: generateCode(),
  backup: generateCode()
};

// Embed cu valorile actuale din stații
function createEmbed() {
  return new EmbedBuilder()
    .setTitle("📻 Stațiile zilei")
    .setColor(0xA3E635)
    .setDescription(
      `🟡 **Statie Zi**: ${stations.zi}\n` +
      `🟣 **Statie Actiuni**: ${stations.actiuni}\n` +
      `🔴 **Statie Backup**: ${stations.backup}\n\n` +
      `*Apasă pe buton pentru a genera o nouă stație.*`
    );
}

// Butoanele
function createButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('generate_zi')
      .setLabel('🟡 Statie Zi')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('generate_actiuni')
      .setLabel('🟣 Statie Actiuni')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('generate_backup')
      .setLabel('🔴 Statie Backup')
      .setStyle(ButtonStyle.Primary),
  );
}

client.on('ready', async () => {
  console.log(`✅ Botul e pornit ca ${client.user.tag}`);

  const channel = await client.channels.fetch(process.env.CHANNEL_ID);

  if (!process.env.MESSAGE_ID) {
    const msg = await channel.send({
      embeds: [createEmbed()],
      components: [createButtons()]
    });
    console.log(`🟩 Mesaj postat cu ID: ${msg.id}`);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const member = await interaction.guild.members.fetch(interaction.user.id);
  if (!member.roles.cache.some(role => role.name === allowedRoles[0])) {
    await interaction.reply({
      content: '❌ Nu ai permisiunea să folosești acest buton.',
      ephemeral: true
    });
    return;
  }

  let updatedStationName = '';

  if (interaction.customId === 'generate_zi') {
    stations.zi = generateCode();
    updatedStationName = 'Stația Zi';
  } else if (interaction.customId === 'generate_actiuni') {
    stations.actiuni = generateCode();
    updatedStationName = 'Stația Acțiuni';
  } else if (interaction.customId === 'generate_backup') {
    stations.backup = generateCode();
    updatedStationName = 'Stația Backup';
  } else {
    return;
  }

  await interaction.update({
    embeds: [createEmbed()],
    components: [createButtons()]
  });

  const mentionText = `🔄 ${updatedStationName} a fost actualizată!\n<@&${notifyRoles[0]}> <@&${notifyRoles[1]}>`;

  const notifyMessage = await interaction.channel.send({
    content: mentionText,
    allowedMentions: {
      parse: [],
      roles: notifyRoles
    }
  });

  setTimeout(() => {
    notifyMessage.delete().catch(err =>
      console.error('❌ Eroare la ștergerea mesajului de ping:', err)
    );
  }, 60000);
});

client.login(process.env.TOKEN);