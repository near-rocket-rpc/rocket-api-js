import { connect as nearConnect, Near, ConnectConfig, keyStores } from 'near-api-js';
import base64url from 'base64url';

export async function connect (config: ConnectConfig): Promise<Near> {
  // if the user is logged in and there a private key in local storage,
  // sign a jwt bearer token with the key
  const authData = JSON.parse(window.localStorage.getItem('near_app_wallet_auth_key') || '{}');
  if (!authData.accountId) {
    return nearConnect(config);
  }

  console.log('found signed in user', authData.accountId);
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  const keyPair = await keyStore.getKey(config.networkId, authData.accountId);
  console.log('pubkey loaded', keyPair.getPublicKey().toString());

  // build jwt
  const header = {
    alg: 'ED25519',
    typ: 'JWT'
  }
  const payload = {
    sub: authData.accountId,
    pubkey: keyPair.getPublicKey().toString()
  }
  const jwtBody = `${encode(header)}.${encode(payload)}`;
  const sig = keyPair.sign(Buffer.from(jwtBody));

  const token = `${jwtBody}.${base64url.encode(Buffer.from(sig.signature))}`
  console.log('jwt token', token);

  config.headers = config.headers || {};
  config.headers['Authorization'] = `bearer ${token}`;

  return nearConnect(config);
}

function encode (o: object): string {
  return base64url.encode(JSON.stringify(o));
}
