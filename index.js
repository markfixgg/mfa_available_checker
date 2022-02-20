const TicketsApi = require("./TicketsApi");
const { Telegraf } = require('telegraf');
const fs = require("fs");

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// Configuration
const country = "Польща";
const consulate = "ГКУ в Кракові";
const serviceCategory = "Паспортні дії";
const service = "Оформлення закордонного паспорта";

bot = new Telegraf("5139692106:AAGHArrDS5ClK-b_RKztJ5yY9a8EfChk_Us")

const subscribe = (ctx) => {
    try {
        if(fs.existsSync('./users.json')) {
            const file = fs.readFileSync('./users.json');
            const users = JSON.parse(file || "");

            fs.writeFileSync('./users.json', JSON.stringify([...users, ctx.from.id]));
        } else {
            fs.writeFileSync('./users.json', JSON.stringify([ctx.from.id], null, 2))
        }
    } catch (e) {
        console.log(e.message)
    }
}

const unSubscribe = (ctx) => {
    try {
        if(fs.existsSync('./users.json')) {
            const file = fs.readFileSync('./users.json');
            const users = JSON.parse(file || "");

            const index = users.indexOf(ctx.from.id);
            if(index !== -1) {
                users.splice(index, 1);
            }

            fs.writeFileSync('./users.json', JSON.stringify(users));
        }
    } catch (e) {
        console.log(e.message)
    }
}

const notifyUsers = async (message) => {
    try {
        if(fs.existsSync('./users.json')) {
            const file = fs.readFileSync('./users.json');
            const users = JSON.parse(file || "");

            await Promise.all(users?.map(async userId => {
                await bot.telegram.sendMessage(userId, message);
            }))
        }
    } catch (e) {
        console.log(e.message);
    }
}

(async () => {
    // Initialisation
    const Api = new TicketsApi(country, consulate, serviceCategory, service);

    bot.command('/subscribe', (ctx) => {
        subscribe(ctx);
        ctx.reply("Subscribed successfully!");
    })

    bot.command('/unsubscribe', (ctx) => {
        unSubscribe(ctx);
        ctx.reply("Unsubscribed successfully!");
    })

    bot.command('/tickets', async ctx => {
        const tickets = await Api.getSchedules();
        if(!tickets) {
            await ctx.reply('Билетов нет!');
        } else {
            await ctx.reply('Билетов есть!');
            await ctx.reply(JSON.stringify(tickets))
        }
    })

    setInterval(async () => {
        let tickets = await Api.getSchedules();
        if(tickets) {
            await notifyUsers('Появились билеты!');
            await notifyUsers(JSON.stringify(tickets))
        }
    }, 60000)

    await bot.launch()
})();