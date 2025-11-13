const algosdk = require('algosdk');

const APP_ID = 749335380;
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';

// Your wallet address (the one that created the bounty)
const YOUR_ADDRESS = '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI';

// Paste your 25-word mnemonic here
const MNEMONIC = 'once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place';

async function quickRefund() {
    try {
        console.log('\n🔧 Quick Refund Tool for AlgoEase\n');
        console.log('This will refund the stuck bounty and return 2 ALGO to your wallet.\n');
        
        const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
        
        // Recover account from mnemonic
        if (MNEMONIC === 'YOUR_25_WORD_MNEMONIC_HERE') {
            console.log('❌ ERROR: Please edit this script and add your 25-word mnemonic phrase.\n');
            console.log('Open: scripts/quick-refund.js');
            console.log('Replace YOUR_25_WORD_MNEMONIC_HERE with your actual mnemonic.\n');
            console.log('⚠️  WARNING: Never share your mnemonic with anyone!\n');
            return;
        }
        
        const account = algosdk.mnemonicToSecretKey(MNEMONIC.trim());
        
        // Convert address to string if it's an object
        const fromAddress = typeof account.addr === 'string' ? account.addr : algosdk.encodeAddress(account.addr.publicKey);
        
        console.log(`📝 Your address: ${fromAddress}`);
        
        // Get account info to verify it exists
        try {
            const accountInfo = await algodClient.accountInformation(fromAddress).do();
            console.log(`💰 Current balance: ${Number(accountInfo.amount) / 1000000} ALGO\n`);
        } catch (e) {
            console.log(`⚠️  Warning: Could not fetch account info: ${e.message}\n`);
        }
        
        if (fromAddress !== YOUR_ADDRESS) {
            console.log(`⚠️  Warning: The mnemonic belongs to ${fromAddress}`);
            console.log(`   But the bounty was created by ${YOUR_ADDRESS}`);
            console.log(`   Make sure you're using the correct mnemonic!\n`);
        }
        
        // Get transaction parameters
        const suggestedParams = await algodClient.getTransactionParams().do();
        console.log('Got suggested params');
        
        // Create refund transaction
        const appArgs = [new Uint8Array(Buffer.from('refund'))];
        
        console.log('Creating transaction with:');
        console.log('  From:', fromAddress);
        console.log('  From type:', typeof fromAddress);
        console.log('  App ID:', APP_ID);
        console.log('  SuggestedParams:', suggestedParams);
        
        try {
            // Decode and re-encode the address to ensure it's in the correct format
            const addressBytes = algosdk.decodeAddress(fromAddress);
            const encodedFrom = algosdk.encodeAddress(addressBytes.publicKey);
            
            console.log('Encoded from:', encodedFrom);
            
            const txn = algosdk.makeApplicationCallTxnFromObject({
                from: encodedFrom,
                suggestedParams: suggestedParams,
                appIndex: APP_ID,
                onComplete: algosdk.OnApplicationComplete.NoOpOC,
                appArgs: appArgs,
                accounts: undefined,
                foreignApps: undefined,
                foreignAssets: undefined,
                boxes: undefined,
                lease: undefined,
                rekeyTo: undefined,
                note: new Uint8Array(Buffer.from('AlgoEase: Refund Bounty'))
            });
            
            console.log('\n📤 Signing refund transaction...');
            console.log('Transaction created successfully');
        } catch (txnError) {
            console.error('Error creating transaction:', txnError);
            console.error('Stack:', txnError.stack);
            throw txnError;
        }
        
        const signedTxn = txn.signTxn(account.sk);
        const txId = txn.txID().toString();
        
        console.log(`🔑 Transaction ID: ${txId}`);
        console.log('📡 Sending to blockchain...');
        
        await algodClient.sendRawTransaction(signedTxn).do();
        
        console.log('⏳ Waiting for confirmation (this takes about 4.5 seconds)...\n');
        
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
        
        console.log(`✅ SUCCESS! Transaction confirmed in round ${confirmedTxn['confirmed-round']}`);
        console.log(`💰 Refunded 2,000,000 microAlgos (2 ALGO) to your wallet`);
        console.log(`\n🎉 You can now create new bounties!\n`);
        console.log(`🔗 View transaction: https://testnet.explorer.perawallet.app/tx/${txId}\n`);
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        if (error.message && error.message.includes('invalid mnemonic')) {
            console.log('\n💡 Your mnemonic phrase appears to be invalid.');
            console.log('   Make sure you copied all 25 words correctly.\n');
        }
        
        if (error.response && error.response.body) {
            try {
                const body = JSON.parse(error.response.body);
                console.error('📋 Details:', body.message || body);
            } catch (e) {
                console.error('📋 Details:', error.response.body);
            }
        }
    }
}

quickRefund();
