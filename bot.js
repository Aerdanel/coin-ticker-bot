"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
// const Discord = require('discord.js');
const client = new discord_js_1.Client();
const request = require('request-promise');
const cheerio = require('cheerio');
var logger = require('winston');
var fs = require('fs');
var moment = require('moment-timezone');
var async = require('async');

var coinList = process.env.COINLIST.split(',');
var outputPath = '/tmp/';
var outputChannel = process.env.OUTPUT_CHANNEL;

var outputTwitterChannel = process.env.OUTPUT_TWITTER_CHANNEL;
var activateTwitterFeed = process.env.ACTIVATE_TWITTER_FEED;

const allTickUrl = 'https://api.coinmarketcap.com/v1/ticker/?convert=EUR&limit=0';

var dicoCoins;
var lastMessage;
var args;
client.on('ready', () => {
    console.log('I am ready!');
});
client.on('message', (message) => {
    lastMessage = message;
    // logger.info(message.content);
    if (message.content.substring(0, 1) == '!') {
        //kiwi, moi, darine1, darine2
        if (message.author.id != '114858575276408834'
            && message.author.id != '138627869957029888'
            && message.author.id != '155799926226288640'
            && message.author.id != '379591303593197568') {
        }
        else {
            args = message.content.substring(1).split(' ');
            var cmd = args[0];
            args = args.splice(1);
            switch (cmd) {
                case 'coinlist-show':
                    var show = '';
                    coinList.forEach(c => {
                        show += '\n' + c;
                    });
                    message.channel.send('Coins actuellement dans la liste : ' + show);
                    break;
                case 'coinlist-getprices':
                    logger.info('création du fichier');
                    coinlistGetPrices(message.channel.id);
                    break;
                case 'coinlist-isok':
                    var erreurs = [];
                    if (coinList == undefined || coinList.length == 0) {
                        erreurs.push('La liste des coins est vide.');
                    }
                    if (outputChannel == undefined) {
                        erreurs.push('Le channel de sortie du fichier n\'est pas paramétré.');
                    }
                    if (erreurs.length == 0) {
                        message.channel.send('Le paramétrage est correct.');
                    }
                    else {
                        message.channel.send(erreurs);
                    }
                    break;
                case 'coin-info':
                    if (dicoCoins == undefined || dicoCoins.size == 0) {
                        loadDico(getCoinInfo);
                    }
                    else {
                        getCoinInfo();
                    }
                    break;
                case 'coin-ticker':
                    if (dicoCoins == undefined || dicoCoins.size == 0) {
                        loadDico(getCoinTicker);
                    }
                    else {
                        getCoinTicker();
                    }
                    break;
                case 'help':
                    var str = [];
                    str.push('La liste des commandes disponibles est la suivante : ');
                    // str.push('- **coinlist-add** => Permet d\'ajouter des coins à la liste pour la récupération automatique nocturnes des cours. Les coins peuvent être ajoutées en double, et sont traitées dans l\'ordre d\'ajout. ');
                    // str.push('\tSyntaxe : **!coinlist-add** _coin1,coin2,coin3..._');
                    // str.push('- **coinlist-clear** => Permet de vider la liste des coins.');
                    // str.push('\tSyntaxe : **!coinlist-clear**');
                    str.push('- **coinlist-show** => Permet d\'afficher la liste des coins pour lesquelles le cours va être récupéré durant la nuit.');
                    str.push('\tSyntaxe : **!coinlist-show**');
                    // str.push('- **coinlist-setchannel** => Permet de paramétrer le channel dans lequel le fichier contenant les cours sera envoyé une fois généré.');
                    // str.push('\tSyntaxe : **!coinlist-setchannel** _channelID_');
                    str.push('- **coinlist-getprices** => Permet d\'obtenir le cours des coins de la liste, dans un fichier envoyé sur le channel courant.');
                    str.push('\tSyntaxe : **!coinlist-getprices**');
                    str.push('- **coinlist-isok => Permet de savoir si tout est paramétré correctement pour la récupération nocturne du cours des coins.**');
                    str.push('\tSyntaxe : **!coinlist-isok**');
                    str.push('- **coin-info** => Permet d\'obtenir, dans le channel courant, les différents liens de la coin, de la page de coinmarketcap (lien du site, des explorers, de l\'annonce...).');
                    str.push('\tSyntaxe : **!coin-info** _coin_');
                    str.push('- **coin-ticker** => Permet d\'obtenir les informations du ticker de la coin passée en paramètre.');
                    str.push('\tSyntaxe : **!coin-ticker** _coin_');
                    str.push('- **help** => Permet d\'obtenir de l\'aide concernant les différentes commandes de ce bot.');
                    str.push('\tSyntaxe : **!help**');
                    message.channel.send(str);
                    break;
                case 'mock':
                    var lowercase = message.content.substring(message.content.indexOf(' ') + 1).toLocaleLowerCase();
                    var rand = Math.round(Math.random());
                    var output = '';
                    for (let index = 0; index < lowercase.length; index++) {
                        const element = lowercase[index];
                        if (index % 2 == rand) {
                            output += element.toLocaleUpperCase();
                        }
                        else {
                            output += element;
                        }
                    }
                    message.reply(output + ' :mockingbob:');
                    break;
                case 'shuffle':
                    var phrase = message.content.substring(message.content.indexOf(' ') + 1);
                    //on prend la phrase, on la découpe par espace et on fait du random - 1 pour récupérer des mots
                    var mots = phrase.split(" ");
                    var output = '';
                    var entiers = [];
                    for (var i = 0; i < mots.length;) {
                        var rnd = getRandomInt(mots.length);
                        if (!entiers.includes(rnd)) {
                            output += mots[rnd] + " ";
                            entiers.push(rnd);
                            i++;
                        }
                    }
                    message.reply(output);
                    break;
                default:
                    message.channel.send('Commande non reconnue.');
                    break;
            }
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
            data.forEach((d) => {
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
    var coinInfoUrl = `https://coinmarketcap.com/currencies/${coinId}`;
    logger.info(coinInfoUrl);
    logger.info(args[0].toLowerCase());
    var requestOptions = {
        uri: coinInfoUrl,
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    request(requestOptions)
        .then(function ($) {
        //récupération de l'url du logo
        var logoUrl = $('.currency-logo-32x32').attr('src');
        // //on récupère les différents liens
        var links = [];
        links.push('**' + coinId + '**');
        links.push('**Coinmarketcap** : ' + coinInfoUrl);
        $('body > div.container > div > div.col-lg-10 > div.row.bottom-margin-2x > div.col-sm-4.col-sm-pull-8 > ul > li > a').toArray().forEach((a) => {
            var href = $(a).attr('href');
            var text = $(a).text();
            links.push('**' + text + '** : ' + href);
        });
        lastMessage.channel.send(links, { file: logoUrl });
    })
        .catch(function () {
        lastMessage.channel.send('Erreur lors de la récupération des informations');
    });
}
function getCoinTicker() {
    var coinId;
    if (args.length == 0) {
        lastMessage.channel.send('Erreur : aucune coin renseignée.');
    }
    else {
        coinId = dicoCoins.get(args[0]);
        if (coinId == undefined) {
            lastMessage.channel.send('Erreur : coin introuvable. Merci de renseigner le symbole de la coin.');
        }
        else {
            //Si tout est bon, on va balancer la requête et traiter le tout !
            var coinTickerUrl = `https://api.coinmarketcap.com/v1/ticker/${coinId}/?convert=EUR`;
            var requestOptions = {
                uri: coinTickerUrl,
                json: true
            };
            request(requestOptions)
                .then(function (jsonData) {
                if (jsonData.error == undefined) {
                    var ticker = jsonData[0];
                    var strings = [];
                    var formater = new Intl.NumberFormat("fr-FR", {
                        maximumFractionDigits: 20,
                        maximumSignificantDigits: 21
                    });
                    strings.push('**' + ticker.name + '**');
                    strings.push('Symbol : ' + ticker.symbol);
                    strings.push('Price EUR : ' + formatStringNumber(formater.format(ticker.price_eur)));
                    strings.push('Price BTC : ' + formatStringNumber(formater.format(ticker.price_btc)));
                    strings.push('Price USD : ' + formatStringNumber(formater.format(ticker.price_usd)));
                    strings.push('Percent change 1h : ' + ticker.percent_change_1h);
                    strings.push('Percent change 24h : ' + ticker.percent_change_24h);
                    strings.push('Percent change 7j : ' + ticker.percent_change_7d);
                    strings.push('24h volume USD : ' + formatStringNumber(formater.format(ticker["24h_volume_usd"])));
                    strings.push('Market cap USD : ' + formatStringNumber(formater.format(ticker.market_cap_usd)));
                    strings.push('Available supply : ' + formatStringNumber(formater.format(ticker.available_supply)));
                    strings.push('Total supply : ' + formatStringNumber(formater.format(ticker.total_supply)));
                    strings.push('Max supply : ' + formatStringNumber(formater.format(ticker.max_supply)));
                    strings.push('24h volume EUR : ' + formatStringNumber(formater.format(ticker['24h_volume_eur'])));
                    strings.push('Market cap EUR : ' + formatStringNumber(formater.format(ticker.market_cap_eur)));
                    lastMessage.channel.send(strings);
                }
                else {
                    lastMessage.channel.send('Erreur : coin non trouvée sur coinmarketcap. Url : ' + coinTickerUrl);
                }
            });
        }
    }
}
function formatStringNumber(str) {
    return str.split(',').join(' ');
}
function coinlistGetPrices(channelID) {
    //on essaie de récupérer le channel qui va bien à partir de l'ID
    var channel = getChannelFromID(channelID);
    if (channel === undefined) {
        logger.error('Channel est undefined, impossible de le trouver, ou paramétrage manquant.');
    }
    else {
        request(allTickUrl, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                //on va mettre chaque valeur en euro dans la troisième colonne
                var csvheader = '';
                var csvline = '';
                var data = JSON.parse(body);
                var now = new Date();
                var fileName = 'coinprices_' + now.getFullYear()
                    + '-' + padZero((now.getMonth() + 1).toString())
                    + '-' + padZero(now.getDate().toString())
                    + '_' + padZero(now.getHours().toString())
                    + '-' + padZero(now.getMinutes().toString())
                    + '-' + padZero(now.getSeconds().toString()) + '.csv';
                coinList.forEach(coin => {
                    data.forEach((d) => {
                        if (coin.toLowerCase() == d.symbol.toLowerCase()) {
                            csvheader += ';;' + coin.toLowerCase() + ';';
                            csvline += ';;' + d.price_eur + ';';
                        }
                    });
                });
                fs.writeFileSync(outputPath + fileName, csvheader + '\n' + csvline);
                channel.send('Le fichier du ' + moment().format('YYYY/MM/DD'), { file: outputPath + fileName });
            }
        });
    }
}
function getChannelFromID(channelID) {
    for (let index = 0; index < client.channels.array().length; index++) {
        const c = client.channels.array()[index];
        if (c.id == channelID) {
            return c;
        }
    }
    return undefined;
}
function padZero(str) {
    var pad = '00';
    return pad.substring(0, pad.length - str.length) + str;
}
var doneDate;
//Génération du fichier
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
var lastTweetCheck = Date.now();
//Récupération des tweets
setInterval(function () {
    if (activateTwitterFeed == '1') {
        var requestOptions = {
            uri: 'https://twitter.com/MinigunMaxifun',
            transform: function (body) {
                return cheerio.load(body);
            }
        };
        var tweetsToRepost = [];
        request(requestOptions)
            .then(function ($) {
            var tweetList = $('#timeline div.stream li.stream-item:not(".js-pinned")').toArray();
            tweetList.forEach((t) => {
                // on test si c'est un retweet ou pas !
                if ($(t).find('div').first().data('retweeter') == undefined) {
                    var timestamp = $(t).find('span._timestamp.js-short-timestamp').data('time-ms') * 1;
                    //si c'est un nouveau tweet
                    if (timestamp > lastTweetCheck) {
                        //on l'ajoute à la liste !
                        var permalink = $(t).find('div').first().data('permalink-path');
                        tweetsToRepost.push(permalink);
                    }
                }
            });
            var channel = getChannelFromID(outputTwitterChannel);
            tweetsToRepost.reverse();
            tweetsToRepost.forEach((t) => {
                channel.send('https://twitter.com' + t);
            });
            lastTweetCheck = Date.now();
        });
    }
}, 1000 * 60);
function getDayDate() {
    var date = new Date();
    return date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate();
}
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}




// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);
