const Discord = require('discord.js');
const client = new Discord.Client();
const request = require('request');
var logger = require('winston');
var fs = require('fs');

var coinList = [];
var outputPath = '/tmp/';


client.on('ready', () => {
	console.log('I am ready!');
});

client.on('message', message => {
	logger.info(message.content);

	if (message.content.substring(0, 1) == '!') {
		var args = message.content.substring(1).split(' ');
		var cmd = args[0];

		args = args.splice(1);
		switch (cmd) {
			case 'ping':
				message.channel.send('la bite !');
				break;
			case 'coinlist-add':
				logger.info(args);
				var coins = args[0].split(',');
				coins.forEach(c => {
					var trim = c.trim();

					logger.info('c.trim() : ' + c.trim());

					coinList.push(trim);
				});

				message.reply('Ajout correctement effectué. \n' + coinList.length + ' coins au total dans la liste.');
				break;

			case 'coinlist-clear':
				coinList = [];
				message.reply('Purge effectuée.');

				logger.info('coinList : ' + coinList.length);
				break;

			case 'coinlist-show':
				var show = '';

				coinList.forEach(c => {
					show += '\n' + c;
				});

				message.reply('Coins actuellement dans la liste : ' + show);
				break;
			// case 'add':
			// 	logger.info('add: ' + args[0]);
			// 	addList.push(args[0]);
			// break;
			// case 'list':
			// 	for (i = 0; i < addList.length; i++) {
			// 		bot.sendMessage({
			// 			to: channelID,
			// 			message: addList[i]
			// 		});
			// 	}
			// break;
			// case 'set-channel':
			// 	channelIDTickerPost = args[0];
			// break;
			// case 'test':
			// 	var request = require('request');
			// 	request('https://api.coinmarketcap.com/v1/ticker/bitcoin/?convert=EUR', function (error, response, body) {
			// 	  if (!error && response.statusCode == 200) {
			// 		console.log(body) // Print the google web page.

			// 		var jsonData = JSON.parse(body);
			// 		bot.sendMessage({
			// 			to: channelID,
			// 			message: 'price_btc : ' + jsonData[0].price_btc + '\nune autre ligne'
			// 		});
			// 	  }
			// 	})
			// break;
			case 'coinlist-getprices':
				logger.info('création du fichier');

				coinlistGetPrices(message);

			break;
			// case 'send':
			// 	bot.uploadFile({
			// 			to: channelID,
			// 			file: '/tmp/file.csv',
			// 			message: 'un message qu\'il est bien',
			// 		},
			// 		function (error, response) {
			// 				logger.info(error);
			// 			});
			// break;
			// case 'coin-ticker' :

			// break;
			// Just add any case commands if you want to..
		}
	}
});

function coinlistGetPrices(message){

	request('https://api.coinmarketcap.com/v1/ticker/?convert=EUR', function (error, response, body) {
		if (!error && response.statusCode == 200) {

			//on va mettre chaque valeur en euro dans la troisième colonne
			var csvline = '';
			var data = JSON.parse(body);

			var now = new Date;

			var fileName = 'coinprices_' + now.getFullYear()
				+ '-' + padZero(now.getMonth().toString())
				+ '-' + padZero(now.getDate().toString())
				+ '_' + padZero(now.getHours().toString())
				+ '-' + padZero(now.getMinutes().toString())
				+ '-' + padZero(now.getSeconds().toString()) + '.csv';

			coinList.forEach(coin => {
				data.forEach(d => {
					if (coin.toLowerCase() == d.symbol.toLowerCase()) {
						csvline += ';;' + d.price_eur + ';';
					}
				});
			});

			fs.writeFile(outputPath + fileName, csvline);

			message.channel.send('Le fichier du jour', { file: outputPath + fileName });
		}
	})

}

function padZero(str) {
	var pad = '00';
	return pad.substring(0, pad.length - str.length) + str;
}

// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);
