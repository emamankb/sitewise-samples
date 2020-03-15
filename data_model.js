// Load the SDK for JavaScript
var AWS = require("./aws-sdk");
const model_parser = require('./model_parser');

// Set the Region 
AWS.config.update({ region: 'eu-west-1' });

sitewise = new AWS.IoTSiteWise({ apiVersion: '2019-12-02' });

var assetModelId = new Array();

// timeout helper function
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// wrapper function for describeAssetModel()
var describeAssetModel =  async (id) => {
  var params = {
    assetModelId: id
  };
  return sitewise.describeAssetModel(params).promise();
};

//wrapper function for createAssetModel()
var createAssetModel = async (name, description, hierarchy, properties) =>{
  var params = {
    assetModelDescription: description,
    assetModelName: name,
    assetModelHierarchies: hierarchy,
    assetModelProperties: properties
  };
  return sitewise.createAssetModel(params).promise()
}

// check if state of asset model if it's active before proceed to next steps
var checkStatusOfAssetModel = async (id) => {
  var first = true;
  while (true){
    const data = await describeAssetModel(id);
    if (first){
      assetModelId.push(data);
      first =false;
    }
    if (data.assetModelStatus.state == "ACTIVE"){
      break;
    }
    await timeout(1000);
  }
};


var createAllAssetModels = async _ =>  {

  for (model in model_parser.assetModels) {
    console.log(model_parser.assetModels[model]);
    if (model_parser.assetModels[model].Hierarchy.length >0){
        //for (refMode in assetModelId){
          //search for {{ }} in Hierarchy, metric types
          //for loop in Hierachy array
          for (hierarchy in model_parser.assetModels[model].Hierarchy){
            var str = model_parser.assetModels[model].Hierarchy[hierarchy].childAssetModelId;
            if (str.indexOf("{{") != -1){
              addReference(model, hierarchy , -1, -1);
            }
          }
          //for loop in properties array
          for (property in model_parser.assetModels[model].Properties){
            if ( model_parser.assetModels[model].Properties[property].type.metric != undefined){
              for (variable in model_parser.assetModels[model].Properties[property].type.metric.variables){

              
            var  str =  model_parser.assetModels[model].Properties[property].type.metric.variables[variable].value.propertyId;
            console.log (model_parser.assetModels[model].Properties[property].type.metric.variables[variable].value.propertyId);
            if (str.indexOf("{{") != -1){
              addReference(model, -1 , property, variable);
            }
          }
          }
          }
       // }
    }
    // create AssetModel
    console.log ("create Asset for assetModelName", model_parser.assetModels[model].Name);
    console.log("*****Now= " , JSON.stringify(model_parser));

    const data = await createAssetModel(model_parser.assetModels[model].Name, model_parser.assetModels[model].Description, model_parser.assetModels[model].Hierarchy, model_parser.assetModels[model].Properties);
    await checkStatusOfAssetModel(data.assetModelId);
  
  }  
  return new Promise(function (resolve, reject){});
}

// replace all refrence with real values
var addReference = function addReference (modelIndex, hierarchyIndex, propertyIndex , variableIndex){
  if (hierarchyIndex != -1){
   var str = model_parser.assetModels[modelIndex].Hierarchy[hierarchyIndex].childAssetModelId;
   model_parser.assetModels[modelIndex].Hierarchy[hierarchyIndex].childAssetModelId = lookupAssetModelId(str.replace("{{","").replace("}}",""));
   model_parser.assetModels[modelIndex].Hierarchy[hierarchyIndex].name= str.replace("{{","").replace("}}","");
  } else{
    if (propertyIndex != -1){
      var str = model_parser.assetModels[modelIndex].Properties[propertyIndex].type.metric.variables[variableIndex].value.propertyId;
      var str_stripped = str.replace("{{","").replace("}}","");
      model_parser.assetModels[modelIndex].Properties[propertyIndex].type.metric.variables[variableIndex].value.propertyId = lookupPropertyId(str_stripped.substring(0,str_stripped.indexOf(".")), 
                                                                                                                str_stripped.substring(str_stripped.indexOf(".")+1, str_stripped.length ) );
      model_parser.assetModels[modelIndex].Properties[propertyIndex].type.metric.variables[variableIndex].value.hierarchyId= str_stripped.substring(0,str_stripped.indexOf("."));                                                                                                        
    }
  }

}

// look up for asset Model Id from asset Model Name
var lookupAssetModelId = function lookupAssetModelId (assetModelName){
  console.log("****assetModelName= ", assetModelName);
  for (m in assetModelId) {
    if (assetModelId[m].assetModelName == assetModelName){
      return assetModelId[m].assetModelId;
    }
  }
}

// look up for property Id from asset model name and property name
var lookupPropertyId = function lookupPropertyId (assetModelName, PropertyName) {
  console.log("****assetModelName= ", assetModelName, "    PropertyName=",PropertyName );
  console.log(JSON.stringify(assetModelId));
  for (modid in assetModelId) {
    if (assetModelId[modid].assetModelName == assetModelName){
      for (property in assetModelId[modid].assetModelProperties){
        if (assetModelId[modid].assetModelProperties[property].name == PropertyName) {
          return assetModelId[modid].assetModelProperties[property].id;
        }
      }
    }
  }
}

// main
model_parser.parse("model.csv", function (err, data) {
  console.log(JSON.stringify(model_parser.assetModels));

 createAllAssetModels();

});
