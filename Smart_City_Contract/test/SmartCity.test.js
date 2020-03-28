const SmartCity = artifacts.require("SmartCity");
require('chai')
.use(require('chai-as-promised'))
.should();

contract(SmartCity,([deployer, seller, buyer])=>{
    let smartCity;
    before(async () =>{
        smartCity = await SmartCity.deployed()
    })
    describe('Deployment', async()=>{
        it('The deployment should be done successfully',async() =>{
            const address = await smartCity.address
            assert.notEqual(address,0x0)
            assert.notEqual(address,'')
            assert.notEqual(address,null)
            assert.notEqual(address,undefined) 
        })

        it('The deployed smart contract has the correct name', async()=>{
            const name = await smartCity.appName();
            assert.equal(name, 'SmartCity')
        })
    })

    
});
