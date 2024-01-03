sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/core/routing/History",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "monitorpedidos/model/Util",
    "sap/m/MessageBox",
    "sap/ui/core/util/ExportTypeCSV",
    "sap/ui/core/util/Export",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Fragment, History, Filter, FilterOperator, Util, MessageBox, ExportTypeCSV, Export, exportLibrary) {
        "use strict";

        var EdmType = exportLibrary.EdmType;

        var codcli, sumTotal, nomcli, Numped, Fechad, Fechah, Imported, Importeh, Cliente, ClasePed, codmat, nommat, LineaServicio, codord, nomord, codceco, nomceco, Vkbur;
        var arrayKeys = [];

        return Controller.extend("monitorpedidos.controller.MonitorPedidos", {
            onInit: function () {
                this.mainService = this.getOwnerComponent().getModel("mainService");
                this.oComponent = this.getOwnerComponent();
                this.oI18nModel = this.oComponent.getModel("i18n");

                //PARSEADO INICIAL DE LAS FECHAS DESDE Y HASTA/////////////////

                var today = new Date();
                //today.toLocaleDateString("es-ES");
                var today1 = new Date();
                //today1.toLocaleDateString("es-ES");
                today1.setDate(today1.getDate() - 30);

                /*var fechai =
                    today1.getFullYear() +
                    "-" +
                    ("0" + (today1.getMonth() + 1)).slice(-2) +
                    "-" +
                    ("0" + today1.getDate()).slice(-2);
                var fechaf =
                    today.getFullYear() +
                    "-" +
                    ("0" + (today.getMonth() + 1)).slice(-2) +
                    "-" +
                    ("0" + today.getDate()).slice(-2);*/

                var date = new Date();
                var fechai, fechaf;

                this.ListadoSolicitudes(
                    //Usuario,
                    //Numped,
                    fechai,
                    fechaf,
                    Imported,
                    Importeh,
                    Cliente);

                //Mapear los campos por defecto de los filtros:

                var filtros = {
                    fechaD: fechai,
                    fechaH: fechaf

                };

                var oModFiltr = new JSONModel();
                oModFiltr.setData(filtros);
                this.oComponent.setModel(oModFiltr, "Filtros");
                this.dameTiposped();
                this.dameLineas();
            },

            dameTiposped: function () {
                Promise.all([
                    this.readDataEntity(this.mainService, "/ClasePedSet", ""),
                ]).then(this.buildClasePed.bind(this), this.errorFatal.bind(this));
            },

            dameLineas: function () {
                Promise.all([
                    this.readDataEntity(this.mainService, "/LineasServicioSet", ""),
                ]).then(this.buildLineas.bind(this), this.errorFatal.bind(this));
            },

            buildClasePed: function (values) {

                if (values[0].results) {
                    var oModelClasePed = new JSONModel();
                    oModelClasePed.setData(values[0].results);
                    oModelClasePed.setSizeLimit(300);
                    this.oComponent.setModel(oModelClasePed, "Tipospedido");
                }

            },

            buildLineas: function (values) {

                if (values[0].results) {
                    var oModelLineas= new JSONModel();
                    oModelLineas.setData(values[0].results);
                    this.oComponent.setModel(oModelLineas, "LineasServicio");
                }

            },


            onChangefLineas: function() {
                LineaServicio = this.getView().byId("f_line").getSelectedKey();
                console.log(LineaServicio);
            }, 

            handleSelectionChange: function (oEvent) {
                var changedItem = oEvent.getParameter("changedItem");
                var isSelected = oEvent.getParameter("selected");

                var state = "Selected";
                if (!isSelected) {
                    state = "Deselected";
                    //arrayKeys.pop(changedItem.mProperties.key);
                    var valor = changedItem.mProperties.key;
                    for (var i = 0; i < arrayKeys.length; i++) {
                        if (valor == arrayKeys[i]) {
                            //console.log("Igual");
                            const index = arrayKeys.findIndex( x => x.key === valor );

                            arrayKeys.splice( index, 1 );
                        }

                    }
                 
                } else {
                    arrayKeys.push(changedItem.mProperties.key);
                }

                

                //changedItem.mProperties.key
                //arrayKeys++;

                /*MessageBox.show("Event 'selectionChange': " + state + " '" + changedItem.getText() + "'", {
                    width: "auto"
                });*/
            },

            /*handleSelectionFinish: function (oEvent) {
                var selectedItems = oEvent.getParameter("selectedItems");
                var messageText = "Event 'selectionFinished': [";

                for (var i = 0; i < selectedItems.length; i++) {
                    messageText += "'" + selectedItems[i].getText() + "'";
                    if (i != selectedItems.length - 1) {
                        messageText += ",";
                    }
                }

                messageText += "]";

                MessageBox.show(messageText, {
                    width: "auto"
                });
            },*/

            //MÉTODO PARA LEER LAS ENTITIES///////////////////////////////////////////////////////////////////////////////////////////////////////////////
            readDataEntity: function (oModel, path, aFilters) {
                return new Promise(function (resolve, reject) {
                    oModel.read(path, {
                        filters: [aFilters],
                        success: function (oData) {
                            resolve(oData);
                        },
                        error: function (oResult) {
                            reject(oResult);
                        },
                    });
                });
            },

            //MÉTODOS PARA LISTADO DE PEDIDOS Y LLAMADA AL ODATA PARA TRAER LOS DATOS A LA TABLA PRINCIPAL //////////////////////////////////////////////

            onBusqSolicitudes: function (oEvent) {

                //var Usuario = this.getView().byId("f_usuario").getValue();
                //Numped = this.getView().byId("f_numsolic").getValue();
                Fechad = this.getView().byId("DTPdesde").getValue();
                Fechah = this.getView().byId("DTPhasta").getValue();
                Imported = this.getView().byId("f_impdesde").getValue();
                Importeh = this.getView().byId("f_imphasta").getValue();
                ClasePed = arrayKeys;
                // Cliente = this.getView().byId("f_client").getSelectedKey();
                Cliente = codcli;
                this.ListadoSolicitudes(
                    //Usuario,
                    //Numped,
                    Fechad,
                    Fechah,
                    Imported,
                    Importeh,
                    Cliente,
                    LineaServicio,
                    codmat
                    /*, 
                    ClasePed*/
                    )

            },

            //FILTROS DE LISTADO DE PEDIDOS
            ListadoSolicitudes: function (
                //Usuario,
                //Numped,
                Fechad,
                Fechah,
                Imported,
                Importeh,
                Cliente,
                LineaServicio,
                codmat
                /*,
                ClasePed*/
            ) {
                var aFilterIds, aFilterValues, aFilters;

                //Numped = Util.zfill(Numped, 10); //Rellenar el Número de Pedido con ceros a la izquierda

                if (Date.parse(Fechad)) {
                    var fec_ini = Date.parse(Fechad);
                }
                if (Date.parse(Fechah)) {
                    var fec_fin = Date.parse(Fechah);
                }

                aFilterIds = [
                    //"USUARIO",
                    "IDSOLICITUD",
                    "FECHAD",
                    "FECHAH",
                    "IMPORTED",
                    "IMPORTEH",
                    "CLIENTE",
                    "LINEA",
                    "MATERIAL"
                    /*,
                    "TIPO"*/
                ];
                aFilterValues = [
                   // "",
                    Numped,
                    fec_ini,
                    fec_fin,
                    Imported,
                    Importeh,
                    Cliente,
                    LineaServicio,
                    codmat,
                    /*,
                    ClasePed*/
                ];

                /*if (Usuario == "") {
                    var i = aFilterIds.indexOf("USUARIO");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }*/
                if (Numped == "" || Numped == undefined) {
                    var i = aFilterIds.indexOf("IDSOLICITUD");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (fec_ini == "" || fec_ini == null) {
                    var i = aFilterIds.indexOf("FECHAD");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (fec_fin == "" || fec_fin == null) {
                    var i = aFilterIds.indexOf("FECHAH");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }
                if (Imported == "" && Importeh == "" || Imported == undefined && Importeh == undefined) {
                    var i = aFilterIds.indexOf("IMPORTED");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }

                    var j = aFilterIds.indexOf("IMPORTEH");

                    if (j !== -1) {
                        aFilterIds.splice(j, 1);
                        aFilterValues.splice(j, 1);
                    }
                }
                if (Cliente == "" || Cliente == undefined) {
                    var i = aFilterIds.indexOf("CLIENTE");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }
                if (LineaServicio == "" || LineaServicio == undefined) {
                    var i = aFilterIds.indexOf("LINEA");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (codmat == "" || codmat == undefined) {
                    var i = aFilterIds.indexOf("MATERIAL");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

               /* if (ceco == "" || ceco == undefined) {
                    var i = aFilterIds.indexOf("Ceco");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }*/

                /*if (!ClasePed) {
                    var i = aFilterIds.indexOf("Tipo");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }*/

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/DamePedidosSet", aFilters),
                ]).then(this.buildListadoModel.bind(this), this.errorFatal.bind(this));
            },

            buildListadoModel: function (values) {
                sap.ui.core.BusyIndicator.hide();
                if (values[0].results) {
                    var oModelSolicitudes = new JSONModel(values[0].results);
                    this.oComponent.setModel(oModelSolicitudes, "listadoSolicitudes");
                    this.oComponent.getModel("listadoSolicitudes").refresh(true);

                    if (values[0].results[0].Ztotal > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/Total", values[0].results[0].Ztotal);
                    }  else if (values[0].results[0].Ztotred > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalred", values[0].results[0].Ztotred);
                    } else if (values[0].results[0].Ztotapr > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalapr", values[0].results[0].Ztotapr);
                    } else if (values[0].results[0].Ztotfin > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalfin", values[0].results[0].Ztotfin);
                    } else if (values[0].results[0].Ztotfac > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalfac", values[0].results[0].Ztotfac);
                    } else if (values[0].results[0].Ztotpdte > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalpdte", values[0].results[0].Ztotpdte);
                    } else if (values[0].results[0].Ztotcob > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalcob", values[0].results[0].Ztotpdte);
                    } else {
                        this.oComponent.getModel("Filtros").setProperty("/Total", "");
                    }
                }
            },

            handleLinkFact: function () {
                MessageBox.alert("Link was clicked!");
            },

            handleLinkCont: function () {
                MessageBox.alert("Link was clicked!");
            },



            //MÉTODOS PARA LA BÚSQUEDA DE CLIENTES Y SU DIÁLOGO//////////////////////////////////////////////////////////////////

            onBusqClientes: function () {
                var Kunnr = this.getView().byId("f_lifnrAcr").getValue();
                var Stcd1 = this.getView().byId("f_nameAcr").getValue();
                var Name1 = this.getView().byId("f_nifAcr").getValue();
                //var Bukrs = this.getView().byId("f_nifcAcr").getValue();

                var aFilterIds, aFilterValues, aFilters;

                //FILTRADO DE CLIENTES////////////////////////////////////////////////////////////////////////////////////////////

                aFilterIds = [
                    "Stcd1",
                    "Name1",
                    "Kunnr"
                ];
                aFilterValues = [
                    Stcd1,
                    Name1,
                    Kunnr
                ];

                if (Stcd1 == "") {
                    var i = aFilterIds.indexOf("Stcd1");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Name1 == "") {
                    var i = aFilterIds.indexOf("Name1");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                /*if (Bukrs == "") {
                    var i = aFilterIds.indexOf("Bukrs");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }*/
                if (Kunnr == "") {
                    var i = aFilterIds.indexOf("Kunnr");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameClientesSet", aFilters),
                ]).then(this.buildClientesModel.bind(this), this.errorFatal.bind(this));

            },

            onBusqMateriales: function() {
                var Matnr = this.getView().byId("f_codMat").getValue();
                var Maktx= this.getView().byId("f_nomMat").getValue();
                var Matkl = this.getView().byId("f_grArt").getValue();
                //var Bukrs = this.getView().byId("f_nifcAcr").getValue();

                var aFilterIds, aFilterValues, aFilters;

                //FILTRADO DE CLIENTES////////////////////////////////////////////////////////////////////////////////////////////

                aFilterIds = [
                    "Matnr",
                    "Maktx",
                    "Matkl"
                ];
                aFilterValues = [
                    Matnr,
                    Maktx,
                    Matkl
                ];

                if (Matnr == "") {
                    var i = aFilterIds.indexOf("Matnr");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Maktx == "") {
                    var i = aFilterIds.indexOf("Maktx");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                /*if (Bukrs == "") {
                    var i = aFilterIds.indexOf("Bukrs");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }*/
                if (Matkl == "") {
                    var i = aFilterIds.indexOf("Matkl");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameMaterialSet", aFilters),
                ]).then(this.buildMaterialesModel.bind(this), this.errorFatal.bind(this));
            },

            onBusqOrdenes: function() {
                var Aufnr= this.getView().byId("f_codOrd").getValue();
                var Ktext= this.getView().byId("f_nomOrd").getValue();
                var Bukrs= this.getView().byId("f_ordbukrs").getValue();
                //var Bukrs = this.getView().byId("f_nifcAcr").getValue();

                var aFilterIds, aFilterValues, aFilters;

                //FILTRADO DE CLIENTES////////////////////////////////////////////////////////////////////////////////////////////

                aFilterIds = [
                    "Aufnr",
                    "Ktext",
                    "Bukrs"
                ];
                aFilterValues = [
                    Aufnr,
                    Ktext,
                    Bukrs
                ];

                if (Aufnr == "") {
                    var i = aFilterIds.indexOf("Aufnr");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Ktext == "") {
                    var i = aFilterIds.indexOf("Ktext");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                /*if (Bukrs == "") {
                    var i = aFilterIds.indexOf("Bukrs");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }*/
                if (Bukrs == "") {
                    var i = aFilterIds.indexOf("Bukrs");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/OrdenIngresoSet", aFilters),
                ]).then(this.buildOrdenesModel.bind(this), this.errorFatal.bind(this));
            },

            onBusqCecos: function() {
                var Kostl = this.getView().byId("f_codCeco").getValue();
                var Ltext = this.getView().byId("f_nomCeco").getValue();
                var Bukrs = this.getView().byId("f_cecoSoc").getValue();
                //var Bukrs = this.getView().byId("f_nifcAcr").getValue();

                var aFilterIds, aFilterValues, aFilters;

                //FILTRADO DE CLIENTES////////////////////////////////////////////////////////////////////////////////////////////

                aFilterIds = [
                    "Kostl",
                    "Ltext",
                    "Kokrs"
                ];
                aFilterValues = [
                    Kostl,
                    Ltext,
                    Bukrs
                ];

                if (Kostl == "") {
                    var i = aFilterIds.indexOf("Kostl");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Ltext == "") {
                    var i = aFilterIds.indexOf("Ltext");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                /*if (Bukrs == "") {
                    var i = aFilterIds.indexOf("Bukrs");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }*/
                if (Bukrs == "") {
                    var i = aFilterIds.indexOf("Kokrs");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/CecoIngresoSet", aFilters),
                ]).then(this.buildCecosModel.bind(this), this.errorFatal.bind(this));
            },

            onBusqOficina: function() {
                var Vkorg = this.getView().byId("f_VkorgOfi").getValue();
                var Vtweg = this.getView().byId("f_VtwegOfi").getValue();
                var Spart = this.getView().byId("f_SpartOfi").getValue();

                var aFilterIds, aFilterValues, aFilters;

                //FILTRADO DE OFICINAS////////////////////////////////////////////////////////////////////////////////////////////

                aFilterIds = [
                    "VKORG",
                    "VTWEG",
                    "SPART"
                ];
                aFilterValues = [
                    Vkorg,
                    Vtweg,
                    Spart
                ];

                if (Vkorg == "") {
                    var i = aFilterIds.indexOf("VKORG");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Vtweg == "") {
                    var i = aFilterIds.indexOf("VTWEG");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Spart == "") {
                    var i = aFilterIds.indexOf("SPART");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameOficinasSet", aFilters),
                ]).then(this.buildOficinasModel.bind(this), this.errorFatal.bind(this));
            },

            buildClientesModel: function (values) {
                if (values[0].results) {
                    sap.ui.core.BusyIndicator.hide();
                    var oModelClientes = new JSONModel();
                    oModelClientes.setData(values[0].results);
                    this.oComponent.setModel(oModelClientes, "listadoClientes");
                    this.oComponent.getModel("listadoClientes").refresh(true);
                }
            },

            buildMaterialesModel: function (values) {
                if (values[0].results) {
                    sap.ui.core.BusyIndicator.hide();
                    var oModelMateriales = new JSONModel();
                    oModelMateriales.setData(values[0].results);
                    this.oComponent.setModel(oModelMateriales, "listadoMateriales");
                    this.oComponent.getModel("listadoMateriales").refresh(true);
                }
            },

            buildOrdenesModel: function (values) {
                if (values[0].results) {
                    sap.ui.core.BusyIndicator.hide();
                    var oModelOrdenes = new JSONModel();
                    oModelOrdenes.setData(values[0].results);
                    this.oComponent.setModel(oModelOrdenes, "listadoOrdenes");
                    this.oComponent.getModel("listadoOrdenes").refresh(true);
                }
            },

            buildCecosModel: function (values) {
                if (values[0].results) {
                    sap.ui.core.BusyIndicator.hide();
                    var oModelCecos = new JSONModel();
                    oModelCecos.setData(values[0].results);
                    this.oComponent.setModel(oModelCecos, "listadoCecos");
                    this.oComponent.getModel("listadoCecos").refresh(true);
                }
            },

            buildOficinasModel: function (values) {
                if (values[0].results) {
                    sap.ui.core.BusyIndicator.hide();
                    var oModelOficinas = new JSONModel();
                    oModelOficinas.setData(values[0].results);
                    this.oComponent.setModel(oModelOficinas, "listadoOficinas");
                    this.oComponent.getModel("listadoOficinas").refresh(true);
                }
            },

            onPressCliente: function (oEvent) {
                var acr = this.getSelect(oEvent, "listadoClientes");
                codcli = acr.Kunnr;
                nomcli = acr.Name1;
                this.getView().byId("f_client").setValue(nomcli);
                this.byId("cliDial").close();

            },

            onPressMaterial: function (oEvent) {
                var mat = this.getSelectMat(oEvent, "listadoMateriales");
                codmat = mat.Matnr;
                nommat = mat.Maktx;
                this.getView().byId("f_material").setValue(codmat);
                this.byId("matDial").close();

            },

            onPressOrdenes: function (oEvent) {
                var ord = this.getSelectOrd(oEvent, "listadoOrdenes");
                codord = ord.Aufnr;
                nomord = ord.Ktext;
                this.getView().byId("f_ording").setValue(codord );
                this.byId("ordDial").close();

            },

            onPressCecos: function (oEvent) {
                var ceco = this.getSelectCeco(oEvent, "listadoCecos");
                codceco = ceco.Kostl;
                nomceco = ceco.Ltext;
                this.getView().byId("f_cecos").setValue(codceco);
                this.byId("cecoDial").close();

            },

            onPressOficinas: function (oEvent) {
                var ofi = this.getSelectOficinas(oEvent, "listadoOficinas");
                Vkbur = ofi.Vkbur;
                this.getView().byId("f_oficinas").setValue(Vkbur);
                this.byId("ofiDial").close();

            },

            getSelect: function (oEvent, oModel) {
                var oModClie = this.oComponent.getModel(oModel).getData();
                const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var idcliente = oModClie[sOperation];
                return idcliente;
            },

            getSelectMat: function (oEvent, oModel) {
                var oModMat = this.oComponent.getModel(oModel).getData();
                const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var idMaterial = oModMat[sOperation];
                return idMaterial;
            },

            getSelectOrd: function (oEvent, oModel) {
                var oModOrd = this.oComponent.getModel(oModel).getData();
                const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var idOrden = oModOrd[sOperation];
                return idOrden;
            },

            getSelectCeco: function (oEvent, oModel) {
                var oModCeco = this.oComponent.getModel(oModel).getData();
                const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var idCeco = oModCeco[sOperation];
                return idCeco;
            },

            getSelectOficinas: function (oEvent, oModel) {
                var oModOficinas = this.oComponent.getModel(oModel).getData();
                const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var idOficinas = oModOficinas[sOperation];
                return idOficinas;
            },

            CloseCliDiag: function () {
                this.byId("cliDial").close();
            },

            CloseMatDiag: function () {
                this.byId("matDial").close();
            },

            CloseOrdDiag: function () {
                this.byId("ordDial").close();
            },

            CloseCecoDiag: function () {
                this.byId("cecoDial").close(); 
            },

            onValueHelpRequest: function (oEvent) {
                //this.Dialog = sap.ui.xmlfragment("aguasdevalencia.fragment.ClienteMonitorPedidos", this);
                //this.Dialog.open();
                this._getDialogCliente();
            },

            onValueHelpRequestMat: function (oEvent) {
                //this.Dialog = sap.ui.xmlfragment("aguasdevalencia.fragment.ClienteMonitorPedidos", this);
                //this.Dialog.open();
                this._getDialogMaterial();
            },

            onValueHelpRequestOrd: function (oEvent) {
                //this.Dialog = sap.ui.xmlfragment("aguasdevalencia.fragment.ClienteMonitorPedidos", this);
                //this.Dialog.open();
                this._getDialogOrdenes();
            },

            onValueHelpRequestCecos: function (oEvent) {
                //this.Dialog = sap.ui.xmlfragment("aguasdevalencia.fragment.ClienteMonitorPedidos", this);
                //this.Dialog.open();
                this._getDialogCecos();
            },

            onValueHelpRequestOficinas: function (oEvent) {
                //this.Dialog = sap.ui.xmlfragment("aguasdevalencia.fragment.ClienteMonitorPedidos", this);
                //this.Dialog.open();
                this._getDialogOficinas();
            },

            _getDialogCliente: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogCliente) {
                    this.pDialogCliente = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.BusqClientes",
                        controller: this,
                    }).then(function (oDialogCliente) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialogCliente);
                        return oDialogCliente;
                    });
                }
                this.pDialogCliente.then(function (oDialogCliente) {
                    oDialogCliente.open(sInputValue);
                    //this._configDialogCliente(oDialog)
                });
            },

            _getDialogMaterial: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogMaterial) {
                    this.pDialogMaterial = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.BusqMateriales",
                        controller: this,
                    }).then(function (oDialogMaterial) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialogMaterial);
                        return oDialogMaterial;
                    });
                }
                this.pDialogMaterial.then(function (oDialogMaterial) {
                    oDialogMaterial.open(sInputValue);
                });
            },

            _getDialogOrdenes: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogOrdenes) {
                    this.pDialogOrdenes = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.OrdenIngreso",
                        controller: this,
                    }).then(function (oDialogOrdenes) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialogOrdenes);
                        return oDialogOrdenes;
                    });
                }
                this.pDialogOrdenes.then(function (oDialogOrdenes) {
                    oDialogOrdenes.open(sInputValue);
                });
            },

            _getDialogCecos: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogCecos) {
                    this.pDialogCecos = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.CecoIngreso",
                        controller: this,
                    }).then(function (oDialogCecos) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialogCecos);
                        return oDialogCecos;
                    });
                }
                this.pDialogCecos.then(function (oDialogCecos) {
                    oDialogCecos.open(sInputValue);
                });
            },

            _getDialogOficinas: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogOficinas) {
                    this.pDialogOficinas = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.OficinaVentas",
                        controller: this,
                    }).then(function (oDialogOficinas) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialogOficinas);
                        return oDialogOficinas;
                    });
                }
                this.pDialogOficinas.then(function (oDialogOficinas) {
                    oDialogOficinas.open(sInputValue);
                });
            },

            //METODOS PARA LA IMPORTACIÓN DE UN CSV////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            onCSV: function (oEvent) {

                //this._getDialogUpload();
                var oButton = oEvent.getSource(),
                oView = this.getView();

                if (!this._pDialogPEP) {
                    this._pDialogPEP = Fragment.load({
                        id: oView.getId(),
                        name: "project1.fragments.UploadFile",
                        controller: this,
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }

                this._pDialogPEP.then(
                    function (oDialog) {
                        this._configDialog(oButton);
                        oDialog.open();
                    }
                        .bind(this));

            },

            _configDialog: function (oButton, oDialog) {
                // Multi-select if required
                //var bMultiSelect = !!oButton.data("multi");
                //oDialog.setMultiSelect(bMultiSelect);
    
                var sResponsivePadding = oButton.data("responsivePadding");
                var sResponsiveStyleClasses =
                    "sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";
    
                if (sResponsivePadding) {
                    oDialog.addStyleClass(sResponsiveStyleClasses);
                } /*else {
                    oDialog.removeStyleClass(sResponsiveStyleClasses);
                }*/
    
                // Set custom text for the confirmation button
                var sCustomConfirmButtonText = oButton.data("confirmButtonText");
                oDialog.setConfirmButtonText(sCustomConfirmButtonText);
    
                // toggle compact style
                syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
            },

            _configDialogCliente: function (oDialog) {
                var sResponsivePadding = oButton.data("responsivePadding");
                var sResponsiveStyleClasses =
                    "sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";
    
                if (sResponsivePadding) {
                    oDialog.addStyleClass(sResponsiveStyleClasses);
                } /*else {
                    oDialog.removeStyleClass(sResponsiveStyleClasses);
                }*/
    
                // Set custom text for the confirmation button
                var sCustomConfirmButtonText = oButton.data("confirmButtonText");
                oDialog.setConfirmButtonText(sCustomConfirmButtonText);
    
                // toggle compact style
                syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
            },    

            _getDialogUpload: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialog) {
                    this.pDialog = Fragment.load({
                        id: oView.getId(),
                        name: "project1.fragments.UploadFile",
                        controller: this,
                    }).then(function (oDialog) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }
                this.pDialog.then(function (oDialog) {
                    oDialog.open();
                }.bind(this));
            },

            onUpload: function (e) {
                var fU = this.getView().byId("idfileUploader");
                var domRef = fU.getFocusDomRef();
                //var file = domRef.files[0];
                var file = fU.oFileUpload.files[0];

                // Create a File Reader object
                var reader = new FileReader();
                var t = this;

                reader.onload = function (e) {
                    var strCSV = e.target.result;
                    var arrCSV = strCSV.match(/[\w .]+(?=,?)/g);
                    var noOfCols = 25;

                    // To ignore the first row which is header
                    var hdrRow = arrCSV.splice(0, noOfCols);

                    var data = [];
                    while (arrCSV.length > 0) {
                        var obj = {};
                        // extract remaining rows one by one
                        var row = arrCSV.splice(0, noOfCols)
                        for (var i = 0; i < row.length; i++) {
                            obj[hdrRow[i]] = row[i].trim()
                        }
                        // push row to an array
                        data.push(obj)
                    }

                    // Bind the data to the Table
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData(data);
                    var oTable = t.byId("idTable");
                    oTable.setModel(oModel);
                };
                reader.readAsBinaryString(file);
            },

            onCancelUpload: function (oDialog) {
                this.pDialog.then(function (oDialog) {
                    oDialog.close();
                });
            },

            //MÉTODO PARA EL CAMBIO DE ESTADO (ICON TAB FILTERS) ///////////////////////////////////////////////////////////////////////////////////////////////
            onFilterSelect: function (oEvent) {

                var skey = oEvent.getParameter("key"),
                    sStatus = "";

                switch (skey) {
                    //Todas
                    case "Free":
                        sStatus = "";
                        break;
                        //En redaccion
                    case "Ok":
                        sStatus = "REDA";
                        break;
                        //Pdte. Aprobar
                    case "Heavy":
                        sStatus = "APRB";
                        break;
                        //Pdte. Financiero
                    case "Overweight":
                        sStatus = "FINA";
                        break;
                        //Pdte. Facturar
                    case "Money":
                        sStatus = "FACT";
                        break;
                        //Pdte. Cobrar
                    case "Payment":
                        sStatus = "PDTE";
                        break;
                        //Cobradas
                    case "Sales":
                        sStatus = "COBR"
                        break;
                        //Denegadas
                    case "Cancel":
                        sStatus = "DEN"
                        break;
                }

                this.ListadoSolStatus(
                    //Usuario,
                //Numped,
                Fechad,
                Fechah,
                Imported,
                Importeh,
                Cliente,
                LineaServicio,
                codmat
                /*,
                ClasePed*/);
            },

            ListadoSolStatus: function (
                //Usuario,
                //Numped,
                Fechad,
                Fechah,
                Imported,
                Importeh,
                Cliente,
                LineaServicio,
                codmat
                /*,
                ClasePed*/
            ) {
                var aFilterIds, aFilterValues, aFilters;

                //Numped = Util.zfill(Numped, 10); //Rellenar el Número de Pedido con ceros a la izquierda

                if (Date.parse(Fechad)) {
                    var fec_ini = Date.parse(Fechad);
                }
                if (Date.parse(Fechah)) {
                    var fec_fin = Date.parse(Fechah);
                }

                aFilterIds = [
                    //"USUARIO",
                    "IDSOLICITUD",
                    "FECHAD",
                    "FECHAH",
                    "IMPORTED",
                    "IMPORTEH",
                    "CLIENTE",
                    "LINEA",
                    "MATERIAL"
                    /*,
                    "Tipo"*/
                ];
                aFilterValues = [
                    //"",
                    Numped,
                    fec_ini,
                    fec_fin,
                    Imported,
                    Importeh,
                    Cliente,
                    LineaServicio,
                    codmat
                    /*,
                    ClasePed*/
                ];

                if (Numped == "" || Numped == undefined) {
                    var i = aFilterIds.indexOf("IDSOLICITUD");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }
                if (fec_ini == "" || fec_ini == null) {
                    var i = aFilterIds.indexOf("FECHAD");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (fec_fin == "" || fec_fin == null) {
                    var i = aFilterIds.indexOf("FECHAH");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }
                if (Imported == "" && Importeh == "" || Imported == undefined && Importeh == undefined) {
                    var i = aFilterIds.indexOf("IMPORTED");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }

                    var j = aFilterIds.indexOf("IMPORTEH");

                    if (j !== -1) {
                        aFilterIds.splice(j, 1);
                        aFilterValues.splice(j, 1);
                    }
                }
                if (Cliente == "" || Cliente == undefined) {
                    var i = aFilterIds.indexOf("CLIENTE");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }
                if (LineaServicio == "" || LineaServicio == undefined) {
                    var i = aFilterIds.indexOf("LINEA");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }


                if (codmat == "" || codmat == undefined) {
                    var i = aFilterIds.indexOf("MATERIAL");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/DamePedidosSet", aFilters),
                ]).then(this.buildListadoModel.bind(this), this.errorFatal.bind(this));

            },

            /////////////////////////////VISUALIZAR PEDIDO/////////////////////////////////////////////////////////

            onDispPed: function (oEvent) {

                var pedido = this.getSelectedPed(oEvent).Ebeln;

                this.modoapp = "D";

                this.getPedido(pedido);
            },


            //PRUEBA

            onOpenOrder: function(oEvent){
              
                var numero = oEvent.getSource().getBindingContext("listadoSolicitudes").getPath().split("/").slice(-1).pop()
                var posicionArray = this.oComponent.getModel("listadoSolicitudes").getData()[numero];
                var Idsolicitud = posicionArray.IDSOLICITUD;

                console.log(posicionArray)
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteAltaPedidos",{
                    path: Idsolicitud
                });
          
                     
            },


            getSelectedPed: function (oEvent) {

                var oModSum = this.oComponent.getModel("listadoSolicitudes").getData();
                const sOperationPath = oEvent.getSource().getBindingContext("listadoSolicitudes").getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();

                var sum = oModSum[sOperation];

                return sum;

            },

            getPedido: function (pedido) {

                var aFilterIds,
                    aFilterValues,
                    aFilters,
                    aFilters2;

                sap.ui.core.BusyIndicator.show();

                // Filtros Datos Pedido
                aFilterIds = ["Ebeln"];
                aFilterValues = [pedido];
                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                // Filtros CHAT pedido
                aFilterIds = ["Docu"];
                aFilterValues = [pedido];
                aFilters2 = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                var expand = [
                    "EstrategiaSet",
                    "HistorialModificacionSet",
                    "PedidoPosSet",
                    "AdjuntoSHPSet",
                    "AdjuntoSet"
                ];

                Promise.all([
                    this.readDataExpEntity(this.mainService, "/PedidoCabSet", aFilters, expand),
                    // this.readDataEntity( this.mainService , "/SociedadSet" ),
                    // this.readDataEntity( this.mainService , "/ClasePedSet" ),
                    this.readDataEntity(this.mainService, "/ImpuestoSet"),
                    this.readDataEntity(this.mainService, "/TipoCompraSet"),
                    this.readDataEntity(this.mainService, "/GrupoArticuloSet"),
                    this.readDataEntity(this.mainService, "/ChatSet", aFilters2),
                    this.readDataEntity(this.mainService, "/ExtensionAdjuntoSet"),
                ]).then(this.buildPedModel.bind(this), this.errorFatal.bind(this));

            },


            //EXCEPCIONES (ERROR FATAL)/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            errorFatal: function (e) {
                MessageBox.error(this.oI18nModel.getProperty("errFat"));
                sap.ui.core.BusyIndicator.hide();
            },

            //METODO PARA DESCARGA EXCELL
            onDownExcel: function(oEvent) {
                var aCols, oRowBinding, oSettings, oSheet, oTable;

                this._oTable = this.byId('idTablePEPs');

                oTable = this._oTable;
                oRowBinding = oTable.getBinding().oList;

                if (oRowBinding.length > 0) {
                    var today1 = new Date();
                    var fechai = today1.getFullYear()+("0"+(today1.getMonth()+1)).slice(-2)+("0"+today1.getDate()).slice(-2);
                    var time = Util.formatTime(today1);
                    var fName = this.oI18nModel.getProperty("solVentas") + fechai + time;

                    aCols = this.createColumnConfig(oTable);

                    oSettings = {
                        workbook: {
                            columns: aCols,
                            hierarcyLevel: 'Level'
                        },
                        dataSource: oRowBinding,
                        fileName: fName,
                        worker: false
                    };

                    oSheet = new sap.ui.export.Spreadsheet(oSettings);
                    oSheet.build().finally(function() {
                        oSheet.destroy();
                    });
                } else {
                    MessageBox.warning(this.oI18nModel.getProperty("errExcV"));
                }
            },

            createColumnConfig: function(oTable) {
                var aCols = [];

                var table = oTable;
				var colums = oTable.getColumns();
				var columExcel = {};
				var index = 1;
				var paso = 1;

                /*colums.forEach(function (el) {
                    if (el.getLabel().mBindingInfos.text) {
                        if (el.getVisible()) {
                            var pro = [table.getBinding().oModel.aBindings[index].sPath];
                            var type;

                            if (table.getBinding().oModel.aBindings[index].sPath == 'fechadocu') {
								type = sap.ui.export.EdmType.Date;
							} else {
								type = sap.ui.export.EdmType.String;
							}

                            columExcel = {
								label: el.getLabel().mBindingInfos.text.binding.oValue,
								property: pro,
								type: type
							}

                            aCols.push(columExcel);
							index = index + 1;
                        }
                    }
                });*/

                
                aCols.push({
                    label: this.oI18nModel.getProperty("numped"),
                    property: ['Idsolicitud'],
                    type: sap.ui.export.EdmType.String
                });

                aCols.push({
                    label: this.oI18nModel.getProperty("fechadocu"),
                    property: ['Fechadoc'],
                    type: sap.ui.export.EdmType.Date
                });

                aCols.push({
                    label: this.oI18nModel.getProperty("nomcli"),
                    property: ['Nombrecliente'],
                    type: sap.ui.export.EdmType.String
                });

                aCols.push({
                    label: this.oI18nModel.getProperty("imptotal"),
                    property: ['ImpPedido'],
                    type: sap.ui.export.EdmType.String
                });

                aCols.push({
                    label: this.oI18nModel.getProperty("status"),
                    property: ['Estado'],
                    type: sap.ui.export.EdmType.String
                });

                aCols.push({
                    label: this.oI18nModel.getProperty("nomapprov"),
                    property: ['Nombreapr'],
                    type: sap.ui.export.EdmType.String
                });

                aCols.push({
                    label: this.oI18nModel.getProperty("orgventas"),
                    property: ['Orgventas'],
                    type: sap.ui.export.EdmType.String
                });

                aCols.push({
                    label: this.oI18nModel.getProperty("Numfactura"),
                    property: ['Numfactura'],
                    type: sap.ui.export.EdmType.Number
                });

                aCols.push({
                    label: this.oI18nModel.getProperty("Referenciped"),
                    property: ['Referenciped'],
                    type: sap.ui.export.EdmType.Number
                });

                aCols.push({
                    label: this.oI18nModel.getProperty("Indcontrato"),
                    property: ['Indcontrato'],
                    type: sap.ui.export.EdmType.Number
                });

                return aCols;
            },

            filterOption: function(oEvent) {
                var oColumn = oEvent.getParameter("column");

                var nameC = oColumn.mProperties.filterProperty;

                if (nameC !== "Fechadoc" && nameC !== "ImpPedido") {
                    return;
                }

                oEvent.preventDefault();

                var sValue = oEvent.getParameter("value");

                function clear() {
                    this._oFilter = null;
                    oColumn.setFiltered(false);
                    this.byId("idTablePEPs").getBinding().filter(this._oFilter, "Application");
                }

                if (!sValue) {
                    clear.apply(this);
                    return;
                }

                var fValue = null;

                if (nameC == "Fechadoc") {
                    var dia = ("0"+ parseInt(sValue.substring(0,2) , 10)).slice(-2),
                        mes =  "0"+ (parseInt(sValue.substring(3,5), 10 )).slice(-2) , 
                        anio = sValue.substring(6,10),
                        fecha = anio + '-' + mes + '-' + dia; 
                    
                    fValue = new Date(fecha);

                    this._oFilter = new Filter(nameC, FilterOperator.EQ, fValue, "");
                    oColumn.setFiltered(true);
                    this.byId("idTablePEPs").getBinding().filter(this._oFilter, "Application");

                }

                if (nameC == "ImpPedido") {
                    var num = sValue.replace(/,/g, '.');
                    var num = parseFloat(num);

                    this._oFilter = new Filter(nameC, FilterOperator.EQ, num, "");
                    oColumn.setFiltered(true);
                    this.byId("idTablePEPs").getBinding().filter(this._oFilter, "Application");
                }
            }
        });
    });
