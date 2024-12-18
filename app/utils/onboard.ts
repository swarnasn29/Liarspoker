export function isEthereum(): boolean {
  if (typeof window !== 'undefined' && window.ethereum) {
    return true;
  }
  return false;
}

export function getChainID(): number {
  if (isEthereum()) {
    return parseInt(window.ethereum.chainId, 16);
  }
  return 0;
}

async function handleConnection(accounts: string[]): Promise<string[]> {
  if (accounts.length === 0) {
    const fetchedAccounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    return fetchedAccounts;
  }
  return accounts;
}

export async function requestAccount(): Promise<string> {
  let currentAccount = '0x0';
  if (isEthereum() && getChainID() !== 0) {
    let accounts = await window.ethereum.request({ method: 'eth_accounts' });
    accounts = await handleConnection(accounts);
    currentAccount = accounts[0];
  }
  return currentAccount;
}

export async function requestBalance(currentAccount: string): Promise<{
  currentBalance: number;
  err: boolean;
}> {
  let currentBalance = 0;
  if (isEthereum()) {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [currentAccount, 'latest'],
      });

      currentBalance = parseInt(balance, 16) / 1e18;
      return { currentBalance, err: false };
    } catch (err) {
      return { currentBalance, err: true };
    }
  }
  return { currentBalance, err: true };
}

export const GetParams = async () => {
  const response = {
    isError: false,
    message: '',
    step: -1,
    balance: 0,
    account: '0x0',
  };

  if (!isEthereum()) {
    response.step = 0;
    return response;
  }

  const currentAccount = await requestAccount();
  if (currentAccount === '0x0') {
    response.step = 1;
    return response;
  }

  response.account = currentAccount;

  // Base Sepolia Chain ID is 84532
  if (getChainID() !== 296) {
    response.step = 2;
    return response;
  }

  const { currentBalance, err } = await requestBalance(currentAccount);
  if (err) {
    response.isError = true;
    response.message = 'Error fetching balance!';
    return response;
  }
  response.balance = currentBalance;

  if (currentBalance < 0.01) {
    response.step = 3;
    return response;
  }

  return response;
};

export async function SwitchNetwork(): Promise<void> {
  try {
    await window?.ethereum?.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x128', 
        chainName: 'Hedera Testnet',
        nativeCurrency: {
          name: 'Hedera',
          symbol: 'HBAR',
          decimals: 8
        },
        rpcUrls: ['https://296.rpc.thirdweb.com/'],
        blockExplorerUrls: ['https://hashscan.io/testnet'],
      }],
    });
  } catch (error) {
    console.error('Error switching network:', error);
  }
} 