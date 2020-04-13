import React, { Component } from 'react';
import Web3 from 'web3';
import logo from '../logo.png';
import './App.css';
import SmartCity from '../abis/SmartCity'
import Addressbar from './Addressbar'
import Main from './Main'

class App extends Component {
  state = {
    account: '',
    totalNumber: 0,
    BroadcastEvents: [],
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
    const networkData = SmartCity.networks[networkId];
    if(networkData) {
      const deployedSmartCity = new web3.eth.Contract(SmartCity.abi, networkData.address);
      this.setState({deployedSmartCity: deployedSmartCity});
      const totalNumber = await deployedSmartCity.methods.eventNumber().call();
      console.log(totalNumber);
      this.setState({totalNumber})
      for (var i = 1;i<= totalNumber;i++) {
        const BroadcastEvent = await deployedSmartCity.methods.BroadcastEvents(i).call();
        this.setState({
          BroadcastEvents:[...this.state.BroadcastEvents, BroadcastEvent]
        });
      }
      this.setState({loading: false})
      console.log(this.state.BroadcastEvents)
    } else {
      window.alert('SmartCity contract is not found in your blockchain.')
    }
  
  }

 
  broadcastWarning = async (timestamp, objectID, objectXCor, objectYCor, mode, warningCode) => {
    this.setState ({loading: true})
    const gasAmount = await this.state.deployedSmartCity.methods.broadcastWarning(timestamp, objectID, objectXCor, objectYCor, mode, warningCode).estimateGas({from: this.state.account})
    this.state.deployedSmartCity.methods.broadcastWarning(timestamp, objectID, objectXCor, objectYCor, mode, warningCode).send({from: this.state.account, gas: gasAmount})
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
                  <Main events = {this.state.BroadcastEvents} 
                        broadcastWarning = {this.broadcastWarning}
                  />}
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
