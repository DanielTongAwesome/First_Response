pragma solidity ^0.5.0;

contract SmartCity {
    string public appName;
    uint public eventNumber = 0; // total number of detected event
    uint public publicWarnNumber = 0;
    // event status to keep track of the status of reward event
    /*
    enum explaination
    No_Warning - There is no inicident now
    Near_Close - Two objects are too close
    Potential_Pedestrian_Injuries - Crash involved human, there is a chance that human injuries
    Car_Crash - user approved the recent help (and issue been closed)
    */
    enum warningFlag { No_Warning, Near_Misses, Potential_Pedestrian_Injuries, Car_Crash}

    struct BroadcastEvent {
        uint256 eventID;    // tract event number`
        uint256 timestamp;  // timestamp
        uint256 objectID;   // tract the object
        uint256 objectXCor;     // object x corodinates
        uint256 objectYCor;     // object y corodinates
        uint256 mode;           // form of transportation
        uint256 warningCode;    // warning code
        warningFlag status;     // warning flag status
    }

    struct PublicWarnEvent {
        uint256 eventID;    // tract event number
        uint256 timestamp;  // timestamp
        string  roadName1;
        string  roadName2;
        uint256 warningCode;    // warning code
        warningFlag status;     // warning flag status
    }

    // mapping adress to BroadcastEvent - type public
    // use uint256 => BroadcastEvent because one user can send multiple events
    mapping(uint256 => BroadcastEvent) public BroadcastEvents;
    mapping(uint256 => PublicWarnEvent) public PublicWarnEvents;

    // contract constructor
    constructor() public {
        appName = "SmartCity";
    }

    /*
    events decleration:
    1. Broadcast Warning
    2. Broadcast Intersection Warning
    */

    // broadcast warning event
    event broadcastWarningEvent(
        uint256 eventID,    // tract event number
        uint256 timestamp,  // timestamp
        uint256 objectID,   // tract the object
        uint256 objectXCor,     // object x corodinates
        uint256 objectYCor,     // object y corodinates
        uint256 mode,           // form of transportation
        warningFlag status      // warning flag status
    );

    // broadcast warning event
    event broadcastPublicWarningEvent(
        uint256 eventID,    // tract event number
        uint256 timestamp,  // timestamp
        string roadName1,        // example: V6T 1Z4
        string roadName2,   // example: UBC Bus Loop
        warningFlag status      // warning flag status
    );

    event call911Event(
        uint256 eventID,    // tract event number
        uint256 timestamp,  // timestamp
        string intersectionZip,        // example: V6T 1Z4
        string intersectionLocation,   // example: UBC Bus Loop
        warningFlag status      // warning flag status
    );






    // function declearation
    // broadcast the warning msg to the network
    function broadcastWarning(
        uint256 _timestamp,  // timestamp
        uint256 _objectID,   // tract the object
        uint256 _objectXCor,     // object x corodinates
        uint256 _objectYCor,     // object y corodinates
        uint256 _mode,           // form of transportation
        uint256 _warningCode     // warning code
    ) public {
        require(_timestamp != 0, "Timestamp not equal to 0");
        require(_objectID != 0, "Object ID not equal to 0");
        require(_objectXCor != 0, "Object X cordinates not equal to 0");
        require(_objectYCor != 0, "Object Y cordinates not equal to 0");
        require(_mode != 0, "mode not equal to 0");

        // TODO: only admin can call this function

        // accumulate num
        eventNumber++;

        // save info
        BroadcastEvents[eventNumber] = BroadcastEvent(
            eventNumber,            // tract event number
            _timestamp,             // timestamp
            _objectID,              // tract the object
            _objectXCor,            // object x corodinates
            _objectYCor,            // object y corodinates
            _mode,                  // form of transportation
            _warningCode,
            warningFlag(_warningCode)     // warning flag status
        );

        // broadcast to the network
        emit broadcastWarningEvent(
            BroadcastEvents[eventNumber].eventID,       // tract event number
            BroadcastEvents[eventNumber].timestamp,     // timestamp
            BroadcastEvents[eventNumber].objectID,      // tract the object
            BroadcastEvents[eventNumber].objectXCor,    // object x corodinates
            BroadcastEvents[eventNumber].objectYCor,    // object y corodinates
            BroadcastEvents[eventNumber].mode,          // form of transportation
            BroadcastEvents[eventNumber].status        // warning flag status
        );
    }


    // function declearation
    // broadcast the warning msg to the network
    function broadcastIntersectionWarning(
        uint256 _timestamp,  // timestamp
        uint256 _warningCode,     // warning code
        string memory _roadName1,    // road intersection 1
        string memory _roadName2    // road intersection 2
    ) public {
        require(_timestamp != 0, "Timestamp not equal to 0");
        require(bytes(_roadName1).length > 0, "Road name should not be empty");
        require(bytes(_roadName2).length > 0, "Road name should not be empty");
        // TODO: only admin can call this function

        // accumulate num
        publicWarnNumber++;

        // save info
        PublicWarnEvents[publicWarnNumber] = PublicWarnEvent(
            publicWarnNumber,            // tract event number
            _timestamp,
            _roadName1,
            _roadName2,
            _warningCode,
            warningFlag(_warningCode)     // warning flag status
        );

        // broadcast to the network
        emit broadcastPublicWarningEvent(
            PublicWarnEvents[publicWarnNumber].eventID,       // tract event number
            PublicWarnEvents[publicWarnNumber].timestamp,     // timestamp
            PublicWarnEvents[publicWarnNumber].roadName1,
            PublicWarnEvents[publicWarnNumber].roadName2,
            PublicWarnEvents[publicWarnNumber].status        // warning flag status
        );
    }

}