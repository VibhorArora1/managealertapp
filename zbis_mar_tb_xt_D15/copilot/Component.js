
sap.ui.define(["sap/ui/core/UIComponent",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/odata/v2/ODataModel",
	"copilot/libs/signalr"
],
	function (UIComponent, ResourceModel, ODataModel, signalr) {
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
					viewName: "copilot.copilot",
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

					var strURLEncryption = "/sap/opu/odata/sap/ZBIS_COPILOT_SRV/"; //Set up base call URL
					var strServicePathEncryption = "/ZBIS_C_FETCH_API_KEY" //Set up dynamic part with AlertID

					var objDefaultEncryption = new ODataModel(strURLEncryption, {
						json: true,
						useBatch: false
					});
					var view = this.oView;
					this.oBusy = new sap.m.BusyDialog();
					var that = this;
					this.cleanSlate(view);
					this.oBusy.open();

					objDefaultEncryption.read(strServicePathEncryption, {
						success: function (encryptionData) {
							//Instantiate a JSON model with return data from oData Service. We will bind this as default model.
							var oJSONModelEncryption = new sap.ui.model.json.JSONModel(encryptionData.results);
							//Set the view model.
							view.setModel(oJSONModelEncryption, "pf8");

							view.byId("smartTable").setVisible(true);
							view.byId("smartFormColumn").setVisible(false);
							view.byId("OwnershipTableId").setVisible(false);
							view.byId("smartFormColumn1").setVisible(false);
							view.byId("_IDGenFeedInput1").setVisible(false);
							view.byId("idVerticalLayoutSanction").setVisible(false);
							view.byId("idVerticalLayoutOwnership").setVisible(false);
							view.byId("_IDGenList1").setVisible(false);
							view.byId("sanctionTabVerticalID").setVisible(false);
							view.byId("smartFormSearch").setVisible(false);
							var oIconTabBar = view.byId("idIconTabBar");
							if (oIconTabBar) {
								
									oIconTabBar.removeItem(oIconTabBar.getItems()[3]);
									oIconTabBar.removeItem(oIconTabBar.getItems()[3]);
									oIconTabBar.setSelectedKey("Match");
								
							}
							//Grab an instance of the view, and set data retrieved to its default model.


							objDefaultModel.read(strServicePath, {
								urlParameters: {
									"$expand": "to_AlertOrgAddressV2,to_AlertPersonAddressV2,to_BPOtherInfoV2"
								},
								success: function (data) {
									//Instantiate a JSON model with return data from oData Service. We will bind this as default model.
									var dataModel = new sap.ui.model.json.JSONModel(data);

									var keyVal = view.getModel("pf8").getData();
									for (var i = 0; i < keyVal.length; i++) {
										if (keyVal[i].ApiName === "MODDYS") {
											var moodys = keyVal[i].KeyDecryptValue;
											break;
										}
									}
									if (!moodys) {
										that.oBusy.close();
										sap.m.MessageToast.show("Please check the API Key for Moody's");
										return;
									}

									var tokenEndpoint = "https://token.hub.moodysanalytics.com/prod/auth/token";
									var username = "vibhorarora@microsoft.com";

									var password = moodys;

									// Create a base64-encoded string of the credentials (username:password)
									var base64Credentials = btoa(username + ":" + password);

									// Prepare the request headers
									var headers = {
										"Authorization": "Basic " + base64Credentials,
										"Content-Type": "application/x-www-form-urlencoded"
									};

									// Prepare the data to send to the token endpoint
									var dataCrednetials = "grant_type=client_credentials";
									// Send a POST request to the token endpoint with basic authentication
									jQuery.ajax({
										url: tokenEndpoint,
										method: "POST",
										headers: headers,
										data: dataCrednetials,
										success: function (response) {
											// The response should contain the access token
											var accessToken = response.access_token;
											// that.getOwnerComponent()._accessToken = accessToken;
											var url = "https://api.bvdinfo.com/v1/orbis/companies/match";
											var aTitleValue = {};
											var oModel4 = new sap.ui.model.json.JSONModel();
											for (var i = 0; i < data.to_AlertOrgAddressV2.results.length; i++) {
												if (data.to_AlertOrgAddressV2.results[i].AlertItemNumber === 1) {
													if (data.to_AlertOrgAddressV2.results[i].CustomerType === "ZC") {
														for (var j = i - 1; j >= 0; j--) {
															if (data.to_AlertOrgAddressV2.results[j].CustomerType === "ZB") {
																i = j;
																break;
															}
														}
													}
													var oIndex = i;
													aTitleValue.CompanyName = data.to_AlertOrgAddressV2.results[i].CompanyName;
													aTitleValue.Country = data.to_AlertOrgAddressV2.results[i].Country;
													aTitleValue.Street = data.to_AlertOrgAddressV2.results[i].Street;
													aTitleValue.City = data.to_AlertOrgAddressV2.results[i].City;
													aTitleValue.PostalCode = data.to_AlertOrgAddressV2.results[i].PostalCode;
													oModel4.setData(aTitleValue);
													view.setModel(oModel4, "pf9");
													break;
												}
												if (!oIndex) {
													var oIndex = 0;
												}
											}

											var dataCompany = {
												"MATCH": {
													"Criteria": {
														"Name": data.to_AlertOrgAddressV2.results[oIndex].CompanyName,
														"Country": data.to_AlertOrgAddressV2.results[oIndex].Country,
														"Address": data.to_AlertOrgAddressV2.results[oIndex].Street,
														"City": data.to_AlertOrgAddressV2.results[oIndex].City,
													},
													"Options": {
														"ExclusionFlags": [
															"None"
														],
														"ScoreLimit": 0.80
													}
												},
												"SELECT": [
													"Match.Hint",
													"Match.Score",
													"Match.Name",
													"Match.Name_Local",
													"Match.MatchedName",
													"Match.MatchedName_Type",
													"Match.Address",
													"Match.Postcode",
													"Match.City",
													"Match.Country",
													"Match.Address_Type",
													"Match.PhoneOrFax",
													"Match.EmailOrWebsite",
													"Match.National_Id",
													"Match.NationalIdLabel",
													"Match.State",
													"Match.Region",
													"Match.LegalForm",
													"Match.ConsolidationCode",
													"Match.Status",
													"Match.Ticker",
													"Match.CustomRule",
													"Match.Isin",
													"Match.BvDId"
												]
											};
											const requestOptions = {
												method: "POST",
												headers: {
													"Content-Type": "application/json",
													'Authorization': `Bearer ${accessToken}`
												},
												body: JSON.stringify(dataCompany),
											};

											var oJSONModel = new sap.ui.model.json.JSONModel();
											fetch(url, requestOptions)
												.then((response) => response.json())
												.then((dataMatch) => {
													// Handle the response data here

													// that.cleanSlate(view);
													if (dataMatch.length === 0) {

														sap.m.MessageToast.show("No Data Found with CO-PILOT");
														that.oBusy.close();
														return;
													}
													oJSONModel.setData(dataMatch);
													view.setModel(oJSONModel, "pf2");
													that.oBusy.close();
													// that.onLLM(null, false, JSON.stringify(data[0]), "Phrase the above data into English as per the company view", false, true);

												})
												.catch((error) => {
													that.oBusy.close();
													// Handle any errors that occurred during the fetch
													console.error("Error:", error);
												});

										},
										error: function (jqXHR, textStatus, errorThrown) {
											that.oBusy.close();
											console.error("Error:", errorThrown);

										}
									});

									//Set the view model.
									view.setModel(dataModel);
									dataModel.refresh();
								}
							});
						},
						error: function (jqXHR, textStatus, errorThrown) {
							that.oBusy.close();
							console.error("Error:", errorThrown);
						}
					});
				}
				return this;
			},

			init: function () {
				// call super init (will call function "create content")
				sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

				var i18nModel = new ResourceModel({
					bundleName: "copilot.i18n.i18n"
				});

				this.oView.setModel(i18nModel, "i18n");

				var sCssPath = jQuery.sap.getModulePath("copilot/css");
				sCssPath = sCssPath + "/style.css";
				jQuery.sap.includeStyleSheet(sCssPath);
			},
			cleanSlate: function (view) {
				if (view.getModel("pf2")) {
					view.getModel("pf2").setData(null);
				}
				if (view.getModel("pf3")) {
					view.getModel("pf3").setData(null);
				}
				if (view.getModel("pf4")) {
					view.getModel("pf4").setData(null);
				}
				if (view.getModel("pf5")) {
					view.getModel("pf5").setData(null);
				}
				if (view.getModel("pf6")) {
					view.getModel("pf6").setData(null);
				}
				if (view.getModel("pf7")) {
					view.getModel("pf7").setData(null);
				}
				if (view.getModel("pf8")) {
					view.getModel("pf8").setData(null);
				}
				if (view.getModel("pf9")) {
					view.getModel("pf9").setData(null);
				}
				if (view.getModel("pf10")) {
					view.getModel("pf10").setData(null);
				}
				if (view.getModel("pf11")) {
					view.getModel("pf11").setData(null);
				}
			}
		});
	});