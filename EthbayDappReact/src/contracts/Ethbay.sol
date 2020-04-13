pragma solidity ^0.5.0;

contract Ethbay {
    string public storeName;
    uint public totalNumber = 0;
    mapping(uint => Item) public items;
    struct Item {
        uint itemId;
        string itemName;
        uint itemPrice;
        address payable itemOwner;
        bool isItemSold;
    }

    event ItemReady(
        uint itemId,
        string itemName,
        uint itemPrice,
        address payable itemOwner,
        bool isItemSold
    );

    event ItemSold(
        uint itemId,
        string itemName,
        uint itemPrice,
        address payable itemOwner,
        bool isItemSold
    );

    constructor() public {
        storeName = "EECE571 ETHBAY.COM";
    }

    function createItem(string memory _itemName, uint _itemPrice) public {
        require(bytes(_itemName).length > 0, "Item's name is required");
        require(_itemPrice > 0, "Item's price is required");
        totalNumber++;
        items[totalNumber] = Item(totalNumber, _itemName, _itemPrice, msg.sender, false);
        emit ItemReady(totalNumber, _itemName, _itemPrice, msg.sender, false);
    }

    function buyItem(uint _itemId) public payable {
        Item memory _item = items[_itemId];
        address payable _seller = _item.itemOwner;
        require(_item.itemId > 0 && _item.itemId <= totalNumber, 'Item should be in store');
        require(msg.value >= _item.itemPrice, 'payment should be good');
        require(!_item.isItemSold, 'should not yet been sold');
        require(msg.sender != _seller, 'cannot buy himself');

        //Purchase it
        _item.itemOwner = msg.sender;
        //Market the product purchased
        _item.isItemSold = true;
        //Update the product
        items[_itemId] = _item;
        //Pay the seller some ether
        address(_seller).transfer(msg.value);
        //Trigger an event
        emit ItemSold(totalNumber, _item.itemName, _item.itemPrice, msg.sender, true);
    }

}