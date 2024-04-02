sap.ui.controller('recommendation.recom', {
  /*
   * Called when a controller is instantiated and its View controls (if available) are already created.
   * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
   * @memberOf alertinfo.Alert_Info
   */
  onInit: function () {
    //var oUser = sap.ushell.Container.getUser()
    //var sUserId = oUser.getId()
    // if (sUserId === "VIBHORARORA" || sUserId === "SNEHAP" || sUserId === "ANANDRAI" || sUserId === "RUMACPAR") {
    // 	this.getView().byId("_IDGenButton1").setVisible(true);
    // } else {
    // 	this.getView().byId("_IDGenButton1").setVisible(false);

    // }
  },

  // formatter
  columnTextWithLineBreak: function (sText1, sText2) {
    var sResult = sText1 + '\n'
    sResult += sText2 ? sText2 : '\n'
    return sResult
  },

  toPercentage: function (oValue) {
    var iNumber = 0
    if (oValue) {
      iNumber = parseInt(oValue, 10)
      if (isNaN(iNumber)) {
        iNumber = 0
      }
    }
    return iNumber + '%'
  },
  /*
   * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
   * (NOT before the first rendering! onInit() is used for that one!).
   * @memberOf alertinfo.Alert_Info
   */
  onBeforeRendering: function () {},

  /**
   * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
   * This hook is the same one that SAPUI5 controls get after being rendered.
   * @memberOf alertinfo.Alert_Info
   */
  onAfterRendering: function () {},

  /**
   * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
   * @memberOf alertinfo.Alert_Info
   */
  //	onExit: function() {
  //
  //	}

  /**
   * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
   * This hook is the same one that SAPUI5 controls get after being rendered.
   * @memberOf alertinfo.Alert_Info
   */
  onSubmitHits: function (oEvent) {
    // Get the selected paths
    var oSelectionPath = oEvent.oSource.oParent.oParent._aSelectedPaths // Get selected paths
    //        var view = this.getView() // Assuming you have a reference to the view
    var oModel = this.getView().getModel('M1') // Assuming your model name is "data"

    // Initialize an array to store the selected data
    var selectedData = []
    // Loop through each selected path and retrieve the corresponding data
    oSelectionPath.forEach(function (path) {
      var selectedItem = oModel.getProperty(path)
      // Select specific fields and create a new object
      var selectedFields = {
        AlertKey: selectedItem.DBkey,
        ItemKey: selectedItem.ItemDBkey,
        AddressKey: selectedItem.AddressDBkey,
        AIRecomm: selectedItem.AI_Recommendation
      }
      selectedData.push(selectedFields) // Push the selected fields to the array
    })

    // Create the final JSON format
    var finalJSON = {
      AlertKey: selectedData[0].AlertKey, // Map the first AlertKey from selectedData
      Nav_To_Item: selectedData.map(function (item, index) {
        return {
          AlertKey: item.AlertKey, // Map the same AlertKey for each item
          ItemKey: item.ItemKey,
          AddressKey: item.AddressKey,
          AIRecomm: item.AIRecomm,
          Status: ' '
        }
      })
    }

    // Call the OData service to submit the data

    var strURL = '/sap/opu/odata/sap/ZBIS_REL_ADDR_HITS_AI_RECOMM_SRV/' //Set up base call URL

    var objModel = new sap.ui.model.odata.v2.ODataModel(strURL, {
      json: true,
      useBatch: false
    })

    objModel.create('/AlertHdrSet', finalJSON, {
      // Assuming the entity set is ZBIS_C_ALERT_HIT_DET
      success: function (data) {
        // Handle the success response
        debugger

        var addHitsResult = data.Nav_To_Item.results
        var oModelData = oModel.getData()

        // Loop through each entry in addHitsResult
        addHitsResult.forEach(function (addHit) {
          // Find the matching entry in oModelData based on Item key, Address key, and DB key
          var matchingEntry = oModelData.result.find(function (entry) {
            return entry.Item.some(function (item) {
              return (
                item.ItemDBkey === addHit.ItemKey &&
                item.AddressDBkey === addHit.AddressKey &&
                item.DBkey === addHit.AlertKey
              )
            })
          })

          // If a matching entry is found, update the Status field
          if (matchingEntry) {
            matchingEntry.Item.forEach(function (item) {
              if (
                item.ItemDBkey === addHit.ItemKey &&
                item.AddressDBkey === addHit.AddressKey &&
                item.DBkey === addHit.AlertKey
              ) {
                item.Status = addHit.Status
              }
            })
          }
        })

        // Refresh the model to reflect the changes
        oModel.refresh(true)
      },
      error: function (error) {
        // Handle the error response
        debugger
      }
    })
  },
  onCompleteItem: function (oEvent) {
    var oSelectionPath = oEvent.oSource.oParent.oParent._aSelectedPaths // Get selected paths
    var oModel = this.getView().getModel('M1')

    const finalData = oSelectionPath.map(path => {
      const selectedItem = oModel.getProperty(path)
      return {
        AlertKey: selectedItem.DBkey,
        ItemKey: selectedItem.ItemDBkey,
        Response: ' '
      }
    })

    var finalJSON = finalData[0]

    var isMessageBoxCalled = false // Flag variable

    // Check if any of the selected items have a status of 'Open'
    oSelectionPath.forEach(function (path) {
      if (isMessageBoxCalled) {
        return // Exit the forEach loop if MessageBox is already called
      }

      var selectedItem = oModel.getProperty(path)

      if (selectedItem.Status == 'Open') {
        sap.m.MessageBox.warning(
          'There are Open Address Hit which will be Submitted',
          {
            actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
            //  emphasizedAction: MessageBox.Action.OK,
            onClose: function (sAction) {
              if (sAction === sap.m.MessageBox.Action.OK) {
                // Complete Item
                completeItem(finalJSON, oModel, oSelectionPath)
              } else if (sButton === sap.m.MessageBox.Action.CANCEL) {
                return
              }
            }.bind(this)
          }
        )
        isMessageBoxCalled = true // Set the flag variable to true
      }
    })
  },
  completeItem: function (finalJSON, oModel, oSelectionPath) {
    // Call the OData service to submit the data

    var strURL = '/sap/opu/odata/sap/ZBIS_REL_ADDR_HITS_AI_RECOMM_SRV/' //Set up base call URL

    var objModel = new sap.ui.model.odata.v2.ODataModel(strURL, {
      json: true,
      useBatch: false
    })

    objModel.create('/CloseItemSet', finalJSON, {
      // Assuming the entity set is ZBIS_C_ALERT_HIT_DET
      success: function (data) {
        // Handle the success response

        var itemResult = JSON.parse(data.Response)

        if (itemResult.type == 'E') {
          new sap.m.MessageBox.error(itemResult.message);
        } else if (itemResult.type == 'S') {
          sap.m.MessageToast.show(itemResult.message);
        } else if (itemResult.type == 'W') {
          sap.m.MessageBox.warning(itemResult.message);
        }
        // Update Address Hits Status
        // var oModelData = oModel.getData()

        // Loop through each entry in addHits
        oSelectionPath.forEach(function (path) {
          var selectedItem = oModel.getProperty(path)
          selectedItem.Status = 'Submitted'
        })
        // Refresh the model to reflect the changes
        oModel.refresh(true);
      },
      error: function (error) {
        // Handle the error response
      }
    })
  }
})
