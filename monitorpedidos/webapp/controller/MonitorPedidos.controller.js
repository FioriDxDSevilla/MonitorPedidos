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

        var codcli, sumTotal, nomcli, Numped, Fechad, Fechah, Imported, Importeh, Cliente, ClasePed, codmat, nommat, LineaServicio, codord, nomord, codceco, nomceco, vkbur, socPed, TipoPed, numCont, nomSoc, vText, nomCont, Bzirk, Bztxt, Cvcan, Cvsector, Posped, condPago, Centges, Centuni, Centpro, Codadm, Plataforma, sStatus, sAprob, sLiber, responsable, vedit, checkMisPed, checkTodos, Usuario;
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
                vedit = false;
                var Usuario = "";

                /*this.ListadoSolicitudes(
                    Usuario,
                    Numped,
                    fechai,
                    fechaf,
                    Imported,
                    Importeh,
                    Cliente);*/

                this.ListadoSolicitudes(
                    Usuario,
                    Numped,
                    Fechad,
                    Fechah,
                    Imported,
                    Importeh,
                    Cliente,
                    LineaServicio,
                    codmat,
                    ClasePed);

                //Mapear los campos por defecto de los filtros:

                var filtros = {
                    fechaD: fechai,
                    fechaH: fechaf

                };

                var oModFiltr = new JSONModel();
                var oModFiltrosAcr = new JSONModel();
                var oModCab = new JSONModel();


                oModFiltr.setData(filtros);

                this.oComponent.setModel(oModFiltr, "Filtros");
                this.oComponent.setModel(oModFiltrosAcr, "FiltrosCli");
                this.oComponent.setModel(oModCab, "PedidoCab");

                this.dameTiposped();
                this.dameLineas();
                this.DameOrganizaciones();
                //this.TiposPedidoAlta();
                this.motivosRechazo();
                this.getUser();
                this.AreasVenta();
                this.modoapp = "";
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
                    var oModelLineas = new JSONModel();
                    oModelLineas.setData(values[0].results);
                    this.oComponent.setModel(oModelLineas, "LineasServicio");
                }

            },


            onChangefLineas: function () {
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
                            const index = arrayKeys.findIndex(x => x.key === valor);

                            arrayKeys.splice(index, 1);
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
                    codmat,
                    ClasePed
                )

            },

            //FILTROS DE LISTADO DE PEDIDOS
            ListadoSolicitudes: function (
                Usuario,
                Numped,
                Fechad,
                Fechah,
                Imported,
                Importeh,
                Cliente,
                LineaServicio,
                codmat,
                ClasePed
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
                    "USUARIO",
                    "IDSOLICITUD",
                    "FECHAD",
                    "FECHAH",
                    "IMPORTED",
                    "IMPORTEH",
                    "CLIENTE",
                    "LINEA",
                    "MATERIAL",
                    "TIPO"
                ];
                aFilterValues = [
                    Usuario,
                    Numped,
                    fec_ini,
                    fec_fin,
                    Imported,
                    Importeh,
                    Cliente,
                    LineaServicio,
                    codmat,
                    ClasePed
                ];

                if (Usuario == "" || Usuario == undefined) {
                    var i = aFilterIds.indexOf("USUARIO");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }
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

                if (ClasePed == "" || ClasePed == undefined) {
                    var i = aFilterIds.indexOf("TIPO");

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
                if (values[0].results.length >= 1) {
                    var oModelSolicitudes = new JSONModel(values[0].results);
                    this.oComponent.setModel(oModelSolicitudes, "listadoSolicitudes");
                    this.oComponent.getModel("listadoSolicitudes").refresh(true);
                    this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                    this.oComponent.getModel("PedidoCab").refresh(true);

                    if (values[0].results[0].Ztotal > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/Total", values[0].results[0].Ztotal);
                    } else if (values[0].results[0].Ztotred > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalred", values[0].results[0].Ztotred);
                    } else if (values[0].results[0].Ztotapr > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalpdte", values[0].results[0].Ztotapr);
                    } else if (values[0].results[0].Ztotfin > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalfin", values[0].results[0].Ztotfin);
                    } else if (values[0].results[0].Ztotfac > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalfac", values[0].results[0].Ztotfac);
                    } else if (values[0].results[0].Ztotpdte > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalpdtecobr", values[0].results[0].Ztotpdte);
                    } else if (values[0].results[0].Ztotcob > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/totalcob", values[0].results[0].Ztotcob);
                    } else if (values[0].results[0].Ztotden > 0) {
                        this.oComponent.getModel("Filtros").setProperty("/TotalDen", values[0].results[0].Ztotden);
                    } else {
                        this.oComponent.getModel("Filtros").setProperty("/Total", "");
                    }
                } else {
                    MessageBox.warning(this.oI18nModel.getProperty("noSol"));
                    if (sStatus === "REDA") {
                        this.oComponent.getModel("Filtros").setProperty("/totalred", 0);
                    } else if (sStatus === "APRB") {
                        this.oComponent.getModel("Filtros").setProperty("/totalpdte", 0);
                    } else if (sStatus === "FINA") {
                        this.oComponent.getModel("Filtros").setProperty("/totalfin", 0);
                    } else if (sStatus === "FACT") {
                        this.oComponent.getModel("Filtros").setProperty("/totalfac", 0);
                    } else if (sStatus === "PDTE") {
                        this.oComponent.getModel("Filtros").setProperty("/totalpdtecobr", 0);
                    } else if (sStatus === "COBR") {
                        this.oComponent.getModel("Filtros").setProperty("/totalcob", 0);
                    } else if (sStatus === "DEN") {
                        this.oComponent.getModel("Filtros").setProperty("/TotalDen", 0);
                    } else {
                        this.oComponent.getModel("Filtros").setProperty("/Total", 0);
                    }
                    //this.oComponent.getModel("Filtros").setProperty("/Total", '0');

                    //Si no hay solicitudes, se borra el listado
                    this.oComponent.setModel(new JSONModel(), "listadoSolicitudes");
                }
            },

            handleLinkFact: function () {
                //                MessageBox.alert("Link was clicked!");
                var numFact = this.getView().byId("f_numfac").getValue();
                var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                var hashUrl = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "ZPV",
                        action: "invoiceView"
                    },
                    params: {
                        "Vbelb": numFact
                    }
                }));
                oCrossAppNavigator.toExternal({
                    target: {
                        shellHash: hashUrl
                    }
                });
            },

            handleLinkCont: function () {
                //MessageBox.alert("Link was clicked!");
                var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                var numCont = this.getView().byId("f_numcont").getValue()
                var hashUrl = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "ZPV",
                        action: "contractView"
                    },
                    params: {
                        "Belnr": "0500005089"
                    }
                }));
                oCrossAppNavigator.toExternal({
                    target: {
                        shellHash: hashUrl
                    }
                });
            },



            //MÉTODOS PARA LA BÚSQUEDA DE CLIENTES Y SU DIÁLOGO//////////////////////////////////////////////////////////////////

            onBusqClientes: function () {
                var Kunnr = this.getView().byId("f_lifnrAcr").getValue();
                var Stcd1 = this.getView().byId("f_nameAcr").getValue();
                var Name1 = this.getView().byId("f_nifAcr").getValue();
                var Bukrs = this.getView().byId("f_nifcAcr").getValue();

                var aFilterIds, aFilterValues, aFilters;

                //FILTRADO DE CLIENTES////////////////////////////////////////////////////////////////////////////////////////////

                aFilterIds = [
                    "Stcd1",
                    "Name1",
                    "Kunnr",
                    "Bukrs"
                ];
                aFilterValues = [
                    Stcd1,
                    Name1,
                    Kunnr,
                    Bukrs
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

                if (Bukrs == "" || Bukrs == undefined) {
                    var i = aFilterIds.indexOf("Bukrs");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }
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

            onBusqMateriales: function () {
                var Matnr = this.getView().byId("f_codMat").getValue();
                var Maktx = this.getView().byId("f_nomMat").getValue();
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

            onBusqOrdenes: function () {
                var Aufnr = this.getView().byId("f_codOrd").getValue();
                var Ktext = this.getView().byId("f_nomOrd").getValue();
                var Bukrs = this.getView().byId("f_ordbukrs").getValue();
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

            onBusqCecos: function () {
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

            onBusqOficina: function () {
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
                this.getView().byId("idCCliente").setValue(codcli);
                this.getView().byId("descrProv").setValue(nomcli);

                sap.ui.core.BusyIndicator.show();

                if (vkbur) {
                    var aFilters = [],
                        aFilterIds = [],
                        aFilterValues = [];

                    aFilterIds.push("Kunnr");
                    aFilterValues.push(codcli);

                    aFilterIds.push("Bukrs");
                    aFilterValues.push(vkbur);

                    aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                    Promise.all([
                        this.readDataEntity(this.mainService, "/DameClientesSet", aFilters),
                    ]).then(this.buildCliente.bind(this), this.errorFatal.bind(this));


                } else {
                    MessageBox.error(this.oI18nModel.getProperty("noCli"));
                }

                this.CanalVentas();
                this.ObtenerZonas();

                this.oComponent.getModel("ModoApp").setProperty("/ccont", true);
                this.oComponent.getModel("ModoApp").setProperty("/cvcan", true);
                this.oComponent.getModel("ModoApp").refresh(true);

                this.byId("cliDial").close();
            },

            DatosCliente: function (codcli, vkbur) {
                //var kunnr = codcli;
                //var Bukrs = vkbur

                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);

                aFilterIds.push("Bukrs");
                aFilterValues.push(vkbur);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


                Promise.all([
                    this.readDataEntity(this.mainService, "/DatosClienteSet", aFilters),
                ]).then(this.buildDatosClientes.bind(this), this.errorFatal.bind(this));
            },

            buildDatosClientes: function (values) {
                var that = this;
                if (values[0].results) {
                    var oModelDatosCliente = new JSONModel();
                    oModelDatosCliente.setData(values[0].results);
                    this.oComponent.getModel("ModoApp").setProperty("/Kunnr", values[0].results[0].Kunnr);
                    this.oComponent.getModel("ModoApp").setProperty("/Nombre", values[0].results[0].Nombre);
                    this.oComponent.getModel("ModoApp").setProperty("/Stcd1", values[0].results[0].Stcd1);
                    this.oComponent.getModel("ModoApp").setProperty("/Stras", values[0].results[0].Stras);
                    this.oComponent.getModel("ModoApp").setProperty("/SmtpAddr", values[0].results[0].SmtpAddr);
                    this.oComponent.getModel("ModoApp").setProperty("/Ort01", values[0].results[0].Ort01);
                    this.oComponent.getModel("ModoApp").setProperty("/Pstlz", values[0].results[0].Pstlz);
                    this.oComponent.getModel("ModoApp").setProperty("/Land1", values[0].results[0].Land1);
                    this.oComponent.getModel("ModoApp").setProperty("/Zwels", values[0].results[0].Zwels);
                    //this.oComponent.getModel("ModoApp").setProperty("/Zterm", values[0].results[0].Zterm);
                    this.oComponent.getModel("ModoApp").refresh(true);
                }
            },

            NIApedido: function (codcli, vkbur) {
                //var Kunnr = this.getOwnerComponent().getModel("ModoApp").getData().Codcli;
                //var Bukrs = this.getOwnerComponent().getModel("ModoApp").getData().Vkbur; //Vkbur es la organiz. ventas en ModoApp
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                //aFilterIds = ["Kunnr", "Bukrs"];
                //aFilterValues = [Kunnr, Bukrs];

                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);
                aFilterIds.push("Bukrs");
                aFilterValues.push(vkbur);

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


                Promise.all([
                    this.readDataEntity(this.mainService, "/DatosNIASet", aFilters),
                ]).then(this.buildNIA.bind(this), this.errorFatal.bind(this));

            },

            buildNIA: function (values) {
                if (values[0].results) {
                    if (values[0].results[0].Nia) {
                        this.oComponent.getModel("ModoApp").setProperty("/Nia", values[0].results[0].Nia);
                        this.oComponent.getModel("ModoApp").refresh(true);
                    }
                    /*var oModelNIA = new JSONModel();
                    oModelNIA.setData(values[0].results);
                    this.oComponent.setModel(oModelNIA, "listadoNIA");
                    this.oComponent.getModel("listadoNIA").refresh(true);*/
                }
            },

            OrganoGestor: function (codcli, vkbur, Vbeln) {
                //var Kunnr = this.getOwnerComponent().getModel("ModoApp").getData().Codcli;
                //var Bukrs = this.getOwnerComponent().getModel("ModoApp").getData().SocPed; //SocPed es el código de sociedad en ModoApp

                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                //aFilterIds = ["Kunnr", "Bukrs"];
                //aFilterValues = [Kunnr, Bukrs];
                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);
                aFilterIds.push("Bukrs");
                aFilterValues.push(vkbur);
                aFilterIds.push("Vbeln");
                aFilterValues.push(Vbeln);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


                Promise.all([
                    this.readDataEntity(this.mainService, "/OrgGestorSet", aFilters),
                ]).then(this.buildOrgGestor.bind(this), this.errorFatal.bind(this));

            },

            buildOrgGestor: function (values) {
                if (values[0].results) {
                    if (values[0].results[0].Centges) {
                        this.oComponent.getModel("ModoApp").setProperty("/Centges", values[0].results[0].Centges);
                        this.oComponent.getModel("ModoApp").refresh(true);
                    }
                    /*var oModelOrgGestor = new JSONModel();
                    oModelOrgGestor.setData(values[0].results);
                    this.oComponent.setModel(oModelOrgGestor, "OrgGestor");*/
                    //this.oComponent.getModel("listadoNIA").refresh(true);
                    /* Centges = values[0].results[0].Centges;
                     Centuni = values[0].results[0].Centuni;
                     Centpro = values[0].results[0].Centpro;
                     Codadm = values[0].results[0].Codadm;*/
                    /*this.getView().byId("f_DIRorgest").setValue(Centges);
                    this.getView().byId("f_DIRuni").setValue(Centuni);
                    this.getView().byId("f_DIRofcont").setValue(Centpro);
                    this.getView().byId("f_DIRadm").setValue(Codadm);*/
                    //this.oComponent.getModel("listadoNIA").refresh(true);
                }
            },

            UnidadTramitadora: function (codcli, vkbur, vbeln) {
                //var Kunnr = this.getOwnerComponent().getModel("ModoApp").getData().Codcli;
                //var Bukrs = this.getOwnerComponent().getModel("ModoApp").getData().SocPed; //SocPed es el código de sociedad en ModoApp

                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                //aFilterIds = ["Kunnr", "Bukrs"];
                //aFilterValues = [Kunnr, Bukrs];
                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);
                aFilterIds.push("Bukrs");
                aFilterValues.push(vkbur);
                aFilterIds.push("Vbeln");
                aFilterValues.push(vbeln);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


                Promise.all([
                    this.readDataEntity(this.mainService, "/UndTramSet", aFilters),
                ]).then(this.buildUndTram.bind(this), this.errorFatal.bind(this));

            },

            buildUndTram: function (values) {
                if (values[0].results) {
                    if (values[0].results[0].Centuni) {
                        this.oComponent.getModel("ModoApp").setProperty("/Centuni", values[0].results[0].Centuni);
                        this.oComponent.getModel("ModoApp").refresh(true);
                    }
                    var oModelUndTram = new JSONModel();
                    oModelUndTram.setData(values[0].results);
                    this.oComponent.setModel(oModelUndTram, "UndTram");
                    //this.oComponent.getModel("listadoNIA").refresh(true);
                    /* Centges = values[0].results[0].Centges;
                     Centuni = values[0].results[0].Centuni;
                     Centpro = values[0].results[0].Centpro;
                     Codadm = values[0].results[0].Codadm;*/
                    /*this.getView().byId("f_DIRorgest").setValue(Centges);
                    this.getView().byId("f_DIRuni").setValue(Centuni);
                    this.getView().byId("f_DIRofcont").setValue(Centpro);
                    this.getView().byId("f_DIRadm").setValue(Codadm);*/
                    //this.oComponent.getModel("listadoNIA").refresh(true);
                }
            },

            OficinaContable: function (codcli, vkbur, Vbeln) {
                //var Kunnr = this.getOwnerComponent().getModel("ModoApp").getData().Codcli;
                //var Bukrs = this.getOwnerComponent().getModel("ModoApp").getData().SocPed; //SocPed es el código de sociedad en ModoApp

                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                //aFilterIds = ["Kunnr", "Bukrs"];
                //aFilterValues = [Kunnr, Bukrs];
                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);
                aFilterIds.push("Bukrs");
                aFilterValues.push(vkbur);
                aFilterIds.push("Vbeln");
                aFilterValues.push(Vbeln);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


                Promise.all([
                    this.readDataEntity(this.mainService, "/OfContableSet", aFilters),
                ]).then(this.buildOfContable.bind(this), this.errorFatal.bind(this));

            },

            buildOfContable: function (values) {
                if (values[0].results) {
                    if (values[0].results[0].Centpro) {
                        this.oComponent.getModel("ModoApp").setProperty("/Centpro", values[0].results[0].Centpro);
                        this.oComponent.getModel("ModoApp").refresh(true);
                    }
                    /*var oModelOfContable = new JSONModel();
                    oModelOfContable.setData(values[0].results);
                    this.oComponent.setModel(oModelOfContable, "OfContable");*/
                    //this.oComponent.getModel("listadoNIA").refresh(true);
                    /* Centges = values[0].results[0].Centges;
                     Centuni = values[0].results[0].Centuni;
                     Centpro = values[0].results[0].Centpro;
                     Codadm = values[0].results[0].Codadm;*/
                    /*this.getView().byId("f_DIRorgest").setValue(Centges);
                    this.getView().byId("f_DIRuni").setValue(Centuni);
                    this.getView().byId("f_DIRofcont").setValue(Centpro);
                    this.getView().byId("f_DIRadm").setValue(Codadm);*/
                    //this.oComponent.getModel("listadoNIA").refresh(true);
                }
            },

            CodigoAdmon: function (codcli, vkbur, vbeln) {
                //var Kunnr = this.getOwnerComponent().getModel("ModoApp").getData().Codcli;
                //var Bukrs = this.getOwnerComponent().getModel("ModoApp").getData().SocPed; //SocPed es el código de sociedad en ModoApp

                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                //aFilterIds = ["Kunnr", "Bukrs"];
                //aFilterValues = [Kunnr, Bukrs];
                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);
                aFilterIds.push("Bukrs");
                aFilterValues.push(vkbur);
                aFilterIds.push("Vbeln");
                aFilterValues.push(vbeln);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


                Promise.all([
                    this.readDataEntity(this.mainService, "/CodAdmonSet", aFilters),
                ]).then(this.buildCodAdmon.bind(this), this.errorFatal.bind(this));

            },

            buildCodAdmon: function (values) {
                if (values[0].results) {
                    if (values[0].results[0].Codadm) {
                        this.oComponent.getModel("ModoApp").setProperty("/Codadm", values[0].results[0].Codadm);
                        this.oComponent.getModel("ModoApp").refresh(true);
                    }
                    /*var oModelCodAdmon = new JSONModel();
                    oModelCodAdmon.setData(values[0].results);
                    this.oComponent.setModel(oModelCodAdmon, "codAdmon");*/
                    //this.oComponent.getModel("listadoNIA").refresh(true);
                    /* Centges = values[0].results[0].Centges;
                     Centuni = values[0].results[0].Centuni;
                     Centpro = values[0].results[0].Centpro;
                     Codadm = values[0].results[0].Codadm;*/
                    /*this.getView().byId("f_DIRorgest").setValue(Centges);
                    this.getView().byId("f_DIRuni").setValue(Centuni);
                    this.getView().byId("f_DIRofcont").setValue(Centpro);
                    this.getView().byId("f_DIRadm").setValue(Codadm);*/
                    //this.oComponent.getModel("listadoNIA").refresh(true);
                }
            },

            Plataformapedido: function (codcli, vkbur, Vbeln) {
                //var Kunnr = this.getOwnerComponent().getModel("ModoApp").getData().Codcli;
                //var Bukrs = this.getOwnerComponent().getModel("ModoApp").getData().SocPed; //SocPed es el código de sociedad en ModoApp
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                //aFilterIds = ["Kunnr", "Bukrs"];
                //aFilterValues = [Kunnr, Bukrs];
                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);
                aFilterIds.push("Bukrs");
                aFilterValues.push(vkbur);
                aFilterIds.push("Vbeln");
                aFilterValues.push(Vbeln);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


                Promise.all([
                    this.readDataEntity(this.mainService, "/DamePlataformaSet", aFilters),
                ]).then(this.buildPlataforma.bind(this), this.errorFatal.bind(this));

            },

            buildPlataforma: function (values) {
                if (values[0].results) {
                    if (values[0].results[0].Plataforma) {
                        this.oComponent.getModel("ModoApp").setProperty("/Plataforma", values[0].results[0].Plataforma);
                        this.oComponent.getModel("ModoApp").refresh(true);
                    }
                    /*var oModelPlataforma = new JSONModel();
                    oModelPlataforma.setData(values[0].results);
                    this.oComponent.setModel(oModelPlataforma, "Plataforma");*/
                }
            },

            DameMonedas: function () {
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                //aFilterIds = ["Kunnr", "Bukrs"];
                //aFilterValues = [Kunnr, Bukrs];
                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);
                aFilterIds.push("Bukrs");
                aFilterValues.push(vkbur);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


                Promise.all([
                    this.readDataEntity(this.mainService, "/DameMonedasSet", ""),
                ]).then(this.buildMonedas.bind(this), this.errorFatal.bind(this));

            },

            buildMonedas: function (values) {
                if (values[0].results) {
                    var oModelMoneda = new JSONModel();
                    oModelMoneda.setData(values[0].results);
                    this.oComponent.setModel(oModelMoneda, "listadoMoneda");
                }

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
                this.getView().byId("f_ording").setValue(codord);
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
                vkbur = ofi.Vkbur;
                this.getView().byId("f_oficinas").setValue(vkbur);
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
                this._getDialogOficinas(oEvent);
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
                }
                /*else {
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
                }
                /*else {
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

                var skey = oEvent.getParameter("key");
                sStatus = "";
                sAprob = "";
                sLiber = "";

                switch (skey) {
                    //Todas
                    case "Free":
                        sStatus = "";
                        sAprob = false;
                        vedit = false;
                        break;
                        //En redaccion
                    case "Ok":
                        sStatus = "REDA";
                        //this.oComponent.getModel("ModoApp").setProperty("/redacc", redacc);
                        //this.oComponent.getModel("ModoApp").refresh(true);
                        //this._getDialogAprobaciones();
                        vedit = true;
                        break;
                        //Pdte. Aprobar
                    case "Heavy":
                        sStatus = "APRB";
                        sAprob = false;
                        vedit = false;
                        break;
                        //Pdte. Financiero
                    case "Overweight":
                        sStatus = "FINA";
                        sAprob = false;
                        vedit = false;
                        break;
                        //Pdte. Facturar
                    case "Money":
                        sStatus = "FACT";
                        sAprob = false;
                        vedit = false;
                        break;
                        //Pdte. Cobrar
                    case "Payment":
                        sStatus = "PDTE";
                        sAprob = false;
                        var aprob = true;
                        vedit = false;
                        //this.oComponent.getModel("ModoApp").setProperty("/aprob", aprob);
                        //this.oComponent.getModel("ModoApp").refresh(true);
                        break;
                        //Cobradas
                    case "Sales":
                        sStatus = "COBR";
                        sAprob = false;
                        vedit = false;
                        break;
                        //Denegadas
                    case "Cancel":
                        sStatus = "DEN";
                        sAprob = false;
                        vedit = false;
                        break;
                    case "Approv":
                        //this.ListadoSolStatus(s);
                        sStatus = "APRB";
                        sAprob = true;
                        vedit = false;

                        //this._getDialogAprobaciones();
                        break;
                }


                if (sStatus == "REDA") {
                    if (checkMisPed === 'X') {
                        this.getView().byId("Filtr10").setVisible(true);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (checkMisPed === undefined) {
                        this.getView().byId("Filtr10").setVisible(true);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (checkTodos === 'X') {
                        this.getView().byId("Filtr10").setVisible(true);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (checkTodos === undefined) {
                        this.getView().byId("Filtr10").setVisible(true);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    }
                    //this.getView().byId("Filtr10").setVisible(true);
                    //this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                    //this.oComponent.getModel("PedidoCab").refresh(true);
                    //this.ListadoSolStatus(
                    //    //Usuario,
                    //    //Numped,
                    //    Fechad,
                    //    Fechah,
                    //    Imported,
                    //    Importeh,
                    //    Cliente,
                    //    sStatus,
                    //    LineaServicio,
                    //    codmat,
                    //    responsable
                    //    /*,
                    //    ClasePed*/
                    //);
                } else if (sStatus == "APRB" && sAprob == true) {
                    this.getView().byId("Filtr10").setVisible(false);
                    this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                    this.oComponent.getModel("PedidoCab").refresh(true);
                    this._getDialogAprobaciones();
                } else if (sStatus == "APRB" && sAprob == false) {
                    if (checkMisPed === 'X') {
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (checkMisPed === undefined) {
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (checkTodos === 'X') {
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (checkTodos === undefined) {

                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    }

                    /*this.getView().byId("Filtr10").setVisible(false);
                    this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                    this.oComponent.getModel("PedidoCab").refresh(true);
                    this.ListadoSolStatus(
                        Usuario,
                        Numped,
                        Fechad,
                        Fechah,
                        Imported,
                        Importeh,
                        sStatus,
                        Cliente,
                        LineaServicio,
                        codmat,
                        responsable,
                        ClasePed
                    );*/
                } else {
                    if (checkMisPed === 'X') {
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (checkMisPed === undefined) {
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (checkTodos === 'X') {
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (checkTodos === undefined) {
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    }


                    /*this.getView().byId("Filtr10").setVisible(false);
                    this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                    this.oComponent.getModel("PedidoCab").refresh(true);
                    this.ListadoSolStatus(
                        Usuario,
                        Numped,
                        Fechad,
                        Fechah,
                        Imported,
                        Importeh,
                        sStatus,
                        Cliente,
                        LineaServicio,
                        codmat,
                        responsable,
                        ClasePed
                    );*/
                }
            },

            onBusqMisPedidos: function () {
                /*if (sStatus == "" || sStatus == "REDA" || sStatus == "APROB" || sStatus == "FINA" || sStatus == "FACT" || sStatus == "PDTE" || sStatus == "COBR" || sStatus == "DEN")  {
                    var Usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                    this.ListadoSolStatus(
                        Usuario,
                        //Numped,
                        Fechad,
                        Fechah,
                        Imported,
                        Importeh,
                        Cliente,
                        sStatus,
                        LineaServicio,
                        codmat,
                        responsable,
                        ClasePed
                    );    
                } else {*/
                Usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                checkMisPed = 'X';
                this.ListadoSolicitudes(
                    Usuario,
                    Numped,
                    Fechad,
                    Fechah,
                    Imported,
                    Importeh,
                    Cliente,
                    sStatus,
                    LineaServicio,
                    codmat,
                    responsable,
                    ClasePed)
                //}

            },

            onBusqTodos: function () {
                /*if (sStatus == "" || sStatus == "REDA" || sStatus == "APROB" || sStatus == "FINA" || sStatus == "FACT" || sStatus == "PDTE" || sStatus == "COBR" || sStatus == "DEN")  {
                    var Usuario = "";
                    this.ListadoSolStatus(
                        Usuario,
                        //Numped,
                        Fechad,
                        Fechah,
                        Imported,
                        Importeh,
                        sStatus,
                        Cliente,
                        LineaServicio,
                        codmat,
                        responsable,
                        ClasePed
                    );    
                } else {*/
                Usuario = "";
                checkTodos = 'X';
                this.ListadoSolicitudes(
                    Usuario,
                    Numped,
                    Fechad,
                    Fechah,
                    Imported,
                    Importeh,
                    sStatus,
                    Cliente,
                    LineaServicio,
                    codmat,
                    responsable,
                    ClasePed)
                //}
            },

            onRadioButtonSelect: function (oEvent) {
                var oRbGroup = this.getView().byId("rbGroup"); // Get the RadioButtonGroup control
                var oSelectedButton = oRbGroup.getSelectedButton(); // Get the selected radio button

                if (oSelectedButton.getId() === "application-monitorpedidos-display-component---MonitorPedidos--rbTrue") {
                    //Si está marcado un status y queremos acceder a Mis Pedidos comprobamos en que estatus estamos
                    if (sStatus === "") {
                        Usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "REDA") {
                        Usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                        this.getView().byId("Filtr10").setVisible(true);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "APRB" && sAprob == false) {
                        Usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "FINA") {
                        Usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "FACT") {
                        Usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "PDTE") {
                        Usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "COBR") {
                        Usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "DEN") {
                        Usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else {
                        //Si queremos ver mis pedidos primero y luego navegar por los filtros de estado
                        checkMisPed = 'X';
                        Usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                        this.ListadoSolicitudes(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            Cliente,
                            sStatus,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed);
                    }

                } else if (oSelectedButton.getId() === "application-monitorpedidos-display-component---MonitorPedidos--rbFalse") {
                    //Si está marcado un status y queremos acceder a Todos los Pedidos comprobamos en que estatus estamos
                    if (sStatus === "") {
                        Usuario = "";
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "REDA") {
                        Usuario = "";
                        this.getView().byId("Filtr10").setVisible(true);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "APRB" && sAprob == false) {
                        Usuario = "";
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "FINA") {
                        Usuario = "";
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "FACT") {
                        Usuario = "";
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "PDTE") {
                        Usuario = "";
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "COBR") {
                        Usuario = "";
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );
                    } else if (sStatus === "DEN") {
                        Usuario = "";
                        this.getView().byId("Filtr10").setVisible(false);
                        this.oComponent.getModel("PedidoCab").setProperty("/editPos", vedit);
                        this.oComponent.getModel("PedidoCab").refresh(true);
                        this.ListadoSolStatus(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            sStatus,
                            Cliente,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed
                        );

                    } else {
                        //Si queremos ver todos los pedidos primero y luego navegar por los filtros de estado
                        Usuario = "";
                        checkTodos = 'X';
                        this.ListadoSolicitudes(
                            Usuario,
                            Numped,
                            Fechad,
                            Fechah,
                            Imported,
                            Importeh,
                            Cliente,
                            sStatus,
                            LineaServicio,
                            codmat,
                            responsable,
                            ClasePed);
                    }

                };
            },


            onEnviarLiberacion: function () {
                this._getDialogLiberaciones();
            },

            ListadoSolStatus: function (
                Usuario,
                Numped,
                Fechad,
                Fechah,
                Imported,
                Importeh,
                sStatus,
                Cliente,
                LineaServicio,
                codmat,
                responsable,
                ClasePed
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
                    "USUARIO",
                    "IDSOLICITUD",
                    "FECHAD",
                    "FECHAH",
                    "IMPORTED",
                    "IMPORTEH",
                    "ESTADO",
                    "CLIENTE",
                    "LINEA",
                    "MATERIAL",
                    "ZRESPONSABLE",
                    "TIPO"
                ];
                aFilterValues = [
                    Usuario,
                    Numped,
                    fec_ini,
                    fec_fin,
                    Imported,
                    Importeh,
                    sStatus,
                    Cliente,
                    LineaServicio,
                    codmat,
                    responsable,
                    ClasePed
                ];

                if (Usuario == "" || Usuario == undefined) {
                    var i = aFilterIds.indexOf("USUARIO");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

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


                if (sStatus == "" || sStatus == undefined) {
                    var i = aFilterIds.indexOf("ESTADO");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Cliente == "REDA" || Cliente == "APRB" || Cliente == "FINA" || Cliente == "FACT" || Cliente == "PDTE" || Cliente == "COBR" || Cliente == "DEN") {
                    Cliente = "";
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

                if (responsable == "" || responsable == undefined) {
                    var i = aFilterIds.indexOf("ZRESPONSABLE");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (ClasePed == "" || ClasePed == undefined) {
                    var i = aFilterIds.indexOf("TIPO");

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
            /*
            onOpenOrder: function (oEvent) {

                
                const oI18nModel = this.oComponent.getModel("i18n");
                var soli = this.getSelectedPed(oEvent);

                var that = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                this.modoapp = "D";
                var aFilterIds, aFilterValues, aFilters;
                var numsol = soli;

                aFilterIds = ["IdSolicitud"];
                aFilterValues = [numsol];

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.mainService.read("/AccionDetallePedido", {
                        filters: aFilters,
                        urlParameters: {
                            $expand: [
                                "AdjuntoSHPSet",
                                "SolicitudAdjunto_A",
                                "SolicitudPep_A",
                                "SolicitudHistorial_A"
                            ],
                        },
                        success: function (data, response) {
                            if (data) {
                                var oModelDisplay = new JSONModel();
                                var oModelSolicitud_Adj = new JSONModel();
                                var oModelSolicitud_AdjExp = new JSONModel();
                                var oModelSolicitud_Pep = new JSONModel();
                                var oModelSolicitud_Apr = new JSONModel();
                                var oModelSolicitud_Est = new JSONModel();
                                var oModeljustificacion = new JSONModel();
                                var oModelestrategia = new JSONModel();
                                var SolicitudAdjunto_A = [],
                                    SolicitudAdjunto_Exp = [],
                                    SolicitudPep_A = [],
                                    Justificacion = [],
                                    ElemPlanif = [],
                                    SolicitudAprobacion_A = [],
                                    SolicitudHistorial_A = [];


                                if (data.results[0].Erdat) {
                                    var today1 = data.results[0].Erdat;
                                    var fechai = today1.getFullYear() + '-' + ("0" + (today1.getMonth() + 1)).slice(-2) + '-' + ("0" + today1.getDate()).slice(-2);
                                    data.results[0].Erdat = fechai;
                                }

                                oModelDisplay.setData(data.results[0]);
                                that.oComponent.setModel(oModelDisplay, "DisplayPEP");

                                if ((that.modoapp === "D" || that.modoapp === "C") &&
                                    data.results[0].SolicitudAdjunto_A.results.length > 0) {
                                    var oModAdj = new JSONModel();
                                    var adjs = [],
                                        adj;
                                    data.results[0].SolicitudAdjunto_A.forEach(function (el) {
                                        var url;
                                        url = "";
                                        data.results[0].AdjuntoSHPSet.results.forEach(function (elshp) {
                                            if (el.Descripcion == elshp.Descriptivo && el.Documento == elshp.Adjunto) {
                                                url = elshp.Url;
                                            }
                                        });
                                        adj = {
                                            Filename: el.Documento,
                                            Descripcion: el.Descripcion,
                                            URL: url
                                        };
                                        adjs.push(adj);
                                    });

                                    oModAdj.setData(adjs);
                                    that.oComponent.setModel(new JSONModel(), "datosAdj");
                                    that.oComponent.setModel(oModAdj, "AdjuntoSHPSet");
                                } else {
                                    that.oComponent.setModel(new JSONModel(), "datosAdj");
                                    that.oComponent.setModel(new JSONModel([]), "AdjuntoSHPSet");
                                }

                                SolicitudHistorial_A = data.results[0].SolicitudHistorial_A;

                                if (data.results[0].SolicitudEstrategia_A.results.length > 0) {
                                    var oModHist = new JSONModel();
                                    var historial = data.results[0].SolicitudHistorial_A;

                                    historial.results.forEach(function (el) {
                                        if (condition) {

                                        }
                                    });
                                    oModHist.setData(data.results[0].SolicitudHistorial_A);
                                    that.oComponent.setModel(oModHist, "HistorialSol");

                                } else {
                                    that.oComponent.setModel(new JSONModel(), "HistorialSol");
                                }

                                SolicitudPep_A = data.results[0].SolicitudPep_A

                                for (var i = 0; i < SolicitudPep_A.results.length; i++) {
                                    var sreturn = "";
                                    sreturn = SolicitudPep_A.results[i].Importe;
                                    SolicitudPep_A.results[i].Importe = sreturn;
                                }

                                for (var i = 0; i < SolicitudPep_A.results.length; i++) {
                                    Totalizado += parseFloat(SolicitudPep_A.results[i].Importe);
                                }

                                oModelSolicitud_Pep.setData(SolicitudPep_A);

                                var title = oI18nModel.getProperty("detSolP") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().IdSolicitud).slice(-10);
                                that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                                that.oComponent.getModel("DisplayPEP").setProperty("/param", false);

                                //Boton de CRUD
                                var button, modAdj;

                                if (that.modoapp === "D") {
                                    button = oI18nModel.getProperty("grabMod");

                                    if (data.results[0].ZdatePs !== '') {
                                        modAdj = false;
                                    }
                                }

                                var config = {
                                    buttCRUD: button,
                                    modAdj: modAdj
                                };

                                var oModConfig = new JSONModel();
                                oModConfig.setData(config);

                                that.oComponent.setModel(oModConfig, "ModoApp");
                            }
                            if (response) {
                                //var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                                oRouter.navTo("RouteAltaPedidos");
                            }
                        },
                    }),
                ]);
            },
            */

            onOpenOrder: function (oEvent) {

                /*var numero = oEvent.getSource().getBindingContext("listadoSolicitudes").getPath().split("/").slice(-1).pop()
                var posicionArray = this.oComponent.getModel("listadoSolicitudes").getData()[numero];
                var Idsolicitud = posicionArray.IDSOLICITUD;
 
                const oRouter = this.getOwnerComponent().getRouter();
                console.log(posicionArray)
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteAltaPedidos",{
                    path: Idsolicitud
                });
                this.modoapp = "D";
                var oModConfig = new JSONModel();
                var button;
                var config = {
                    buttCRUD: button,
                    mode: modoapp
                };
                oModConfig.setData(config);
 
                this.oComponent.setModel(oModConfig, "ModoApp");
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteAltaPedidos");*/
                //sap.ui.core.BusyIndicator.hide();*/
                //});
                const oI18nModel = this.oComponent.getModel("i18n");
                var soli = this.getSelectedPed(oEvent);

                var that = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var Totalizado;
                var aFilterIdsCli, aFilterValuesCli, aFiltersCli;

                this.modoapp = "D";

                /*if (modoapp === "D"){
                   var claseped = this.getView("AltaPedidos.view.xml").byId("f_claseped");
                   claseped.setEditable(false);
                }*/

                var aFilterIds, aFilterValues, aFilters;
                var numsol = soli;
                var modApp;

                aFilterIds = ["Vbeln"];
                aFilterValues = [numsol.IDSOLICITUD];

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.mainService.read("/SolicitudSet", {
                        filters: aFilters,
                        urlParameters: {
                            $expand: [
                                //"SolicitudCli_A",
                                "SolicitudAdjunto_A",
                                "SolicitudPed_A",
                                "SolicitudMod_A"
                            ],
                        },
                        success: function (data, response) {
                            if (data) {
                                var oModelDisplay = new JSONModel();
                                var oModelSolicitud_Cli = new JSONModel();
                                var oModelSolicitud_Adj = new JSONModel();
                                var oModelSolicitud_Ped = new JSONModel();
                                var oModelSolicitud_Apr = new JSONModel();
                                var oModelSolicitud_Hist = new JSONModel();
                                var SolicitudAdjunto_A = [],
                                    Solicitud_Cli_A = [],
                                    SolicitudMod_A = [],
                                    SolicitudPed_A = [],
                                    SolicitudAprobacion_A = [],
                                    SolicitudHistorial_A = [];

                                that.oComponent.setModel(new JSONModel([]), "PedidoPos");


                                if (data.results[0].Erdat) {
                                    var today1 = data.results[0].Erdat;
                                    var fechai = today1.getFullYear() + '-' + ("0" + (today1.getMonth() + 1)).slice(-2) + '-' + ("0" + today1.getDate()).slice(-2);
                                    data.results[0].Erdat = fechai;
                                }

                                oModelDisplay.setData(data.results[0]);
                                that.oComponent.setModel(oModelDisplay, "DisplayPEP");

                                if ((that.modoapp === "D" || that.modoapp === "C") &&
                                    data.results[0].SolicitudAdjunto_A.results.length > 0) {
                                    var oModAdj = new JSONModel();
                                    var adjs = [],
                                        adj;
                                    data.results[0].SolicitudAdjunto_A.results.forEach(function (el) {
                                        var url;
                                        url = "";
                                        /*data.results[0].AdjuntoSHPSet.results.forEach(function (elshp) {
                                            if (el.Descripcion == elshp.Descriptivo && el.Documento == elshp.Adjunto) {
                                                url = elshp.Url;
                                            }
                                        });*/
                                        adj = {
                                            Filename: el.Filename,
                                            Descripcion: el.Descripcion,
                                            URL: url
                                        };
                                        adjs.push(adj);
                                    });

                                    oModAdj.setData(adjs);
                                    that.oComponent.setModel(new JSONModel(), "datosAdj");
                                    that.oComponent.setModel(oModAdj, "Adjuntos");
                                } else {
                                    that.oComponent.setModel(new JSONModel(), "datosAdj");
                                    that.oComponent.setModel(new JSONModel([]), "Adjuntos");
                                }

                                SolicitudHistorial_A = data.results[0].SolicitudMod_A;

                                if (SolicitudHistorial_A.results.length > 0) {
                                    var oModHist = new JSONModel();
                                    var historial = SolicitudHistorial_A.results;

                                    /* historial.results.forEach(function (el) {
                                         if (condition) {
 
                                         }
                                     });*/
                                    oModHist.setData(SolicitudHistorial_A.results);
                                    that.oComponent.setModel(oModHist, "HistorialSol");

                                } else {
                                    that.oComponent.setModel(new JSONModel(), "HistorialSol");
                                }

                                SolicitudPed_A = data.results[0].SolicitudPed_A

                                for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                    var sreturn = "";
                                    sreturn = SolicitudPed_A.results[i].Netwr;
                                    SolicitudPed_A.results[i].Netwr = sreturn;
                                    //SolicitudPed_A.results[i].Ykostl = that.oComponent.getModel("DisplayPEP").getProperty("/Yykostkl");
                                    //SolicitudPed_A.results[i].Yaufnr = that.oComponent.getModel("DisplayPEP").getProperty("/Yyaufnr");
                                    SolicitudPed_A.results[i].Ykostl = SolicitudPed_A.results[i].Yykostkl;
                                    SolicitudPed_A.results[i].Yaufnr = SolicitudPed_A.results[i].Yyaufnr;
                                }

                                for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                    Totalizado += parseFloat(SolicitudPed_A.results[i].Netwr);
                                }

                                oModelSolicitud_Ped.setData(SolicitudPed_A);
                                that.oComponent.getModel("PedidoPos").setData(oModelSolicitud_Ped.getData().results);
                                that.oComponent.setModel(that.oComponent.getModel("PedidoPos"), "DisplayPosPed");
                                //that.oComponent.setModel(PedidoPos, "DisplayPosPed");



                                /*aFilterIdsCli.push("Kunnr");
                                aFilterValuesCli.push(data.results[0].Kunnr);
 
                                aFilterIdsCli.push("Bukrs");
                                aFilterValuesCli.push(data.results[0].Vkorg);
 
 
                                aFiltersCli = Util.createSearchFilterObject(aFilterIdsCli, aFilterValuesCli);
                                */
                                var vbeln = "";
                                that.DatosAux(data.results[0].Vbeln);
                                that.motivopedido(data.results[0].Auart, data.results[0].Vkorg);
                                that.DatosCliente(data.results[0].Kunnr, data.results[0].Vkorg);
                                that.OficinaVenta(data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                that.NIApedido(data.results[0].Kunnr, data.results[0].Vkorg);
                                that.condicionPago(data.results[0].Kunnr, data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                //this.DIRpedido(codcli, vkbur);
                                that.OrganoGestor(data.results[0].Kunnr, data.results[0].Vkorg, vbeln);
                                that.UnidadTramitadora(data.results[0].Kunnr, data.results[0].Vkorg, vbeln);
                                that.OficinaContable(data.results[0].Kunnr, data.results[0].Vkorg, vbeln);
                                that.CodigoAdmon(data.results[0].Kunnr, data.results[0].Vkorg, vbeln);
                                that.Plataformapedido(data.results[0].Kunnr, data.results[0].Vkorg, vbeln);



                                var title = oI18nModel.getProperty("detSolP") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().Vbeln).slice(-10);
                                that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                                that.oComponent.getModel("DisplayPEP").setProperty("/param", false);

                                //Boton de CRUD
                                var button, modAdj;

                                if (that.modoapp === "D") {
                                    button = oI18nModel.getProperty("grabMod");

                                    if (data.results[0].ZdatePs !== '') {
                                        modAdj = false;
                                    }
                                }

                                var config = {
                                    buttCRUD: button,
                                    modAdj: modAdj,
                                    mode: that.modoapp

                                };

                                var oModConfig = new JSONModel();
                                oModConfig.setData(config);

                                that.oComponent.setModel(oModConfig, "ModoApp");

                                that.oComponent.getModel("ModoApp").setProperty("/Clasepedido", that.oComponent.getModel("DisplayPEP").getProperty("/Auart"));
                                that.oComponent.getModel("ModoApp").setProperty("/Vtext", that.oComponent.getModel("DisplayPEP").getProperty("/Spart"));
                                that.oComponent.getModel("ModoApp").setProperty("/CvCanal", that.oComponent.getModel("DisplayPEP").getProperty("/Vtweg"));
                                that.oComponent.getModel("ModoApp").setProperty("/CvSector", that.oComponent.getModel("DisplayPEP").getProperty("/Spart"));
                                that.oComponent.getModel("ModoApp").setProperty("/NomSoc", that.oComponent.getModel("DisplayPEP").getProperty("/Bukrs"));
                                that.oComponent.getModel("ModoApp").setProperty("/Nomcli", that.oComponent.getModel("DisplayPEP").getProperty("/Kunnr"));
                                that.oComponent.setModel(new JSONModel([]), "PedidoPos");
                                that.oComponent.getModel("ModoApp").refresh(true);

                                /*for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                    that.oComponent.getModel("PedidoPos").setProperty("/ItmNumber", SolicitudPed_A.results[i].Posnr);
                                    that.oComponent.getModel("PedidoPos").setProperty("/Material", SolicitudPed_A.results[i].Matnr);
                                    that.oComponent.getModel("PedidoPos").setProperty("/ShortText", SolicitudPed_A.results[i].Arktx);
                                    that.oComponent.getModel("PedidoPos").setProperty("/ReqQty", SolicitudPed_A.results[i].Kpein);
                                    that.oComponent.getModel("PedidoPos").setProperty("/SalesUnit", SolicitudPed_A.results[i].Meins);
                                    that.oComponent.getModel("PedidoPos").setProperty("/CondValue", SolicitudPed_A.results[i].Netwr);
                                    that.oComponent.getModel("PedidoPos").setProperty("/Currency", SolicitudPed_A.results[i].Waerk);
                                    that.oComponent.getModel("PedidoPos").setProperty("/Ykostl", that.oComponent.getModel("DisplayPEP").getProperty("/Yykostkl"));
                                    that.oComponent.getModel("PedidoPos").setProperty("/Yaufnr", that.oComponent.getModel("DisplayPEP").getProperty("/Yyaufnr"));
                                    that.oComponent.getModel("PedidoPos").refresh(true);
                                    
                                }*/

                                //that.oComponent.getModel("PedidoPos").setData(that.oComponent.getModel("DisplayPosPed").getData());


                            }
                            if (response) {
                                //var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                                oRouter.navTo("RouteAltaPedidos");
                            }
                        },
                    }),
                ]);

            },

            onEditOrder: function (oEvent) {
                const oI18nModel = this.oComponent.getModel("i18n");
                var soli = this.getSelectedPed(oEvent);

                var that = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var Totalizado;

                var aFilterIdsCli, aFilterValuesCli, aFiltersCli;
                var aFilterIds, aFilterValues, aFilters;

                var numsol = soli;
                var modApp;

                this.modoapp = "M";

                aFilterIds = ["Vbeln"];
                aFilterValues = [numsol.IDSOLICITUD];

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.mainService.read("/SolicitudSet", {
                        filters: aFilters,
                        urlParameters: {
                            $expand: [
                                "SolicitudAdjunto_A",
                                "SolicitudPed_A",
                                "SolicitudMod_A"
                            ],
                        },
                        success: function (data, response) {
                            if (data) {
                                var oModelDisplay = new JSONModel();
                                var oModelSolicitud_Cli = new JSONModel();
                                var oModelSolicitud_Adj = new JSONModel();
                                var oModelSolicitud_Ped = new JSONModel();
                                var oModelSolicitud_Apr = new JSONModel();
                                var oModelSolicitud_Hist = new JSONModel();
                                var SolicitudAdjunto_A = [],
                                    Solicitud_Cli_A = [],
                                    SolicitudMod_A = [],
                                    SolicitudPed_A = [],
                                    SolicitudAprobacion_A = [],
                                    SolicitudHistorial_A = [];

                                that.oComponent.setModel(new JSONModel([]), "PedidoPos");

                                if (data.results[0].Erdat) {
                                    var today1 = data.results[0].Erdat;
                                    var fechai = today1.getFullYear() + '-' + ("0" + (today1.getMonth() + 1)).slice(-2) + '-' + ("0" + today1.getDate()).slice(-2);
                                    data.results[0].Erdat = fechai;
                                }

                                oModelDisplay.setData(data.results[0]);
                                that.oComponent.setModel(oModelDisplay, "DisplayPEP");

                                if ((that.modoapp === "M") &&
                                    data.results[0].SolicitudAdjunto_A.results.length > 0) {
                                    var oModAdj = new JSONModel();
                                    var adjs = [],
                                        adj;
                                    data.results[0].SolicitudAdjunto_A.results.forEach(function (el) {
                                        var url;
                                        url = "";
                                        /*data.results[0].AdjuntoSHPSet.results.forEach(function (elshp) {
                                            if (el.Descripcion == elshp.Descriptivo && el.Documento == elshp.Adjunto) {
                                                url = elshp.Url;
                                            }
                                        });*/
                                        adj = {
                                            Filename: el.Filename,
                                            Descripcion: el.Descripcion,
                                            URL: url
                                        };
                                        adjs.push(adj);
                                    });

                                    oModAdj.setData(adjs);
                                    that.oComponent.setModel(new JSONModel(), "datosAdj");
                                    that.oComponent.setModel(oModAdj, "Adjuntos");
                                } else {
                                    that.oComponent.setModel(new JSONModel(), "datosAdj");
                                    that.oComponent.setModel(new JSONModel([]), "Adjuntos");
                                }

                                SolicitudHistorial_A = data.results[0].SolicitudMod_A;

                                if (SolicitudHistorial_A.results.length > 0) {
                                    var oModHist = new JSONModel();
                                    var historial = SolicitudHistorial_A.results;

                                    /* historial.results.forEach(function (el) {
                                            if (condition) {

                                            }
                                        });*/
                                    oModHist.setData(SolicitudHistorial_A.results);
                                    that.oComponent.setModel(oModHist, "HistorialSol");

                                } else {
                                    that.oComponent.setModel(new JSONModel(), "HistorialSol");
                                }

                                SolicitudPed_A = data.results[0].SolicitudPed_A

                                for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                    var sreturn = "";
                                    sreturn = SolicitudPed_A.results[i].Netwr;
                                    SolicitudPed_A.results[i].Netwr = sreturn;
                                    //SolicitudPed_A.results[i].Ykostl = that.oComponent.getModel("DisplayPEP").getProperty("/Yykostkl");
                                    //SolicitudPed_A.results[i].Yaufnr = that.oComponent.getModel("DisplayPEP").getProperty("/Yyaufnr");
                                    SolicitudPed_A.results[i].Ykostl = SolicitudPed_A.results[i].Yykostkl;
                                    SolicitudPed_A.results[i].Yaufnr = SolicitudPed_A.results[i].Yyaufnr;
                                }

                                for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                    Totalizado += parseFloat(SolicitudPed_A.results[i].Netwr);
                                }

                                var vbeln = "";
                                oModelSolicitud_Ped.setData(SolicitudPed_A);
                                that.oComponent.getModel("PedidoPos").setData(oModelSolicitud_Ped.getData().results);
                                that.oComponent.setModel(that.oComponent.getModel("PedidoPos"), "DisplayPosPed");

                                that.DatosAux(data.results[0].Vbeln);
                                that.condicionPago(data.results[0].Kunnr, data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                that.DatosCliente(data.results[0].Kunnr, data.results[0].Vkorg);
                                that.OficinaVenta(data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                that.NIApedido(data.results[0].Kunnr, data.results[0].Vkorg);
                                //this.DIRpedido(codcli, vkbur);
                                that.OrganoGestor(data.results[0].Kunnr, data.results[0].Vkorg, vbeln);
                                that.UnidadTramitadora(data.results[0].Kunnr, data.results[0].Vkorg, vbeln);
                                that.OficinaContable(data.results[0].Kunnr, data.results[0].Vkorg, vbeln);
                                that.CodigoAdmon(data.results[0].Kunnr, data.results[0].Vkorg, vbeln);
                                that.Plataformapedido(data.results[0].Kunnr, data.results[0].Vkorg, vbeln);
                                that.DameMonedas();

                                var title = oI18nModel.getProperty("detSolP") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().Vbeln).slice(-10);
                                that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                                that.oComponent.getModel("DisplayPEP").setProperty("/param", false);

                                //Boton de CRUD
                                var button, modAdj;

                                if (that.modoapp === "M") {
                                    button = oI18nModel.getProperty("grabMod");

                                    if (data.results[0].ZdatePs !== '') {
                                        modAdj = false;
                                    }
                                }

                                var config = {
                                    buttCRUD: button,
                                    modAdj: modAdj,
                                    mode: that.modoapp

                                };

                                var oModConfig = new JSONModel();
                                oModConfig.setData(config);

                                that.oComponent.setModel(oModConfig, "ModoApp");

                                that.oComponent.getModel("ModoApp").setProperty("/Clasepedido", that.oComponent.getModel("DisplayPEP").getProperty("/Auart"));
                                that.oComponent.getModel("ModoApp").setProperty("/NomSoc", that.oComponent.getModel("DisplayPEP").getProperty("/Vtext"));
                                that.oComponent.getModel("ModoApp").setProperty("/Vtext", that.oComponent.getModel("DisplayPEP").getProperty("/Vtext"));
                                //that.oComponent.getModel("ModoApp").setProperty("/Vkbur", that.oComponent.getModel("DisplayPEP").getProperty("/Vkbur"));
                                //that.oComponent.getModel("ModoApp").setProperty("/Spart", that.oComponent.getModel("DisplayPEP").getProperty("/Spart"));
                                that.oComponent.getModel("ModoApp").setProperty("/CvCanal", that.oComponent.getModel("DisplayPEP").getProperty("/Vtweg"));
                                that.oComponent.getModel("ModoApp").setProperty("/CvSector", that.oComponent.getModel("DisplayPEP").getProperty("/Spart"));
                                that.oComponent.getModel("ModoApp").setProperty("/NomSoc", that.oComponent.getModel("DisplayPEP").getProperty("/Vtext"));
                                that.oComponent.getModel("ModoApp").setProperty("/Nomcli", that.oComponent.getModel("DisplayPEP").getProperty("/Kunnr"));
                                that.oComponent.getModel("ModoApp").setProperty("/Ykostl", that.oComponent.getModel("DisplayPEP").getProperty("/Yykostkl"));
                                that.oComponent.getModel("ModoApp").setProperty("/Yaufnr", that.oComponent.getModel("DisplayPEP").getProperty("/Yyaufnr"));
                                that.oComponent.getModel("ModoApp").refresh(true);
                                that.oComponent.setModel(new JSONModel([]), "PedidoPos");

                            }
                            if (response) {
                                oRouter.navTo("RouteAltaPedidos");
                            }
                        },
                    }),
                ]);
            },

            getSelectedPed: function (oEvent) {

                var oModSum = this.oComponent.getModel("listadoSolicitudes").getData();
                const sOperationPath = oEvent.getSource().getBindingContext("listadoSolicitudes").getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();

                var sum = oModSum[sOperation];

                return sum;

            },

            getSelectedContrato: function (oEvent) {
                var oModCont = this.oComponent.getModel("ContratoCliente").getData();
                const sOperationPath = oEvent.getSource().getBindingContext("ContratoCliente").getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var sum = oModCont[sOperation];

                return sum;
            },

            getPedido: function (pedido) {

                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteAltaPedidos");
                sap.ui.core.BusyIndicator.hide();

                /* var aFilterIds,
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
                 ]).then(this.buildPedModel.bind(this), this.errorFatal.bind(this));*/

            },

            /*buildPedModel: function(values) {
                if (values[0].results[0]) { // Mapeo cabecera
                    var cabecera = Object.assign({}, values[0].results[0]);
                    delete cabecera.EstrategiaSet;
                    delete cabecera.HistorialModificacionSet;
                    delete cabecera.PedidoPosSet;
                    delete cabecera.AdjuntoSHPSet;
                    delete cabecera.AdjuntoSet;
                    delete cabecera.AdjuntoPSet;
                    delete cabecera.RespuestaPedido
    
                    // Formato Fechas
                    if (cabecera.Bedat) {
                        if (this.modoapp == "CO") {
                            var today1 = new Date();
                        } else {
                            var today1 = cabecera.Bedat;
                        }
                        var fechai = today1.getFullYear() + '-' + (
                            "0" + (
                                today1.getMonth() + 1
                            )
                        ).slice(-2) + '-' + (
                            "0" + today1.getDate()
                        ).slice(-2);
                        cabecera.Bedat = fechai;
                    }
                    if (cabecera.ZzfechaAprob) {
                        var today1 = cabecera.ZzfechaAprob;
                        var fechai = today1.getFullYear() + '-' + (
                            "0" + (
                                today1.getMonth() + 1
                            )
                        ).slice(-2) + '-' + (
                            "0" + today1.getDate()
                        ).slice(-2);
                        cabecera.ZzfechaAprob = fechai;
                    }
                    if (cabecera.FRechazo) {
                        var today1 = cabecera.FRechazo;
                        var fechai = today1.getFullYear() + '-' + (
                            "0" + (
                                today1.getMonth() + 1
                            )
                        ).slice(-2) + '-' + (
                            "0" + today1.getDate()
                        ).slice(-2);
                        cabecera.FRechazo = fechai;
                    }
                    if (cabecera.Aedat) {
                        var today1 = cabecera.Aedat;
                        var fechai = today1.getFullYear() + '-' + (
                            "0" + (
                                today1.getMonth() + 1
                            )
                        ).slice(-2) + '-' + (
                            "0" + today1.getDate()
                        ).slice(-2);
                        cabecera.Aedat = fechai;
                    }
    
                    
                    
                    if (this.modoapp == "CO" || this.modoapp == "M") {
    
                        if (this.modoapp == "CO") {
                            cabecera.Unsez = cabecera.Ebeln;
                            delete cabecera.Ebeln;
                            delete cabecera.Text;
    
                        }
                        delete cabecera.Frggr;
                        delete cabecera.Frgke;
                        delete cabecera.Frgsx;
                        delete cabecera.Aedat;
                        delete cabecera.Posid;
                        delete cabecera.PsPspPnr;
                        delete cabecera.Verna;
                        delete cabecera.Verna1;
                        delete cabecera.Verna2
                        delete cabecera.Verna3;
                        delete cabecera.Verna4;
                        delete cabecera.Verna5;
                        delete cabecera.Verna6;
                        delete cabecera.Vernr;
                        delete cabecera.Vernr1;
                        delete cabecera.Vernr2;
                        delete cabecera.Vernr3;
                        delete cabecera.Vernr4;
                        delete cabecera.Vernr5;
                        delete cabecera.Resp2;
                        delete cabecera.Obart;
                        delete cabecera.Ernam;
                        delete cabecera.ErnamName;
                    }
    
                    var oModCab = new JSONModel();
                    oModCab.setData(cabecera);
                    this.oComponent.setModel(oModCab, "PedidoCab");
    
                    // Mapeo Adjuntos
                    var adjuntos = values[0].results[0].AdjuntoSet.results;
                    var adjSHP = values[0].results[0].AdjuntoSHPSet.results;
    
                    if (adjuntos.length > 0) {
    
                        var oModAdj = new JSONModel();
                        var adjs = [],
                            adj;
    
                        adjuntos.forEach(function (el) {
    
                            var url;
                            url = "";
                            adjSHP.forEach(function (elshp) {
    
                                if (el.Descripcion == elshp.Descriptivo && el.Filename == elshp.Adjunto) {
                                    url = elshp.Url;
                                }
                            });
    
                            adj = {
                                Filename: el.Filename,
                                Descripcion: el.Descripcion,
                                URL: url
    
                            };
                            adjs.push(adj);
                        });
    
                        oModAdj.setData(adjs);
                        this.oComponent.setModel(oModAdj, "Adjuntos");
                        this.oComponent.setModel(new JSONModel(), "datosAdj");
                    } else {
                        this.oComponent.setModel(new JSONModel([]), "Adjuntos");
                        this.oComponent.setModel(new JSONModel(), "datosAdj");
                    }
                    // Mapeo posiciones
                    var posiciones = values[0].results[0].PedidoPosSet.results;
    
                    if (posiciones.length > 0) { // Formato posiciones y calculo siguiente pos
                        var posAnt;
                        var posNext = 0;
                        var posicionesN = [];
                        var modeAPP = this.modoapp;
    
                        posiciones.forEach(function (pos) {
    
                            pos.Ebelp = parseInt(pos.Ebelp);
                            pos.Secu = parseInt(pos.Secu);
    
                            if (! posAnt || posAnt != pos.Ebelp) {
                                pos.EbelpT = pos.Ebelp;
                            } else {
                                pos.EbelpT = "";
                            } posNext = pos.Ebelp;
                            posAnt = pos.Ebelp;
    
                            if (pos.Mwskz == "") {
                                pos.Mwskz = "00";
                            }
    
                            var posicionN = {
                                Ebelp: pos.Ebelp,
                                EbelpT: pos.EbelpT,
                                Accion: pos.Accion,
                                Pstyp: pos.Pstyp,
                                Loekz: pos.Loekz,
                                NameTyp: "Servicio",
                                Knttp: pos.Knttp,
                                Txz01: pos.Txz01,
                                Posid: pos.Posid,
                                MatServ: pos.MatServ,
                                Maktx: pos.Maktx,
                                Matkl: pos.Matkl,
                                Werks: pos.Werks,
                                Name1: pos.Name1,
                                Brtwr: pos.Brtwr,
                                Mwskz: pos.Mwskz,
                                Secu: pos.Secu,
                                SerialNo: pos.SerialNo,
                                Packno: pos.Packno,
                                Saknr: pos.Saknr,
                                LineNo: pos.LineNo,
                                PendienteFact: pos.PendienteFact,
                                WrbtrRf2: pos.WrbtrRf2
                            }
    
                            if (pos.Loekz == "L") {
                                posicionN.iconoB = "sap-icon://delete";
                                posicionN.iconoM = true;
                            } else if (pos.Loekz == "S") {
                                posicionN.iconoB = "sap-icon://locked";
                                posicionN.iconoM = true;
                            } else {
                                posicionN.iconoM = false;
                            }
    
                            if (modeAPP == "M") {
                               //posicionN.modificabe = false;
                               posicionN.modificabe = true;
                            } else {
                                posicionN.modificabe = false;
                                //posicionN.modificabe = true;
                            }
    
                            if (modeAPP !== "CO") {
                                posicionN.Erekz = pos.Erekz;
                            }
    
                            posicionesN.push(posicionN);
    
                        });
    
                        this.posNext = posNext + 10;
                        this.secuModi = posicionesN.length;
    
                        posiciones = posicionesN;
    
                        posiciones.sort(function (a, b) { // return a.Secu.toString().localeCompare(b.Secu.toString());
                            return a.Secu > b.Secu;
                        });
    
                        // Tratamiento posiciones en Copiar (Se eliminan posiciones marcadas para borrado)
                        var posidNew;
                        if (this.modoapp == "CO") {
    
                            for (var i = posiciones.length - 1; i >= 0; i--) {
    
                                if (posiciones[i].Loekz == "L") {
                                    posiciones.splice(i, 1);
                                }
                                
                                //Eliminar cantidad facturada en las posiciones en caso de copia
                                if (posiciones[i].WrbtrRf2 != "0.00") {
                                    posiciones[i].PendienteFact = posiciones[i].Brtwr
                                    posiciones[i].WrbtrRf2 = "0.00"
                                }
                            }
                            var pepCopia = posiciones[0].Posid;
    
                        }
    
                        var oModPos = new JSONModel();
                        oModPos.setData(posiciones);
                        this.oComponent.setModel(oModPos, "PedidoPos");
                    } else {
                        this.oComponent.setModel(new JSONModel(), "PedidoPos");
                    }
    
                    var accept = this.oI18nModel.getProperty("acept"),
                        decline = this.oI18nModel.getProperty("rech"),
                        pend = this.oI18nModel.getProperty("pend");
    
                    // Mapeo Estrategia
                    var estrategia = values[0].results[0].EstrategiaSet.results;
    
                    if (estrategia.length > 0) {
    
                        estrategia.forEach(function (el) {
    
                            if (el.Zlib == "X") {
                                el.icono = "sap-icon://accept";
                                el.dicono = accept;
                                el.color = "Positive";
                            } else {
                                if (el.Zico == "'@02@'") { // "@ED@"){
                                    el.icono = "sap-icon://decline";
                                    el.dicono = decline;
                                    el.color = "Negative";
                                } else {
                                    el.icono = "sap-icon://message-warning";
                                    el.dicono = pend;
                                    el.color = "Critical";
                                }
                                // estrategia.icono
                            }
    
                        });
    
                        var oModEst = new JSONModel();
                        oModEst.setData(estrategia);
                        this.oComponent.setModel(oModEst, "EstrategiaSol");
                    } else {
                        this.oComponent.setModel(new JSONModel(), "EstrategiaSol");
                    }
    
                    // Mapeo Historial Modificaciones
    
                    var modific = values[0].results[0].HistorialModificacionSet.results;
    
                    if (modific.length > 0) {
    
                        modific.forEach(function (el) { // el.Utime = el.Utime.ms.match(/(\d{2})H(\d{2})M(\d{2})S$/).slice(-3).join(":");
    
                            var seconds = Math.floor((el.Utime.ms / 1000) % 60),
                                minutes = Math.floor((el.Utime.ms / (1000 * 60)) % 60),
                                hours = Math.floor((el.Utime.ms / (1000 * 60 * 60)) % 24);
    
                            hours = (hours < 10) ? "0" + hours : hours;
                            minutes = (minutes < 10) ? "0" + minutes : minutes;
                            seconds = (seconds < 10) ? "0" + seconds : seconds;
    
                            el.Utime = hours + ":" + minutes + ":" + seconds;
                        });
    
                        var oModMod = new JSONModel();
                        oModMod.setData(modific);
                        this.oComponent.setModel(oModMod, "HistorialMod");
                    } else {
                        this.oComponent.setModel(new JSONModel(), "HistorialMod");
                    }
                }
                // Mapeo de Impuestos
                if (values[1].results.length > 0) { // Se cambia la clave al impuesto sin Iva a 00
                    values[1].results.forEach(function (el) {
    
                        if (el.Value == "") {
                            el.Value = "00";
                        }
    
                    });
    
                    var oModImp = new JSONModel();
                    oModImp.setData(values[1].results);
                    this.oComponent.setModel(oModImp, "Impuestos");
                }
    
                // Mapeo Tipo de compras
                if (values[2].results.length > 0) {
    
                    var oModComp = new JSONModel();
                    oModComp.setData(values[2].results);
                    this.oComponent.setModel(oModComp, "TipoCompras");
                }
                // Mapeo Tipo de grupo de Artículos
                if (values[3].results.length > 0) {
    
                    var oModGrA = new JSONModel();
                    oModGrA.setData(values[3].results);
                    this.oComponent.setModel(oModGrA, "GrupoArticulos");
                }
    
                // Mapeo CHAT pedido
                if (values[4].results.length > 0) {
    
                    var oModChat = new JSONModel();
                    oModChat.setData(values[4].results);
                    this.oComponent.setModel(oModChat, "ChatPedido");
                } else {
                    this.oComponent.setModel(new JSONModel(), "ChatPedido");
                }
    
                // Modelo crear chat.
                this.oComponent.setModel(new JSONModel(), "chatCreate");
    
                var bsart = cabecera.Bsart;
                var bukrs = cabecera.Bukrs;
                // Mapeamos la condicion de pago
    
                this.oComponent.getModel("PedidoCab").setProperty("/Zterm", cabecera.Zterm);
    
                // Mapeo extensión ficheros
                if (values[5].results) {
                    var oModExtA = new JSONModel();
                    oModExtA.setData(values[5].results);
                    this.oComponent.setModel(oModExtA, "ExtArchivos");
                }
    
                var aFilterIds,
                    aFilterValues,
                    aFilters,
                    aFilters2,
                    posidNew,
                    oJson;
    
                aFilterIds = ["Bsart"];
                aFilterValues = [bsart];
                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);
    
                aFilterIds = ["Ekorg"];
                aFilterValues = [bukrs];
                aFilters2 = Util.createSearchFilterObject(aFilterIds, aFilterValues);
    
                
    
                    if (posidNew) {
                        oJson = {
                            POSID : posidNew
                        }
                    }
                }

                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteAltaPedidos");
                sap.ui.core.BusyIndicator.hide();
    
            },*/


            //EXCEPCIONES (ERROR FATAL)/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            errorFatal: function (e) {
                MessageBox.error(this.oI18nModel.getProperty("errFat"));
                sap.ui.core.BusyIndicator.hide();
            },

            //METODO PARA DESCARGA EXCELL
            onDownExcel: function (oEvent) {
                var aCols, oRowBinding, oSettings, oSheet, oTable;

                this._oTable = this.byId('idTablePEPs');

                oTable = this._oTable;
                oRowBinding = oTable.getBinding().oList;

                if (oRowBinding.length > 0) {
                    var today1 = new Date();
                    var fechai = today1.getFullYear() + ("0" + (today1.getMonth() + 1)).slice(-2) + ("0" + today1.getDate()).slice(-2);
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
                    oSheet.build().finally(function () {
                        oSheet.destroy();
                    });
                } else {
                    MessageBox.warning(this.oI18nModel.getProperty("errExcV"));
                }
            },

            createColumnConfig: function (oTable) {
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

            filterOption: function (oEvent) {
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
                    var dia = ("0" + parseInt(sValue.substring(0, 2), 10)).slice(-2),
                        mes = "0" + (parseInt(sValue.substring(3, 5), 10)).slice(-2),
                        anio = sValue.substring(6, 10),
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
            },

            // METODOS Y FUNCIONES PARA EL ALTA DE PEDIDOS
            onNavToAltaPedidos: function (oEvent) {
                this._getDialogOptions();
                this.modoapp = 'C';
            },

            _getDialogOptions: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogOptions) {
                    this.pDialogOptions = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.AltaPedidoOption",
                        controller: this,
                    }).then(function (oDialogOptions) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialogOptions);
                        return oDialogOptions;
                    });
                }
                this.pDialogOptions.then(function (oDialogOptions) {
                    oDialogOptions.open(sInputValue);
                    //this._configDialogCliente(oDialog)
                });

                var vcped,
                    vcvent,
                    vzona,
                    vclient,
                    vcont,
                    vcreation,
                    vtitle,
                    modApp,
                    boton,
                    secuModi,
                    vccan,
                    vcsect,
                    vordenes;

                this.modoapp = 'C';

                if (this.modoapp == "C") {
                    vcped = false;
                    vcvent = false;
                    vzona = false;
                    vccan = false;
                    vcsect = false;
                    vclient = false;
                    vcont = false;
                    vcreation = false;
                    vordenes = false;
                    vtitle = this.oI18nModel.getProperty("visPed");
                    boton,
                    modApp = this.modoapp;
                }

                var config = {
                    ItmNumber: 10,
                    creation: vcreation,
                    mode: modApp,
                    modeAlta: "A",
                    cped: vcped,
                    cvent: vcvent,
                    czona: vzona,
                    cvcan: vccan,
                    cordenes: vordenes,
                    cvsector: vcsect,
                    ccont: vcont,
                    cclient: vclient,
                    buttCRUD: boton,
                    Title: vtitle,
                    secuModi: secuModi
                }

                var oModConfig = new JSONModel();
                oModConfig.setData(config);
                this.oComponent.setModel(oModConfig, "ModoApp");
                this.oComponent.setModel(new JSONModel([]), "posPedFrag");
                this.oComponent.setModel(new JSONModel([]), "PedidoCab");
                this.oComponent.setModel(new JSONModel([]), "PedidoPos");
            },

            _getDialogAprobaciones: function (sInputValue) {
                var oView = this.getView(),
                    that = this;
                sap.ui.core.BusyIndicator.hide();
                if (!this.pDialogAprobaciones) {
                    this.pDialogAprobaciones = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.Aprobacion",
                        controller: this,
                    }).then(function (oDialogAprobaciones) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialogAprobaciones);
                        return oDialogAprobaciones;
                    });
                }
                this.pDialogAprobaciones.then(function (oDialogAprobaciones) {
                    oDialogAprobaciones.open(sInputValue);
                });

                responsable = this.oComponent.getModel("Usuario").getData()[0].Bname;

                if (checkMisPed === 'X') {
                    that.ListadoSolStatus(
                        Usuario,
                        Numped,
                        Fechad,
                        Fechah,
                        Imported,
                        Importeh,
                        sStatus,
                        Cliente,
                        LineaServicio,
                        codmat,
                        responsable,
                        ClasePed);
                } else if (checkMisPed === undefined) {
                    that.ListadoSolStatus(
                        Usuario,
                        Numped,
                        Fechad,
                        Fechah,
                        Imported,
                        Importeh,
                        sStatus,
                        Cliente,
                        LineaServicio,
                        codmat,
                        responsable,
                        ClasePed);
                }

                if (checkTodos === 'X') {
                    that.ListadoSolStatus(
                        Usuario,
                        Numped,
                        Fechad,
                        Fechah,
                        Imported,
                        Importeh,
                        sStatus,
                        Cliente,
                        LineaServicio,
                        codmat,
                        responsable,
                        ClasePed);
                } else if (checkTodos === undefined) {
                    that.ListadoSolStatus(
                        Usuario,
                        Numped,
                        Fechad,
                        Fechah,
                        Imported,
                        Importeh,
                        sStatus,
                        Cliente,
                        LineaServicio,
                        codmat,
                        responsable,
                        ClasePed);
                }

            },

            _getDialogLiberaciones: function (sInputValue) {
                var oView = this.getView(),
                    that = this;
                sap.ui.core.BusyIndicator.hide();
                if (!this.pDialogLiberacion) {
                    this.pDialogLiberacion = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.Liberacion",
                        controller: this,
                    }).then(function (oDialogLiberacion) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialogLiberacion);
                        return oDialogLiberacion;
                    });
                }
                this.pDialogLiberacion.then(function (oDialogLiberacion) {
                    oDialogLiberacion.open(sInputValue);
                });

                responsable = "";

                that.ListadoSolStatus(
                    "",
                    Fechad,
                    Fechah,
                    Imported,
                    Importeh,
                    sStatus,
                    Cliente,
                    LineaServicio,
                    codmat,
                    responsable,
                    "");
            },

            DameOrganizaciones: function () {
                Promise.all([
                    this.readDataEntity(this.mainService, "/OrganizacionesSet", ""),
                ]).then(this.buildSociedades.bind(this), this.errorFatal.bind(this));
            },

            buildSociedades: function (values) {
                if (values[0].results) {
                    var oModelOgranizacion = new JSONModel();
                    oModelOgranizacion.setData(values[0].results);
                    oModelOgranizacion.setSizeLimit(300);
                    this.oComponent.setModel(oModelOgranizacion, "Organizaciones");
                }

            },

            getUser: function () {
                Promise.all([
                    this.readDataEntity(this.mainService, "/DameUsuarioSet", ""),
                ]).then(this.buildUsuario.bind(this), this.errorFatal.bind(this));
            },

            buildUsuario: function (values) {
                if (values[0].results) {
                    var oModelUsuario = new JSONModel();
                    oModelUsuario.setData(values[0].results);
                    this.oComponent.setModel(oModelUsuario, "Usuario");
                }
            },

            motivosRechazo: function () {
                Promise.all([
                    this.readDataEntity(this.mainService, "/TiposRechazoSet", ""),
                ]).then(this.buildTiposRechazo.bind(this), this.errorFatal.bind(this));
            },

            buildTiposRechazo: function (values) {
                if (values[0].results) {
                    var oModelTiposRechazo = new JSONModel();
                    oModelTiposRechazo.setData(values[0].results);
                    this.oComponent.setModel(oModelTiposRechazo, "TiposRechazo");
                }

            },

            TiposPedidoAlta: function (TipoPed) {

                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Auart");
                aFilterValues.push(TipoPed);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.readDataEntity(this.mainService, "/TipoPedidoSet", aFilters),
                ]).then(this.buildTiposPed.bind(this), this.errorFatal.bind(this));
            },

            buildTiposPed: function (values) {
                if (values[0].results) {
                    var oModelTiposPed = new JSONModel();
                    oModelTiposPed.setData(values[0].results);
                    this.oComponent.setModel(oModelTiposPed, "TipospedidoAlta");
                }

            },

            onChangeTipoPed: function () {
                //var mode = this.oComponent.getModel("ModoApp").getData();
                TipoPed = this.getView().byId("idCTipoPed").getSelectedKey();
                ClasePed = this.getView().byId("idCTipoPed")._getSelectedItemText();
                //mode.cped = true;
                //this.oComponent.getModel("ModoApp").refresh(true);
                this.oComponent.getModel("ModoApp").setProperty("/cped", true);
                this.oComponent.getModel("ModoApp").refresh(true);
                this.motivopedido(TipoPed, vkbur);
                //                this.oComponent.getModel("ModoApp").refresh(true);
            },

            AreasVenta: function () {
                /*var mode = this.oComponent.getModel("ModoApp").getData();

                mode.cvent = true;
                this.oComponent.getModel("ModoApp").refresh(true);*/
                //this.oComponent.getModel("ModoApp").setProperty("/cvent", true);
                //this.oComponent.getModel("ModoApp").setProperty("/cclient", true);
                //this.oComponent.getModel("ModoApp").refresh(true);

                //Calculamos los centos asociados a la sociedad
                //var bukrs = this.oComponent.getModel("PedidoCab").getData().Bukrs;
                //socPed = this.getView().byId("idCSociedad").getSelectedKey();
                //nomSoc = this.getView().byId("idCSociedad")._getSelectedItemText();
                //this.getView().byId("idArea").setValue(nomSoc);
                //vkbur = this.getView().byId("idCSociedad").getSelectedKey();
                //var user = ''  

                var aFilterIds,
                    aFilterValues,
                    aFilters;

                aFilterIds = ["Vkorg"];
                aFilterValues = [socPed];
                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([this.readDataEntity(this.mainService, "/AreaVentasSet", "")]).then(
                    this.buildListAreaVentas.bind(this), this.errorFatal.bind(this));
            },

            /*onChangeSoc: function () {

                
                //this.oComponent.getModel("ModoApp").setProperty("/cvent", true);
                this.oComponent.getModel("ModoApp").setProperty("/cclient", true);
                this.oComponent.getModel("ModoApp").refresh(true);

                //Calculamos los centos asociados a la sociedad
                //var bukrs = this.oComponent.getModel("PedidoCab").getData().Bukrs;
                socPed = this.getView().byId("idCSociedad").getSelectedKey();
                nomSoc = this.getView().byId("idCSociedad")._getSelectedItemText();
                this.getView().byId("idArea").setValue(nomSoc);
                vkbur = this.getView().byId("idCSociedad").getSelectedKey();
                //var user = ''  

                var aFilterIds,
                    aFilterValues,
                    aFilters;

                aFilterIds = ["Vkorg"];
                aFilterValues = [socPed];
                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([this.readDataEntity(this.mainService, "/AreaVentasSet", "")]).then(
                    this.buildListAreaVentas.bind(this), this.errorFatal.bind(this));

            },*/

            ObtenerZonas: function (vkbur) {
                //this.oComponent.getModel("ModoApp").setProperty("/cvcan", true);
                //this.oComponent.getModel("ModoApp").refresh(true);

                //vkbur = this.getView().byId("idArea").getSelectedKey();
                //vText = this.getView().byId("idArea")._getSelectedItemText();

                var aFilterIds,
                    aFilterValues,
                    aFilters;

                aFilterIds = ["Vkorg"];
                aFilterValues = [vkbur];
                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([this.readDataEntity(this.mainService, "/ZonaVentasSet", "")]).then(
                    this.buildListZonaVentas.bind(this), this.errorFatal.bind(this));
            },

            onChangeArea: function () {

                this.oComponent.getModel("ModoApp").setProperty("/cclient", true);
                this.oComponent.getModel("ModoApp").refresh(true);

                vkbur = this.getView().byId("idArea").getSelectedKey();
                vText = this.getView().byId("idArea")._getSelectedItemText();

                var aFilterIds,
                    aFilterValues,
                    aFilters;

                aFilterIds = ["Vkorg"];
                aFilterValues = [vkbur];
                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([this.readDataEntity(this.mainService, "/ZonaVentasSet", "")]).then(
                    this.buildListZonaVentas.bind(this), this.errorFatal.bind(this));

            },


            onChangeZona: function () {
                /*var mode = this.oComponent.getModel("ModoApp").getValue();
                mode.cclient = true;
                this.oComponent.getModel("ModoApp").refresh(true);*/
                this.oComponent.getModel("ModoApp").setProperty("/cped", true);
                this.oComponent.getModel("ModoApp").refresh(true);
                Bzirk = this.getView().byId("idzona").getSelectedKey();
                Bztxt = this.getView().byId("idzona")._getSelectedItemText();
                this.TiposPedidoAlta(TipoPed);
                this.OficinaVenta(vkbur, Cvcan, Cvsector);

            },

            onReqProv: function () {
                /*var mode = this.oComponent.getModel("ModoApp").getValue();
                mode.ccontr = true;
                this.oComponent.getModel("ModoApp").refresh(true);*/
                this.oComponent.getModel("ModoApp").setProperty("/ccontr", true);
                this.oComponent.getModel("ModoApp").refresh(true);
            },

            onValHelpReqCliente: function (oEvent) {
                var sInputValue = oEvent.getSource().getValue(),
                    oView = this.getView();

                if (vkbur) {
                    this.oComponent.setModel(new JSONModel(), "acrList");
                    this.oComponent.getModel("FiltrosCli").setProperty("/Bukrs", vkbur);
                    this.oComponent.getModel("FiltrosCli").setProperty("/Kunnr", sInputValue);

                    if (!this._pValueHelpDialog) {
                        this._pValueHelpDialog = Fragment.load({
                            id: oView.getId(),
                            name: "monitorpedidos.fragments.BusqClientes",
                            controller: this
                        }).then(function (oDialog) {
                            oView.addDependent(oDialog);
                            return oDialog;
                        });
                    }
                    this._pValueHelpDialog.then(function (oDialog) {
                        oDialog.open(sInputValue);
                    });
                } else {
                    MessageBox.error(this.oI18nModel.getProperty("noCli"));
                }
            },

            onReqCli: function (oEvent) {
                var cli = oEvent.getParameter("value");

                sap.ui.core.BusyIndicator.show();

                if (vkbur) {
                    var aFilters = [],
                        aFilterIds = [],
                        aFilterValues = [];

                    aFilterIds.push("Kunnr");
                    aFilterValues.push(cli);

                    aFilterIds.push("Bukrs");
                    aFilterValues.push(vkbur);

                    aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                    Promise.all([
                        this.readDataEntity(this.mainService, "/DameClientesSet", aFilters),
                    ]).then(this.buildCliente.bind(this), this.errorFatal.bind(this));


                } else {
                    MessageBox.error(this.oI18nModel.getProperty("noCli"));
                }

                //this.oComponent.getModel("ModoApp").setProperty("/ccontr", true);
                /*var recogetipoped = this.getView().byId("idCTipoPed").getSelectedKey();
                if (recogetipoped == 'ZSER') {
                    this.oComponent.getModel("ModoApp").setProperty("/ccontr", false);
                    this.getView().byId("idcontract").setVisible(true);
 
                }else{
                    this.oComponent.getModel("ModoApp").setProperty("/ccontr", true);
                    this.getView().byId("idcontract").setVisible(true);
                }*/

                this.CanalVentas();
                this.ObtenerZonas();

                //this.oComponent.getModel("ModoApp").setProperty("/cvent", true);
                this.oComponent.getModel("ModoApp").setProperty("/ccont", true);
                this.oComponent.getModel("ModoApp").setProperty("/cvcan", true);

                this.oComponent.getModel("ModoApp").refresh(true);

            },

            buildCliente: function (values) {

                var error = false;

                if (values[0].results) {
                    //nomcli
                    if (values[0].results.length == 0) {
                        MessageBox.error(this.oI18nModel.getProperty("noCli"));
                        error = true;
                    } else if (values[0].results.length > 1) {
                        //univCli
                        MessageBox.warning(this.oI18nModel.getProperty("univCli"));
                        this.oComponent.getModel("PedidoCab").setProperty("/Name1", "");
                        this.oComponent.getModel("PedidoCab").refresh(true);
                    } else if (values[0].results.length == 1) {
                        this.oComponent.getModel("PedidoCab").setProperty("/Name1", values[0].results[0].Name1);
                        this.oComponent.getModel("PedidoCab").setProperty("/Kunnr", values[0].results[0].Kunnr);
                        codcli = values[0].results[0].Kunnr;
                        nomcli = values[0].results[0].Name1;
                        this.oComponent.getModel("PedidoCab").refresh(true);

                        //this.oComponent.getModel("ModoApp").setProperty("/ccont", true);
                        //this.oComponent.getModel("ModoApp").refresh(true);
                        this.DatosCliente(codcli, vkbur);
                        //this.motivopedido(TipoPed, vkbur);-->Cambiaremos el punto donde se llama al mot.

                    }
                }

                sap.ui.core.BusyIndicator.hide();

                this.DameContratosCliente();

            },

            condicionPago: function (codcli, vkbur, Cvcan, Cvsector) {
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);

                aFilterIds.push("Vkorg");
                aFilterValues.push(vkbur);

                aFilterIds.push("Vtweg");
                aFilterValues.push(Cvcan);

                aFilterIds.push("Spart");
                aFilterValues.push(Cvsector);

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.readDataEntity(this.mainService, "/CondicionPagoSet", aFilters),
                ]).then(this.buildCondiciones.bind(this), this.errorFatal.bind(this));

            },

            buildCondiciones: function (values) {
                if (values[0].results) {
                    if (!values[0].results[0].Zterm) {
                        MessageBox.warning(this.oI18nModel.getProperty("ErrCond"));
                    } else {
                        this.oComponent.getModel("ModoApp").setProperty("/Zterm", values[0].results[0].Zterm);
                        this.oComponent.getModel("ModoApp").refresh(true);
                        /*var oModelCondicion = new JSONModel();
                        oModelCondicion.setData(values[0].results);
                        condPago = values[0].results[0].Zterm;
                        this.oComponent.setModel(oModelCondicion, "CondicionPago");*/
                        //this.oComponent.getModel("ContratoCliente").refresh(true);
                    }
                }
            },

            DameContratosCliente: function () {
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Vkorg");
                aFilterValues.push(vkbur);

                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);

                aFilterIds.push("Auart");
                aFilterValues.push(TipoPed);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameContratosSet", aFilters),
                ]).then(this.buildContratos.bind(this), this.errorFatal.bind(this));
            },

            buildContratos: function (values) {
                if (values[0].results) {
                    var oModelContratos = new JSONModel();
                    oModelContratos.setData(values[0].results);
                    this.oComponent.setModel(oModelContratos, "ContratoCliente");
                    this.oComponent.getModel("ContratoCliente").refresh(true);
                }

                //this.DatosCliente(codcli, vkbur);
            },

            onChangeContrato: function (oEvent) {

                numCont = this.getView().byId("idcontract").getSelectedKey();
                nomCont = this.getView().byId("idcontract")._getSelectedItemText();


                this.oComponent.getModel("ModoApp").setProperty("/cped", true);
                this.oComponent.getModel("ModoApp").refresh(true);

                if (!numCont || numCont == undefined) {
                    MessageBox.warning(this.oI18nModel.getProperty("noCont"));

                    this.oComponent.getModel("ModoApp").setProperty("/cvcan", true);
                    this.oComponent.getModel("ModoApp").setProperty("/cvsector", false);
                    this.oComponent.getModel("ModoApp").setProperty("/czona", false);
                    this.oComponent.getModel("ModoApp").setProperty("/cped", false);
                    this.getView().byId("idCanal").setSelectedKey(null);
                    this.getView().byId("idSector").setSelectedKey(null);
                    this.getView().byId("idzona").setSelectedKey(null);
                    this.getView().byId("idCTipoPed").setSelectedKey(null);
                } else {
                    var soli = this.oComponent.getModel("ContratoCliente").getData();
                    for (var i = 0; i < soli.length; i++) {
                        if (soli[i].Vbeln === numCont) {
                            Cvcan = soli[i].Vtweg;
                            Cvsector = soli[i].Spart;
                            Bzirk = soli[i].Bzirk;
                            TipoPed = soli[i].Auart;
                        }

                    }

                    this.condicionPago(codcli, vkbur, Cvcan, Cvsector);
                    this.CanalVentas();
                    this.SectorVentas();
                    this.ObtenerZonas();
                    this.OficinaVenta(vkbur, Cvcan, Cvsector);
                    this.TiposPedidoAlta(TipoPed);

                    this.oComponent.getModel("ModoApp").setProperty("/cvcan", false);
                    this.oComponent.getModel("ModoApp").setProperty("/cvsector", false);
                    this.oComponent.getModel("ModoApp").setProperty("/czona", false);

                    this.getView().byId("idCanal").setSelectedKey(Cvcan);
                    this.getView().byId("idSector").setSelectedKey(Cvsector);
                    this.getView().byId("idzona").setSelectedKey(Bzirk);
                }
            },

            _getDialogPedContrato: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogOptionsContrato) {
                    this.pDialogOptionsContrato = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.PosicionesContrato",
                        controller: this,
                    }).then(function (oDialogOptionsContrato) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialogOptionsContrato);
                        return oDialogOptionsContrato;
                    });
                }
                this.pDialogOptionsContrato.then(function (oDialogOptionsContrato) {
                    oDialogOptionsContrato.open(sInputValue);
                });

                //this.oComponent.setModel(this.oComponent.getModel("PedidoPosContrato"), "ModoApp");
            },

            onNavAltaContrato: function () {

                //this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", TipoPed);
                this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", ClasePed);
                ClasePed = "";
                this.oComponent.getModel("ModoApp").setProperty("/SocPed", socPed);
                //this.oComponent.getModel("ModoApp").setProperty("/NomSoc", nomSoc);
                this.oComponent.getModel("ModoApp").setProperty("/NomSoc", vText);
                this.oComponent.getModel("ModoApp").setProperty("/Vkbur", vkbur);
                this.oComponent.getModel("ModoApp").setProperty("/Vtext", vText);
                this.oComponent.getModel("ModoApp").setProperty("/CvCanal", Cvcan);
                this.oComponent.getModel("ModoApp").setProperty("/CvSector", Cvsector);
                this.oComponent.getModel("ModoApp").setProperty("/Bzirk", Bzirk);
                this.oComponent.getModel("ModoApp").setProperty("/Bztxt", Bztxt);
                this.oComponent.getModel("ModoApp").setProperty("/Codcli", codcli);
                this.oComponent.getModel("ModoApp").setProperty("/Nomcli", nomcli);
                this.oComponent.getModel("ModoApp").setProperty("/Numcont", numCont);
                this.oComponent.getModel("ModoApp").setProperty("/Nomcont", nomCont);
                this.oComponent.getModel("ModoApp").setProperty("/CondPago", condPago);
                //this.oComponent.setModel(new JSONModel([]), "Adjuntos");
                //this.oComponent.setModel(new JSONModel(), "datosAdj");

                // Obtener las posiciones marcadas en el contrato
                /*var aSelectedItems = this.getView().byId("TablaPosicionesContrato").getSelectedIndices();
                var aSelectedData = [];
                
                // Recorrer los elementos seleccionados y obtener los datos correspondientes
                for (var i = 0; i < aSelectedItems.length; i++) {
                    
                }
                aSelectedItems.forEach(function(oItem) {
                    var oContext = oItem.getBindingContext();
                    var oData = oContext.getObject();
                    aSelectedData.push(oData);
                });

                this.oComponent.getModel("PedidoPos").setData(aSelectedData); */

                var oTable = this.getView().byId("TablaPosicionesContrato");
                /*var t_indices = oTable.getBinding().aIndices;

                //this.oComponent.setModel(this.oComponent.getModel("PedidoPosContrato"), "PedidoPosContrato_Aux");

                var aContexts = oTable.getSelectedIndices();
                var items = aContexts.map(function (c) {
                    //return c.getObject();
                    return this.oComponent.getModel("PedidoPosContrato_Aux").getProperty("/" + t_indices[c]);
                }.bind(this));                
                var results_array = items;
                var posnr_ItmNumber;
                for (var i = 0; i < results_array.length; i++) {
                    //results_array[i].Posnr = String((i+1) * 10).padStart(6, '0'); // establecer el formato de SAP 000000
                    posnr_ItmNumber = (i+1) * 10;
                    results_array[i].Posnr = posnr_ItmNumber;
                    results_array[i].ItmNumber = posnr_ItmNumber;
                }*/
                //var oTable = this.getView().byId("myTable");
                var aSelectedIndices = oTable.getSelectedIndices();
                var pedidosContrato = this.oComponent.getModel("PedidoPosContrato").getData();
                var pedidosContrato_Aux = JSON.parse(JSON.stringify(pedidosContrato)); // Copy data model without references
                var results_array = [];
                var posnr_ItmNumber;

                for (var i = 0; i < aSelectedIndices.length; i++) {
                    var indice = aSelectedIndices[i];
                    var posicionPed = pedidosContrato_Aux[indice];
                    posnr_ItmNumber = (i + 1) * 10;
                    //posicionPed.Posnr = posnr_ItmNumber;
                    posicionPed.ItmNumber = posnr_ItmNumber;
                    results_array.push(posicionPed);
                }
                //console.log(results_array);

                this.oComponent.getModel("PedidoPos").setData(results_array);
                //this.oComponent.getModel("posPedFrag").setData(results_array);
                //this.oComponent.getModel("PedidoPos").setData(aSelectedData);
                this.oComponent.getModel("ModoApp").refresh(true);

                this.NIApedido(codcli, vkbur);
                //this.DIRpedido(codcli, vkbur);
                /* this.OrganoGestor(codcli, vkbur);
                 this.UnidadTramitadora(codcli, vkbur);
                 this.OficinaContable(codcli, vkbur);
                 this.CodigoAdmon(codcli, vkbur);
                 this.Plataformapedido(codcli, vkbur);*/
                this.DameMonedas();

                /**
                 * Cuando ya navegamos al alta debe de borrar todos los campos de opciones 
                 * para que cuando se entre de nuevo aparezcan vacios para crear una nueva peticion
                 */
                this.getView().byId("idCTipoPed").setSelectedKey(null);
                //this.getView().byId("idCSociedad").setSelectedKey(null);
                this.getView().byId("idArea").setSelectedKey(null);
                this.getView().byId("idCanal").setSelectedKey(null);
                this.getView().byId("idSector").setSelectedKey(null);
                this.getView().byId("idzona").setSelectedKey(null);
                this.getView().byId("idCCliente").setValue(null);
                this.getView().byId("descrProv").setValue(null);
                this.getView().byId("idcontract").setSelectedKey(null);

                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteAltaPedidos");
            },

            CloseOptionsDiagContrato: function () {
                this.byId("OptionDialContrato").close();
            },

            CloseOptionsDiag: function () {
                this.getView().byId("idCTipoPed").setSelectedKey(null);
                //this.getView().byId("idCSociedad").setSelectedKey(null);
                this.getView().byId("idArea").setSelectedKey(null);
                this.getView().byId("idCanal").setSelectedKey(null);
                this.getView().byId("idSector").setSelectedKey(null);
                this.getView().byId("idzona").setSelectedKey(null);
                this.getView().byId("idCCliente").setValue(null);
                this.getView().byId("idcontract").setSelectedKey(null);
                this.getView().byId("idcontract").setVisible(true);
                this.byId("OptionDial").close();
            },

            buildListAreaVentas: function (values) {
                if (values[0].results) {
                    var oModelListAreaVentas = new JSONModel();
                    oModelListAreaVentas.setData(values[0].results);
                    //                    var AreaVenta = values[0].results[0].Vkorg;
                    this.oComponent.setModel(oModelListAreaVentas, "AreaVentas");


                }

            },

            buildListZonaVentas: function (values) {
                if (values[0].results) {
                    var oModelListZonaVentas = new JSONModel();
                    oModelListZonaVentas.setData(values[0].results);
                    this.oComponent.setModel(oModelListZonaVentas, "ZonaVentas");
                    //this.motivopedido(TipoPed, vkbur);
                }
                //this.CanalVentas();

            },

            CanalVentas: function () {
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Vkorg");
                aFilterValues.push(vkbur);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.readDataEntity(this.mainService, "/CanalVentasSet", aFilters),
                ]).then(this.buildCanales.bind(this), this.errorFatal.bind(this));
            },

            buildCanales: function (values) {
                if (values[0].results) {
                    var oModelListCanalVentas = new JSONModel();
                    oModelListCanalVentas.setData(values[0].results);
                    this.oComponent.setModel(oModelListCanalVentas, "CanalVentas");
                }
            },

            onChangeCanal: function () {
                this.oComponent.getModel("ModoApp").setProperty("/cvsector", true);
                this.oComponent.getModel("ModoApp").refresh(true);
                Cvcan = this.getView().byId("idCanal").getSelectedKey();
                this.SectorVentas();
            },

            SectorVentas: function () {
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Vkorg");
                aFilterValues.push(vkbur);
                aFilterIds.push("Vtweg");
                aFilterValues.push(Cvcan);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.readDataEntity(this.mainService, "/SectorVentasSet", aFilters),
                ]).then(this.buildSectores.bind(this), this.errorFatal.bind(this));
            },

            buildSectores: function (values) {
                if (values[0].results) {
                    var oModelListSectorVentas = new JSONModel();
                    oModelListSectorVentas.setData(values[0].results);
                    this.oComponent.setModel(oModelListSectorVentas, "SectorVentas");
                }
                //this.oComponent.getModel("ModoApp").setProperty("/cvcan", true);
                //this.oComponent.getModel("ModoApp").refresh(true);

            },

            onChangeSector: function () {
                this.oComponent.getModel("ModoApp").setProperty("/czona", true);
                this.oComponent.getModel("ModoApp").refresh(true);
                Cvsector = this.getView().byId("idSector").getSelectedKey();
                //this.OficinaVenta(vkbur, Cvcan, Cvsector);
                //this.ObtenerZonas(vkbur);
            },

            OficinaVenta: function (vkbur, Cvcan, Cvsector) {

                var aFilterIds, aFilterValues, aFilters;

                //FILTRADO DE OFICINAS////////////////////////////////////////////////////////////////////////////////////////////

                aFilterIds = [
                    "Vkorg",
                    "Vtweg",
                    "Spart"
                ];
                aFilterValues = [
                    vkbur,
                    Cvcan,
                    Cvsector
                ];

                if (vkbur == "") {
                    var i = aFilterIds.indexOf("Vkorg");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Cvcan == "") {
                    var i = aFilterIds.indexOf("Vtweg");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Cvsector == "") {
                    var i = aFilterIds.indexOf("Spart");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameOficinasSet", aFilters),
                ]).then(this.buildModelOfVentas.bind(this), this.errorFatal.bind(this));
            },

            buildModelOfVentas: function (values) {
                if (values[0].results) {
                    var oModelOfVentas = new JSONModel();
                    oModelOfVentas.setData(values[0].results);
                    this.oComponent.setModel(oModelOfVentas, "OficinaVenta");
                    this.oComponent.getModel("OficinaVenta").refresh(true);
                }
            },

            onNavAlta: function () {

                if (numCont) {
                    var that = this;
                    const oI18nModel = this.oComponent.getModel("i18n");

                    var aFilterIds, aFilterValues, aFilters;

                    aFilterIds = ["Vbeln"];
                    aFilterValues = [numCont];

                    aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                    Promise.all([
                        this.mainService.read("/SolicitudSet", {
                            filters: aFilters,
                            urlParameters: {
                                $expand: [
                                    //"SolicitudCli_A",
                                    "SolicitudAdjunto_A",
                                    "SolicitudPed_A",
                                    "SolicitudMod_A"
                                ],
                            },
                            success: function (data, response) {
                                if (data) {
                                    var oModelDisplay = new JSONModel();
                                    var oModelSolicitud_Ped = new JSONModel();
                                    var SolicitudPed_A = [],
                                        SolicitudHistorial_A = [];

                                    that.oComponent.setModel(new JSONModel([]), "PedidoPosContrato");
                                    that.oComponent.setModel(new JSONModel([]), "PedidoPos");


                                    if (data.results[0].Erdat) {
                                        var today1 = data.results[0].Erdat;
                                        var fechai = today1.getFullYear() + '-' + ("0" + (today1.getMonth() + 1)).slice(-2) + '-' + ("0" + today1.getDate()).slice(-2);
                                        data.results[0].Erdat = fechai;
                                    }

                                    oModelDisplay.setData(data.results[0]);
                                    that.oComponent.setModel(oModelDisplay, "DisplayPEP");

                                    if ((that.modoapp === "D" || that.modoapp === "C") &&
                                        data.results[0].SolicitudAdjunto_A.results.length > 0) {
                                        var oModAdj = new JSONModel();
                                        var adjs = [],
                                            adj;
                                        data.results[0].SolicitudAdjunto_A.results.forEach(function (el) {
                                            var url;
                                            url = "";
                                            /*data.results[0].AdjuntoSHPSet.results.forEach(function (elshp) {
                                                if (el.Descripcion == elshp.Descriptivo && el.Documento == elshp.Adjunto) {
                                                    url = elshp.Url;
                                                }
                                            });*/
                                            adj = {
                                                Filename: el.Filename,
                                                Descripcion: el.Descripcion,
                                                URL: url
                                            };
                                            adjs.push(adj);
                                        });

                                        oModAdj.setData(adjs);
                                        that.oComponent.setModel(new JSONModel(), "datosAdj");
                                        that.oComponent.setModel(oModAdj, "Adjuntos");
                                    } else {
                                        that.oComponent.setModel(new JSONModel(), "datosAdj");
                                        that.oComponent.setModel(new JSONModel([]), "Adjuntos");
                                    }

                                    SolicitudHistorial_A = data.results[0].SolicitudMod_A;

                                    if (SolicitudHistorial_A.results.length > 0) {
                                        var oModHist = new JSONModel();
                                        var historial = SolicitudHistorial_A.results;

                                        /* historial.results.forEach(function (el) {
                                             if (condition) {
     
                                             }
                                         });*/
                                        oModHist.setData(SolicitudHistorial_A.results);
                                        that.oComponent.setModel(oModHist, "HistorialSol");

                                    } else {
                                        that.oComponent.setModel(new JSONModel(), "HistorialSol");
                                    }

                                    SolicitudPed_A = data.results[0].SolicitudPed_A

                                    for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                        var sreturn = "";
                                        sreturn = SolicitudPed_A.results[i].Netwr;
                                        SolicitudPed_A.results[i].Netwr = sreturn;
                                        //SolicitudPed_A.results[i].Ykostl = that.oComponent.getModel("DisplayPEP").getProperty("/Yykostkl");
                                        //SolicitudPed_A.results[i].Yaufnr = that.oComponent.getModel("DisplayPEP").getProperty("/Yyaufnr");
                                        SolicitudPed_A.results[i].Ykostl = SolicitudPed_A.results[i].Yykostkl;
                                        SolicitudPed_A.results[i].Yaufnr = SolicitudPed_A.results[i].Yyaufnr;

                                        var posnr_ItmNumber = parseInt(SolicitudPed_A.results[i].Posnr);
                                        //SolicitudPed_A.results[i].Posnr = posnr_ItmNumber;
                                        SolicitudPed_A.results[i].ItmNumber = posnr_ItmNumber;

                                        SolicitudPed_A.results[i].SalesUnit = SolicitudPed_A.results[i].Meins;
                                        SolicitudPed_A.results[i].Material = SolicitudPed_A.results[i].Matnr;
                                        SolicitudPed_A.results[i].ShortText = SolicitudPed_A.results[i].Arktx;
                                        SolicitudPed_A.results[i].ReqQty = SolicitudPed_A.results[i].Kpein;
                                        SolicitudPed_A.results[i].Currency = SolicitudPed_A.results[i].Waerk;
                                        SolicitudPed_A.results[i].CondValue = SolicitudPed_A.results[i].Netwr;
                                    }

                                    //for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                    //    Totalizado += parseFloat(SolicitudPed_A.results[i].Netwr);
                                    //}

                                    oModelSolicitud_Ped.setData(SolicitudPed_A);
                                    that.oComponent.getModel("PedidoPosContrato").setData(oModelSolicitud_Ped.getData().results);
                                    that.oComponent.setModel(that.oComponent.getModel("PedidoPosContrato"), "DisplayPosPed");
                                    //that.oComponent.setModel(PedidoPos, "DisplayPosPed");



                                    /*aFilterIdsCli.push("Kunnr");
                                    aFilterValuesCli.push(data.results[0].Kunnr);
     
                                    aFilterIdsCli.push("Bukrs");
                                    aFilterValuesCli.push(data.results[0].Vkorg);
     
     
                                    aFiltersCli = Util.createSearchFilterObject(aFilterIdsCli, aFilterValuesCli);
                                    */
                                    //that.DatosAux(numCont);
                                    //that.motivopedido(data.results[0].Auart, data.results[0].Vkorg);
                                    //that.condicionPago(data.results[0].Kunnr, data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                    //that.DatosCliente(data.results[0].Kunnr, data.results[0].Vkorg);
                                    //that.OficinaVenta(data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                    that.NIApedido(data.results[0].Kunnr, data.results[0].Vkorg);

                                    //this.DIRpedido(codcli, vkbur);
                                    that.OrganoGestor(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                    that.UnidadTramitadora(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                    that.OficinaContable(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                    that.CodigoAdmon(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                    that.Plataformapedido(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                    that.DameMonedas();

                                    var title = oI18nModel.getProperty("detSolPCon") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().Vbeln).slice(-10);
                                    that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                                    that.oComponent.getModel("DisplayPEP").setProperty("/param", false);

                                    /*
                                    //Boton de CRUD
                                    var button, modAdj;
     
                                    if (that.modoapp === "D") {
                                        button = oI18nModel.getProperty("grabMod");
     
                                        if (data.results[0].ZdatePs !== '') {
                                            modAdj = false;
                                        }
                                    }
                                    
                                    var config = {
                                        buttCRUD: button,
                                        modAdj: modAdj,
                                        mode: that.modoapp
     
                                    };
     
                                    var oModConfig = new JSONModel();
                                    oModConfig.setData(config);
     
                                    //that.oComponent.setModel(oModConfig, "ModoApp");
    
                                    that.oComponent.getModel("ModoApp").setProperty("/Clasepedido", that.oComponent.getModel("DisplayPEP").getProperty("/Auart"));
                                    that.oComponent.getModel("ModoApp").setProperty("/Vtext", that.oComponent.getModel("DisplayPEP").getProperty("/Spart"));
                                    that.oComponent.getModel("ModoApp").setProperty("/CvCanal", that.oComponent.getModel("DisplayPEP").getProperty("/Vtweg"));
                                    that.oComponent.getModel("ModoApp").setProperty("/CvSector", that.oComponent.getModel("DisplayPEP").getProperty("/Spart"));
                                    that.oComponent.getModel("ModoApp").setProperty("/NomSoc", that.oComponent.getModel("DisplayPEP").getProperty("/Bukrs"));
                                    that.oComponent.getModel("ModoApp").setProperty("/Nomcli", that.oComponent.getModel("DisplayPEP").getProperty("/Kunnr"));
                                    that.oComponent.setModel(new JSONModel([]), "PedidoPos");
                                    
                                    for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                        that.oComponent.getModel("PedidoPos").setProperty("/ItmNumber", SolicitudPed_A.results[i].Posnr);
                                        that.oComponent.getModel("PedidoPos").setProperty("/Material", SolicitudPed_A.results[i].Matnr);
                                        that.oComponent.getModel("PedidoPos").setProperty("/ShortText", SolicitudPed_A.results[i].Arktx);
                                        that.oComponent.getModel("PedidoPos").setProperty("/ReqQty", SolicitudPed_A.results[i].Kpein);
                                        that.oComponent.getModel("PedidoPos").setProperty("/SalesUnit", SolicitudPed_A.results[i].Meins);
                                        that.oComponent.getModel("PedidoPos").setProperty("/CondValue", SolicitudPed_A.results[i].Netwr);
                                        that.oComponent.getModel("PedidoPos").setProperty("/Currency", SolicitudPed_A.results[i].Waerk);
                                        that.oComponent.getModel("PedidoPos").setProperty("/Ykostl", that.oComponent.getModel("DisplayPEP").getProperty("/Yykostkl"));
                                        that.oComponent.getModel("PedidoPos").setProperty("/Yaufnr", that.oComponent.getModel("DisplayPEP").getProperty("/Yyaufnr"));
                                        that.oComponent.getModel("PedidoPos").refresh(true);
                                        
                                    }*/

                                    //that.oComponent.getModel("PedidoPos").setData(that.oComponent.getModel("DisplayPosPed").getData());


                                }
                                if (response) {
                                    //var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                                    //oRouter.navTo("RouteAltaPedidos");
                                    //that.oComponent.getModel("PedidoPosContrato").setProperty("/Contador", SolicitudPed_A.results.length);
                                    that._getDialogPedContrato();
                                }
                            },
                        }),
                    ]);
                } else {

                    var modeApp = this.oComponent.getModel("ModoApp").getData().mode; //RECOGEMOS EL MODO EN QUE VIENE
                    //this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", TipoPed);
                    this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", ClasePed);
                    ClasePed = "";
                    this.oComponent.getModel("ModoApp").setProperty("/SocPed", socPed);
                    this.oComponent.getModel("ModoApp").setProperty("/NomSoc", vText);
                    this.oComponent.getModel("ModoApp").setProperty("/Vkbur", vkbur);
                    this.oComponent.getModel("ModoApp").setProperty("/Vtext", vText);
                    this.oComponent.getModel("ModoApp").setProperty("/CvCanal", Cvcan);
                    this.oComponent.getModel("ModoApp").setProperty("/CvSector", Cvsector);
                    this.oComponent.getModel("ModoApp").setProperty("/Bzirk", Bzirk);
                    this.oComponent.getModel("ModoApp").setProperty("/Bztxt", Bztxt);
                    this.oComponent.getModel("ModoApp").setProperty("/Codcli", codcli);
                    this.oComponent.getModel("ModoApp").setProperty("/Nomcli", nomcli);
                    this.oComponent.getModel("ModoApp").setProperty("/Numcont", numCont);
                    this.oComponent.getModel("ModoApp").setProperty("/Nomcont", nomCont);
                    this.oComponent.getModel("ModoApp").setProperty("/CondPago", condPago);
                    this.oComponent.setModel(new JSONModel([]), "Adjuntos");
                    this.oComponent.setModel(new JSONModel(), "datosAdj");
                    if (modeApp === 'C') {
                        this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", 0);
                        this.oComponent.getModel("PedidoCab").setProperty("/Moneda", 'EUR');
                    }


                    const oI18nModel = this.oComponent.getModel("i18n");
                    var title = oI18nModel.getProperty("detSolP");
                    if (!this.oComponent.getModel("DisplayPEP"))
                        this.oComponent.setModel(new JSONModel(), "DisplayPEP")
                    this.oComponent.getModel("DisplayPEP").setProperty("/Title", title);

                    this.oComponent.getModel("ModoApp").refresh(true);
                    var vbeln = "";

                    this.NIApedido(codcli, vkbur);
                    //this.DIRpedido(codcli, vkbur);
                    this.OrganoGestor(codcli, vkbur, vbeln);
                    this.UnidadTramitadora(codcli, vkbur, vbeln);
                    this.OficinaContable(codcli, vkbur, vbeln);
                    this.CodigoAdmon(codcli, vkbur, vbeln);
                    this.Plataformapedido(codcli, vkbur, vbeln);
                    this.DameMonedas();

                    /**
                     * Cuando ya navegamos al alta debe de borrar todos los campos de opciones 
                     * para que cuando se entre de nuevo aparezcan vacios para crear una nueva peticion
                     */
                    this.getView().byId("idCTipoPed").setSelectedKey(null);
                    //this.getView().byId("idCSociedad").setSelectedKey(null);
                    this.getView().byId("idArea").setSelectedKey(null);
                    this.getView().byId("idCanal").setSelectedKey(null);
                    this.getView().byId("idSector").setSelectedKey(null);
                    this.getView().byId("idzona").setSelectedKey(null);
                    this.getView().byId("idCCliente").setValue(null);
                    this.getView().byId("descrProv").setValue(null);
                    this.getView().byId("idcontract").setSelectedKey(null);
                    this.getView().byId("idcontract").setVisible(true);

                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("RouteAltaPedidos");
                }
            },

            motivopedido: function (TipoPed, AreaVenta) {
                //var Auart = this.getOwnerComponent().getModel("ModoApp").getData().Tipopedido;
                //var Vkorg = this.getOwnerComponent().getModel("ModoApp").getData().Vkbur; //Vkbur es la organiz. ventas en ModoApp
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Auart");
                aFilterValues.push(TipoPed);
                aFilterIds.push("Vkorg");
                aFilterValues.push(AreaVenta);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


                Promise.all([
                    this.readDataEntity(this.mainService, "/MotivosPedidoSet", aFilters),
                ]).then(this.buildMotivo.bind(this), this.errorFatal.bind(this));

            },

            DatosAux: function (vbeln) {
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Vbeln");
                aFilterValues.push(vbeln);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


                Promise.all([
                    this.readDataEntity(this.mainService, "/DatosAuxSet", aFilters),
                ]).then(this.buildDatosAux.bind(this), this.errorFatal.bind(this));
            },

            buildDatosAux: function (values) {
                if (values[0].results) {
                    this.oComponent.getModel("ModoApp").setProperty("/NomSoc", values[0].results[0].Vtext);
                    this.oComponent.getModel("ModoApp").setProperty("/Bztxt", values[0].results[0].Bztxt);
                    this.oComponent.getModel("ModoApp").setProperty("/Bzirk", values[0].results[0].Bzirk);
                    this.oComponent.getModel("ModoApp").refresh(true);
                }
            },

            oncancelaprobaciones: function () {
                /*this.pDialogAprobaciones.then(function (oDialogAprobaciones) {
                    oDialogAprobaciones.close();
                });*/
                this.byId("ApprovDial").close();
            },

            oncancelliberacion: function () {
                this.byId("LiberacionDial").close();
            },


            buildMotivo: function (values) {
                if (values[0].results) {
                    var oModelMotivo = new JSONModel();
                    oModelMotivo.setData(values[0].results);
                    this.oComponent.setModel(oModelMotivo, "listadoMotivo");
                    this.oComponent.getModel("listadoMotivo").refresh(true);
                }
            },

            onAprobacion: function (oEvent) {
                const oI18nModel = this.oComponent.getModel("i18n");
                var oTable = this.getView().byId("a_idTablePEPs");
                var t_indices = oTable.getBinding().aIndices;

                var aContexts = oTable.getSelectedIndices();
                var items = aContexts.map(function (c) {
                    //return c.getObject();
                    return this.oComponent.getModel("listadoSolicitudes").getProperty("/" + t_indices[c]);
                }.bind(this));


                var results_array = items;
                var DatosAprobaciones = [];
                var obj = {};
                var accion = "A";


                var that = this;

                for (var i = 0; i < results_array.length; i++) {

                    obj = {
                        Accion: accion,
                        Solicitud: results_array[i].IDSOLICITUD
                    };
                    DatosAprobaciones.push(obj);
                    obj = {};
                }

                var msg = oI18nModel.getProperty("SolAprob");
                var msgLog = "";

                MessageBox.warning(msg, {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction == 'OK') {
                            var json1 = {
                                Accion: accion,
                                AprobarSet: DatosAprobaciones,
                                RespAprobSet: []
                            }
                            sap.ui.core.BusyIndicator.show();
                            that.mainService.create("/AprobarSet", json1, {
                                success: function (result) {
                                    if (result.AprobarSet.results[0].Solicitud) {
                                        sap.ui.core.BusyIndicator.hide();
                                        oTable.clearSelection();
                                        if (result.RespAprobSet.results.length > 1) {
                                            for (var i = 0; i < result.RespAprobSet.results.length; i++) {
                                                msgLog += result.RespAprobSet.results[i].TextoLog + "\r\n";
                                            }

                                            sap.m.MessageToast.show(msgLog);
                                            that.byId("ApprovDial").close();
                                        } else {
                                            MessageBox.show(result.RespAprobSet.results[0].TextoLog);
                                            that.byId("ApprovDial").close();
                                        }

                                    }
                                },
                                error: function (err) {
                                    sap.m.MessageBox.error("Solicitud no Aprobada.", {
                                        title: "Error",
                                        initialFocus: null,
                                    });
                                    oTable.clearSelection();
                                    sap.ui.core.BusyIndicator.hide();
                                },
                                async: true,
                            });
                        } else {
                            oTable.clearSelection();
                        }
                    }
                });

            },

            OnRechazo: function (oEvent) {
                const oI18nModel = this.oComponent.getModel("i18n");
                var oTable = this.getView().byId("a_idTablePEPs");
                var t_indices = oTable.getBinding().aIndices;
                var aContexts = oTable.getSelectedIndices();
                var items = aContexts.map(function (c) {
                    //return c.getObject();
                    return this.oComponent.getModel("listadoSolicitudes").getProperty("/" + t_indices[c]);
                }.bind(this));


                var results_array = items;
                var Datosrechazo = [];
                var obj = {};
                var accion = "R";


                var that = this;

                /*for (var i = 0; i < results_array.length; i++) {
 
                    obj = {
                        Accion: accion,
                        Solicitud: results_array[i].IDSOLICITUD
                    };
                    Datosrechazo.push(obj);
                    obj = {};
                }*/



                //sap.ui.core.BusyIndicator.show();

                var msg = oI18nModel.getProperty("SolRechz");
                var msgRechz = "";

                /*this.mainService.create("/AccionRechazarSet", json1, {
                    success: function (result) {
                        if (result.FicheroAprobacion) {
                            sap.ui.core.BusyIndicator.hide(); 
                            MessageBox.show(LogAprobacion.TextoLog);  
                        }
                    },
                    error: function (err) {
                        sap.m.MessageBox.error("Solicitud no Rechazada.", {
                            title: "Error",
                            initialFocus: null,
                        });
                        oTable.clearSelection();
                        sap.ui.core.BusyIndicator.hide();
                    },
                    async: true,
                });*/
                /*MessageBox.warning(msg, {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                        emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction == 'OK') {
                            var json1 = {
                                Accion: accion,
                                AccionAprobarSet: DatosAprobaciones,
                                FicheroAprobacion: []
                            }
                            //sap.ui.core.BusyIndicator.show();
                            that.mainService.create("/AccionRechazarSet", json1, {
                                success: function (result) {
                                    if (result.LiberarSet.results[0].Solicitud) {
                                       // sap.ui.core.BusyIndicator.hide(); 
                                        //MessageBox.show(result.LiberacionRespuesta.TextoLog);  
                                        oTable.clearSelection();
                                    }
                                    //oTable.clearSelection();
                                    //sap.ui.core.BusyIndicator.hide(); 
                                },
                                error: function (err) {
                                    sap.ui.core.BusyIndicator.hide(); 
                                    sap.m.MessageBox.error("Solicitud no Rechazada.", {
                                        title: "Error",
                                        initialFocus: null,
                                    });
                                    oTable.clearSelection();
                                    //sap.ui.core.BusyIndicator.hide();
                                },
                                async: true,
                            });
                            oTable.clearSelection();
                        } else {
                            oTable.clearSelection();
                        }
                    }
                });*/

                if (!this.oConfirmDialog) {
                    this.oConfirmDialog = new sap.m.Dialog({
                        type: sap.m.DialogType.Message,
                        title: msg,
                        content: [
                            new sap.ui.layout.HorizontalLayout({
                                content: [
                                    new sap.m.Label({
                                        text: "Motivo Rechazo",
                                        labelFor: "submissionNote"
                                    }),
                                    new sap.m.ComboBox({
                                        id: "idCbRechazo",
                                        width: "120px",
                                        items: [
                                            new sap.ui.core.ListItem({
                                                key: "",
                                                text: ""
                                            }),
                                            new sap.ui.core.ListItem({
                                                key: "ZN",
                                                text: "Rechazo definitivo"
                                            }),
                                            new sap.ui.core.ListItem({
                                                key: "ZR",
                                                text: "Modificación de pedido necesaria"
                                            }),
                                        ]
                                    }),
                                ]
                            }),
                            new sap.m.TextArea("confirmationNote", {
                                width: "100%",
                                id: "idTxtRechazo",
                                placeholder: "Añadir texto Rechazo (opcional)"
                            })
                        ],
                        beginButton: new sap.m.Button({
                            type: sap.m.ButtonType.Emphasized,
                            text: "Submit",
                            press: function () {
                                //var sText = Core.byId("confirmationNote").getValue();
                                //MessageToast.show("Note is: " + sText);
                                var oComboBox = that.oConfirmDialog.mAggregations.content[0].mAggregations.content[1].sId;
                                var oTextArea = that.oConfirmDialog.mAggregations.content[1].mProperties.value;
                                if (oComboBox) {
                                    var selectedKey = that.oConfirmDialog.mAggregations.content[0].mAggregations.content[1].mProperties.selectedKey;
                                    //console.log("Selected Key:", selectedKey);
                                }

                                for (var i = 0; i < results_array.length; i++) {

                                    obj = {
                                        Accion: accion,
                                        Motivo: selectedKey,
                                        Texto: oTextArea,
                                        Solicitud: results_array[i].IDSOLICITUD
                                    };
                                    Datosrechazo.push(obj);
                                    obj = {};
                                }


                                var json1 = {
                                    Accion: accion,
                                    RechazarSet: Datosrechazo,
                                    RespRechazoSet: []
                                }
                                that.mainService.create("/RechazarSet", json1, {
                                    success: function (result) {
                                        if (result.RechazarSet.results[0].Solicitud) {
                                            sap.ui.core.BusyIndicator.hide();
                                            oTable.clearSelection();
                                            if (result.RechazarSet.results.length > 1) {
                                                for (var i = 0; i < result.RespRechazoSet.results.length; i++) {
                                                    msgRechz += result.RespRechazoSet.results[i].TextoLog + "\r\n";
                                                }
                                                sap.m.MessageToast.show(msgRechz);
                                                that.oConfirmDialog.destroyContent();
                                                //oComboBox.setSelectedKey(null);
                                                //oTextArea.setValue('');
                                                that.byId("ApprovDial").close();

                                            } else {
                                                MessageBox.show(result.RespRechazoSet.results[0].TextoLog);
                                                that.oConfirmDialog.destroyContent();
                                                that.byId("ApprovDial").close();
                                            }
                                        }
                                    }
                                });
                                this.oConfirmDialog.close();
                            }.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: "Cancel",
                            press: function () {
                                this.oConfirmDialog.close();
                            }.bind(this)
                        })
                    });
                }

                this.oConfirmDialog.open();
            },

            onLiberacion: function (oEvent) {
                const oI18nModel = this.oComponent.getModel("i18n");
                var oTable = this.getView().byId("b_idTablePEPs");
                var t_indices = oTable.getBinding().aIndices;

                var aContexts = oTable.getSelectedIndices();
                var items = aContexts.map(function (c) {
                    //return c.getObject();
                    return this.oComponent.getModel("listadoSolicitudes").getProperty("/" + t_indices[c]);
                }.bind(this));


                var results_array = items;
                var DatosLiberaciones = [];
                var LiberacionRespuesta = [];
                var obj = {};
                var accion = "L";


                var that = this;

                for (var i = 0; i < results_array.length; i++) {

                    obj = {
                        Accion: accion,
                        Solicitud: results_array[i].IDSOLICITUD
                    };
                    DatosLiberaciones.push(obj);
                    obj = {};
                }

                var msg = oI18nModel.getProperty("SolLiber");
                var msgLog = "";

                MessageBox.warning(msg, {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction == 'OK') {
                            var json1 = {
                                Accion: accion,
                                LiberarSet: DatosLiberaciones,
                                LiberacionRespuesta: []
                            }
                            sap.ui.core.BusyIndicator.show();
                            that.mainService.create("/LiberarSet", json1, {
                                success: function (result) {
                                    if (result.LiberarSet.results[0].Solicitud) {
                                        sap.ui.core.BusyIndicator.hide();
                                        //MessageBox.show(result.LiberacionRespuesta.TextoLog);  
                                        oTable.clearSelection();
                                        if (result.LiberacionRespuesta.results.length > 1) {
                                            for (var i = 0; i < result.LiberacionRespuesta.results.length; i++) {
                                                msgLog += result.LiberacionRespuesta.results[i].TextoLog + "\r\n";
                                            }

                                            sap.m.MessageToast.show(msgLog);
                                            that.byId("LiberacionDial").close();
                                        } else {
                                            MessageBox.show(result.LiberacionRespuesta.results[0].TextoLog);
                                            that.byId("LiberacionDial").close();
                                        }
                                    }
                                    //oTable.clearSelection();
                                    //sap.ui.core.BusyIndicator.hide(); 
                                },
                                error: function (err) {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageBox.error("Solicitud no Liberada.", {
                                        title: "Error",
                                        initialFocus: null,
                                    });
                                    oTable.clearSelection();
                                    sap.ui.core.BusyIndicator.hide();
                                },
                                async: true,
                            });
                        } else {
                            oTable.clearSelection();
                        }
                    }
                });

            },

            onGoToZpv: function () {
                //var numFact = this.getView().byId("f_numfac").getValue();
                var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                var hashUrl = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "ZPV",
                        action: "cargaExcel"
                    },
                    //params : { "Vbelb" : numFact}
                }));
                oCrossAppNavigator.toExternal({
                    target: {
                        shellHash: hashUrl
                    }
                });
            },

            //LÓGICA PARA LOS DIFERENTES MENU ITEMS QUE SE CREEN

            onGetKeyFromItemMenu: function (oEvent) {
                //console.log(oEvent.getSource().getProperty("key"));
                var selectedKey = oEvent.getSource().getProperty("key");

                switch (selectedKey) {

                    case "CrearCliente":
                        this.onNavToCrearCliente(oEvent);
                        break;

                    case "CargaPedidos":
                        this.onGoToZpv();
                        break;

                };

                /* #### ALTA DE CLIENTES ##### */
                //METODOS PARA LA ALTA DE CLIENTES

            },
            onNavToCrearCliente: function (oEvent) {
                this._getDialogAltaCliente(oEvent);

            },



            _getDialogAltaCliente: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogCliente) {
                    this.pDialogCliente = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.AltaClienteOption",
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

            CloseClientDialog: function () {

                this.byId("OptionDialogCliente").close();
            },

            //VERIFICAR SI EL DNI TIENE UN FORMATO VALIDO

            onVerifyNIF: function () {
                var inputNifCliente = this.getView().byId("inputNifCliente");
                var inputText = inputNifCliente.getValue();
                var dniRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

                if (dniRegex.test(inputText)) {
                    var numero = inputText.substring(0, 8);
                    var letra = inputText.charAt(8).toUpperCase();

                    var letrasValidas = 'TRWAGMYFPDXBNJZSQVHLCKE';
                    var letraEsperada = letrasValidas.charAt(numero % 23);

                    if (letra === letraEsperada) {
                        inputNifCliente.setValueState("Success");

                    } else {
                        inputNifCliente.setValueState("Error");
                    }
                } else {
                    inputNifCliente.setValueState("Error");
                }

            },

            //VERIFICAR SI EL TELF TIENE UN FORMATO VALIDO
            onVerifyTelf: function () {
                var inputTelefonoCliente = this.getView().byId("inputTelefonoCliente");
                var inputText = inputTelefonoCliente.getValue();
                //var telefonoRegex = /^(?:\+34|0034|34)?[6-9][0-9]{8}$/;
                var telefonoRegex = /^\+\d+[0-9]{8}$/;

                if (telefonoRegex.test(inputText)) {
                    inputTelefonoCliente.setValueState("Success");
                } else {
                    inputTelefonoCliente.setValueState("Error")
                }

            },
            //VERIFICAR SI EL EMAIL TIENE UN FORMATO VALIDO

            onVerifyEmail: function () {
                var inputEmailCliente = this.getView().byId("inputMailContacto");
                var inputText = inputEmailCliente.getValue();
                var emailregex = new RegExp("^[\\w!#$%&'*+/=?`{|}~^-]+(?:\\.[\\w!#$%&'*+/=?`{|}~^-]+)*@(?:[a-zA-Z-]+\\.)+[a-zA-Z]{2,6}");

                if (emailregex.test(inputText)) {
                    inputEmailCliente.setValueState("Success");
                } else {
                    inputEmailCliente.setValueState("Error")
                }

            }


        });
    });