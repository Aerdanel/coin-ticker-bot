const Discord = require('discord.js');
const client = new Discord.Client();
const request = require('request');
var logger = require('winston');
var fs = require('fs');

var coinList = [];
var outputPath = '/tmp/';
var outputChannel;

const allTickUrl = 'https://api.coinmarketcap.com/v1/ticker/?convert=EUR&limit=0';

var dicoCoins;

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
			case 'coinlist-add':
				logger.info(args);
				var coins = args[0].split(',');
				coins.forEach(c => {
					var trim = c.trim();

					logger.info('c.trim() : ' + c.trim());

					coinList.push(trim);
				});

				message.channel.send('Ajout correctement effectué. \n' + coinList.length + ' coins au total dans la liste.');
				break;

			case 'coinlist-clear':
				coinList = [];
				message.channel.send('Purge effectuée.');

				logger.info('coinList : ' + coinList.length);
				break;

			case 'coinlist-show':
				var show = '';

				coinList.forEach(c => {
					show += '\n' + c;
				});

				message.channel.send('Coins actuellement dans la liste : ' + show);
				break;


			case 'coinlist-setchannel':
				outputChannel = args[0];
				message.channel.send('Channel ID enregistré.')
				break;



			case 'coinlist-getprices':
				logger.info('création du fichier');

				coinlistGetPrices(message.channel.id);

				break;


			case 'test':

				break;


// case 'coin-info':

// if (dicoCoins == undefined || dicoCoins.length == 0) {
// 	loadDico();
// }

// //on récupère l'id en fonction du symbol
// var coinId = dicoCoins[args[0]];

// var coinInfoUrl = 'https://coinmarketcap.com/currencies/';

// request(coinInfoUrl + coinId, function (error, response, body) {
// 	const $ = cheerio.load(body);




// 			});

// break;



		}
	}
});





function loadDico() {

	request(allTickUrl, function (error, response, body) {
		if (!error && response.statusCode == 200) {

			var data = JSON.parse(body);
			data.forEach(d => {
				dicoCoins[d.symbol.toLowerCase()] = d.id;
			});

		}
	});

}



function coinlistGetPrices(channelID) {

	//on essaie de récupérer le channel qui va bien à partir de l'ID
	var channel = getChannelFromID(channelID);


	request(allTickUrl, function (error, response, body) {
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

			channel.send('Le fichier du jour', { file: outputPath + fileName });
		}
	})

}

function getChannelFromID(channelID) {
	for (let index = 0; index < client.channels.array().length; index++) {
		const c = client.channels.array()[index];

		if (c.id == channelID) {
			return c;
		}
	}
}

function padZero(str) {
	var pad = '00';
	return pad.substring(0, pad.length - str.length) + str;
}






var doneDate;

setInterval(function () {
	var hour = new Date().getHours();
	if (0 <= hour && hour < 1) {
		if (outputChannel !== undefined) {
			if (doneDate === undefined || doneDate != getDayDate()) {
				doneDate = getDayDate();

				coinlistGetPrices(outputChannel);
			}
			else {
				// logger.info('déjà fait aujourdhui');
			}
		}
		else {
			// logger.info('Aucun channel défini');
		}

	}
}, 1000 * 60 * 5);

function getDayDate() {
	var date = new Date();
	return date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate();
}



// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);
