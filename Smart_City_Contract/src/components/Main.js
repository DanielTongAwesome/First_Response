import React, { Component } from 'react';

class Main extends Component {
  render() {
    return (
      <div id="content">
        <h2>Add Item</h2>
        <form onSubmit = 
          {async (event) => {
            event.preventDefault();
            const itemName = this.itemName.value
            const sellingPrice = window.web3.utils.toWei(this.sellingPrice.value.toString(), 'Ether')
            await this.props.createItem(itemName, sellingPrice)}
          }>
        <div className="form-group mr-sm-2">
            <input 
            id="itemName"
            type="text"
            ref={(input)=>{this.itemName=input}}
            className="form-control"
            placeholder="Item Name"
            required/>
        </div>
        <div className="form-group mr-sm-2">
            <input 
            id="sellingPrice"
            type="text"
            ref={(input)=>{this.sellingPrice=input}}
            className="form-control"
            placeholder="Selling Price"
            required/>
        </div>
        <button type="submit" className="btn btn-primary">Add Item</button>
        </form>
        <p>&nbsp;</p>
        <h2>Buy Item</h2>
        <table className="table">
        <thead id="itemList">
          <tr>
            <th scope="col">#</th>
            <th scope="col">Item Name</th>
            <th scope="col">Selling Price</th>
            <th scope="col">Owner Address</th>
            <th scope="col"></th>
          </tr> 
        </thead>
        <tbody id="itemList">
            {this.props.items.map((item, key)=>{
                return(
                    <tr key={key}>
                    <th scope="row">{item.itemId.toString()}</th>   
                    <td>{item.itemName}</td> 
                    <td>{window.web3.utils.fromWei(item.itemPrice.toString(), 'Ether')} ETH </td>
                    <td>{item.itemOwner}</td>
                    <td>
                      {
                        !item.isItemSold
                          ?
                          <button 
                            name = {item.itemId}
                            value = {item.itemPrice}
                            onClick={async (event)=>{
                              await this.props.buyItem(event.target.name, event.target.value);
                            }}
                          >
                            Buy
                          </button>
                          : 
                          null
                        }
                    </td>
                  </tr>
                )
            })}
        </tbody>
        </table>
      </div>
    );
  }
}

export default Main;
