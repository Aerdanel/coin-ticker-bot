const Discord = require('discord.js');
const client = new Discord.Client();
const request = require('request-promise');
const cheerio = require('cheerio');
var logger = require('winston');
var fs = require('fs');

var coinList = [];
var outputPath = '/tmp/';
var outputChannel;

const allTickUrl = 'https://api.coinmarketcap.com/v1/ticker/?convert=EUR&limit=0';

var dicoCoins;

var lastMessage;
var args;

client.on('ready', () => {
	console.log('I am ready!');
});

client.on('message', message => {
	lastMessage = message;
	// logger.info(message.content);

	if (message.content.substring(0, 1) == '!') {
		args = message.content.substring(1).split(' ');
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


			case 'coin-info':

				channelToRespond = message.channel;
				coinInfoSymbol = args[0];

				if (dicoCoins == undefined || dicoCoins.size == 0) {
					loadDico(getCoinInfo);
				}
				else {
					getCoinInfo();
				}

				break;



		}
	}
});





function loadDico(postTreatment) {
	logger.info('chargement du dictionnaire des coins');

	if (postTreatment == undefined) {
		postTreatment = function () { };
	}


	dicoCoins = new Map();

	request(allTickUrl, function (error, response, body) {
		logger.info('lancement de la requête fait');
		if (!error && response.statusCode == 200) {
			var data = JSON.parse(body);
			data.forEach(d => {

				dicoCoins.set(d.symbol.toLowerCase(), d.id);

			});

			logger.info('chargement dico fini');
		}
		else {
			logger.error('ERREUR : ' + error);
		}
	}).then(postTreatment);

}


function getCoinInfo() {

	var coinId = dicoCoins.get(args[0].toLowerCase());

	var coinInfoUrl = 'https://coinmarketcap.com/currencies/' + coinId;

	logger.info(coinInfoUrl);
	logger.info(args[0].toLowerCase());

	var requestOptions = {
		uri: coinInfoUrl,
		transform: function (body) {
			return cheerio.load(body);
		}
	}


	request(requestOptions)
		.then(function ($) {

			//récupération de l'url du logo
			var logoUrl = $('.currency-logo-32x32').attr('src');

			// //on récupère les différents liens
			var links = [];
			links.push('**' + coinId + '**');
			links.push('**Coinmarketcap** : ' + coinInfoUrl);

			$('body > div.container > div > div.col-lg-10 > div.row.bottom-margin-2x > div.col-sm-4.col-sm-pull-8 > ul > li > a').toArray().forEach(a => {
				var href = $(a).attr('href');
				var text = $(a).text();
				links.push('**' + text + '** : ' + href);
			});


			lastMessage.channel.send(links, { file: logoUrl });
		})
		.catch(function (err) {

			lastMessage.channel.send('Erreur lors de la récupération des informations');
		});

}





function coinlistGetPrices(channelID) {

	//on essaie de récupérer le channel qui va bien à partir de l'ID
	var channel = getChannelFromID(channelID);


	request(allTickUrl, function (error, response, body) {
		if (!error && response.statusCode == 200) {

			//on va mettre chaque valeur en euro dans la troisième colonne
			var csvheader = '';
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
						csvheader += ';;' + coin.toLowerCase() + ';';
						csvline += ';;' + d.price_eur + ';';
					}
				});
			});

			fs.writeFile(outputPath + fileName, csvheader + '\n' + csvline);

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
