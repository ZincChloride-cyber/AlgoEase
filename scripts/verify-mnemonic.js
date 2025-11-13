const algosdk = require('algosdk');

// Try the 24-word mnemonic
const mnemonic24 = 'barrel dentist divorce confirm worth type bless van cement click program opera turkey cushion consider bird symbol topic feature bleak mixed memory card man';
const expectedAddress = '3BHDMTNXJ3NGZDPTAHM26SB4ICJQW3GLS7MUOIC5G2NXQFDPIUVXY5IPWE';

console.log('Trying 24-word mnemonic...');
try {
  const account = algosdk.mnemonicToSecretKey(mnemonic24);
  const address = algosdk.encodeAddress(account.addr);
  console.log('Success! Address:', address);
  console.log('Matches expected:', address === expectedAddress);
} catch (e) {
  console.log('Failed:', e.message);
  console.log('\nNote: Algorand mnemonics typically require 25 words.');
  console.log('Please verify you have the complete mnemonic phrase.');
}








