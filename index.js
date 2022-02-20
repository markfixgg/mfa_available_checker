const TicketsApi = require("./TicketsApi");
const { Telegraf } = require('telegraf');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// Configuration
const country = "Польща";
const consulate = "ГКУ в Кракові";
const serviceCategory = "Паспортні дії";
const service = "Оформлення закордонного паспорта";

(async () => {
    // Initialisation
    const Api = new TicketsApi(country, consulate, serviceCategory, service);

    const bot = new Telegraf("5139692106:AAGHArrDS5ClK-b_RKztJ5yY9a8EfChk_Us")

    // bot.use((ctx, next)=>{
    //     console.log(ctx.from);
    //     ctx.reply('Server running :)')
    //
    //     return next();
    // });

    bot.launch()
})();