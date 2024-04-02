sap.ui.define(
  [
    'sap/ui/core/UIComponent',
    'sap/ui/model/resource/ResourceModel',
    'sap/ui/model/odata/v2/ODataModel'
  ],
  function (UIComponent, ResourceModel, ODataModel) {
    'use strict'

    return UIComponent.extend('ZBIS_MAR_TB_XT.Component', {
      metadata: {
        properties: {
          AlertDBKey: {
            type: 'string',
            defaultValue: '',
            bindable: 'bindable'
          }
        }
      },

      createContent: function () {
        sap.ui.getCore().loadLibrary('sap.ui.commons')
        sap.ui.getCore().loadLibrary('sap.ui.table')

        this.oView = sap.ui.view({
          viewName: 'recommendation.recom',
          type: sap.ui.core.mvc.ViewType.XML
        })

        return this.oView
      },

      setAlertDBKey: function (sAlertDBKey) {
        if (sAlertDBKey !== this.getProperty('AlertDBKey')) {
          this.setProperty('AlertDBKey', sAlertDBKey);
          var strRequestURLBase = '/sap/opu/odata/sap/ZBIS_REL_ADDR_HITS_AI_RECOMM_SRV/'; //Set up base call URL
          var strServicePath = "/AlertHdrSet(guid'" + sAlertDBKey + "')";

          //Create the default Model object oData Service.
          var objDefaultModel = new ODataModel(strRequestURLBase, {
            json: true,
            useBatch: false
          });

          //Grab an instance of the view, and set data retrieved to its default model.
          var view = this.oView
          this.oBusy = new sap.m.BusyDialog()

          var that = this
          this.oBusy.open()

          objDefaultModel.read(strServicePath, {
            success: function (data) {
              // Check Address Hits are there are not
              this.oBusy.close();
              debugger;
              if (data.Response.length === 0) {
                sap.m.MessageToast.show('No Address Hits Found for this AlertID');
                var oModel = new sap.ui.model.json.JSONModel(null);
                view.setModel(oModel);
                oModel.refresh(true);
                return;
              }

              // Call your custom callback function here
              AIRecommCallback(data, view);
            },
            error: function () {
              this.oBusy.close();
              throw new Error('Something went wrong --- too bad'); // Throw an error if the response is not ok
            }
          });
        }
        return this
      },

      init: function () {
        // call super init (will call function "create content")
        sap.ui.core.UIComponent.prototype.init.apply(this, arguments)

        var i18nModel = new ResourceModel({
          bundleName: 'recommendation.i18n.i18n'
        })

        this.oView.setModel(i18nModel, 'i18n')
      },

      AIRecommCallback: function (data, view) {

        // Retrive AI Recommendation data and bind to the model
        var AIRecommData = data.Response;
        var input = JSON.parse(AIRecommData);

       // Convert the input array to the desired output format
        var output = { result: [] } // Initialize an empty object with a result property as an empty array
        var map = {} // Initialize an empty object to store the items by their ItemDbkey
      
        for (var i = 0; i < input.length; i++) {
          // Loop through the input array
          var itemDBKey = input[i].ITEMDBKEY
          // Get the ItemDbkey of the current element
          if (!map[itemDBKey]) {
            // If the map object does not have a property with the itemDbKey
            map[itemDBKey] = [] // Initialize an empty array for the itemDbKey
            var i2 = {} // Initialize an empty object for i2
            i2.ScreenedName = input[i].BP_FULL_NAME // Copy the ScreenedName from the input element
            i2.ScreenedAddress = input[i].SCREENEDADDRESS // Copy the ScreenedAddress from the input element
            i2.ScreenedCountry = input[i].BP_COUNTRY // Copy the ScreenedCity from the input element
            output.result.push({ Item: map[itemDBKey], i2: i2 }) // Push an object with Item and i2 properties to the output result array
          }
          var item = {} // Initialize an empty object for the item
          item.DBkey = input[i].DBKEY    // Copy the DBkey from the input element
          item.ItemDBkey = input[i].ITEMDBKEY    // Copy the ItemDbkey from the input element
          //   item.Address_ID = input[i].Address_ID // Copy the Address_ID from the input element
          item.AddressDBkey = input[i].ADDRESSDBKEY    // Copy the Address_ID from the input element
          item.HitName = input[i].HIT_NAME // Copy the HitName from the input element
          item.HitCountryCode = input[i].HIT_COUNTRY // Copy the HitCountryCode from the input element
          item.HitAddress = input[i].HIT_ADDRESS // Copy the HitAddress from the input element
          item.OverallMatch = input[i].OVERALL_SCORE // Copy the OverallMatch from the input element
          item.AI_match_score = input[i].AI_MATCH_SCORE// Copy the AI_match_score from the input element
          item.AI_close_reason = input[i].AI_CLOSE_REASON // Copy the AI_close_reason from the input element
          item.AI_Recommendation = input[i].AI_RECOMMENDATION // Copy the AI_Recommendation from the input element
          item.Status = input[i].STATUS // Copy the Status from the input element
          map[itemDBKey].push(item) // Push the item to the corresponding array in the map object
        }

        //Instantiate a JSON model with return data from oData Service. We will bind this as default model.
        var dataModel = new sap.ui.model.json.JSONModel(output)
        //Set the view model.
        view.setModel(dataModel, 'M1')
        //	that.oBusy.close();
        dataModel.refresh()
      }
    })
  }
)
