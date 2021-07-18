const config = require("./config.json");
const songs = require("./songs.json");
const ytdl = require("discord-ytdl-core");
const moment = require("jalali-moment");
const cron = require("node-cron");
const YouTube = require("youtube-sr").default;
const Discord = require("discord.js"),
	client = new Discord.Client(),
	broadcast = client.voice.createBroadcast();
var announcementChannel = null,
	commandsChannel = null,
	dailySong = songs[Math.floor(Math.random() * songs.length)];

client.once("ready", () => {
	console.log("Connected!");
	console.log("Finding the server and channels ...");
	announcementChannel = client.guilds.cache
		.get(config.server_id)
		.channels.cache.get(config.announcement_channel_id);
	commandsChannel = client.guilds.cache
		.get(config.server_id)
		.channels.cache.get(config.commands_channel_id);
	console.log("Setting up the broadcast ...");
	var stream = ytdl(`https://www.youtube.com/watch?v=-V2DnMkqc4M`, {
		filter: "audioonly",
		opusEncoded: false,
		// encoderArgs: ["-af", "bass=g=10,dynaudnorm=f=200"],
	});
	broadcast.play(stream, {
		type: "converted",
	});
	broadcast.dispatcher.on("finish", () => {
		broadcast.play(stream, {
			type: "converted",
		});
	});

	console.log("Setting up daily suggestion service ...");
	cron.schedule(
		"30 * * * *",
		() => {
			dailySong = songs[Math.floor(Math.random() * songs.length)];
			const _moment = moment().locale("fa");
			const embedMsg = new Discord.MessageEmbed()
				.setColor(0x0099ff)
				.setTitle(dailySong.title)
				.setAuthor(
					`قطعه‌ی روز | ${_moment.jDate()} ${
						config.jalaliMonths[parseInt(_moment.jMonth())]
					} ${_moment.jYear()}`,
					"https://upload.wikimedia.org/wikipedia/commons/4/4e/Hayedeh-Persian-Singer-Tehran-1977.jpg"
				)
				.setDescription(
					config.messages.dailyTrack[
						Math.floor(Math.random() * config.messages.dailyTrack.length)
					]
						.toString()
						.replace("_", dailySong.title)
				)
				.setThumbnail("https://i.imgur.com/xt0Yuib.png")
				.addFields(
					{ name: "ترانه‌سرا", value: dailySong.lyrics, inline: true },
					{ name: "آهنگساز", value: dailySong.composer, inline: true },
					{ name: "تنظیم", value: dailySong.arrangement, inline: true }
				)
				.setImage(config.thumbnails[Math.floor(Math.random() * config.thumbnails.length)])
				// .setTimestamp()
				.setFooter("هر روز یک قطعه از بانو هایده");

			announcementChannel.send(embedMsg);
			announcementChannel.send(
				new Discord.MessageEmbed()
					.setColor(0x0099ff)
					.setDescription(
						`برای شنیدن قطعه «${dailySong.title}» می‌توانید از دستور \`banu daily!\` استفاده کنید.`
					)
			);
		},
		{
			scheduled: true,
			timezone: "Asia/Tehran",
		}
	);
	console.log("Setting up presence ...");
	client.user.setPresence({
		status: "online",
		activity: {
			type: "LISTENING",
			name: config.songTitles[Math.floor(Math.random() * config.songTitles.length)],
		},
	});
	client.setInterval(() => {
		client.user.setPresence({
			status: "online",
			activity: {
				type: "LISTENING",
				name: config.songTitles[Math.floor(Math.random() * config.songTitles.length)],
			},
		});
	}, 432000000); // 2 hours

	console.log("Ready to operate!");
});

