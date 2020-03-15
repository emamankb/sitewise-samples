// Load the SDK for JavaScript
var AWS = require("./aws-sdk");
const asset_parser = require('./asset_parser');

// Set the Region 
AWS.config.update({ region: 'eu-west-1' });

// use Sitewise SDK
sitewise = new AWS.IoTSiteWise({ apiVersion: '2019-12-02' });

// Global variable to hold all assetModels
var assetModel = new Array();


// timeout helper function
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// lookup function for asset model id from asset model name
var lookupAssetModelId = function lookupAssetModelId (assetModelName){
    //console.log("****assetModelName= ", assetModelName);
    for (model in assetModel) {
      if (assetModel[model].assetModelName == assetModelName){
        return assetModel[model].assetModelId;
      }
    }
  }

// lookup function for asset id from asset name
var lookupAssetId = function lookupAssetId (assetName){
    console.log("****assetName= ", assetName);
    for (asset in asset_parser.assets) {
      if (asset_parser.assets[asset].AssetName == assetName){
        return asset_parser.assets[asset].AssetId;
      }
    }
}

// lookup function for property id from propert name and asset model name
var lookupPropertyId = function lookupPropertyId (assetModelName, PropertyName) {
    //console.log("****assetModelName= ", assetModelName, "    PropertyName=",PropertyName );
    //console.log(JSON.stringify(assetModel));
    for (model in assetModel) {
      if (assetModel[model].assetModelName == assetModelName){
        for (property in assetModel[model].assetModelProperties){
          if (assetModel[model].assetModelProperties[property].name == PropertyName) {
            return assetModel[model].assetModelProperties[property].id;
          }
        }
      }
    }
}

// lookup function for hierarchy id from child asset model name and parent asset model name
var lookupHierarchyId = function lookupHierarchyId (association, childAssetModelName) {
      console.log("lookup Hieirarchy");
    var childAssetModelId = lookupAssetModelId(childAssetModelName);
    var assetModelName = lookupAssetModelName (association);
    console.log(childAssetModelId);
    console.log(assetModelName);
    for (model in assetModel) {
      if (assetModel[model].assetModelName == assetModelName){
          console.log(childAssetModelId);
          console.log(assetModel[model].assetModelHierarchies);
        for (hierarchy in assetModel[model].assetModelHierarchies){
          if (assetModel[model].assetModelHierarchies[hierarchy].childAssetModelId == childAssetModelId) {
            return assetModel[model].assetModelHierarchies[hierarchy].id;
          }
        }
      }
    }
}

// lookup function for child asset model name from parent asset model name
var lookupAssetModelName = function lookupAssetModelName (association){
    for (asset in asset_parser.assets){
      if (asset_parser.assets[asset].AssetName == association){
        return asset_parser.assets[asset].AssetModelName;
      }
    }
}

var createAllAssets = async _ => {
    //listAssetsModels
    const data = await listAssetModels();
      console.log (data);
          for (model in data.assetModelSummaries)
          {
            // for each describeassetmodels  
            const assetmodel = await describeAssetModel(data.assetModelSummaries[model].id)
              
                assetModel.push (assetmodel);
               // console.log (JSON.stringify(assetModel));  
              
            
          }
      
      console.log (JSON.stringify(assetModel));
      // replace assetmodelname
      for (asset in asset_parser.assets){
        asset_parser.assets[asset].AssetModelId = lookupAssetModelId(asset_parser.assets[asset].AssetModelName);
        if (asset_parser.assets[asset].PropertyName != '')
            asset_parser.assets[asset].PropertyId = lookupPropertyId (asset_parser.assets[asset].AssetModelName, asset_parser.assets[asset].PropertyName)
        if (asset_parser.assets[asset].Association != '')
            asset_parser.assets[asset].HierarchyId = lookupHierarchyId (asset_parser.assets[asset].Association, asset_parser.assets[asset].AssetModelName)
      }

      for (asset in asset_parser.assets){ 
          const data = await createAsset(asset_parser.assets[asset].AssetName, asset_parser.assets[asset].AssetModelId);
          asset_parser.assets[asset].AssetId = data.assetId;
      }
      console.log(asset_parser.assets);
      await checkStatusOfAssets();

      for (asset in asset_parser.assets){ 
        if (asset_parser.assets[asset].Association !=''){
        const data = await associateAssets(asset_parser.assets[asset].Association ,asset_parser.assets[asset].HierarchyId ,asset_parser.assets[asset].AssetName );
        }
        if (asset_parser.assets[asset].PropertyName !=''){
            await updateAssetProperty(asset_parser.assets[asset].AssetName, asset_parser.assets[asset].PropertyAlias,asset_parser.assets[asset].PropertyId, asset_parser.assets[asset].PropertyNotification);
        }
      }
}

// wrapper function for listAssetModels()
var listAssetModels = async ()=> {
    //console.log("list all models");
    return sitewise.listAssetModels().promise();
};

// wrapper function for describeAssetModel()
var describeAssetModel =  async (id) => {
    var params = {
      assetModelId: id
    };
    return sitewise.describeAssetModel(params).promise();
};

// wrapper function for describeAsset()
var describeAsset =  async (id) => {
    var params = {
      assetId: id
    };
    return sitewise.describeAsset(params).promise();
};


// check and verify that staus of all assets are in ACTIVE state
var checkStatusOfAssets =  async () => {
      totalAssets = asset_parser.assets.length;
      while (true) {
      activeAssets =0; 
        for (asset in asset_parser.assets){ 
            const data = await describeAsset(asset_parser.assets[asset].AssetId);
            console.log("Check Status of Assetid=" , asset_parser.assets[asset].AssetId, "Status=", data.assetStatus);
            if (data.assetStatus.state =='ACTIVE') activeAssets++;
         }   
         console.log ("activeAssets=", activeAssets, " totalAssets=", totalAssets )
         if (activeAssets == totalAssets){
             break;
         } else{
            await timeout(3000); 
         }
      }
      return new Promise((resolve,reject) => {
        // do some async task
        resolve();
     });
};

// wrapper function for createAsset()
var createAsset = async (assetName, assetModelId) =>{
    var params = {
      assetModelId: assetModelId,
      assetName: assetName,
    };
    console.log("create asset = " ,params);
    return sitewise.createAsset(params).promise();
}
  
// wrapper function for associateAssets()
var associateAssets = async (assetName, hierarchyId, childAssetName ) =>{
    var params = {
      assetId: "",  //parent Asset ID
      hierarchyId: hierarchyId,
      childAssetId:"" //child Asset ID
    };
    params.assetId = lookupAssetId(assetName);
    params.childAssetId = lookupAssetId(childAssetName);
    console.log ("Associate" , params);
    return sitewise.associateAssets(params).promise()
}
  
// wrapper function for updateAssetProperty()
var updateAssetProperty = async (assetName, propertyAlias, propertyId, propertyNotificationState) =>{
    var params = {
      assetId: "",  //parent Asset ID
      propertyId: propertyId,
      propertyAlias:propertyAlias,
      propertyNotificationState: propertyNotificationState //child Asset ID
    };
    params.assetId = lookupAssetId(assetName);
    return sitewise.updateAssetProperty(params).promise()
}


// main entry
// parse the asset csv files then creat all assets
asset_parser.parse("asset.csv", function (err, data) {
    console.log(asset_parser.assets);
  
    createAllAssets();

});