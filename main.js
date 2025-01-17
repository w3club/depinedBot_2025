import * as utils from './utils/api.js';
import banner from './utils/banner.js';
import log from './utils/logger.js';
import { readFile, delay } from './utils/helper.js'

const main = async () => {
    log.info(banner);
    await delay(3)
    const accounts = await readFile("accounts.txt");
    if (accounts.length === 0) {
        log.error('No accounts found in tokens.txt');
        return;
    }
    const proxies = await readFile("proxy.txt");
    try {
        log.info(`Starting Program for all accounts:`, accounts.length);

        const accountsProcessing = accounts.map(async (account, index) => {
            const proxy = proxies[index % proxies.length] || null;

            const [email, password] = account.split('|')

            try {

                const loginRes = await utils.loginUser(email, password, proxy)
                const token = loginRes?.data?.token
                const userData = await utils.getUserInfo(token, proxy);
                if (userData?.data) {
                    const { email, verified, current_tier, points_balance } = userData.data
                    log.info(`Account ${index + 1} info:`, { email, verified, current_tier, points_balance });
                }

                setInterval(async () => {
                    const connectRes = await utils.connect(token, proxy);
                    log.info(`Ping result for account ${index + 1}:`, connectRes || { message: 'unknown error' });

                    const result = await utils.getEarnings(token, proxy);
                    log.info(`Earnings result for account ${index + 1}:`, result?.data || { message: 'unknown error' });
                }, 1000 * 30); // Run every 30 seconds

            } catch (error) {
                log.error(`Error processing account ${index}: ${error.message}`);
            }
        });

        await Promise.all(accountsProcessing);
    } catch (error) {
        log.error(`Error in main loop: ${error.message}`);
    }
};


process.on('SIGINT', () => {
    log.warn(`Process received SIGINT, cleaning up and exiting program...`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    log.warn(`Process received SIGTERM, cleaning up and exiting program...`);
    process.exit(0);
});


// Run the main function
main();
