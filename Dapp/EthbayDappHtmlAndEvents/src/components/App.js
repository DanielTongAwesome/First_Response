import React, { Component } from 'react';
import Web3 from 'web3';
import logo from '../logo.png';
import './App.css';
import Ethbay from '../abis/Ethbay'
import Addressbar from './Addressbar'
import Main from './Main'

class App extends Component {
  state = {
    account: '',
    totalNumber: 0,
    items: [],
    loading: true
  }

  async componentDidMount(){
    await this.getWeb3Provider();
    await this.connectToBlockchain();
  }
  
  async getWeb3Provider(){
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
        window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  async connectToBlockchain(){
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({account: accounts[0]})
    const networkId = await web3.eth.net.getId()
    const networkData = Ethbay.networks[networkId];
    if(networkData) {
      const deployedEthbay = new web3.eth.Contract(Ethbay.abi, networkData.address);
      this.setState({deployedEthbay: deployedEthbay});
      const totalNumber = await deployedEthbay.methods.totalNumber().call();
      console.log(totalNumber);
      this.setState({totalNumber})
      for (var i = 1;i<= totalNumber;i++) {
        const item = await deployedEthbay.methods.items(i).call();
        this.setState({
          items:[...this.state.items, item]
        });
      }
      this.setState({loading: false})
      console.log(this.state.items)
    } else {
      window.alert('Ethbay contract is not found in your blockchain.')
    }
  
  }

 
  createItem = async (itemName, itemPrice) => {
    this.setState ({loading: true})
    const gasAmount = await this.state.deployedEthbay.methods.createItem(itemName, itemPrice).estimateGas({from: this.state.account})
    this.state.deployedEthbay.methods.createItem(itemName, itemPrice).send({from: this.state.account, gas: gasAmount})
    .once('receipt', (receipt)=> {
      this.setState({loading: false});
    })
  }

  buyItem = async (itemId, sellingPrice) => {
    this.setState ({loading: true})
    const gasAmount = await this.state.deployedEthbay.methods.buyItem(itemId).estimateGas({from: this.state.account, value: sellingPrice})
    this.state.deployedEthbay.methods.buyItem(itemId).send({from: this.state.account, value: sellingPrice, gas: gasAmount })
    .once('receipt', (receipt)=> {
      this.setState({loading: false});
    })
  }
  
  render() {
    return (
      <div>
        <Addressbar account={this.state.account}/>
        <div className="container-fluid mt-5">
          <div className="row">
            <main>
              { this.state.loading 
                ? 
                  <div><p className="text-center">Loading ...</p></div> 
                : 
                  <Main items = {this.state.items} 
                        createItem = {this.createItem}
                        buyItem = {this.buyItem}
                  />}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
