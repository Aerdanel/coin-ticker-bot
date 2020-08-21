"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
// const Discord = require('discord.js');
const client = new discord_js_1.Client();
const request = require('request-promise');
const cheerio = require('cheerio');
var logger = require('winston');
// var Twitter = require('twitter');

//var fs = require('fs');
// var moment = require('moment-timezone');
//var async = require('async');
var idMe = '138627869957029888';
var outputChannel = '386846479966404618';
var outputTwitterChannel = '386846479966404618';
var activateTwitterFeed = 0;




var lastCheckMangaChapters;
var mangas = [
    'https://manganelo.com/manga/isekai_maou_to_shoukan_shoujo_dorei_majutsu',
    'https://manganelo.com/manga/kaifuku_jutsushi_no_yarinaoshi',
    'https://manganelo.com/manga/read_one_punch_man_manga_online_free3',
    'https://manganelo.com/manga/worlds_end_harem',
    'https://manganelo.com/manga/worlds_end_harem_fantasia',
    'https://manganelo.com/manga/itai_no_wa_iya_nanode_bougyoryoku_ni_kyokufuri_shitai_to_omoimasu',
    'https://manganelo.com/manga/overlord_manga',
    'https://manganelo.com/manga/hgj2047065412',
    'https://manganelo.com/manga/dhox263071555134154',
    'https://manganelo.com/manga/yjhu10601567132916',
    'https://manganelo.com/manga/kiss_x_sis',
    'https://manganelo.com/manga/qg918612',
    'https://manganelo.com/manga/ya23ux2738298723',
    'https://manganelo.com/manga/mushoku_tensei_isekai_ittara_honki_dasu',
    'https://manganelo.com/manga/kaguyasama_wa_kokurasetai_tensaitachi_no_renai_zunousen',
    'https://manganelo.com/manga/saihate_no_paladin',
    'https://manganelo.com/manga/danberu_nan_kiro_moteru',
    'https://manganelo.com/manga/ay918540',
    'https://manganelo.com/manga/dead_tube',
    'https://manganelo.com/manga/tachibanakan_triangle',
    'https://manganelo.com/manga/uv917720',
    'https://manganelo.com/manga/lk918931',
    'https://manganelo.com/manga/ilsi12001567132882',
    'https://manganelo.com/manga/read_hunter_x_hunter_manga_online_free2'
];



var userMe;

