const { 
  Client, 
  GatewayIntentBits, 
  ActivityType, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType 
} = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is Online 24/7!'));
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

const TICKET_CHANNEL_ID = '1563664620387041411';
const VOICE_CHANNEL_ID  = '1563611513393123378';

client.once('ready', async () => {
  console.log(`Bot is ready: ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: '! 𝐕 ⋆ Roles', type: ActivityType.Playing }],
    status: 'online'
  });

  async function connectToVoice() {
    try {
      const channel = client.channels.cache.get(VOICE_CHANNEL_ID);
      if (!channel) return;

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true
      });

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          connection.destroy();
          setTimeout(connectToVoice, 5000);
        }
      });
    } catch (error) {
      console.error('Voice error:', error);
    }
  }

  if (VOICE_CHANNEL_ID !== 'PUT_VOICE_CHANNEL_ID_HERE') {
    connectToVoice();
  }

  try {
    const ticketChannel = await client.channels.fetch(TICKET_CHANNEL_ID).catch(() => null);
    if (ticketChannel) {
      const messages = await ticketChannel.messages.fetch({ limit: 5 });
      if (messages.size === 0) {
        const embed = new EmbedBuilder()
          .setTitle('VALHALLA Ticket')
          .setThumbnail('https://cdn.discordapp.com/attachments/1563325742001954930/1563718366764597328/9ceee1bbdf5b21310c6d3a6a0aa4b20e.png?ex=6adea5b7&is=6add5437&hm=752fdb007d0083be3a08f92a856f74bd05873dd9bfe7ac2937b28e3f052eccbb&')
          .setDescription('**لفتح تكت قم بالضغط علي الزر بالأسفل**')
          .setColor('#8B0000')
          .setImage('https://cdn.discordapp.com/attachments/1563325742001954930/1563718317984841748/image.png?ex=6adea5ab&is=6add542b&hm=b34c8bb4ca4907f3514f31a12c910fbc7964c781ebb2882f62762040efefbbe6&')
          .setFooter({ text: '! 𝐕 ⋆ Roles • System' });

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('valhalla_ticket_select')
            .setPlaceholder('اختر القائمة المناسبة لك')
            .addOptions([
              {
                label: 'تذكرة دعم فني',
                description: 'واجهك مشكلة؟ فريق الدعم لمساعدتك',
                value: 'support_ticket',
                emoji: '<:valhalla:1563723114721050645>'
              },
              {
                label: 'التقديم على الإدارة',
                description: 'قدم طلبك للأنضمام الى فريق الادارة وابدأ رحلتك في تنظيم وتطوير السيرفر',
                value: 'apply_ticket',
                emoji: '<:valhalla:1563722622691315842>'
              },
              { 
                      label: 'أستلام جائزتك',
                description: 'استلم هداياك وجوائزك بكل سهولة اضغط هنا',
                value: 'Gift_ticket',
                emoji: '<:gift:1563724882402082868>'
              },
              {
                label: 'توثيق بنات',
                description: 'قسم مخصص لتوثيق البنات وفق الشروط لضمان بيئة موثوقه وآمنة',
                value: 'verify_ticket',
                emoji: '<:pink:1563724646287675443>'
              }
            ])
        );

        await ticketChannel.send({ embeds: [embed], components: [row] });
      }
    }
  } catch (err) {
    console.error('Ticket send error:', err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'valhalla_ticket_select') {
      const choice = interaction.values[0];
      const user = interaction.user;
      const guild = interaction.guild;

      let categoryName = 'ticket';
      if (choice === 'support_ticket') categoryName = 'support';
      else if (choice === 'apply_ticket') categoryName = 'apply';
      else if (choice === 'shop_ticket') categoryName = 'shop';

      const ticketChannel = await guild.channels.create({
        name: `${categoryName}-${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle(`VALHALLA - ${categoryName.toUpperCase()} TICKET`)
        .setDescription(`أهلاً بك ${user} في تذكرتك الخاصة.`)
        .setColor('#8B0000');

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_valhalla_ticket').setLabel('إغلاق التذكرة 🔒').setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [closeRow] });
      return interaction.reply({ content: `✅ تم فتح تذكرتك بنجاح: ${ticketChannel}`, ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'close_valhalla_ticket') {
      await interaction.reply({ content: '🔒 جاري إغلاق التذكرة وحذفها خلال 5 ثوانٍ...', ephemeral: true });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
});

client.login(process.env.TOKEN);
