/*
Author			: Gopal Nair (GONAIR), Microsoft
Organization	: CPE EAS SAP ERP Platform
Project			: MS Finance - BIS
*/
sap.ui.define(["sap/ui/core/UIComponent",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/odata/v2/ODataModel"
],
	function (UIComponent, ResourceModel, ODataModel) {
		"use strict";

		return UIComponent.extend("ZBIS_MAR_TB_XT.Component", {
			metadata: {
				properties: {
					"AlertDBKey": {
						type: "string",
						defaultValue: "",
						bindable: "bindable"
					}
				}
			},

			createContent: function () {
				sap.ui.getCore().loadLibrary("sap.ui.commons");
				sap.ui.getCore().loadLibrary("sap.ui.table");

				this.oView = sap.ui.view({
					viewName: "bpinfo.BP_Info",
					type: sap.ui.core.mvc.ViewType.XML
				});

				return (this.oView);
			},

			setAlertDBKey: function (sAlertDBKey) {

				if (sAlertDBKey !== this.getProperty("AlertDBKey")) {
					this.setProperty("AlertDBKey", sAlertDBKey);
					var strRequestURLBase = "/sap/opu/odata/sap/ZBIS_C_ALERTBP_CDS/"; //Set up base call URL
					var strServicePath = "/ZBIS_C_ALERTBP(guid'" + sAlertDBKey + "')"; //Set up dynamic part with AlertID

					//Create the default Model object oData Service.
					var objDefaultModel = new ODataModel(strRequestURLBase, {
						json: true,
						useBatch: false
					});

					//Grab an instance of the view, and set data retrieved to its default model.
					var view = this.oView;
					var oTable1 = view.byId("tblOrgAddress");
					var oTable2 = view.byId("tblPersonAddress");
					var oTable3 = view.byId("tblBPOtherInfoV2");
					var oTable4 = view.byId("tblBPOtherInfoExpiredV2");
					if (oTable1) {
						oTable1.setBusy(true);
					}
					if (oTable2) {
						oTable2.setBusy(true);
					}
					if (oTable3) {
						oTable3.setBusy(true);
					}
					if (oTable4) {
						oTable4.setBusy(true);
					}
					var that = this;
					objDefaultModel.read(strServicePath, {
						urlParameters: {
							"$expand": "to_AlertOrgAddressV2,to_AlertPersonAddressV2,to_BPOtherInfoV2,to_BPOtherInfoExpiredV2"
						},
						success: function (data) {
							//Instantiate a JSON model with return data from oData Service. We will bind this as default model.
							var dataModel = new sap.ui.model.json.JSONModel(data);

							//Use a custom sorter to build the display order based on:
							// Items having the same Request ID should be grouped together - but Org should come first.

							dataModel.getProperty("/to_AlertOrgAddressV2").results.sort(function (objA, objB) {
								//Check if Request IDs of the objects are different.
								if (objA.RequestID < objB.RequestID) {
									return 1;
								}
								if (objA.RequestID > objB.RequestID) {
									return -1;
								}

								//If execution reach here, the request IDs are the same. Compare Address type.
								if (objA.CustomerType > objB.CustomerType) {
									return 1;
								}

								if (objA.CustomerType < objB.CustomerType) {
									return -1;
								}
								return 0;
							});

							//Set the view model.
							view.setModel(dataModel);
							// that.oBusy.close();
							if (oTable1) {
								oTable1.setBusy(false);
							}
							if (oTable2) {
								oTable2.setBusy(false);
							}
							if (oTable3) {
								oTable3.setBusy(false);
							}
							if (oTable4) {
								oTable4.setBusy(false);
							}

							dataModel.refresh();

						}
					});

				}

				return this;
			},

			init: function () {
				// call super init (will call function "create content")
				sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

				var i18nModel = new ResourceModel({
					bundleName: "bpinfo.i18n.i18n"
				});

				this.oView.setModel(i18nModel, "i18n");

			}
		});
	});