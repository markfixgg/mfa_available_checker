const axios = require("axios");
const fs = require("fs");
const TicketsApi = require("./TicketsApi");

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// Configuration
const country = "Польща";
const consulate = "ГКУ в Кракові";
const serviceCategory = "Паспортні дії";
const service = "Оформлення закордонного паспорта";

(async () => {
    // Initialisation
    const Api = new TicketsApi(country, consulate, serviceCategory, service);

    const serviceId = await Api.getSchedules();
})();