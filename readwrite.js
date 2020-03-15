// Load the SDK for JavaScript
var AWS = require("./aws-sdk");
const asset_parser = require('./asset_parser');
;
// Set the Region 
AWS.config.update({ region: 'eu-west-1' });



sitewise = new AWS.IoTSiteWise({ apiVersion: '2019-12-02' });




function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var batchPutAssetPropertyValue =  async (propertyAlias, timeInSeconds, offsetInNanos, value) => {
  var params = {
    entries: [ 
        {  entryId:"test",
            propertyAlias: propertyAlias,
  
            propertyValues: [ 
              { 
                  quality: "GOOD",
                  timestamp: { 
                    offsetInNanos: offsetInNanos,
                    timeInSeconds: timeInSeconds
                  },
                  value: { 
                    doubleValue: value
                  }
              }
            ]
        }
    ]
 }    
    return sitewise.batchPutAssetPropertyValue(params).promise();
};


var getAssetPropertyValueHistory =  async (propertyAlias,startDate, endDate) => {
  var params = {
    propertyAlias: propertyAlias,
    startDate: startDate,
    endDate: endDate
  };
  return sitewise.getAssetPropertyValueHistory(params).promise();

};

var testDataReadWrite =  async() =>{
  for (let i=0; i<10; i++){
    currentTime = Date.now();
  
    var timeInSeconds = Math.trunc((currentTime*1000000)/1000000000);
    var offsetInNanos = (currentTime*1000000)%1000000000;
    var randomValue = Math.random()*50;
    console.log("value=", randomValue);
    console.log (timeInSeconds);
    await batchPutAssetPropertyValue("/rpi/temp1"  , timeInSeconds, offsetInNanos, randomValue);
    await timeout(1000); 

  }

 startDate = Math.floor((Date.now()-1000000000)/1000);
 endDate =  Math.floor((Date.now())/1000);
  const data = await getAssetPropertyValueHistory("/rpi/temp1", startDate, endDate);
  console.log (JSON.stringify(data));
}

testDataReadWrite();
