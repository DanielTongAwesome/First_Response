const getWeb3 = async () => {
    if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
    } else {
        // set the provider you want from Web3.providers
        web3 = new Web3(new Web3.providers.WebsocketProvider("ws://127.0.0.1:7545"));
    }
}
