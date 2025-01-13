import { saveToFile, delay } from './utils/helper.js';
import log from './utils/logger.js'
import Mailjs from '@cemalgnlts/mailjs';
import banner from './utils/banner.js';
import readline from 'readline/promises';
import {
    registerUser,
    createUserProfile,
    confirmUserReff
} from './utils/api.js'
const mailjs = new Mailjs();

const main = async () => {
    log.info(banner);
    log.info(`proccesing run auto register (CTRL + C to exit)`);
    await delay(3);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    while (true) {
        try {
            const account = await mailjs.createOneAccount();
            if (!account?.data?.username) {
                log.warn('Failed To Generate New Email, Retrying...');
                continue;
            }

            const email = account.data.username;
            const password = account.data.password;

            log.info(`Trying to register email: ${email}`);
            const regResponse = await registerUser(email, password, null);
            if (!regResponse?.data?.token) continue;
            const token = regResponse.data.token;

            log.info(`Trying to create profile for ${email}`);
            await createUserProfile(token, { step: 'username', username: email });
            await createUserProfile(token, { step: 'description', description: "AI Startup" });

            const reffCode = await rl.question('Enter Your Referral code or (CTRL + C to exit): ');
            log.info(`Referral code entered: ${reffCode}`);
            const confirm = await confirmUserReff(token, reffCode);
            if (confirm?.data?.token) {
                log.info('Referral confirmed successfully');
                saveToFile("accounts.txt", `${email}|${password}`)
                saveToFile("tokens.txt", `${confirm.data.token}`)
            }

        } catch (err) {
            log.error('Error creating account:', err.message);
        }
    }
};

// Handle CTRL+C (SIGINT)
process.on('SIGINT', () => {
    log.info('SIGINT received. Exiting...');
    rl.close();
    process.exit();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    log.error('Uncaught exception:', err);
    rl.close();
    process.exit(1);
});

main();
