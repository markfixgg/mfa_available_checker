// Status codes
const axios = require("axios");
const ac = require("@antiadmin/anticaptchaofficial");
const fs = require("fs");
const moment = require("moment");

const statusCodes = {
    200: "OK",
    304: "Cached data",
    401: "Unauthorized"
};

class TicketsApi {
    constructor(country, consulate, serviceCategory, service) {
        this.country = country;
        this.consulate = consulate;
        this.serviceCategory = serviceCategory;
        this.service = service;

        this.siteURL = "https://online.mfa.gov.ua/api/v1/auth/session";
        this.siteKey = "6LcPNjgbAAAAAIp0KyR2RK_e7gb6ECDXR0n-JLqG";
        this.captchaKey = "a0b76abb37db80b699ae4444e11f3a27";

        this.instance = axios.create({
            baseURL: 'https://online.mfa.gov.ua/api/v1/',
            timeout: 5000
        });

        ac.setAPIKey(this.captchaKey);
        this.loadSavedToken();
    }

    async getCountryId() {
        const response = (await this.instance.get('countries?order=shortName%2CASC&offset=0&limit=500'))?.data;
        const { meta, data } = response;

        if(meta?.items_count <= 0) {
            throw new Error('Countries not found!');
        }

        const countryId = (data.find(x => x.name.includes(this.country)))?.id;
        console.log('[INFO]', `Country code is: ${countryId}.`)

        return countryId;
    }

    async getConsulateId() {
        const countryId = await this.getCountryId();

        const response = await this.instance.get(`queue/consulates?countryId=${countryId}`).then(res => res).catch(err => err);
        if(response?.response?.status === 401) {
            await this.updateAuthToken();
            return this.getConsulateId();
        }

        const { data } = response?.data;
        if(!data) return null;

        const consulateId = (data.find(x => x.shortName.includes(this.consulate)))?.id;
        console.log('[INFO]', `ConsulateID code is: ${consulateId}.`)

        return consulateId;
    }

    async getServiceCategoryId() {
        const consulateId = await this.getConsulateId();

        const response = await this.instance.get(`queue/service-categories?limit=500&scheduledConsulateId=${consulateId}`).then(res => res).catch(err => err);
        if(response?.response?.status === 401) {
            await this.updateAuthToken();
            return this.getServiceCategoryId();
        }

        const { data } = response?.data;
        if(!data) return null;

        const serviceCategoryId = (data.find(x => x.name.includes(this.serviceCategory)))?.id;
        console.log('[INFO]', `ServiceCategoryId code is: ${serviceCategoryId}.`)

        return serviceCategoryId;
    }

    async getServiceId(scheduledOnly = true) {
        const consulateId = await this.getConsulateId();
        const serviceCategoryId = await this.getServiceCategoryId();

        const response = await this.instance.get(`queue/services?consulateId=${consulateId}&limit=500&serviceCategoryId=${serviceCategoryId}&scheduledOnly=${scheduledOnly}`).then(res => res).catch(err => err);
        if(response?.response?.status === 401) {
            await this.updateAuthToken();
            return this.getServiceId();
        }

        const { data } = response?.data;
        if(!data) return null;

        const serviceId = (data.find(x => x.shortName.includes(this.service)))?.id;
        console.log('[INFO]', `ServiceId code is: ${serviceId}.`)

        return serviceId;
    }

    async getSchedules(date = moment().format('YYYY-MM-DD'), dateEnd = moment().format('YYYY-MM-DD')) {
        const consulateId = await this.getConsulateId();
        const serviceId = await this.getServiceId();

        const response = await this.instance.get(`queue/consulates/${consulateId}/schedule?date=${date}&dateEnd=${dateEnd}&serviceId=${serviceId}`).then(res => res).catch(err => err);
        if(response?.response?.status === 401) {
            await this.updateAuthToken();
            return this.getSchedules();
        }

        if(Array.isArray(response.data) && response?.data?.length === 0) {
            console.log("[INFO]", "Empty tickets list.");
            return null;
        }

        return response;
    }

    loadSavedToken () {
        // Load saved token
        try {
            let file = fs.readFileSync('./auth_token.json');
            let json = JSON.parse(file || "");
            let { auth_token } = json;

            if (auth_token) {
                this.instance.defaults.headers.Authorization = `Bearer ${auth_token}`;
            }
        } catch (e) {}
    }

    async updateAuthToken() {
        const countryId = await this.getCountryId();
        const gresponse = await ac.solveRecaptchaV2Proxyless(this.siteURL, this.siteKey)

        const { token } = (await this.instance.post(`auth/session`, { "g-recaptcha-response": gresponse, countryId }))?.data;

        fs.writeFileSync('./auth_token.json', JSON.stringify({
            auth_token: token,
            create_date: Date.now()
        }, null, 2));

        this.instance.defaults.headers.Authorization = `Bearer ${token}`;
    }
}

module.exports = TicketsApi;