var dicoCommandeChannel;
var dicoCommandeMessage;
var lastMessage;
var args;
client.on('ready', () => {
    loadDicoCommandeChannel();
    userMe = getUserFromID(idMe);

    lastCheckMangaChapters = new Date();

    setInterval(fetchChapters, 1000 * 60 * 60);

    console.log('I am ready!');
});
client.on('message', (message) => {
    lastMessage = message;
    // logger.info(message.content);
    if (message.content.substring(0, 1) == '!') {
        //kiwi, moi, darine1, darine2
        if (message.author.id != '114858575276408834'
            && message.author.id != idMe
            && message.author.id != '155799926226288640'
            && message.author.id != '379591303593197568') {
        }
        else {
            args = message.content.substring(1).split(' ');
            var cmd = args[0];
            args = args.splice(1);
            switch (cmd) {
                case 'test':
                    var id = dicoCommandeChannel.get(cmd);
                    var channel = getChannelFromID(id);
                    message.channel.send('Si tu veux faire des tests, c\'est par là : ' + channel);
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
                case 'shufflec':
                    var phrase = message.content.substring(message.content.indexOf(' ') + 1);
                    //on prend la phrase, on la découpe par espace et on fait du random - 1 pour récupérer des mots
                    var mots = phrase.split(" ");
                    var output = '';
                    for (var i = 0; i < mots.length; i++) {
                        var mot = mots[i];
                        var entiers = [];
                        for (var j = 0; j < mot.length;) {
                            var rnd = getRandomInt(mot.length);
                            if (!entiers.includes(rnd)) {
                                output += mot[rnd];
                                entiers.push(rnd);
                                j++;
                            }
                        }
                        output += " ";
                    }
                    message.reply(output);
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
                case 'testtwitter':
                    lastTweetCheck = Date.now();
                    var requestOptions = {
                        uri: 'https://twitter.com/MinigunMaxifun',
                        transform: function (body) {
                            console.log(body);
                            return cheerio.load(body);
                        }
                    };
                    var tweetsToRepost = [];
                    request(requestOptions)
                        .then(function ($) {
                            // console.log($('h1'));

                            var timeline = $('section.css-1dbjc4n').toArray();
                            var tweetList = $('#timeline div.stream li.stream-item:not(".js-pinned")').toArray();
                            tweetList.forEach((t) => {
                                // on test si c'est un retweet ou pas !
                                if ($(t).find('div').first().data('retweeter') == undefined) {
                                    // var timestamp = $(t).find('span._timestamp.js-short-timestamp').data('time-ms') * 1;
                                    // //si c'est un nouveau tweet
                                    // if (timestamp > lastTweetCheck) {
                                    //     //on l'ajoute à la liste !
                                    //     var permalink = $(t).find('div').first().data('permalink-path');
                                    //     tweetsToRepost.push(permalink);
                                    // }
                                    tweetsToRepost.push(permalink);
                                }
                            });

                            // message.channel.send(tweetList.length + ' trouvés');
                            message.channel.send(timeline.length);


                        });
                    break;
                default:
                    message.channel.send('Commande non reconnue.');
                    break;
            }
        }
    }
});
function loadDicoCommandeChannel() {
    dicoCommandeChannel = new Map();
    dicoCommandeMessage = new Map();
    logger.info('init dico commande');
    // dicoCommandeChannel.set('test', '386846479966404618');
    dicoCommandeChannel.set('test', '169423528850882561'); //looking for party
    dicoCommandeMessage.set('bite', 'Ah non elle est beaucoup trop petite pour qu\'on en parle où que ce soit');
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

function getUserFromID(userID) {
    for (let index = 0; index < client.users.array().length; index++) {
        const u = client.users.array()[index];
        if (u.id == userID) {
            return u;
        }
    }
    return undefined;
}

function padZero(str) {
    var pad = '00';
    return pad.substring(0, pad.length - str.length) + str;
}
var doneDate;
var lastTweetCheck = Date.now();
//Récupération des tweets
setInterval(function () {
    if (activateTwitterFeed == '1') {
        try {
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
        } catch (error) {
            var channel = getChannelFromID(outputChannel);
            if (channel !== undefined) {
                channel.send('<@' + idMe + '> Erreur : ```' + error.name + '```');
                channel.send('```' + error.message + '```');
            }

            logger.error('Erreur survenue pendant la récupération des tweets');
            logger.error(error);
        }
    }
}, 1000 * 60);
// function getDayDate() {
//     var date = new Date();
//     return date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate();
// }
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}







function fetchChapters() {
    logger.info('fetchChapters');

    var newChapters = [];
    var promises = [];

    try {
        for (let index = 0; index < mangas.length; index++) {
            const mangaUrl = mangas[index];

            var requestOptions = {
                uri: mangaUrl,
                transform: function (body) {
                    return cheerio.load(body);
                }
            };

            promises.push(request(requestOptions));
        }

        Promise.all(promises)
            .then((results) => {

                results.forEach(($) => {
                    var chapterList = $('ul.row-content-chapter li').toArray();
                    chapterList.forEach((c) => {

                        var spanTime = $(c).find('span.chapter-time')[0];
                        var chapterPublicationDate = Date.parse(spanTime.attribs.title);

                        if (lastCheckMangaChapters < chapterPublicationDate) {
                            var chapterUrl = $(c).find('a')[0].attribs.href;
                            newChapters.push(chapterUrl);
                        }
                    });
                });

                newChapters.reverse();
                newChapters.forEach((url) => {
                    userMe.send(url);
                })
            });
    }
    catch (error) {
        var channel = getChannelFromID(outputChannel);
        if (channel !== undefined) {
            channel.send('<@' + idMe + '> Erreur : ```' + error.name + '```');
            channel.send('```' + error.message + '```');
        }

        logger.error('Erreur survenue pendant la récupération des tweets');
        logger.error(error);
    }
    lastCheckMangaChapters = new Date();
}





// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);
