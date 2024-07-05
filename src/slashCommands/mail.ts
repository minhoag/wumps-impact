import {
	ActionRowBuilder,
	CommandInteraction,
	Events,
	ModalBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle
} from 'discord.js'
import { SlashCommand, User } from '../types'
import client from '../index'
import moment from 'moment/moment'
import { getUsers } from '../function'

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('mail')
    .setDescription('Gửi lệnh Mail cho người chơi.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 1,
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    const modal = new ModalBuilder()
      .setCustomId('mailForm')
      .setTitle('Nội dung Thư');
    const receiver = new TextInputBuilder()
      .setCustomId('receiverInput')
      .setLabel('Nguời nhận:Người gửi')
      .setPlaceholder('1:Paimon')
      .setStyle(TextInputStyle.Short);

    const expiry = new TextInputBuilder()
      .setCustomId('expiryInput')
      .setLabel('Thời hạn thư (tính theo ngày)')
      .setPlaceholder('14')
      .setStyle(TextInputStyle.Short);

    const title = new TextInputBuilder()
      .setCustomId('titleInput')
      .setLabel('Tiêu đề thư')
      .setPlaceholder("Ví dụ: It's Paimon's Birthday!")
      .setStyle(TextInputStyle.Short);

    const description = new TextInputBuilder()
      .setCustomId('descriptionInput')
      .setLabel('Nội dung thư')
      .setPlaceholder(
        "Ví dụ: You might be only one of countless stars, but you're Paimon's whole world!"
      )
      .setStyle(TextInputStyle.Paragraph);

    const item = new TextInputBuilder()
      .setCustomId('itemInput')
      .setLabel('Vật phẩm thêm')
      .setPlaceholder('Ví dụ: 201:900')
      .setStyle(TextInputStyle.Paragraph);

    // An action row only holds one text input,
    // so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder().addComponents(receiver);
    const secondActionRow = new ActionRowBuilder().addComponents(expiry);
    const thirdActionRow = new ActionRowBuilder().addComponents(title);
    const fourthActionRow = new ActionRowBuilder().addComponents(description);
    const fifthActionRow = new ActionRowBuilder().addComponents(item);

    // Add inputs to the modal
    modal.addComponents(
      firstActionRow as ActionRowBuilder<TextInputBuilder>,
      secondActionRow as ActionRowBuilder<TextInputBuilder>,
      thirdActionRow as ActionRowBuilder<TextInputBuilder>,
      fourthActionRow as ActionRowBuilder<TextInputBuilder>,
      fifthActionRow as ActionRowBuilder<TextInputBuilder>
    );

    // Show the modal to the user
    await interaction.showModal(modal);

	  // Process modal
	  client.on(Events.InteractionCreate, async interaction => {
		  if (!interaction.isModalSubmit()) return;
		  const ip: string | undefined = process.env.IP;
		  if (interaction.customId === 'mailForm') {
			  const receiver = interaction.fields.getTextInputValue('receiverInput');
			  const expiry = interaction.fields.getTextInputValue('expiryInput');
			  const title = interaction.fields.getTextInputValue('titleInput');
			  const description = interaction.fields.getTextInputValue(
				  'descriptionInput',
			  );
			  const item = interaction.fields
				  .getTextInputValue('itemInput')
				  .replace(/\s/g, '');
			  // Xử lý tên
			  const name = receiver.split(':');
			  // Ngày sang giây
			  const seconds = moment().add(Number(expiry), 'days').unix();
			  try {
				  const uuid = new Date().getTime();
				  if (name[0] === 'all') {
					  const users = await getUsers();
					  let error: number[] = [];
					  users.map(async (user: User) => {
						  const res = await fetch(
							  `http://${ip}:14861/api?sender=${name[1]}&title=${title}&content=${description}&item_list=${item}&expire_time=${seconds}&is_collectible=False&uid=${user.uid}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`,
						  );
						  const json = await res.json();
						  if (json.msg !== 'succ') error.push(user.uid);
					  });
					  if (!error.length) {
						  await interaction.reply({
							  content: 'Gửi thư thành công',
							  ephemeral: true,
						  });
					  } else {
						  await interaction.reply({
							  content:
								  'Gửi thư không thành công ở các UID: `' +
								  error.join(', ') +
								  '`',
							  ephemeral: true,
						  });
					  }
				  } else {
					  const res = await fetch(
						  `http://${ip}:14861/api?sender=${name[1]}&title=${title}&content=${description}&item_list=${item}&expire_time=${seconds}&is_collectible=False&uid=${name[0]}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`,
					  );
					  const json = await res.json();
					  if (json.msg !== 'succ') {
						  await interaction.reply({
							  content: 'Gửi thư không thành công. Lỗi: `' + json.msg + '`',
							  ephemeral: true,
						  });
						  return;
					  }
					  await interaction.reply({
						  content: 'Gửi thư thành công',
						  ephemeral: true,
					  });
				  }
			  } catch (error) {
				  console.log(error.message);
			  }
		  }
	  })
  },
};

export default command;