client.on("message", async (message) => {
	if (message.author.id === message.guild.me.id) return;
	if (message.channel.id !== commandsChannel.id) return;
	if (message.content.slice(0, config.prefix.length) !== config.prefix) return;
	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	let vc_connection = null;
	switch (command) {
		case "radio":
			if (!message.member.voice.channel)
				return message.channel.send(
					new Discord.MessageEmbed()
						.setColor(0x0099ff)
						.setDescription(
							"رو هوا که نمیشه خوند عزیز! وارد یه چنل شو تا به شما ملحق بشم."
						)
				);
			message.channel.send(
				new Discord.MessageEmbed().setColor(0x0099ff).setDescription("در حال پخش رادیو ...")
			);
			vc_connection = await message.member.voice.channel.join();
			vc_connection.play(broadcast);
			break;
		case "daily":
			const _moment = moment().locale("fa");
			const embedMsg = new Discord.MessageEmbed()
				.setColor(0x0099ff)
				.setTitle(dailySong.title)
				.setAuthor(
					`قطعه‌ی روز | ${_moment.jDate()} ${
						config.jalaliMonths[parseInt(_moment.jMonth())]
					} ${_moment.jYear()}`,
					"https://upload.wikimedia.org/wikipedia/commons/4/4e/Hayedeh-Persian-Singer-Tehran-1977.jpg"
				)
				.setThumbnail("https://i.imgur.com/xt0Yuib.png")
				.addFields(
					{ name: "ترانه‌سرا", value: dailySong.lyrics, inline: true },
					{ name: "آهنگساز", value: dailySong.composer, inline: true },
					{ name: "تنظیم", value: dailySong.arrangement, inline: true }
				)
				.setImage(config.thumbnails[Math.floor(Math.random() * config.thumbnails.length)])
				.setFooter("هر روز یک قطعه از بانو هایده");

			message.channel.send(embedMsg);
			if (!message.member.voice.channel)
				return message.channel.send(
					new Discord.MessageEmbed()
						.setColor(0x0099ff)
						.setDescription(
							"عزیز اگر میخوای برات این قطعه رو بخونم، وارد یه وویس چنل شو تا ملحق شم."
						)
				);

			message.channel.send(
				new Discord.MessageEmbed()
					.setColor(0x0099ff)
					.setDescription(`پخش قطعه امروز: **${dailySong.title}**`)
			);
			message.channel.send(
				new Discord.MessageEmbed()
					.setColor(0x0099ff)
					.setDescription("در حال آماده‌سازی ...")
			);
			var yt_result = await YouTube.search(`هایده ${dailySong.title}`, {
				limit: 3,
				type: "video",
			});

			console.log(`Playing  https://www.youtube.com/watch?v=${yt_result[0].id}`);

			// Setting up the stream
			var stream = ytdl(`https://www.youtube.com/watch?v=${yt_result[0].id}`, {
				filter: "audioonly",
				opusEncoded: false,
				// encoderArgs: ["-af", "bass=g=10,dynaudnorm=f=200"],
			});

			vc_connection = await message.member.voice.channel.join();
			vc_connection.play(stream, {
				type: "converted",
			});
			break;
		case "bekhan":
			if (!message.member.voice.channel)
				return message.channel.send(
					new Discord.MessageEmbed()
						.setColor(0x0099ff)
						.setDescription(
							"رو هوا که نمیشه خوند عزیز! وارد یه چنل شو تا به شما ملحق بشم."
						)
				);
			message.channel.send(
				new Discord.MessageEmbed()
					.setColor(0x0099ff)
					.setDescription("در حال آماده‌سازی ...")
			);
			var query = args[0];
			var stream = null;
			if (
				query
					.toString()
					.match(
						/^(http(s)??\:\/\/)?(www\.)?((youtube\.com\/watch\?v=)|(youtu.be\/))([a-zA-Z0-9\-_])+/g
					)
			) {
				// Valid youtube URL
				stream = ytdl(query.toString(), {
					filter: "audioonly",
					opusEncoded: false,
					// encoderArgs: ["-af", "bass=g=10,dynaudnorm=f=200"],
				});
			} else {
				// Constructing youtube query
				let addKeyword = !(
					query.toLowerCase().includes("hayedeh") ||
					query.toLowerCase().includes("hayede") ||
					query.toLowerCase().includes("هایده")
				);
				if (addKeyword) {
					query += " هایده";
				}

				console.log(`Searching for '${query}'`);

				// Searching Youtube
				var yt_result = await YouTube.search(query, { limit: 3, type: "video" });

				console.log(`Playing  https://www.youtube.com/watch?v=${yt_result[0].id}`);

				// Setting up the stream
				stream = ytdl(`https://www.youtube.com/watch?v=${yt_result[0].id}`, {
					filter: "audioonly",
					opusEncoded: false,
					// encoderArgs: ["-af", "bass=g=10,dynaudnorm=f=200"],
				});
			}
			// Connecting and playing
			vc_connection = await message.member.voice.channel.join();
			vc_connection.play(stream, {
				type: "converted",
			});
			// vc_connection.on("finish", () => {
			// 	message.guild.me.voice.channel.leave();
			// });
			break;

		case "bedrud":
			if (message.guild.me.voice.channel) {
				message.guild.me.voice.channel.leave();
			}
			if (!getUserFromMention(args[0])) {
				return message.reply(
					config.messages.bedrud[
						Math.floor(Math.random() * config.messages.bedrud.length)
					]
				);
			}
			return message.channel.send(
				`${
					config.messages.bedrud[
						Math.floor(Math.random() * config.messages.bedrud.length)
					]
				} ${getUserFromMention(args[0])}`
			);

		case "dorud":
			if (!getUserFromMention(args[0])) {
				return message.reply(
					config.messages.dorud[Math.floor(Math.random() * config.messages.dorud.length)]
				);
			}
			return message.channel.send(
				`${
					config.messages.dorud[Math.floor(Math.random() * config.messages.dorud.length)]
				} ${getUserFromMention(args[0])}`
			);

		case "help":
			return commandsChannel.send(
				new Discord.MessageEmbed()
					.setColor(0x0099ff)
					.setTitle("بانو هایده هستم!")
					.setAuthor("سلام و درود!")
					.setDescription(
						`سلام به همه شما زیبارویان.
                    بانو هایده هستم و خوشحالم که به این سرور و جمع شما عزیزان اضافه شدم.
                    شما می‌تونید قطعات موردعلاقه‌تون رو بنویسید تا براتون اجرا کنم؛ علاوه بر اون، رادیو هم راه افتاده و می‌تونید هر موقع که خواستید رادیو رو به وویس چنل‌تون اضافه کنید. ضمناً هر روز صبح یک قطعه به شما عزیزان پیشنهاد خواهم داد تا با کارهای دیگه من هم بیشتر آشنا بشید.
                    \n
                    **توضیحات دولوپر:** بات فعلا تو فاز آزمایشیه و شاید باگ و اشکال راحت ازش در بیاد. در صورت پیدا شدن وقت و انرژی کافی (برای من) قابلیت‌های جدید و بهبودهای لازم در آینده اعمال میشن.\n\n**لیست دستورات:**`
					)
					.setThumbnail("https://i.imgur.com/G96cgps.png")
					.addFields(
						{
							name: "پخش قطعه ▶️",
							value: "**`!banu bekhan <YT Link or Song Title>`**",
						},
						{ name: "رادیو 📻", value: "**`!banu radio`**" },
						{ name: "قطعه روز 📅", value: "**`!banu daily`**" },
						{ name: "درود 💙", value: "**`!banu dorud`**" },
						{ name: "بدرود/ترک چنل ❌", value: "**`!banu bedrud`**" },
						{ name: "راهنما 💭", value: "**`!banu help`**" }
					)
					.setImage("https://i.imgur.com/DZGHUvZ.jpg")
					.setFooter("Banu Hayedeh Bot | Developed by Soroush")
			);

		default:
			break;
	}
});
const getUserFromMention = (mention) => {
	if (!mention) return;

	if (mention.startsWith("<@") && mention.endsWith(">")) {
		mention = mention.slice(2, -1);

		if (mention.startsWith("!")) {
			mention = mention.slice(1);
		}

		return client.users.cache.get(mention);
	}
};

client.login(config.token);
