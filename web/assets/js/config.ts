export const {
  VITE_GNO_WS_URL,
  VITE_GNO_JSONRPC_URL,
  VITE_GNO_CHESS_REALM,
  VITE_FAUCET_URL
} = import.meta.env;

if (!VITE_GNO_WS_URL) {
  throw Error('VITE_GNO_WS_URL property not found in .env');
}

if (!VITE_GNO_JSONRPC_URL) {
  throw Error('VITE_GNO_JSONRPC_URL property not found in .env');
}

if (!VITE_GNO_CHESS_REALM) {
  throw Error('VITE_GNO_CHESS_REALM property not found in .env');
}

if (!VITE_FAUCET_URL) {
  throw Error('VITE_FAUCET_URL property not found in .env');
}

export default {
  GNO_WS_URL: VITE_GNO_WS_URL,
  GNO_JSONRPC_URL: VITE_GNO_JSONRPC_URL,
  GNO_CHESS_REALM: VITE_GNO_CHESS_REALM,
  FAUCET_URL: VITE_FAUCET_URL
};
