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

        var codcli, sumTotal, nomcli, Numped, Fechad, Fechah, Imported, Importeh, Cliente, ClasePed, codmat, nommat, LineaServicio, codord, nomord, codceco, nomceco, vkbur, socPed, TipoPed, numCont, nomSoc, vText, nomCont, Bzirk, Bztxt, Cvcan, Cvsector, Posped;
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
                var oModFiltrosAcr = new JSONModel();
                var oModCab = new JSONModel();


                oModFiltr.setData(filtros);

                this.oComponent.setModel(oModFiltr, "Filtros");
                this.oComponent.setModel(oModFiltrosAcr, "FiltrosCli");
                this.oComponent.setModel(oModCab, "PedidoCab");

                this.dameTiposped();
                this.dameLineas();
                this.DameOrganizaciones();
                this.TiposPedidoAlta();
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
                    } else if (values[0].results[0].Ztotred > 0) {
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
                this.byId("cliDial").close();

            },

            DatosCliente: function(codcli, vkbur) {
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

            buildDatosClientes: function(values) {
                if (values[0].results) {
                    var oModelDatosCliente = new JSONModel();
                    oModelDatosCliente.setData(values[0].results);                   
                    this.oComponent.getModel("ModoApp").setProperty("/Nombre",values[0].results[0].Nombre);
                    this.oComponent.getModel("ModoApp").setProperty("/Stcd1",values[0].results[0].Sctd1);
                    this.oComponent.getModel("ModoApp").setProperty("/SmtpAddr",values[0].results[0].SmtpAddr);
                    this.oComponent.getModel("ModoApp").setProperty("/Ort01",values[0].results[0].Ort01);
                    this.oComponent.getModel("ModoApp").setProperty("/Pstlz",values[0].results[0].Pstlz);
                    this.oComponent.getModel("ModoApp").setProperty("/Land1",values[0].results[0].Land1);
                    this.oComponent.getModel("ModoApp").setProperty("/Zwels",values[0].results[0].Zwels);
                    this.oComponent.getModel("ModoApp").setProperty("/Zterm",values[0].results[0].Zterm);
                    this.oComponent.getModel("ModoApp").refresh(true);
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

            onOpenOrder: function (oEvent) {

                var numero = oEvent.getSource().getBindingContext("listadoSolicitudes").getPath().split("/").slice(-1).pop()
                var posicionArray = this.oComponent.getModel("listadoSolicitudes").getData()[numero];
                var Idsolicitud = posicionArray.IDSOLICITUD;

                /*const oRouter = this.getOwnerComponent().getRouter();
                console.log(posicionArray)
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteAltaPedidos",{
                    path: Idsolicitud
                });*/
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
                oRouter.navTo("RouteAltaPedidos");
                //sap.ui.core.BusyIndicator.hide();*/
                //});


            },


            getSelectedPed: function (oEvent) {

                var oModSum = this.oComponent.getModel("listadoSolicitudes").getData();
                const sOperationPath = oEvent.getSource().getBindingContext("listadoSolicitudes").getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();

                var sum = oModSum[sOperation];

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
                    vcsect;

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
                    cvcan : vccan,
                    cvsector : vcsect,
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

            TiposPedidoAlta: function () {
                Promise.all([
                    this.readDataEntity(this.mainService, "/TipoPedidoSet", ""),
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
            },

            onChangeSoc: function () {

                /*var mode = this.oComponent.getModel("ModoApp").getData();

                mode.cvent = true;
                this.oComponent.getModel("ModoApp").refresh(true);*/
                this.oComponent.getModel("ModoApp").setProperty("/cvent", true);

                this.oComponent.getModel("ModoApp").refresh(true);

                //Calculamos los centos asociados a la sociedad
                //var bukrs = this.oComponent.getModel("PedidoCab").getData().Bukrs;
                socPed = this.getView().byId("idCSociedad").getSelectedKey();
                nomSoc = this.getView().byId("idCSociedad")._getSelectedItemText();
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

            onChangeArea: function () {
                /*var mode = this.oComponent.getModel("ModoApp").getData();
                mode.czona = true;
                this.oComponent.getModel("ModoApp").refresh(true);*/
                this.oComponent.getModel("ModoApp").setProperty("/cvcan", true);
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
                this.oComponent.getModel("ModoApp").setProperty("/cclient", true);
                this.oComponent.getModel("ModoApp").refresh(true);
                Bzirk = this.getView().byId("idzona").getSelectedKey();
                Bztxt = this.getView().byId("idzona")._getSelectedItemText();

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

                if (socPed) {
                    this.oComponent.setModel(new JSONModel(), "acrList");
                    this.oComponent.getModel("FiltrosCli").setProperty("/Bukrs", socPed);
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

                this.oComponent.getModel("ModoApp").setProperty("/ccontr", true);
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

                        this.oComponent.getModel("ModoApp").setProperty("/ccont", true);
                        this.oComponent.getModel("ModoApp").refresh(true);
                    }
                }

                sap.ui.core.BusyIndicator.hide();
                
                this.DameContratosCliente();
                
            },

            DameContratosCliente: function () {
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Vkorg");
                aFilterValues.push(socPed);

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

                this.DatosCliente(codcli, vkbur);
            },

            onChangeContrato: function () {
                numCont = this.getView().byId("idcontract").getSelectedKey();
                nomCont = this.getView().byId("idcontract")._getSelectedItemText();

                if (!numCont || numCont == undefined) {
                    MessageBox.warning(this.oI18nModel.getProperty("noCont"));
                }
            },

            CloseOptionsDiag: function () {
                this.getView().byId("idCTipoPed").setSelectedKey(null);
                this.getView().byId("idCSociedad").setSelectedKey(null);
                this.getView().byId("idArea").setSelectedKey(null);
                this.getView().byId("idCanal").setSelectedKey(null);
                this.getView().byId("idSector").setSelectedKey(null);
                this.getView().byId("idzona").setSelectedKey(null);
                this.getView().byId("idCCliente").setValue(null);
                this.getView().byId("idcontract").setSelectedKey(null);
                this.byId("OptionDial").close();

            },

            buildListAreaVentas: function (values) {
                if (values[0].results) {
                    var oModelListAreaVentas = new JSONModel();
                    oModelListAreaVentas.setData(values[0].results);
                    this.oComponent.setModel(oModelListAreaVentas, "AreaVentas");
                }

            },

            buildListZonaVentas: function (values) {
                if (values[0].results) {
                    var oModelListZonaVentas = new JSONModel();
                    oModelListZonaVentas.setData(values[0].results);
                    this.oComponent.setModel(oModelListZonaVentas, "ZonaVentas");
                }
                this.CanalVentas();

            },
 
            CanalVentas: function() {
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
 
            buildCanales: function(values) {
                if (values[0].results) {
                    var oModelListCanalVentas = new JSONModel();
                    oModelListCanalVentas.setData(values[0].results);
                    this.oComponent.setModel(oModelListCanalVentas, "CanalVentas");
                }
            },

            onChangeCanal: function(){
                this.oComponent.getModel("ModoApp").setProperty("/cvsector", true);
                this.oComponent.getModel("ModoApp").refresh(true);
                Cvcan = this.getView().byId("idCanal").getSelectedKey();
                this.SectorVentas();
            },

            SectorVentas: function (){
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

            buildSectores : function(values){
                if(values[0].results){
                    var oModelListSectorVentas = new JSONModel();
                    oModelListSectorVentas.setData(values[0].results);
                    this.oComponent.setModel(oModelListSectorVentas, "SectorVentas");
                }
                this.oComponent.getModel("ModoApp").setProperty("/cvcan", true);
                this.oComponent.getModel("ModoApp").refresh(true);

            },

            onChangeSector: function(){
                this.oComponent.getModel("ModoApp").setProperty("/czona", true);
                this.oComponent.getModel("ModoApp").refresh(true);
                Cvsector = this.getView().byId("idSector").getSelectedKey();
                this.OficinaVenta(vkbur, Cvcan, Cvsector);
            },

            OficinaVenta : function (vkbur,Cvcan, Cvsector) {
           
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

            buildModelOfVentas : function (values) {
                if (values[0].results){
                    var oModelOfVentas = new JSONModel();
                    oModelOfVentas.setData(values[0].results);
                    this.oComponent.setModel(oModelOfVentas, "OficinaVenta");
                    this.oComponent.getModel("OficinaVenta").refresh(true);
                }
            },

            onNavAlta: function () {
                
                this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", TipoPed);
                this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", ClasePed);
                this.oComponent.getModel("ModoApp").setProperty("/SocPed", socPed);
                this.oComponent.getModel("ModoApp").setProperty("/NomSoc", nomSoc);
                this.oComponent.getModel("ModoApp").setProperty("/Vkbur", vkbur);
                this.oComponent.getModel("ModoApp").setProperty("/Vtext", vText);
                this.oComponent.getModel("ModoApp").setProperty("/CvCanal",Cvcan);
                this.oComponent.getModel("ModoApp").setProperty("/CvSector",Cvsector);
                this.oComponent.getModel("ModoApp").setProperty("/Bzirk", Bzirk);
                this.oComponent.getModel("ModoApp").setProperty("/Bztxt", Bztxt);
                this.oComponent.getModel("ModoApp").setProperty("/Codcli",codcli);
                this.oComponent.getModel("ModoApp").setProperty("/Nomcli",nomcli);
                this.oComponent.getModel("ModoApp").setProperty("/Numcont",numCont);
                this.oComponent.getModel("ModoApp").setProperty("/Nomcont",nomCont);
                

                this.oComponent.getModel("ModoApp").refresh(true);

                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteAltaPedidos");
            }

        });
    });
