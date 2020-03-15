const csv = require('csv-parser');
const fs = require('fs');


var assets = new Array();;
var obj={AssetName: '' ,
    AssetModelName: '',
    Association: "",
    PropertyName:"",
    PropertyAlias:"",
    PropertyNotification:"",
};


exports.parse = function parse(filename,callback){

fs.createReadStream(filename)
  .pipe(csv())
  .on('data', (row) => {
    

    obj ={AssetName: row.AssetName ,
    AssetModelName: row.AssetModelName,
    Association: row.Association,
    PropertyName:row.PropertyName,
    PropertyAlias:row.PropertyAlias,
    PropertyNotification: row.PropertyNotification
    };
    //console.log (row);
    if (obj.PropertyNotification =="") {
      obj.PropertyNotification = "DISABLED"
    }
    assets.push(obj);
    })

  .on('end', () => {
    //console.log(JSON.stringify(obj));
    
    callback (null, assets);
    //console.log('CSV file successfully processed');
  });
  
};

  exports.assets = assets;