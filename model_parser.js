const csv = require('csv-parser');
const fs = require('fs');


var assetModels = new Array();;
var obj={Name: '' ,
    Description: '',
    Hierarchy: [],
    Properties:[]};


exports.parse = function parse(filename,callback){

fs.createReadStream(filename)
  .pipe(csv())
  .on('data', (row) => {
    
   if (row.Name != '') 
   {
       if ((obj.Name != '') &&(row.Name != obj.Name)){
        //console.log(JSON.stringify(obj));
           assetModels.push(obj);
       }
    obj = {
           Name: row.Name ,
           Description: row.Description,
           Hierarchy: [],
           Properties:[]
        }

   }
    //console.log(row);
    switch(row.prop_type){
        case 'attribute':
            var temp = { 
                dataType: row.prop_dataType,
                   name: row.prop_name,
                   type: {
                       attribute: {
                           defaultValue: row.prop_defaultValue
                       },
              
                   },
            
             }
             obj.Properties.push(temp);
             //console.log(JSON.stringify(obj));
            break;
        case 'measurement':
            var temp = {
                dataType: row.prop_dataType,
                name: row.prop_name,
                type: {
                 
                       measurement: {}
               
                   },
                unit: row.prop_unit
             }
             obj.Properties.push(temp);
             //console.log(JSON.stringify(obj));
            break;
        case 'metric':
            var temp = {
                dataType: row.prop_dataType,
                 name: row.prop_name,
                   type: {
           
                       metric: {
                           expression: row.prop_expression,
                           variables: [
                               {
                                   name: row.prop_expression_variables_name,
                                   value: {
                                       
                                       propertyId: row.prop_expression_variables_propertyId
                                   }
                               }
                           ],
                           window: {
                               tumbling: {
                                   interval: row.prop_intervals
                               }
                           }
                       },
                       
                   },
                   unit: row.prop_unit
             }
             obj.Properties.push(temp);
             //console.log(JSON.stringify(obj));
            break;
        case 'transform':
            break;
        default:
            break;

    }
    if (row.Hierarchy_name !=""){
        var temp = { 
            childAssetModelId: row.Hierarchy_childAssetModel,
            name: row.Hierarchy_name
         }
         //console.log(JSON.stringify(temp));
         obj.Hierarchy.push(temp);
    }

  })
  .on('end', () => {
    //console.log(JSON.stringify(obj));
    assetModels.push(obj);
    callback (null, assetModels);
    //console.log('CSV file successfully processed');
  });
  
};

  exports.assetModels = assetModels;