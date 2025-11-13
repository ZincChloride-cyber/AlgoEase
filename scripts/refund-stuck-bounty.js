const algosdk = require('algosdk');
const readline = require('readline');

const APP_ID = 749335380;
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function refundStuckBounty() {
    try {
        const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
        
        console.log(`\n🔍 Checking contract state for App ID: ${APP_ID}\n`);
        
        const appInfo = await algodClient.getApplicationByID(APP_ID).do();
        const globalState = appInfo.params?.['global-state'] || [];
        
        const stateMap = {};
        globalState.forEach(item => {
            const key = Buffer.from(item.key, 'base64').toString();
            let value;
            
            if (item.value.type === 1) { // bytes
                const bytes = Buffer.from(item.value.bytes, 'base64');
                if (bytes.length === 32) {
                    value = algosdk.encodeAddress(bytes);
                } else {
                    value = bytes.toString();
                }
            } else if (item.value.type === 2) { // uint
                value = item.value.uint;
            }
            
            stateMap[key] = value;
        });
        
        console.log('📊 Current State:');
        console.log(`  Status: ${stateMap.status || 'undefined'} (0=OPEN, 1=ACCEPTED, 2=APPROVED, 3=CLAIMED, 4=REFUNDED)`);
        console.log(`  Amount: ${stateMap.amount || 0} microAlgos`);
        console.log(`  Client: ${stateMap.client_addr || 'none'}`);
        console.log(`  Verifier: ${stateMap.verifier_addr || 'none'}`);
        console.log(`  Deadline: ${stateMap.deadline || 0}`);
        
        const status = stateMap.status;
        const amount = stateMap.amount || 0;
        
        if (status === 3 || status === 4 || amount === 0) {
            console.log('\n✅ No stuck bounty found. You can create a new bounty!');
            rl.close();
            return;
        }
        
        console.log('\n⚠️  Found a stuck bounty! Attempting to refund...\n');
        
        // Get user's mnemonic
        const mnemonic = await question('Enter your 25-word mnemonic phrase (the wallet that created the bounty or is the verifier): ');
        const account = algosdk.mnemonicToSecretKey(mnemonic.trim());
        
        console.log(`\n📝 Your address: ${account.addr}`);
        console.log(`💼 Client address: ${stateMap.client_addr}`);
        console.log(`🔐 Verifier address: ${stateMap.verifier_addr}`);
        
        const isAuthorized = account.addr === stateMap.client_addr || account.addr === stateMap.verifier_addr;
        
        if (!isAuthorized) {
            console.log('\n❌ You are not authorized to refund this bounty.');
            console.log('   Only the client or verifier can refund the bounty manually.');
            
            const now = Math.floor(Date.now() / 1000);
            if (stateMap.deadline && now >= stateMap.deadline) {
                console.log('\n💡 However, the deadline has passed! You can call auto_refund.');
                const autoRefund = await question('Do you want to try auto_refund? (yes/no): ');
                if (autoRefund.toLowerCase() !== 'yes') {
                    rl.close();
                    return;
                }
                // Continue with auto_refund
            } else {
                rl.close();
                return;
            }
        }
        
        const suggestedParams = await algodClient.getTransactionParams().do();
        
        // Create refund transaction
        const appArgs = [new Uint8Array(Buffer.from('refund'))];
        
        const txn = algosdk.makeApplicationCallTxnFromObject({
            from: account.addr,
            appIndex: APP_ID,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            appArgs,
            suggestedParams
        });
        
        console.log('\n📤 Signing and sending refund transaction...');
        
        const signedTxn = txn.signTxn(account.sk);
        const txId = txn.txID().toString();
        
        console.log(`Transaction ID: ${txId}`);
        
        await algodClient.sendRawTransaction(signedTxn).do();
        
        console.log('⏳ Waiting for confirmation...');
        
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
        
        console.log(`\n✅ Transaction confirmed in round ${confirmedTxn['confirmed-round']}`);
        console.log(`💰 Refunded ${amount} microAlgos (${amount / 1000000} ALGO) to client`);
        console.log('\n🎉 You can now create a new bounty!');
        
        rl.close();
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data || error.response.text);
        }
        rl.close();
    }
}

refundStuckBounty();
