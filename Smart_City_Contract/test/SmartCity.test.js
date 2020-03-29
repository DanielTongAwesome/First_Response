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

     // Testing Broadcast Warning
     describe('Testing Broadcast Warning', async () => {
        let result;
        let numRequests;

        before(async () => {
            result = await smartCity.broadcastWarning('123','1','123', '123', '1', '0',{ from: deployer })
            numRequests = await smartCity.eventNumber()
        })

        // create a request
        it('System should create a broadcast successfully', async () => {
            assert.equal(numRequests, 1);
            const event = result.logs[0].args;
            //console.log(event)
            assert.equal(event.timestamp.toNumber(),    123, 'number of timestamp should be 123');
            assert.equal(event.objectID.toNumber(),     1,   'objectID should be 1');
            assert.equal(event.objectXCor.toNumber(),   123, 'objectXCor should be 123');
            assert.equal(event.objectYCor.toNumber(),   123, 'objectYCor should be 123');
            assert.equal(event.mode.toNumber(),         1,   'trasportation mode should be 1');
            assert.equal(event.status,                  0,   'status should be 0')
        })

        // a request should be rejected
        it('Failure cases tests ', async () => {
            await smartCity.broadcastWarning('','1','123', '123', '1', '0',{ from: deployer }).should.be.rejected;
            await smartCity.broadcastWarning('123','','123', '123', '1', '0',{ from: deployer }).should.be.rejected;
        })

    })


     // Test Broadcast Intersection Warning
     describe('Test Broadcast Intersection Warning', async () => {
        let result;
        let numRequests;

        before(async () => {
            result = await smartCity.broadcastIntersectionWarning('123','2','4th road', '5th road', { from: deployer })
            numRequests = await smartCity.publicWarnNumber()
        })

        // create a request
        it('System should create a broadcast successfully', async () => {
            assert.equal(numRequests, 1);
            const event = result.logs[0].args;
            //console.log(event)
            assert.equal(event.timestamp.toNumber(),    123, 'number of timestamp should be 123');
            assert.equal(event.roadName1,   '4th road',   'road 1 should be 4th road');
            assert.equal(event.roadName2,   '5th road',   'road 2 should be 5th road');
            assert.equal(event.status,               2,'status should be 2 - potential injuries')
        })

        // a request should be rejected
        it('Failure cases tests ', async () => {
            await smartCity.broadcastIntersectionWarning('','2','4th road', '5th road', { from: deployer }).should.be.rejected;
            await smartCity.broadcastIntersectionWarning('123','2','', '5th road', { from: deployer }).should.be.rejected;
        })

    })



    
});
