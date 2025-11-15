# How to Get Private Key from Your Wallet

Since your wallet uses a 24-word mnemonic (not the 25-word Algorand format), you'll need to export the private key directly from your wallet.

## Option 1: Pera Wallet (Mobile/Desktop)

1. Open Pera Wallet app
2. Go to **Settings** → **Security** → **Export Private Key**
3. Enter your passcode/biometric
4. Copy the private key (it will be in base64 format)
5. Add it to `contract.env` as:
   ```
   REACT_APP_CREATOR_PRIVATE_KEY=<your_private_key_here>
   ```

## Option 2: AlgoSigner

1. Open AlgoSigner extension
2. Click on your account
3. Go to **Export Account**
4. Select **Private Key**
5. Copy the private key

## Option 3: MyAlgo Wallet

1. Open MyAlgo Wallet
2. Click on your account
3. Go to **Export Account**
4. Select **Private Key**
5. Copy the private key

## Option 4: Use AlgoKit or goal CLI

If you have access to the wallet through AlgoKit or goal CLI, you can export the private key directly.

## Security Note

⚠️ **Never share your private key or mnemonic with anyone!**
- Only use it for deployment on TestNet
- Never commit it to version control
- Consider using a separate account for development

## After Getting Private Key

1. Add it to `contract.env`:
   ```
   REACT_APP_CREATOR_PRIVATE_KEY=<your_base64_private_key>
   ```

2. Run deployment:
   ```bash
   node scripts/deploy-v3-contract.js
   ```

The script will automatically use the private key if available, or fall back to mnemonic.







