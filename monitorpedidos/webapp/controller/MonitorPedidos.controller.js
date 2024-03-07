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

        // Variables no utilizadas ???
        //var nomceco, nomord, nommat, sumTotal, nomSoc, Posped, Centges, Centuni, Centpro, Codadm, Plataforma, sAprob, socPed, condPago, vedit, checkMisPed, checkTodos;
        // var EdmType = exportLibrary.EdmType;

        // Variables utilizadas para los botones
        var btnEditar, accionLiberar, btnRescatar, accionRescatar;
        // Variables utilizadas en los filtros
        var filtroUsuario, filtroFechaDsd, filtroFechaHst, filtroImporteDsd, filtroImporteHst, filtroEstado, filtroClienteCod, filtroClienteTxt, filtroCeco, filtroOrden, filtroOficionaVentas, filtroLineaServicio, filtroMaterial, filtroClasePed, filtroResponsable;
        //var Usuario, Numped, Fechad, Fechah, Imported, Importeh, sStatus, Cliente, codceco, codord, LineaServicio, codmat, ClasePed, responsable;
        var usuario;
        var arrayFiltroClasePed = [];

        // variables utilizadas para los inputs del diálogo de alta
        var vkbur, vText, codcli, nomcli, numCont, nomCont, Cvcan, Cvsector, Bzirk, Bztxt, TipoPed, TipoPedTxt;

        // Variables globales para el formateo de los campos 'FECHA DOC. VENTA' e 'IMPORTE'

        var fechaDocVentaFormat;
        /*
        1 -> DD.MM.AAAA
        2 -> MM/DD/AAAA
        3 -> MM-DD-AAAA
        4 -> AAAA.MM.DD
        5 -> AAAA/MM/DD
        6 -> AAAA-MM-DD
        7 -> GAA.MM.DD(fecha japonesa)
        8 -> GAA/MM/DD(fecha japonesa)
        9 -> GAA-MM-DD (fecha japonesa)
        A -> AAAA/MM/DD (fecha islámica 1)
        B -> AAAA/MM/DD fecha islámica 2)
        C -> AAAA/MM/DD (fecha iraní)
        */

        var importeFormat;
        /*
        W -> 1.234.567,89
        X -> 1,234,567.89
        Y -> 1 234 567,89
        */

        /**
         * FRAMUMO - 04.03.24 - Seteamos la variable oModel para los adjuntos  de los clientes
         */
        var oModel;


        return Controller.extend("monitorpedidos.controller.MonitorPedidos", {
            onInit: function () {
                this.mainService = this.getOwnerComponent().getModel("mainService");
                this.oComponent = this.getOwnerComponent();
                this.oI18nModel = this.oComponent.getModel("i18n");

                // Modelo para el total de cada estado
                this.oComponent.setModel(new JSONModel(), "Filtros");
                // Modelo para el filtrado de Sociedad en la búsqueda de clientes para el Alta de Pedidos
                this.oComponent.setModel(new JSONModel(), "FiltrosCli");

                /**
                 * FRAMUMO - INI 04.03.24 - Modelo JSON para Alta Clientes
                 */
                var oModClientes = new JSONModel();
                oModel = this.getOwnerComponent().getModel();
                //this.oModel = this.
                oModel = this._createViewModel();

                this.oComponent.setModel(oModClientes, "AltaClientes");
                this.adjuntos = [];
                this.oComponent.setModel(new JSONModel([]), "Adjuntos");
                this.oComponent.setModel(new JSONModel(), "datosAdj");
                /**
                 * FRAMUMO - FIN 04.03.24 - Modelo JSON para Alta Clientes
                 */

                //var oModCab = new JSONModel();
                //this.oComponent.setModel(oModCab, "PedidoCab");
                btnEditar = false, accionLiberar = false, accionRescatar = false;
                //this.oComponent.getModel("PedidoCab").setProperty("/editPos", btnEditar);
                //this.oComponent.getModel("PedidoCab").refresh(true);

                // Inicializar valores mostrados en los filtros
                this.dameTiposped();
                this.dameLineas();
                //this.DameOrganizaciones();
                //this.TiposPedidoAlta();
                this.motivosRechazo();

                // De primeras mostrará las solicitudes de Mi usuario
                this.getUser();
                this.AreasVenta();
                this.modoapp = "";
            },


            /**
             * FRAMUMO - INI 04.03.24 - función para crear modelos en el component
             */
            _createViewModel: function () {
                return new JSONModel({
                    Adjuntos: [],
                    datosAdj: []
                });
            },

            /**
             * FRAMUMO - FIN 04.03.24 - función para crear modelos en el component
             */

            // -------------------------------------- FUNCIÓN PARA LEER LAS ENTIDADES DEL OData --------------------------------------
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

            /**
             * FRAMUMO - INI 04.03.24 - función para crear modelos en el component
             */
            readDataExcel: function (oModel, path, aFilters) {

                var sRuta = oModel.sServiceUrl + path + "/?$format=xlsx";
                window.open(sRuta, '_blank');
                
/*                var excelModel = new JSONModel();
                
                
                excelModel.loadData("/sap/opu/odata/sap/ZUI5_MONITOR_PEDIDOS_SRV/DamePedidosSet/?$format=xlsx",undefined,true, "GET", undefined, true, undefined);

                excelModel.attachRequestCompleted(function() {
                    var fName = "excelPruenas";
                    var fType = "":
                    var fContent = this.getData().properties.Content;

                    var fContentDecoded = atob(fContent)
                    //var fContentDecoded = new Buffer.from(fContent, 'base64');

                    //File.save(fContentDecoded, fName, "pdf", fType);

                    var byteNumbers = new Array(fContentDecoded.length);
                    for (var i = 0; i < fContentDecoded.length; i++) {
                        byteNumbers[i] = fContentDecoded.charCodeAt(i);
                    }
                    var byteArray = new Uint8Array(byteNumbers);
                    var blob = new Blob([byteArray], {
                        type: fType
                    });

                    File.save(byteArray, fName, "xlsx", fType);
                });*/

                /*downloadDocModel.attachRequestCompleted(function () {
                    console.log(this)

                    var fName = this.getData().properties.DocumentTitle;
                    var fType = this.getData().properties.MimeType;
                    var fContent = this.getData().properties.Content;

                    var fContentDecoded = atob(fContent)
                    //var fContentDecoded = new Buffer.from(fContent, 'base64');

                    //File.save(fContentDecoded, fName, "pdf", fType);

                    var byteNumbers = new Array(fContentDecoded.length);
                    for (var i = 0; i < fContentDecoded.length; i++) {
                        byteNumbers[i] = fContentDecoded.charCodeAt(i);
                    }
                    var byteArray = new Uint8Array(byteNumbers);
                    var blob = new Blob([byteArray], {
                        type: fType
                    });
                    var url = URL.createObjectURL(blob);
                    window.open(url, '_blank');

                    File.save(byteArray, fName, "pdf", fType);

                });*/

/*                
                return new Promise(function (resolve, reject) {
                    oModel.read(path, {
                        filters: [aFilters],
                        urlParameters: "$format=xlsx",
                        success: function (oData) {
                            resolve(oData);
                        },
                        error: function (oResult) {
                            reject(oResult);
                        },
                    });
                });
*/
            },

            // -------------------------------------- EXCEPCIONES (ERROR FATAL) --------------------------------------
            errorFatal: function (e) {
                MessageBox.error(this.oI18nModel.getProperty("errFat"));
                sap.ui.core.BusyIndicator.hide();
            },

            // -------------------------------------- FUNCIONES EJECUTADAS AL INICIAR LA APLICACIÓN --------------------------------------
            dameTiposped: function () {
                Promise.all([
                    this.readDataEntity(this.mainService, "/ClasePedSet", ""),
                ]).then(this.buildClasePed.bind(this), this.errorFatal.bind(this));
            },

            buildClasePed: function (values) {

                if (values[0].results) {
                    var oModelClasePed = new JSONModel();
                    oModelClasePed.setData(values[0].results);
                    oModelClasePed.setSizeLimit(300);
                    this.oComponent.setModel(oModelClasePed, "Tipospedido");
                }

            },

            dameLineas: function () {
                Promise.all([
                    this.readDataEntity(this.mainService, "/LineasServicioSet", ""),
                ]).then(this.buildLineas.bind(this), this.errorFatal.bind(this));
            },

            buildLineas: function (values) {

                if (values[0].results) {
                    var oModelLineas = new JSONModel();
                    oModelLineas.setData(values[0].results);
                    this.oComponent.setModel(oModelLineas, "LineasServicio");
                }

            },

            /*DameOrganizaciones: function () {
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

            },*/

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
                    usuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                    filtroUsuario = usuario;
                    this.oComponent.getModel("Usuario").setProperty("/user", usuario);
                    this.oComponent.getModel("Usuario").setProperty("/editPos", btnEditar);
                    this.oComponent.getModel("Usuario").refresh(true);
                }

                this.refrescarMonitor();
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

                /*var aFilterIds,
                    aFilterValues,
                    aFilters;

                aFilterIds = ["Vkorg"];
                aFilterValues = [socPed];
                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);*/

                Promise.all([this.readDataEntity(this.mainService, "/AreaVentasSet", "")]).then(
                    this.buildListAreaVentas.bind(this), this.errorFatal.bind(this));
            },

            buildListAreaVentas: function (values) {
                if (values[0].results) {
                    var oModelListAreaVentas = new JSONModel();
                    oModelListAreaVentas.setData(values[0].results);
                    oModelListAreaVentas.setSizeLimit(values[0].results.length);
                    this.oComponent.setModel(oModelListAreaVentas, "AreaVentas");
                }
            },

            // -------------------------------------- FUNCIONES PARA LA OBTENCIÓN DE LOS DATOS DEL MONITOR Y FILTRADO --------------------------------------
            // FUNCION DE LA BUSQUEDA PRINCIPAL
            onBusqSolicitudes: function (oEvent) {

                var inputUsuario = this.getView().byId("f_usuario").getValue();
                if (inputUsuario) {
                    filtroUsuario = inputUsuario;
                }

                //Numped = this.getView().byId("f_numsolic").getValue();
                filtroFechaDsd = this.getView().byId("DTPdesde").getValue();
                filtroFechaHst = this.getView().byId("DTPhasta").getValue();
                filtroImporteDsd = this.getView().byId("f_impdesde").getValue();
                filtroImporteHst = this.getView().byId("f_imphasta").getValue();
                //filtroEstado
                // Si el usuario no ha seleccionado un cliente desde el diálogo, buscamos el código en el input
                if (!filtroClienteTxt) {
                    filtroClienteCod = this.getView().byId("f_client").getValue();
                }
                filtroCeco = this.getView().byId("f_cecos").getValue();
                filtroOrden = this.getView().byId("f_ordenes").getValue();
                filtroOficionaVentas = this.getView().byId("f_oficinas").getValue();
                filtroMaterial = this.getView().byId("f_material").getValue();
                filtroResponsable = this.getView().byId("f_approv").getValue();
                filtroLineaServicio = this.getView().byId("f_line").getSelectedKey();
                filtroClasePed = arrayFiltroClasePed;

                this.refrescarMonitor();
            },

            // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE CLIENTES EN LOS FILTROS PRINCIPALES
            onValueHelpRequestClienteMonitor: function (oEvent) {
                this._getDialogClienteMonitor();
            },

            _getDialogClienteMonitor: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogCliente) {
                    this.pDialogCliente = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.BusqClientesMonitor",
                        controller: this,
                    }).then(function (oDialogCliente) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialogCliente);
                        return oDialogCliente;
                    });
                }
                this.pDialogCliente.then(function (oDialogCliente) {
                    oDialogCliente.open(sInputValue);
                });
            },

            closeCliDiagMonitor: function () {
                this.byId("cliDialMonitor").close();
            },

            onBusqClientesMonitor: function () {
                var Stcd1 = this.getView().byId("f_nameAcrMoni").getValue();
                var Kunnr = this.getView().byId("f_lifnrAcrMoni").getValue();
                var Name1 = this.getView().byId("f_nifAcrMoni").getValue();

                var aFilterIds = [],
                    aFilterValues = [];

                var addFilter = function (id, value) {
                    if (value) {
                        aFilterIds.push(id);
                        aFilterValues.push(value);
                    }
                };

                addFilter("Stcd1", Stcd1);
                addFilter("Kunnr", Kunnr);
                addFilter("Name1", Name1);

                var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameClientesSet", aFilters),
                ]).then(this.buildClientesModelMonitor.bind(this), this.errorFatal.bind(this));

            },

            buildClientesModelMonitor: function (values) {
                var oModelClientes = new JSONModel();
                if (values[0].results) {
                    // Eliminar los clientes duplicados
                    var uniqueElements = {};

                    var arrayClientes = values[0].results.filter(function (item) {
                        return uniqueElements.hasOwnProperty(item.Kunnr) ? false : (uniqueElements[item.Kunnr] = true);
                    });

                    oModelClientes.setData(arrayClientes);
                }
                this.oComponent.setModel(oModelClientes, "listadoClientes");
                this.oComponent.getModel("listadoClientes").refresh(true);
                sap.ui.core.BusyIndicator.hide();
            },

            onPressClienteMonitor: function (oEvent) {
                var acr = this.getSelectClie(oEvent, "listadoClientes");
                codcli = acr.Kunnr;
                nomcli = acr.Name1;
                filtroClienteCod = codcli;
                filtroClienteTxt = nomcli;
                this.getView().byId("f_client").setValue(filtroClienteTxt);
                this.closeCliDiagMonitor();
            },

            getSelectClie: function (oEvent, oModel) {
                var oModClie = this.oComponent.getModel(oModel).getData();
                const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var idcliente = oModClie[sOperation];
                return idcliente;
            },

            // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE CECOS EN LOS FILTROS PRINCIPALES
            onValueHelpRequestCecosMonitor: function (oEvent) {
                this._getDialogCecosMonitor();
            },

            _getDialogCecosMonitor: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogCecos) {
                    this.pDialogCecos = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.BusqCecoMonitor",
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

            closeCecoDiagMonitor: function () {
                this.byId("cecoDialMonitor").close();
            },

            onBusqCecosMonitor: function () {
                var Kostl = this.getView().byId("f_codCecoMoni").getValue();
                var Ltext = this.getView().byId("f_nomCecoMoni").getValue();
                var Bukrs = this.getView().byId("f_cecoSocMoni").getValue();

                var aFilterIds = [],
                    aFilterValues = [];

                var addFilter = function (id, value) {
                    if (value) {
                        aFilterIds.push(id);
                        aFilterValues.push(value);
                    }
                };

                addFilter("Kostl", Kostl);
                addFilter("Ltext", Ltext);
                addFilter("Kokrs", Bukrs);

                var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/CecoIngresoSet", aFilters),
                ]).then(this.buildCecosModelMonitor.bind(this), this.errorFatal.bind(this));
            },

            buildCecosModelMonitor: function (values) {
                var oModelCecos = new JSONModel();
                if (values[0].results) {
                    oModelCecos.setData(values[0].results);
                }
                this.oComponent.setModel(oModelCecos, "listadoCecos");
                this.oComponent.getModel("listadoCecos").refresh(true);
                sap.ui.core.BusyIndicator.hide();
            },

            onPressCecosMonitor: function (oEvent) {
                var ceco = this.getSelectCeco(oEvent, "listadoCecos");
                filtroCeco = ceco.Kostl;
                nomceco = ceco.Ltext;
                this.getView().byId("f_cecos").setValue(filtroCeco);
                this.closeCecoDiagMonitor();
            },

            getSelectCeco: function (oEvent, oModel) {
                var oModCeco = this.oComponent.getModel(oModel).getData();
                const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var idCeco = oModCeco[sOperation];
                return idCeco;
            },

            // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE ORDENES EN LOS FILTROS PRINCIPALES
            onValueHelpRequestOrdMonitor: function (oEvent) {
                this._getDialogOrdenesMonitor();
            },

            _getDialogOrdenesMonitor: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogOrdenes) {
                    this.pDialogOrdenes = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.BusqOrdenIngresoMonitor",
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

            closeOrdDiagMonitor: function () {
                this.byId("ordDialMonitor").close();
            },

            onBusqOrdenesMonitor: function () {
                var Ceco = filtroCeco;
                var Aufnr = this.getView().byId("f_codOrdMoni").getValue();
                var Ktext = this.getView().byId("f_nomOrdMoni").getValue();
                var Bukrs = this.getView().byId("f_ordbukrsMoni").getValue();

                var aFilterIds = [],
                    aFilterValues = [];

                var addFilter = function (id, value) {
                    if (value) {
                        aFilterIds.push(id);
                        aFilterValues.push(value);
                    }
                };

                addFilter("Ceco", Ceco);
                addFilter("Aufnr", Aufnr);
                addFilter("Ktext", Ktext);
                addFilter("Bukrs", Bukrs);

                var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/OrdenIngresoSet", aFilters),
                ]).then(this.buildOrdenesModelMonitor.bind(this), this.errorFatal.bind(this));
            },

            buildOrdenesModelMonitor: function (values) {
                var oModelOrdenes = new JSONModel();
                if (values[0].results) {
                    oModelOrdenes.setData(values[0].results);
                }
                this.oComponent.setModel(oModelOrdenes, "listadoOrdenes");
                this.oComponent.getModel("listadoOrdenes").refresh(true);
                sap.ui.core.BusyIndicator.hide();
            },

            onPressOrdenesMonitor: function (oEvent) {
                var ord = this.getSelectOrd(oEvent, "listadoOrdenes");
                filtroOrden = ord.Aufnr;
                nomord = ord.Ktext;
                this.getView().byId("f_ordenes").setValue(filtroOrden);
                this.closeOrdDiagMonitor();
            },

            getSelectOrd: function (oEvent, oModel) {
                var oModOrd = this.oComponent.getModel(oModel).getData();
                const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var idOrden = oModOrd[sOperation];
                return idOrden;
            },

            // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE OFICINA DE VENTAS EN LOS FILTROS PRINCIPALES
            onValueHelpRequestOficinasMonitor: function (oEvent) {
                this._getDialogOficinasMonitor(oEvent);
            },

            _getDialogOficinasMonitor: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogOficinas) {
                    this.pDialogOficinas = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.BusqOficinaVentasMonitor",
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

            closeOficinasDiagMonitor: function () {
                this.byId("ofiDialMonitor").close();
            },

            onBusqOficinaMonitor: function () {
                var Vkorg = this.getView().byId("f_VkorgOfiMoni").getValue();
                var Vtweg = this.getView().byId("f_VtwegOfiMoni").getValue();
                var Spart = this.getView().byId("f_SpartOfiMoni").getValue();

                var aFilterIds = [],
                    aFilterValues = [];

                var addFilter = function (id, value) {
                    if (value) {
                        aFilterIds.push(id);
                        aFilterValues.push(value);
                    }
                };

                addFilter("VKORG", Vkorg);
                addFilter("VTWEG", Vtweg);
                addFilter("SPART", Spart);

                var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameOficinasSet", aFilters),
                ]).then(this.buildOficinasModelMonitor.bind(this), this.errorFatal.bind(this));
            },

            buildOficinasModelMonitor: function (values) {
                var oModelOficinas = new JSONModel();
                if (values[0].results) {
                    oModelOficinas.setData(values[0].results);
                }
                this.oComponent.setModel(oModelOficinas, "listadoOficinas");
                this.oComponent.getModel("listadoOficinas").refresh(true);
                sap.ui.core.BusyIndicator.hide();
            },

            onPressOficinasMonitor: function (oEvent) {
                var ofi = this.getSelectOficinas(oEvent, "listadoOficinas");
                filtroOficionaVentas = ofi.Vkbur;
                vkbur = ofi.Vkbur;
                this.getView().byId("f_oficinas").setValue(filtroOficionaVentas);
                this.closeOficinasDiagMonitor();
            },

            getSelectOficinas: function (oEvent, oModel) {
                var oModOficinas = this.oComponent.getModel(oModel).getData();
                const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var idOficinas = oModOficinas[sOperation];
                return idOficinas;
            },

            // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE MATERIAL EN LOS FILTROS PRINCIPALES
            onValueHelpRequestMatMonitor: function (oEvent) {
                this._getDialogMaterialMonitor();
            },

            _getDialogMaterialMonitor: function (sInputValue) {
                var oView = this.getView();

                if (!this.pDialogMaterial) {
                    this.pDialogMaterial = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.BusqMaterialesMonitor",
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

            closeMatDiagMonitor: function () {
                this.byId("matDialMonitor").close();
            },

            onBusqMaterialesMonitor: function () {
                var Matnr = this.getView().byId("f_codMatMoni").getValue();
                var Maktx = this.getView().byId("f_nomMatMoni").getValue();
                var Matkl = this.getView().byId("f_grArtMoni").getValue();

                var aFilterIds = [],
                    aFilterValues = [];

                var addFilter = function (id, value) {
                    if (value) {
                        aFilterIds.push(id);
                        aFilterValues.push(value);
                    }
                };

                addFilter("Matnr", Matnr);
                addFilter("Maktx", Maktx);
                addFilter("Matkl", Matkl);

                var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameMaterialSet", aFilters),
                ]).then(this.buildMaterialesModelMonitor.bind(this), this.errorFatal.bind(this));
            },

            buildMaterialesModelMonitor: function (values) {
                var oModelMateriales = new JSONModel();
                if (values[0].results) {
                    oModelMateriales.setData(values[0].results);
                }
                sap.ui.core.BusyIndicator.hide();
                this.oComponent.setModel(oModelMateriales, "listadoMateriales");
                this.oComponent.getModel("listadoMateriales").refresh(true);
            },

            onPressMaterialMonitor: function (oEvent) {
                var mat = this.getSelectMat(oEvent, "listadoMateriales");
                filtroMaterial = mat.Matnr;
                nommat = mat.Maktx;
                this.getView().byId("f_material").setValue(filtroMaterial);
                this.closeMatDiagMonitor();
            },

            getSelectMat: function (oEvent, oModel) {
                var oModMat = this.oComponent.getModel(oModel).getData();
                const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var idMaterial = oModMat[sOperation];
                return idMaterial;
            },

            // FUNCIONES SELECCIÓN DE BÚSQUEDA DE CECOS EN LOS FILTROS PRINCIPALES
            onChangefLineas: function () {
                filtroLineaServicio = this.getView().byId("f_line").getSelectedKey();
            },

            // FUNCIONES SELECCIÓN DE CLASE DE DOCUMENTO EN LOS FILTROS PRINCIPALES
            handleSelectionChange: function (oEvent) {
                var changedItem = oEvent.getParameter("changedItem");
                var isSelected = oEvent.getParameter("selected");

                if (isSelected) {
                    arrayFiltroClasePed.push(changedItem.getKey());
                } else {
                    var index = arrayFiltroClasePed.indexOf(changedItem.getKey());
                    if (index !== -1) {
                        arrayFiltroClasePed.splice(index, 1);
                    }
                }
            },

            // OBTENER DATOS DEL MONITOR EN BASE A LOS FILTROS
            ListadoSolicitudes: function (
                filtroUsuario,
                //Numped,
                filtroFechaDsd,
                filtroFechaHst,
                filtroImporteDsd,
                filtroImporteHst,
                filtroEstado,
                filtroClienteCod,
                filtroCeco,
                filtroOrden,
                filtroOficionaVentas,
                filtroLineaServicio,
                filtroMaterial,
                filtroResponsable,
                filtroClasePed
            ) {
                var aFilterIds = [],
                    aFilterValues = [];

                var addFilter = function (id, value) {
                    if (value) {
                        aFilterIds.push(id);
                        aFilterValues.push(value);
                    }
                };

                addFilter("USUARIO", filtroUsuario);
                addFilter("FECHAD", Date.parse(filtroFechaDsd));
                addFilter("FECHAH", Date.parse(filtroFechaHst));
                addFilter("IMPORTED", filtroImporteDsd);
                addFilter("IMPORTEH", filtroImporteHst);
                addFilter("ESTADO", filtroEstado);
                addFilter("CLIENTE", filtroClienteCod);
                addFilter("CECO", filtroCeco);
                addFilter("ORDEN", filtroOrden);
                addFilter("ORGVENTAS", filtroOficionaVentas);
                addFilter("LINEA", filtroLineaServicio);
                addFilter("MATERIAL", filtroMaterial);
                addFilter("ZRESPONSABLE", filtroResponsable);
                addFilter("TIPO", filtroClasePed);

                var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/DamePedidosSet", aFilters),
                ]).then(this.buildListadoModel.bind(this), this.errorFatal.bind(this));
            },

            buildListadoModel: function (values) {
                if (values[0].results.length >= 1) {
                    var oModelSolicitudes = new JSONModel(values[0].results);
                    if (filtroEstado === "APRB")
                        this.oComponent.setModel(oModelSolicitudes, "listadoSolicitudesAPRB");
                    if (accionLiberar)
                        this.oComponent.setModel(oModelSolicitudes, "listadoSolicitudesLiberar");
                    else if (accionRescatar)
                        this.oComponent.setModel(oModelSolicitudes, "listadoSolicitudesRescatar");
                    else
                        this.oComponent.setModel(oModelSolicitudes, "listadoSolicitudes");
                } else {
                    //MessageBox.warning(this.oI18nModel.getProperty("noSol"));
                    //Si no hay solicitudes, se borra el listado
                    if (filtroEstado === "APRB")
                        this.oComponent.setModel(new JSONModel(), "listadoSolicitudesAPRB");
                    if (accionLiberar)
                        this.oComponent.setModel(new JSONModel(), "listadoSolicitudesLiberar");
                    else if (accionRescatar)
                        this.oComponent.setModel(new JSONModel(), "listadoSolicitudesRescatar");
                    else
                        this.oComponent.setModel(new JSONModel(), "listadoSolicitudes");
                }
                sap.ui.core.BusyIndicator.hide();
            },

            // FUNCIÓN PARA ESTABLECER EL NÚMERO TOTAL DE CADA PESTAÑA ESTADO
            calcularTotalEstados: function () {

                // -- ELIMINAR LOS FILTROS DE LA TABLA --
                var tablaMonitor = this.getView().byId("idTablePEPs");
                //set group of table and column to false          
                tablaMonitor.setEnableGrouping(false);
                tablaMonitor.clearSelection();

                var oListBinding = tablaMonitor.getBinding();
                if (oListBinding) {
                    oListBinding.aSorters = null;
                    oListBinding.aFilters = null;
                }

                for (var iColCounter = 0; iColCounter < tablaMonitor.getColumns().length; iColCounter++) {
                    tablaMonitor.getColumns()[iColCounter].setSorted(false);
                    tablaMonitor.getColumns()[iColCounter].setFilterValue("");
                    tablaMonitor.getColumns()[iColCounter].setFiltered(false);
                    tablaMonitor.getColumns()[iColCounter].setGrouped(false);
                }

                //after reset, set the enableGrouping back to true
                tablaMonitor.setEnableGrouping(true);

                // -- ACTUALIZAR EL TOTAL EN CADA ESTADO --
                var estados = ["", "REDA", "APRB", "FINA", "FACT", "PDTE", "COBR", "DEN"];

                var addFilter = function (id, value) {
                    if (value) {
                        aFilterIds.push(id);
                        aFilterValues.push(value);
                    }
                };

                for (let i = 0; i < estados.length; i++) {
                    let estado = estados[i];

                    var aFilterIds = [],
                        aFilterValues = [];

                    addFilter("USUARIO", filtroUsuario);
                    addFilter("FECHAD", Date.parse(filtroFechaDsd));
                    addFilter("FECHAH", Date.parse(filtroFechaHst));
                    addFilter("IMPORTED", filtroImporteDsd);
                    addFilter("IMPORTEH", filtroImporteHst);
                    addFilter("ESTADO", estado);
                    addFilter("CLIENTE", filtroClienteCod);
                    addFilter("CECO", filtroCeco);
                    addFilter("ORDEN", filtroOrden);
                    addFilter("ORGVENTAS", filtroOficionaVentas);
                    addFilter("LINEA", filtroLineaServicio);
                    addFilter("MATERIAL", filtroMaterial);
                    addFilter("ZRESPONSABLE", filtroResponsable);
                    addFilter("TIPO", filtroClasePed);

                    var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                    var that = this;

                    Promise.all([
                        this.readDataEntity(this.mainService, "/DamePedidosSet/$count", aFilters, {
                            async: true
                        }),
                    ]).then(function (results) {
                        switch (estado) {
                            case '':
                                that.oComponent.getModel("Filtros").setProperty("/Total", results[0]);
                                break;
                            case 'REDA':
                                that.oComponent.getModel("Filtros").setProperty("/totalred", results[0]);
                                break;
                            case 'APRB':
                                that.oComponent.getModel("Filtros").setProperty("/totalpdte", results[0]);
                                break;
                            case 'FINA':
                                that.oComponent.getModel("Filtros").setProperty("/totalfin", results[0]);
                                break;
                            case 'FACT':
                                that.oComponent.getModel("Filtros").setProperty("/totalfac", results[0]);
                                break;
                            case 'PDTE':
                                that.oComponent.getModel("Filtros").setProperty("/totalpdtecobr", results[0]);
                                break;
                            case 'COBR':
                                that.oComponent.getModel("Filtros").setProperty("/totalcob", results[0]);
                                break;
                            case 'DEN':
                                that.oComponent.getModel("Filtros").setProperty("/TotalDen", results[0]);
                                break;
                        }
                    }, "");
                }
            },

            // FUNCIÓN PARA REFRESCAR LOS DATOS DEL MONITOR
            refrescarMonitor: function () {
                this.ListadoSolicitudes(
                    filtroUsuario,
                    //Numped,
                    filtroFechaDsd,
                    filtroFechaHst,
                    filtroImporteDsd,
                    filtroImporteHst,
                    filtroEstado,
                    filtroClienteCod,
                    filtroCeco,
                    filtroOrden,
                    filtroOficionaVentas,
                    filtroLineaServicio,
                    filtroMaterial,
                    filtroResponsable,
                    filtroClasePed);

                if (this.oComponent.getModel("listadoSolicitudes")) {
                    this.oComponent.getModel("listadoSolicitudes").refresh(true);
                }
                this.calcularTotalEstados();
            },

            //MÉTODO PARA EL CAMBIO DE ESTADO (ICON TAB FILTERS)
            onFilterSelect: function (oEvent) {
                var skey = oEvent.getParameter("key");
                filtroEstado = "";
                btnEditar = false;
                btnRescatar = false;

                switch (skey) {
                    case "Free":
                        filtroEstado = "";
                        break;
                    case "Ok":
                        filtroEstado = "REDA";
                        btnEditar = true;
                        break;
                    case "Heavy":
                        filtroEstado = "APRB";
                        btnRescatar = true;
                        break;
                    case "Overweight":
                        filtroEstado = "FINA";
                        break;
                    case "Money":
                        filtroEstado = "FACT";
                        btnRescatar = true;
                        break;
                    case "Payment":
                        filtroEstado = "PDTE";
                        break;
                    case "Sales":
                        filtroEstado = "COBR";
                        break;
                    case "Cancel":
                        filtroEstado = "DEN";
                        break;
                }

                if (skey === 'Approv') {
                    filtroEstado = "APRB";
                    this._getDialogAprobaciones();
                    this.getView().byId("rbGroup").setVisible(false);
                } else {
                    this.getView().byId("rbGroup").setVisible(true);

                    this.ListadoSolicitudes(
                        filtroUsuario,
                        //Numped,
                        filtroFechaDsd,
                        filtroFechaHst,
                        filtroImporteDsd,
                        filtroImporteHst,
                        filtroEstado,
                        filtroClienteCod,
                        filtroCeco,
                        filtroOrden,
                        filtroOficionaVentas,
                        filtroLineaServicio,
                        filtroMaterial,
                        filtroResponsable,
                        filtroClasePed);
                }
                this.calcularTotalEstados();
                this.getView().byId("Filtr10").setVisible(btnEditar);
                this.getView().byId("colbtnedit").setVisible(btnEditar);
                this.getView().byId("Filtr11").setVisible(btnRescatar);
                this.oComponent.getModel("Usuario").setProperty("/editPos", btnEditar);
                this.oComponent.getModel("Usuario").refresh(true);
            },

            // DIÁLOGO DE APROBACIONES
            _getDialogAprobaciones: function (sInputValue) {

                this.ListadoSolicitudes(
                    "", //filtroUsuario
                    //Numped,
                    "", //filtroFechaDsd
                    "", // filtroFechaHst
                    "", // filtroImporteDsd
                    "", // filtroImporteHst
                    filtroEstado,
                    "", // filtroClienteCod
                    "", // filtroCeco
                    "", // filtroOrden
                    "", // filtroOficionaVentas
                    "", // filtroLineaServicio
                    "", // filtroMaterial
                    usuario, // filtroResponsable
                    ""); // filtroClasePed

                var oView = this.getView();
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
            },

            onAprobacion: function (oEvent) {
                var oTable = this.getView().byId("a_idTablePEPs");
                var aSelectedIndices = oTable.getSelectedIndices();

                if (aSelectedIndices.length > 0) {
                    var soliciAprobar = this.oComponent.getModel("listadoSolicitudes").getData();
                    var soliciAprobar_Aux = JSON.parse(JSON.stringify(soliciAprobar)); // Copy data model without references
                    var DatosAprobaciones = [];
                    var accion = "A";

                    for (var i = 0; i < aSelectedIndices.length; i++) {
                        var indice = aSelectedIndices[i];
                        var solicitud = soliciAprobar_Aux[indice];
                        var obj = {
                            Accion: accion,
                            Solicitud: solicitud.IDSOLICITUD
                        };
                        DatosAprobaciones.push(obj);
                    }

                    /*const oI18nModel = this.oComponent.getModel("i18n");
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
                    var accion = "A";*/


                    var that = this;

                    /*for (var i = 0; i < results_array.length; i++) {

                        obj = {
                            Accion: accion,
                            Solicitud: results_array[i].IDSOLICITUD
                        };
                        DatosAprobaciones.push(obj);
                        obj = {};
                    }*/

                    var msg = this.oI18nModel.getProperty("SolAprob");
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
                                        if (result.AprobarSet.results && result.AprobarSet.results[0].Solicitud) {
                                            if (result.RespAprobSet.results.length > 1) {
                                                for (var i = 0; i < result.RespAprobSet.results.length; i++) {
                                                    msgLog += result.RespAprobSet.results[i].TextoLog + "\r\n";
                                                }
                                                sap.m.MessageToast.show(msgLog);                                            
                                            } else {
                                                MessageBox.show(result.RespAprobSet.results[0].TextoLog);                                            
                                            }
                                            oTable.clearSelection();
                                            that.ListadoSolicitudes(
                                                "", //filtroUsuario
                                                //Numped,
                                                "", //filtroFechaDsd
                                                "", // filtroFechaHst
                                                "", // filtroImporteDsd
                                                "", // filtroImporteHst
                                                filtroEstado,
                                                "", // filtroClienteCod
                                                "", // filtroCeco
                                                "", // filtroOrden
                                                "", // filtroOficionaVentas
                                                "", // filtroLineaServicio
                                                "", // filtroMaterial
                                                usuario, // filtroResponsable
                                                ""); // filtroClasePed
                                            that.calcularTotalEstados();
                                            that.byId("ApprovDial").close();   
                                        }
                                        sap.ui.core.BusyIndicator.hide();
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
                }else {
                    MessageBox.warning(this.oI18nModel.getProperty("noSoli"));
                }
            },

            onRechazo: function (oEvent) {

                var oTable = this.getView().byId("a_idTablePEPs");
                var aSelectedIndices = oTable.getSelectedIndices();

                if (aSelectedIndices.length > 0) {
                    var soliciRechazar = this.oComponent.getModel("listadoSolicitudes").getData();
                    var soliciRechazar_Aux = JSON.parse(JSON.stringify(soliciRechazar)); // Copy data model without references
                    

                    /*const oI18nModel = this.oComponent.getModel("i18n");
                
                    var t_indices = oTable.getBinding().aIndices;
                    var aContexts = oTable.getSelectedIndices();
                    var items = aContexts.map(function (c) {
                        //return c.getObject();
                        return this.oComponent.getModel("listadoSolicitudes").getProperty("/" + t_indices[c]);
                    }.bind(this));

                    var results_array = items;
                    var Datosrechazo = [];
                    var obj = {};
                    var accion = "R";*/



                    var that = this;

                    var msg = this.oI18nModel.getProperty("SolRechz");
                    var msgRechz = "";

                    // Primero destruimos el diálogo para no duplicar IDs
                    if (this.oConfirmDialog) {
                        this.oConfirmDialog.destroyContent();   
                    }
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

                                var DatosRechazo = [];
                                var accion = "R";

                                for (var i = 0; i < aSelectedIndices.length; i++) {
                                    var indice = aSelectedIndices[i];
                                    var solicitud = soliciRechazar_Aux[indice];
                                    var obj = {
                                        Accion: accion,
                                        Motivo: selectedKey,
                                        Texto: oTextArea,
                                        Solicitud: solicitud.IDSOLICITUD
                                    };
                                    DatosRechazo.push(obj);
                                }

                                /*for (var i = 0; i < results_array.length; i++) {

                                    obj = {
                                        Accion: accion,
                                        Motivo: selectedKey,
                                        Texto: oTextArea,
                                        Solicitud: results_array[i].IDSOLICITUD
                                    };
                                    Datosrechazo.push(obj);
                                    obj = {};
                                }*/


                                var json1 = {
                                    Accion: accion,
                                    RechazarSet: DatosRechazo,
                                    RespRechazoSet: []
                                }
                                that.mainService.create("/RechazarSet", json1, {
                                    success: function (result) {
                                        if (result.RechazarSet.results[0].Solicitud) {
                                            //sap.ui.core.BusyIndicator.hide();
                                            if (result.RechazarSet.results.length > 1) {
                                                for (var i = 0; i < result.RespRechazoSet.results.length; i++) {
                                                    msgRechz += result.RespRechazoSet.results[i].TextoLog + "\r\n";
                                                }
                                                sap.m.MessageToast.show(msgRechz);
                                                //that.oConfirmDialog.destroyContent();
                                                //oComboBox.setSelectedKey(null);
                                                //oTextArea.setValue('');
                                                //that.byId("ApprovDial").close();
                                            } else {
                                                MessageBox.show(result.RespRechazoSet.results[0].TextoLog);
                                                //that.oConfirmDialog.destroyContent();
                                                //that.byId("ApprovDial").close();
                                            }
                                            oTable.clearSelection();
                                            that.byId("ApprovDial").close();
                                        }
                                        sap.ui.core.BusyIndicator.hide();
                                    }
                                });
                                that.oConfirmDialog.close();
                                that.ListadoSolicitudes(
                                    "", //filtroUsuario
                                    //Numped,
                                    "", //filtroFechaDsd
                                    "", // filtroFechaHst
                                    "", // filtroImporteDsd
                                    "", // filtroImporteHst
                                    filtroEstado,
                                    "", // filtroClienteCod
                                    "", // filtroCeco
                                    "", // filtroOrden
                                    "", // filtroOficionaVentas
                                    "", // filtroLineaServicio
                                    "", // filtroMaterial
                                    usuario, // filtroResponsable
                                    ""); // filtroClasePed
                                that.calcularTotalEstados();
                            }.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: "Cancel",
                            press: function () {
                                that.oConfirmDialog.close();
                            }.bind(this)
                        })
                    });
                    this.oConfirmDialog.open();                    
                }else{
                    MessageBox.warning(this.oI18nModel.getProperty("noSoli"));
                }             
            },

            oncancelaprobaciones: function () {
                /*this.pDialogAprobaciones.then(function (oDialogAprobaciones) {
                    oDialogAprobaciones.close();
                });*/
                this.byId("ApprovDial").close();
            },

            // DIÁLOGO DE LIBERACIONES
            onEnviarLiberacion: function () {
                accionLiberar = true;
                this._getDialogLiberaciones();
            },

            _getDialogLiberaciones: function (sInputValue) {

                this.ListadoSolicitudes(
                    usuario, //filtroUsuario
                    //Numped,
                    "", // filtroFechaDsd,
                    "", // filtroFechaHst,
                    "", // filtroImporteDsd,
                    "", // filtroImporteHst,
                    filtroEstado,
                    "", // filtroClienteCod,
                    "", // filtroCeco
                    "", // filtroOrden
                    "", // filtroOficionaVentas
                    "", // filtroLineaServicio,
                    "", // filtroMaterial,
                    "", // filtroResponsable,
                    ""); // filtroClasePed                

                var oView = this.getView();
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
            },

            onLiberacion: function (oEvent) {
                var oTable = this.getView().byId("b_idTablePEPs");

                var aSelectedIndices = oTable.getSelectedIndices();

                if (aSelectedIndices.length > 0) {
                    var soliciLiberar = this.oComponent.getModel("listadoSolicitudesLiberar").getData();
                    var soliciLiberar_Aux = JSON.parse(JSON.stringify(soliciLiberar)); // Copy data model without references
                    var DatosLiberaciones = [];
                    var accion = "L";

                    for (var i = 0; i < aSelectedIndices.length; i++) {
                        var indice = aSelectedIndices[i];
                        var solicitud = soliciLiberar_Aux[indice];
                        var obj = {
                            Accion: accion,
                            Solicitud: solicitud.IDSOLICITUD
                        };
                        DatosLiberaciones.push(obj);
                    }

                    //const oI18nModel = this.oComponent.getModel("i18n");
                    var msg = this.oI18nModel.getProperty("SolLiber");
                    var msgLog = "";
                    var that = this;

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
                                        if (result.LiberarSet.results && result.LiberarSet.results[0].Solicitud) {
                                            if (result.LiberacionRespuesta.results.length > 1) {
                                                for (var i = 0; i < result.LiberacionRespuesta.results.length; i++) {
                                                    msgLog += result.LiberacionRespuesta.results[i].TextoLog + "\r\n";
                                                }
                                                sap.m.MessageToast.show(msgLog);
                                            } else {
                                                MessageBox.show(result.LiberacionRespuesta.results[0].TextoLog);
                                            }
                                            oTable.clearSelection();
                                            accionLiberar = false;
                                            // Refrescamos los filtros
                                            that.refrescarMonitor();
                                            that.byId("LiberacionDial").close();
                                        }
                                        sap.ui.core.BusyIndicator.hide();
                                    },
                                    error: function (err) {
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
                } else {
                    MessageBox.warning(this.oI18nModel.getProperty("noSoli"));
                }
            },

            onCancelliberacion: function () {
                accionLiberar = false;
                this.byId("LiberacionDial").close();
            },

            // DIÁLOGO DE RESCATAR
            onEnviarRescatar: function () {
                accionRescatar = true;
                this._getDialogRescatar();
            },

            _getDialogRescatar: function (sInputValue) {

                this.ListadoSolicitudes(
                    usuario, //filtroUsuario
                    //Numped,
                    "", // filtroFechaDsd,
                    "", // filtroFechaHst,
                    "", // filtroImporteDsd,
                    "", // filtroImporteHst,
                    filtroEstado,
                    "", // filtroClienteCod,
                    "", // filtroCeco
                    "", // filtroOrden
                    "", // filtroOficionaVentas
                    "", // filtroLineaServicio,
                    "", // filtroMaterial,
                    "", // filtroResponsable,
                    ""); // filtroClasePed                

                var oView = this.getView();
                if (!this.pDialogRescatar) {
                    this.pDialogRescatar = Fragment.load({
                        id: oView.getId(),
                        name: "monitorpedidos.fragments.Rescatar",
                        controller: this,
                    }).then(function (oDialogRescatar) {
                        // connect dialog to the root view of this component (models, lifecycle)
                        oView.addDependent(oDialogRescatar);
                        return oDialogRescatar;
                    });
                }
                this.pDialogRescatar.then(function (oDialogRescatar) {
                    oDialogRescatar.open(sInputValue);
                });
            },

            onRescatar: function (oEvent) {
                var oTable = this.getView().byId("b_idTablePEPsResc");

                var aSelectedIndices = oTable.getSelectedIndices();

                if (aSelectedIndices.length > 0) {
                    var soliciRescatar = this.oComponent.getModel("listadoSolicitudesRescatar").getData();
                    var soliciRescatar_Aux = JSON.parse(JSON.stringify(soliciRescatar)); // Copy data model without references
                    var DatosRescate = [];
                    var accion = "R";

                    for (var i = 0; i < aSelectedIndices.length; i++) {
                        var indice = aSelectedIndices[i];
                        var solicitud = soliciRescatar_Aux[indice];
                        var obj = {
                            Accion: accion,
                            Solicitud: solicitud.IDSOLICITUD
                        };
                        DatosRescate.push(obj);
                    }

                    //const oI18nModel = this.oComponent.getModel("i18n");
                    var msg = this.oI18nModel.getProperty("SolResca");
                    var msgLog = "";
                    var that = this;

                    MessageBox.warning(msg, {
                        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                        emphasizedAction: MessageBox.Action.OK,
                        onClose: function (sAction) {
                            if (sAction == 'OK') {
                                var json1 = {
                                    Accion: accion,
                                    RescatarSet: DatosRescate,
                                    RescateRespuesta: []
                                }
                                sap.ui.core.BusyIndicator.show();
                                that.mainService.create("/RescatarSet", json1, {
                                    success: function (result) {
                                        if (result.RescatarSet.results && result.RescatarSet.results[0].Solicitud) {
                                            if (result.RescateRespuesta.results.length > 1) {
                                                for (var i = 0; i < result.RescateRespuesta.results.length; i++) {
                                                    msgLog += result.RescateRespuesta.results[i].TextoLog + "\r\n";
                                                }
                                                sap.m.MessageToast.show(msgLog);
                                            } else {
                                                MessageBox.show(result.RescateRespuesta.results[0].TextoLog);
                                            }
                                            oTable.clearSelection();
                                            accionRescatar = false;
                                            // Refrescamos los filtros
                                            that.refrescarMonitor();
                                            that.byId("RescatarDial").close();
                                        }
                                        sap.ui.core.BusyIndicator.hide();
                                    },
                                    error: function (err) {
                                        sap.m.MessageBox.error("Solicitud no Rescatada.", {
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
                } else {
                    MessageBox.warning(this.oI18nModel.getProperty("noSoli"));
                }
            },

            onCancelRescatar: function () {
                accionRescatar = false;
                this.byId("RescatarDial").close();
            },

            // FUNCIÓN PARA SELECCIONAR EL RADIO BUTTON (Mis pedidos / Todos)
            onRadioButtonSelect: function (oEvent) {
                var oRbGroup = this.getView().byId("rbGroup"); // Get the RadioButtonGroup control
                var oSelectedButton = oRbGroup.getSelectedButton(); // Get the selected radio button

                if (oSelectedButton.getId() === "application-monitorpedidos-display-component---MonitorPedidos--rbTrue" || oSelectedButton.getId() === "application-ZPV-display-component---MonitorPedidos--rbTrue") {
                    filtroUsuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                } else if (oSelectedButton.getId() === "application-monitorpedidos-display-component---MonitorPedidos--rbFalse" || oSelectedButton.getId() === "application-ZPV-display-component---MonitorPedidos--rbFalse") {
                    filtroUsuario = "";
                };

                this.refrescarMonitor();
            },

            // -------------------------------------- FUNCIONES DE ENLACES --------------------------------------
            // FUNCIÓN DE ENLACE A LA FACTURA
            handleLinkFact: function (numFact) {
                var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                var hashUrl = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "ZPV",
                        action: "invoiceView"
                    },
                    params: {
                        "VBRK-VBELN": numFact
                    }
                }));
                oCrossAppNavigator.toExternal({
                    target: {
                        shellHash: hashUrl
                    }
                });
            },

            // FUNCIÓN DE ENLACE AL CONTRATO
            handleLinkCont: function (numCont) {
                var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                var hashUrl = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "ZPV",
                        action: "contractView"
                    },
                    params: {
                        "VBAK-VBELN": numCont
                    }
                }));
                oCrossAppNavigator.toExternal({
                    target: {
                        shellHash: hashUrl
                    }
                });
            },

            // -------------------------------------- FUNCIONES DEL ALTA DE PEDIDOS --------------------------------------
            // RESETEAR LAS VARIABLES DE LOS INPUTS DEL DIÁLOGO DE ALTA DE PEDIDOS
            resetearInputsDialogoAlta: function (key) {

                switch (key) {
                    case "All":                    
                        // Resetear Sociedad
                        vkbur = "";
                        vText = "";                
                        if (this.getView().byId("idArea")) {
                            this.getView().byId("idArea").setValue(null);
                        }

                    case "Sociedad":
                        // Resetear Cliente
                        codcli = "";
                        nomcli = "";
                        this.oComponent.setModel(new JSONModel([]), "listadoClientesAlta");
                        this.oComponent.setModel(new JSONModel([]), "CanalVentas");
                        if (this.getView().byId("idCCliente")) {
                            this.getView().byId("idCCliente").setValue(null);
                            this.getView().byId("descrProv").setValue(null);
                        }
                        if (this.pDialogClienteAlta) {
                            this.getView().byId("f_lifnrAcr").setValue(null);
                            this.getView().byId("f_nameAcr").setValue(null);
                            this.getView().byId("f_nifAcr").setValue(null);
                            this.getView().byId("f_nifcAcr").setValue(null);
                        }

                    case "Cliente":
                        // Resetear Contrato
                        numCont = "";
                        nomCont = "";
                        this.oComponent.setModel(new JSONModel([]), "ContratoCliente");
                        if (this.getView().byId("idcontract")) {
                            this.getView().byId("idcontract").setValue(null);
                        }

                    case "Contrato":
                        // Resetear Canal
                        Cvcan = "";
                        if (this.getView().byId("idCanal")) {
                            this.getView().byId("idCanal").setValue(null);
                        }

                    case "Canal":
                        // Resetear Sector
                        Cvsector = "";
                        this.oComponent.setModel(new JSONModel([]), "SectorVentas");
                        if (this.getView().byId("idSector")) {
                            this.getView().byId("idSector").setValue(null);
                        }

                    case "Sector":
                        // Resetear Línea Servicio
                        Bzirk = "";
                        Bztxt = "";
                        this.oComponent.setModel(new JSONModel([]), "ZonaVentas");
                        if (this.getView().byId("idzona")) {
                            this.getView().byId("idzona").setValue(null);
                        }
                        
                        // Resetear Tipo Pedido
                        TipoPed = "";
                        TipoPedTxt = "";
                        this.oComponent.setModel(new JSONModel([]), "TipospedidoAlta");
                        if (this.getView().byId("idCTipoPed")) {
                            this.getView().byId("idCTipoPed").setValue(null);
                        }
                    break;
                }                
            },

            // VALIDACIONES CAMBIO DE ESTADO DROPDOWNS/INPUTS ALTA DE PEDIDOS
            onChangeValueState: function (oEvent) {
                var value = sap.ui.getCore().byId(oEvent.getSource().sId);

                var response = value.getValue().toLowerCase();
                //console.log(response);
                var aItems = value.getItems();
                var bValidInput = false;

                for (var i = 0; i < aItems.length; i++) {
                    var sItemText = aItems[i].getText().toLowerCase();
                    if (response === sItemText) {
                        bValidInput = true;
                        break;
                    }

                }

                if (bValidInput) {
                    value.setValueState("None");
                } else {
                    value.setValueState("Error");
                }
            },

            // VALIDAR LOS INPUTS DEL DIÁLOGO DE ALTA DE PEDIDOS
            validarInputsDialogoAlta: function () {    
                var idArea = this.getView().byId("idArea");
                var idCCliente = this.getView().byId("idCCliente");
                var idCanal = this.getView().byId("idCanal");
                var idSector = this.getView().byId("idSector");
                var idzona = this.getView().byId("idzona");
                var idCTipoPed = this.getView().byId("idCTipoPed");
                
                if (idArea.getValue()) {
                    idArea.setValueState("None");
                } else {
                    idArea.setValueState("Error");
                }

                if (idCCliente.getValue()) {
                    idCCliente.setValueState("None");
                } else {
                    idCCliente.setValueState("Error");
                }

                if (idCanal.getValue()) {
                    idCanal.setValueState("None");
                } else {
                    idCanal.setValueState("Error");
                }

                if (idSector.getValue()) {
                    idSector.setValueState("None");
                } else {
                    idSector.setValueState("Error");
                }

                if (idzona.getValue()) {
                    idzona.setValueState("None");
                } else {
                    idzona.setValueState("Error");
                }

                if (idCTipoPed.getValue()) {
                    idCTipoPed.setValueState("None");
                } else {
                    idCTipoPed.setValueState("Error");
                }

                var validation = false;
                //VALIDACIÓN SI CONTIENE UN VALOR Y SI EL ESTADO DEL COMPONENTE NO ES ERROR 
                if (idArea.getValue() && idArea.getValueState() != "Error" &&
                    idCCliente.getValue() && idCCliente.getValueState() != "Error" &&
                    idCanal.getValue() && idCanal.getValueState() != "Error" &&
                    idSector.getValue() && idSector.getValueState() != "Error" &&
                    idzona.getValue() && idzona.getValueState() != "Error" &&
                    idCTipoPed.getValue() && idCTipoPed.getValueState() != "Error") {

                        validation = true;
                }
                return validation;
            },

            // PRESS BOTÓN 'NUEVA' PARA EL ALTA DE PEDIDOS
            onNavToAltaPedidos: function (oEvent) {
                this.modoapp = 'C';

                var config = {
                    mode: this.modoapp,

                    // Marcar como editables los input de pedido
                    cclient: false,
                    ccont: false,
                    cvcan: false,
                    cvsector: false,
                    czona: false,

                    // Habilitar Ordenes cuando se selecciona el CECO
                    cordenes: false,
                    
                    // Título
                    Title: this.oI18nModel.getProperty("visPed"),

                    // Limpiar variables
                    ItmNumber: 10,
                    Nomcont: "",
                    Numcont: "",
                }

                var oModConfig = new JSONModel();
                oModConfig.setData(config);
                this.oComponent.setModel(oModConfig, "ModoApp");
                this.oComponent.setModel(new JSONModel([]), "posPedFrag");
                this.oComponent.setModel(new JSONModel([]), "PedidoCab");
                this.oComponent.setModel(new JSONModel([]), "PedidoPos");

                this.resetearInputsDialogoAlta("All");
                this._getDialogAltaPed();
            },

            _getDialogAltaPed: function (sInputValue) {
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
                });
            },

            // FUNCIONES DEL DESPLEGABLE DE SOCIEDAD
            onChangeArea: function () {
                var inputSociedad = this.getView().byId("idArea");
                var sociedad = inputSociedad.getValue().trim();

                var sociedades = new Set(this.oComponent.getModel("AreaVentas").getData().map(item => item.Vtext));

                var validation;
                if (validation = sociedades.has(sociedad)) {

                    inputSociedad.setValueState("None");

                    vkbur = inputSociedad.getSelectedKey();
                    vText = inputSociedad._getSelectedItemText();

                    // Hacemos una búsqueda a los clientes de la sociedad para validarlos en onSubmitCliente
                    this.onBusqClientes();
                } else {
                    inputSociedad.setValueState("Error");
                    this.resetearInputsDialogoAlta("Sociedad");
                }

                this.oComponent.getModel("ModoApp").setProperty("/cclient", validation);
                this.oComponent.getModel("ModoApp").setProperty("/ccont", false);
                this.oComponent.getModel("ModoApp").setProperty("/cvcan", false);
                this.oComponent.getModel("ModoApp").setProperty("/cvsector", false);
                this.oComponent.getModel("ModoApp").setProperty("/czona", false);
                this.oComponent.getModel("ModoApp").refresh(true);
            },

            // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE CLIENTES EN EL ALTA
            // ***borrar la función***
            /*onValHelpReqCliente: function (oEvent) {
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
            },*/

            onValueHelpRequestClienteAlta: function (oEvent) {
                var sInputValue = oEvent.getSource().getValue(),
                    oView = this.getView();

                if (vkbur) {
                    this.oComponent.getModel("FiltrosCli").setProperty("/Bukrs", vkbur);
                    this.oComponent.getModel("FiltrosCli").setProperty("/Kunnr", sInputValue);

                    if (!this.pDialogClienteAlta) {
                        this.pDialogClienteAlta = Fragment.load({
                            id: oView.getId(),
                            name: "monitorpedidos.fragments.BusqClientesAlta",
                            controller: this
                        }).then(function (oDialog) {
                            oView.addDependent(oDialog);
                            return oDialog;
                        });
                    }
                    this.pDialogClienteAlta.then(function (oDialog) {
                        oDialog.open(sInputValue);
                    });
                } else {
                    MessageBox.error(this.oI18nModel.getProperty("noCli"));
                }
            },

            closeCliDiag: function () {
                this.byId("cliDial").close();
            },

            onBusqClientes: function () {
                var Kunnr = this.getView().byId("f_lifnrAcr") ? this.getView().byId("f_lifnrAcr").getValue() : "";
                var Name1 = this.getView().byId("f_nifAcr") ? this.getView().byId("f_nifAcr").getValue() : "";
                var Stcd1 = this.getView().byId("f_nameAcr") ? this.getView().byId("f_nameAcr").getValue() : "";
                var Bukrs = this.getView().byId("f_nifcAcr") ? this.getView().byId("f_nifcAcr").getValue() : vkbur;

                var aFilterIds = [],
                    aFilterValues = [];

                var addFilter = function (id, value) {
                    if (value !== "") {
                        aFilterIds.push(id);
                        aFilterValues.push(value);
                    }
                };

                addFilter("Stcd1", Stcd1);
                addFilter("Kunnr", Kunnr);
                addFilter("Name1", Name1);
                addFilter("Bukrs", Bukrs);

                var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameClientesSet", aFilters),
                ]).then(this.buildClientesModel.bind(this), this.errorFatal.bind(this));

            },

            buildClientesModel: function (values) {
                var oModelClientes = new JSONModel();
                if (values[0].results) {
                    oModelClientes.setData(values[0].results);
                }
                this.oComponent.setModel(oModelClientes, "listadoClientesAlta");
                this.oComponent.getModel("listadoClientesAlta").refresh(true);
                sap.ui.core.BusyIndicator.hide();
            },

            onSubmitCliente: function (oEvent) {
                codcli = oEvent.getParameter("value");

                var clientes = new Set(this.oComponent.getModel("listadoClientesAlta").getData().map(item => item.Kunnr));

                var validation;
                if (validation = clientes.has(codcli)) {
                    this.onReqCli();
                } else {
                    this.getView().byId("idCCliente").setValueState("Error");
                    this.resetearInputsDialogoAlta("Cliente");                    
                }
                this.oComponent.getModel("ModoApp").setProperty("/ccont", validation);
                this.oComponent.getModel("ModoApp").setProperty("/cvcan", validation);
                this.oComponent.getModel("ModoApp").setProperty("/cvsector", false);
                this.oComponent.getModel("ModoApp").setProperty("/czona", false);
                this.oComponent.getModel("ModoApp").refresh(true);
            },

            onPressCliente: function (oEvent) {
                var acr = this.getSelectClie(oEvent, "listadoClientesAlta");
                codcli = acr.Kunnr;
                nomcli = acr.Name1;
                this.onReqCli();
            },

            onReqCli: function () {
                sap.ui.core.BusyIndicator.show();

                /* **
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);

                aFilterIds.push("Bukrs");
                aFilterValues.push(vkbur);

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                revisar si tiene sentido**
                Promise.all([
                    this.readDataEntity(this.mainService, "/DameClientesSet", aFilters),
                ]).then(this.buildCliente.bind(this), this.errorFatal.bind(this));*/
                // en su lugar, usamos:
                this.DatosCliente(codcli, vkbur);

                // Establecer el nombre cuando no se ha utilizado la búsqueda
                if (!nomcli) {
                    nomcli = this.oComponent.getModel("ModoApp").getData().Nomcli;
                }

                //this.getView().byId("f_client").setValue(nomcli);
                this.getView().byId("idCCliente").setValueState("None");
                this.getView().byId("idCCliente").setValue(codcli);
                this.getView().byId("descrProv").setValue(nomcli);

                // Habilitar input de contratos
                this.oComponent.getModel("ModoApp").setProperty("/ccont", true);
                this.DameContratosCliente();

                // Habilitar input de canal
                this.oComponent.getModel("ModoApp").setProperty("/cvcan", true);
                this.CanalVentas();
                //this.ObtenerZonas();

                sap.ui.core.BusyIndicator.hide();
                this.oComponent.getModel("ModoApp").refresh(true);
                if (this.byId("cliDial")) {
                    this.byId("cliDial").close();
                }
            },

            /*buildCliente: function (values) {

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

            },*/

            DatosCliente: function (codcli, vkbur) {
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
                if (values[0].results) {
                    var oModelDatosCliente = new JSONModel();
                    oModelDatosCliente.setData(values[0].results);
                    this.oComponent.getModel("ModoApp").setProperty("/Kunnr", values[0].results[0].Kunnr);
                    this.oComponent.getModel("ModoApp").setProperty("/Codcli", values[0].results[0].Kunnr);
                    //this.oComponent.getModel("ModoApp").setProperty("/Codcli", values[0].results[0].Kunnr);
                    //this.oComponent.getModel("ModoApp").setProperty("/Nombre", values[0].results[0].Nombre);
                    this.oComponent.getModel("ModoApp").setProperty("/Nomcli", values[0].results[0].Nombre);
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

            // FUNCIONES DEL DESPLEGABLE DE CONTRATO
            DameContratosCliente: function () {
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Vkorg");
                aFilterValues.push(vkbur);

                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);

                //En SAP no se utiliza
                // aFilterIds.push("Auart");
                // aFilterValues.push(TipoPed);


                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameContratosSet", aFilters),
                ]).then(this.buildContratos.bind(this), this.errorFatal.bind(this));
            },

            buildContratos: function (values) {
                var oModelContratos = new JSONModel();
                if (values[0].results) {
                    oModelContratos.setData(values[0].results);
                }
                this.oComponent.setModel(oModelContratos, "ContratoCliente");
                this.oComponent.getModel("ContratoCliente").refresh(true);
                //this.DatosCliente(codcli, vkbur);
            },

            onChangeContrato: function () {
                var inputContrato = this.getView().byId("idcontract");
                var contrato = inputContrato.getValue().trim();

                var contratos = new Set(this.oComponent.getModel("ContratoCliente").getData().map(item => item.Ktext));

                if (!contrato) {
                    inputContrato.setValueState("None");
                    this.oComponent.getModel("ModoApp").setProperty("/cvcan", true);
                    this.oComponent.getModel("ModoApp").setProperty("/cvsector", false);
                    this.oComponent.getModel("ModoApp").setProperty("/czona", false);
                    this.getView().byId("idCanal").setSelectedKey(null);
                    this.getView().byId("idSector").setSelectedKey(null);
                    this.getView().byId("idzona").setSelectedKey(null);
                    this.getView().byId("idCTipoPed").setSelectedKey(null);
                } else if (contratos.has(contrato)) {

                    inputContrato.setValueState("None");

                    numCont = inputContrato.getSelectedKey();
                    nomCont = inputContrato._getSelectedItemText();

                    var soli = this.oComponent.getModel("ContratoCliente").getData();
                    for (var i = 0; i < soli.length; i++) {
                        if (soli[i].Vbeln === numCont) {
                            Cvcan = soli[i].Vtweg;
                            Cvsector = soli[i].Spart;
                            Bzirk = soli[i].Bzirk;
                            TipoPed = soli[i].Auart;
                            break;
                        }
                    }

                    //this.condicionPago(codcli, vkbur, Cvcan, Cvsector);
                    //this.CanalVentas();
                    //this.SectorVentas();
                    //this.ObtenerZonas();
                    //this.OficinaVenta(vkbur, Cvcan, Cvsector);
                    this.TiposPedidoAlta(TipoPed);

                    this.oComponent.getModel("ModoApp").setProperty("/cvcan", false);
                    this.oComponent.getModel("ModoApp").setProperty("/cvsector", false);
                    this.oComponent.getModel("ModoApp").setProperty("/czona", false);

                    //this.getView().byId("idCanal").setSelectedKey(Cvcan);
                    //this.getView().byId("idSector").setSelectedKey(Cvsector);
                    //this.getView().byId("idzona").setSelectedKey(Bzirk);

                    this.getView().byId("idCanal").setValue(Cvcan);
                    this.getView().byId("idSector").setValue(Cvsector);
                    this.getView().byId("idzona").setValue(Bzirk);
                } else {
                    inputContrato.setValueState("Error");
                    this.resetearInputsDialogoAlta("Contrato");
                    this.oComponent.getModel("ModoApp").setProperty("/cvcan", true);
                    this.oComponent.getModel("ModoApp").setProperty("/cvsector", false);
                    this.oComponent.getModel("ModoApp").setProperty("/czona", false);
                    this.oComponent.getModel("ModoApp").refresh(true);
                }
            },

            // FUNCIONES DEL DESPLEGABLE DE CANAL
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
                var oModelListCanalVentas = new JSONModel();
                if (values[0].results) {
                    oModelListCanalVentas.setData(values[0].results);
                }
                this.oComponent.setModel(oModelListCanalVentas, "CanalVentas");
            },

            onChangeCanal: function () {
                var inputCanal = this.getView().byId("idCanal");
                var canal = inputCanal.getValue().trim();

                var canales = new Set(this.oComponent.getModel("CanalVentas").getData().map(item => item.Vtweg));

                var validation;
                if (validation = canales.has(canal)) {
                    inputCanal.setValueState("None");
                    Cvcan = inputCanal.getSelectedKey();
                    this.SectorVentas();
                } else {
                    inputCanal.setValueState("Error");
                    this.resetearInputsDialogoAlta("Canal");
                }

                this.oComponent.getModel("ModoApp").setProperty("/cvsector", validation);
                this.oComponent.getModel("ModoApp").setProperty("/czona", false);
                this.oComponent.getModel("ModoApp").refresh(true);                
            },

            // FUNCIONES DEL DESPLEGABLE DE SECTOR
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
                var oModelListSectorVentas = new JSONModel();
                if (values[0].results) {
                    oModelListSectorVentas.setData(values[0].results);
                }
                this.oComponent.setModel(oModelListSectorVentas, "SectorVentas");
            },

            onChangeSector: function () {
                var inputSector = this.getView().byId("idSector");
                var sector = inputSector.getValue().trim();

                var sectores = new Set(this.oComponent.getModel("SectorVentas").getData().map(item => item.Spart));

                var validation;
                if (validation = sectores.has(sector)) {
                    inputSector.setValueState("None");
                    Cvsector = inputSector.getSelectedKey();
                    this.ObtenerZonas();
                } else {
                    inputSector.setValueState("Error");
                    this.resetearInputsDialogoAlta("Sector");
                }

                this.oComponent.getModel("ModoApp").setProperty("/czona", validation);
                this.oComponent.getModel("ModoApp").refresh(true); 
            },

            // FUNCIONES DEL DESPLEGABLE DE LÍNEA DE SERVICIO
            ObtenerZonas: function (vkbur) {
                this.oComponent.getModel("ModoApp").setProperty("/cvcan", true);

                Promise.all([this.readDataEntity(this.mainService, "/ZonaVentasSet", "")]).then(
                    this.buildListZonaVentas.bind(this), this.errorFatal.bind(this));
            },

            buildListZonaVentas: function (values) {
                var oModelListZonaVentas = new JSONModel();
                if (values[0].results) {
                    oModelListZonaVentas.setData(values[0].results);
                }
                this.oComponent.setModel(oModelListZonaVentas, "ZonaVentas");
            },

            onChangeZona: function () {
                var inputZona = this.getView().byId("idzona");
                var zona = inputZona.getSelectedKey().trim();

                var zonas = new Set(this.oComponent.getModel("ZonaVentas").getData().map(item => item.Bzirk));

                if (zonas.has(zona)) {
                    inputZona.setValueState("None");
                    Bzirk = inputZona.getSelectedKey();
                    Bztxt = inputZona._getSelectedItemText();
                    this.TiposPedidoAlta(TipoPed);
                } else {
                    inputZona.setValueState("Error");
                }
            },

            // FUNCIONES PARA OBTENER EL TIPO DE PEDIDO
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
                var oModelTiposPed = new JSONModel();
                if (values[0].results) {
                    oModelTiposPed.setData(values[0].results[0]);
                    TipoPed = values[0].results[0].Auart;
                    TipoPedTxt = values[0].results[0].Bezei;
                }                
                this.oComponent.setModel(oModelTiposPed, "TipospedidoAlta");
                this.oComponent.getModel("TipospedidoAlta").refresh(true);
            },


            // -------------------------------------- FUNCIONES ABRIR / MODIFICAR PEDIDO --------------------------------------
            onOpenOrder: function (oEvent) {
                this.modoapp = "D";
                var config = {
                    mode: this.modoapp
                };
                var oModConfig = new JSONModel();
                oModConfig.setData(config);
                this.oComponent.setModel(oModConfig, "ModoApp");

                var soli = this.getSelectedPed(oEvent);
                var numsol = soli.IDSOLICITUD;
                this.onSolicitarPedido(numsol);
            },

            onEditOrder: function (oEvent) {
                this.modoapp = "M";
                var config = {
                    mode: this.modoapp
                };
                var oModConfig = new JSONModel();
                oModConfig.setData(config);
                this.oComponent.setModel(oModConfig, "ModoApp");

                var soli = this.getSelectedPed(oEvent);
                var numsol = soli.IDSOLICITUD;
                this.onSolicitarPedido(numsol);
            },

            getSelectedPed: function (oEvent) {

                var oModSum = this.oComponent.getModel("listadoSolicitudes").getData();
                const sOperationPath = oEvent.getSource().getBindingContext("listadoSolicitudes").getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();

                var sum = oModSum[sOperation];

                return sum;

            },

            /*getSelectedContrato: function (oEvent) {
                var oModCont = this.oComponent.getModel("ContratoCliente").getData();
                const sOperationPath = oEvent.getSource().getBindingContext("ContratoCliente").getPath();
                const sOperation = sOperationPath.split("/").slice(-1).pop();
                var sum = oModCont[sOperation];

                return sum;
            },*/

            /*getPedido: function (pedido) {

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

            //},

            // ---------------------- FUNCIONES SOLICITAR PEDIDO: ABRIR / MODIFICAR / CREAR PEDIDO CON CONTRATO ----------------------
            onSolicitarPedido: function (numsol) {
                var that = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                Promise.all([
                    this.mainService.read("/SolicitudSet", {
                        filters: [new sap.ui.model.Filter("Vbeln", "EQ", numsol, "")],
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
                                var oModelSolicitud_Ped = new JSONModel();
                                var SolicitudPed_A = [], 
                                    SolicitudHistorial_A = [];

                                if (data.results[0].Erdat) {
                                    data.results[0].Erdat = Util.formatDate(data.results[0].Erdat);                                        
                                }

                                oModelDisplay.setData(data.results[0]);
                                that.oComponent.setModel(oModelDisplay, "DisplayPEP");

                                if (data.results[0].SolicitudAdjunto_A.results.length > 0) {
                                    var oModAdj = new JSONModel();
                                    var adjs = [],
                                        adj;
                                    data.results[0].SolicitudAdjunto_A.results.forEach(function (el) {
                                        var url;
                                        url = "";
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
                                    SolicitudPed_A.results[i].Ykostl = SolicitudPed_A.results[i].Yykostkl;
                                    SolicitudPed_A.results[i].Yaufnr = SolicitudPed_A.results[i].Yyaufnr;

                                    if (that.modoapp === "C") { // Si es creación por contrato 'C'
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
                                }

                                if (that.modoapp === "C") { // Si es creación por contrato 'C'
                                    that.oComponent.setModel(new JSONModel([]), "PedidoPosContrato");
                                    oModelSolicitud_Ped.setData(SolicitudPed_A);
                                    that.oComponent.getModel("PedidoPosContrato").setData(oModelSolicitud_Ped.getData().results);

                                    var title = that.oI18nModel.getProperty("detSolPCon") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().Vbeln).slice(-10);
                                    that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);                                    

                                }else{ // Si es visualización 'D' o modificación 'M'
                                    that.oComponent.setModel(new JSONModel([]), "DisplayPosPed");
                                    oModelSolicitud_Ped.setData(SolicitudPed_A);
                                    that.oComponent.getModel("DisplayPosPed").setData(oModelSolicitud_Ped.getData().results);

                                    var title = that.oI18nModel.getProperty("detSolP") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().Vbeln).slice(-10);
                                    that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                                }   
                                
                                that.DatosAux(data.results[0].Vbeln);
                                that.condicionPago(data.results[0].Kunnr, data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                that.DatosCliente(data.results[0].Kunnr, data.results[0].Vkorg);
                                that.OficinaVenta(data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                that.motivopedido(data.results[0].Auart, data.results[0].Vkorg);

                                that.NIApedido(data.results[0].Kunnr, data.results[0].Vkorg);                                
                                that.OrganoGestor(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.UnidadTramitadora(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.OficinaContable(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.CodigoAdmon(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.Plataformapedido(data.results[0].Kunnr, data.results[0].Vkorg, "");

                                if (that.modoapp === "M" || that.modoapp === "C") {
                                    that.DameMonedas();
                                }
                                
                                that.oComponent.getModel("ModoApp").setProperty("/Clasepedido", that.oComponent.getModel("DisplayPEP").getProperty("/Auart"));
                                that.oComponent.getModel("ModoApp").setProperty("/CvCanal", that.oComponent.getModel("DisplayPEP").getProperty("/Vtweg"));
                                that.oComponent.getModel("ModoApp").setProperty("/CvSector", that.oComponent.getModel("DisplayPEP").getProperty("/Spart"));
                                that.oComponent.getModel("ModoApp").setProperty("/NomSoc", that.oComponent.getModel("DisplayPEP").getProperty("/Vtext"));
                                that.oComponent.getModel("ModoApp").setProperty("/Ykostl", that.oComponent.getModel("DisplayPEP").getProperty("/Yykostkl"));
                                that.oComponent.getModel("ModoApp").setProperty("/Yaufnr", that.oComponent.getModel("DisplayPEP").getProperty("/Yyaufnr"));
                                that.oComponent.getModel("ModoApp").refresh(true);
                                that.oComponent.setModel(new JSONModel([]), "PedidoPos");                                

                            }
                            if (response) {
                                if (that.modoapp === "C") { // Si es creación por contrato 'C'
                                    that._getDialogPedContrato();
                                }else{ // Si es visualización 'D' o modificación 'M'
                                    oRouter.navTo("RouteAltaPedidos");
                                }
                            }
                        },
                    }),
                ]);
            },

            // -------------------------------------- FUNCIONES CREAR PEDIDO --------------------------------------
            // FUNCIÓN CREAR PEDIDO
            onNavAlta: function () {                
                var validation = this.validarInputsDialogoAlta();
                if (validation){
                    this.modoapp = "C";
                    this.oComponent.getModel("ModoApp").setProperty("/Vkbur", vkbur);
                    this.oComponent.getModel("ModoApp").setProperty("/NomSoc", vText);
                    this.oComponent.getModel("ModoApp").setProperty("/Codcli", codcli);
                    this.oComponent.getModel("ModoApp").setProperty("/Nomcli", nomcli);
                    this.oComponent.getModel("ModoApp").setProperty("/Numcont", numCont);
                    this.oComponent.getModel("ModoApp").setProperty("/Nomcont", nomCont);
                    this.oComponent.getModel("ModoApp").setProperty("/CvCanal", Cvcan);
                    this.oComponent.getModel("ModoApp").setProperty("/CvSector", Cvsector);
                    this.oComponent.getModel("ModoApp").setProperty("/Bzirk", Bzirk);
                    this.oComponent.getModel("ModoApp").setProperty("/Bztxt", Bztxt);
                    this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", TipoPed);
                    this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", TipoPedTxt);                    
                    this.oComponent.getModel("ModoApp").refresh(true);

                    if (numCont) { // Si el pedido tiene contrato
                        this.onSolicitarPedido(numCont);
                    }else{ // Si el pedido no es con contrato
                        this.oComponent.setModel(new JSONModel([]), "Adjuntos");
                        this.oComponent.setModel(new JSONModel(), "datosAdj");
                        this.oComponent.setModel(new JSONModel(), "HistorialSol");
                        
                        //this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", '0');
                        //this.oComponent.getModel("PedidoCab").setProperty("/Moneda", 'EUR');
                        //this.oComponent.getModel("PedidoCab").refresh(true);
                        
                        var title = this.oI18nModel.getProperty("detSolP");
                        this.oComponent.setModel(new JSONModel(), "DisplayPEP")
                        this.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                        this.oComponent.getModel("DisplayPEP").refresh(true);
    
                        this.condicionPago(codcli, vkbur, Cvcan, Cvsector);
                        this.OficinaVenta(vkbur, Cvcan, Cvsector);
                        this.motivopedido(TipoPed, vkbur);
    
                        this.NIApedido(codcli, vkbur);
                        this.OrganoGestor(codcli, vkbur, "");
                        this.UnidadTramitadora(codcli, vkbur, "");
                        this.OficinaContable(codcli, vkbur, "");
                        this.CodigoAdmon(codcli, vkbur, "");
                        this.Plataformapedido(codcli, vkbur, "");
                        this.DameMonedas();

                        /**
                         * Cuando ya navegamos al alta debe de borrar todos los campos de opciones 
                         * para que cuando se entre de nuevo aparezcan vacios para crear una nueva peticion
                         */
                        this.resetearInputsDialogoAlta("All");
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("RouteAltaPedidos");
                    }                    
                }
            },

            // FUNCIONES CREAR PEDIDO EN EL DIÁLOGO DE CONTRATOS
            onNavAltaContrato: function () {
                var oTable = this.getView().byId("TablaPosicionesContrato");
                var aSelectedIndices = oTable.getSelectedIndices();
                var pedidosContrato = this.oComponent.getModel("PedidoPosContrato").getData();
                var pedidosContrato_Aux = JSON.parse(JSON.stringify(pedidosContrato)); // Copy data model without references
                var results_array = [];
                var posnr_ItmNumber;

                for (var i = 0; i < aSelectedIndices.length; i++) {
                    var indice = aSelectedIndices[i];
                    var posicionPed = pedidosContrato_Aux[indice];
                    posnr_ItmNumber = (i + 1) * 10;
                    posicionPed.ItmNumber = posnr_ItmNumber;
                    results_array.push(posicionPed);
                }
                this.oComponent.setModel(new JSONModel([]), "PedidoPos");
                this.oComponent.getModel("PedidoPos").setData(results_array);
                this.resetearInputsDialogoAlta("All");

                this.closeOptionsDiagContrato();

                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteAltaPedidos");
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
            },

            closeOptionsDiagContrato: function () {
                this.byId("OptionDialContrato").close();
            },

            // -------------------------------------- FUNCIONES OBTENER DATOS ADICIONALES --------------------------------------
            // FUNCIONES PARA OBTENER DATOS AUXILIARES
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
            
            // FUNCIONES PARA OBTENER LA CONDICIÓN DE PAGO
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

            // FUNCIONES PARA OBTENER LA OFICINA DE VENTA
            OficinaVenta: function (vkbur, Cvcan, Cvsector) {
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Vkorg");
                aFilterValues.push(vkbur);

                aFilterIds.push("Vtweg");
                aFilterValues.push(Cvcan);

                aFilterIds.push("Spart");
                aFilterValues.push(Cvsector);

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameOficinasSet", aFilters),
                ]).then(this.buildModelOfVentas.bind(this), this.errorFatal.bind(this));
            },

            buildModelOfVentas: function (values) {
                var oModelOfVentas = new JSONModel();
                if (values[0].results) {
                    oModelOfVentas.setData(values[0].results);
                }
                this.oComponent.setModel(oModelOfVentas, "OficinaVenta");
                this.oComponent.getModel("OficinaVenta").refresh(true);
            },

            // FUNCIONES PARA OBTENER EL MOTIVO DE PEDIDO
            motivopedido: function (TipoPed, AreaVenta) {
                
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

            buildMotivo: function (values) {
                var oModelMotivo = new JSONModel();
                if (values[0].results) {                    
                    oModelMotivo.setData(values[0].results);                    
                }
                this.oComponent.setModel(oModelMotivo, "listadoMotivo");
                this.oComponent.getModel("listadoMotivo").refresh(true);
            },

            // FUNCIONES PARA OBTENER EL NIA
            NIApedido: function (codcli, vkbur) {
                
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

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
                if (values[0].results && values[0].results.length > 0 && values[0].results[0].Nia) {
                    this.oComponent.getModel("ModoApp").setProperty("/Nia", values[0].results[0].Nia);
                    this.oComponent.getModel("ModoApp").refresh(true);
                }
            },

            // FUNCIONES PARA OBTENER EL ORGANO GESTOR
            OrganoGestor: function (codcli, vkbur, Vbeln) {
                
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

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
                if (values[0].results && values[0].results.length > 0 && values[0].results[0].Centges) {
                    this.oComponent.getModel("ModoApp").setProperty("/Centges", values[0].results[0].Centges);
                    this.oComponent.getModel("ModoApp").refresh(true);
                }
            },

            // FUNCIONES PARA OBTENER LA UNIDAD TRAMITADORA
            UnidadTramitadora: function (codcli, vkbur, vbeln) {
                
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

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
                if (values[0].results && values[0].results.length > 0 && values[0].results[0].Centuni) {
                    this.oComponent.getModel("ModoApp").setProperty("/Centuni", values[0].results[0].Centuni);
                    this.oComponent.getModel("ModoApp").refresh(true);
                    //var oModelUndTram = new JSONModel();
                    //oModelUndTram.setData(values[0].results);
                    //this.oComponent.setModel(oModelUndTram, "UndTram");
                    
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

            // FUNCIONES PARA OBTENER LA OFICINA CONTABLE
            OficinaContable: function (codcli, vkbur, Vbeln) {
                
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

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
                if (values[0].results && values[0].results.length > 0 && values[0].results[0].Centpro) {
                    this.oComponent.getModel("ModoApp").setProperty("/Centpro", values[0].results[0].Centpro);
                    this.oComponent.getModel("ModoApp").refresh(true);
                    
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

            // FUNCIONES PARA OBTENER EL CÓDIGO ADMINISTRADOR
            CodigoAdmon: function (codcli, vkbur, vbeln) {
                
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                
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
                if (values[0].results && values[0].results.length > 0 && values[0].results[0].Codadm) {
                    this.oComponent.getModel("ModoApp").setProperty("/Codadm", values[0].results[0].Codadm);
                    this.oComponent.getModel("ModoApp").refresh(true);
                    
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

            // FUNCIONES PARA OBTENER LA PLATAFORMA DEL PEDIDO
            Plataformapedido: function (codcli, vkbur, Vbeln) {
                
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

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
                if (values[0].results && values[0].results.length > 0 && values[0].results[0].Plataforma) {
                    this.oComponent.getModel("ModoApp").setProperty("/Plataforma", values[0].results[0].Plataforma);
                    this.oComponent.getModel("ModoApp").refresh(true);
                    
                    /*var oModelPlataforma = new JSONModel();
                    oModelPlataforma.setData(values[0].results);
                    this.oComponent.setModel(oModelPlataforma, "Plataforma");*/
                }
            },

            // FUNCIONES PARA OBTENER LAS MONEDAS
            DameMonedas: function () {
                /*var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                
                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);
                aFilterIds.push("Bukrs");
                aFilterValues.push(vkbur);

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);*/

                Promise.all([
                    this.readDataEntity(this.mainService, "/DameMonedasSet", ""),
                ]).then(this.buildMonedas.bind(this), this.errorFatal.bind(this));

            },

            buildMonedas: function (values) {
                var oModelMoneda = new JSONModel();
                if (values[0].results) {
                    oModelMoneda.setData(values[0].results);                    
                }
                this.oComponent.setModel(oModelMoneda, "listadoMoneda");
            },

            











            // -------------------------------------- FUNCIONES BACKUP --------------------------------------
            // **ELIMINAR**
            onNavAlta_OLD: function () {
                // var idArea = this.getView().byId("idArea");
                // var idCCliente = this.getView().byId("idCCliente");
                // var idCanal = this.getView().byId("idCanal");
                // var idSector = this.getView().byId("idSector");
                // var idzona = this.getView().byId("idzona");
                // var idCTipoPed = this.getView().byId("idCTipoPed");

                // Si existe contrato
                if (numCont) {
                    var that = this;                    
                    //const oI18nModel = this.oComponent.getModel("i18n");
                    //ar aFilterIds, aFilterValues, aFilters;

                    //aFilterIds = ["Vbeln"];
                    //aFilterValues = [numCont];

                    //aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                    Promise.all([
                        this.mainService.read("/SolicitudSet", {
                            //filters: aFilters,
                            filters: [new sap.ui.model.Filter("Vbeln", "EQ", numCont, "")],
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
                                        data.results[0].Erdat = Util.formatDate(data.results[0].Erdat);                                        
                                    }

                                    oModelDisplay.setData(data.results[0]);
                                    that.oComponent.setModel(oModelDisplay, "DisplayPEP");

                                    if (data.results[0].SolicitudAdjunto_A.results.length > 0) {
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
                                        oModHist.setData(historial);
                                        that.oComponent.setModel(oModHist, "HistorialSol");

                                    } else {
                                        that.oComponent.setModel(new JSONModel(), "HistorialSol");
                                    }

                                    SolicitudPed_A = data.results[0].SolicitudPed_A

                                    for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                        // Poner el Netwr como texto
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
                                    
                                    that.NIApedido(data.results[0].Kunnr, data.results[0].Vkorg);
                                    that.OrganoGestor(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                    that.UnidadTramitadora(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                    that.OficinaContable(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                    that.CodigoAdmon(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                    that.Plataformapedido(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                    that.DameMonedas();

                                    var title = that.oI18nModel.getProperty("detSolPCon") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().Vbeln).slice(-10);
                                    that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                                    //that.oComponent.getModel("DisplayPEP").setProperty("/param", false);

                                }
                                if (response) {
                                    that._getDialogPedContrato();
                                }
                            },
                        }),
                    ]);
                } else {

                    //var modeApp = this.oComponent.getModel("ModoApp").getData().mode; //RECOGEMOS EL MODO EN QUE VIENE
                    //this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", TipoPed);
                    /**
                     * FRAMUMO - 05.03.24 - Recogemos el tipoPedido del input ya que las variables van vacias
                     */
                    /*if (TipoPed == "" || TipoPed == undefined)  {
                        this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", this.getView().byId("idCTipoPed").getValue());
                    } else {
                        this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", TipoPed);
                    }
                    TipoPed = "";*/
                    this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", TipoPed);

                    /*if (filtroClasePed === "" || filtroClasePed === undefined) {
                        this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", this.getView().byId("idCTipoPed").getValue()); 
                    } else {
                        this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", filtroClasePed);
                    }
                    //this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", filtroClasePed);
                    filtroClasePed = "";*/
                    this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", TipoPedTxt);
                    /**
                     *  FRAMUMO - FIN 05.03.24
                     */
                    this.oComponent.getModel("ModoApp").setProperty("/SocPed", socPed);
                    this.oComponent.getModel("ModoApp").setProperty("/NomSoc", vText);
                    this.oComponent.getModel("ModoApp").setProperty("/Vkbur", vkbur);
                    this.oComponent.getModel("ModoApp").setProperty("/Vtext", vText);
                    this.oComponent.getModel("ModoApp").setProperty("/CvCanal", Cvcan);
                    this.oComponent.getModel("ModoApp").setProperty("/CvSector", Cvsector);
                    this.oComponent.getModel("ModoApp").setProperty("/Bzirk", Bzirk);
                    this.oComponent.getModel("ModoApp").setProperty("/Bztxt", Bztxt);
                    this.oComponent.getModel("ModoApp").setProperty("/Codcli", codcli);
                    this.oComponent.getModel("ModoApp").setProperty("/Nombre", nomcli);
                    this.oComponent.getModel("ModoApp").setProperty("/Nomcli", nomcli);
                    this.oComponent.getModel("ModoApp").setProperty("/Numcont", numCont);
                    this.oComponent.getModel("ModoApp").setProperty("/Nomcont", nomCont);
                    this.oComponent.getModel("ModoApp").setProperty("/CondPago", condPago);
                    //this.oComponent.getModel("ModoApp").setProperty("/PriceDate", new Date());
                    this.oComponent.getModel("ModoApp").refresh(true);

                    this.oComponent.setModel(new JSONModel([]), "Adjuntos");
                    this.oComponent.setModel(new JSONModel(), "datosAdj");
                    //if (modeApp === 'C') {
                    this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", '0');
                    this.oComponent.getModel("PedidoCab").setProperty("/Moneda", 'EUR');
                    this.oComponent.getModel("PedidoCab").refresh(true);
                    //}

                    var title = this.oI18nModel.getProperty("detSolP");
                    this.oComponent.setModel(new JSONModel(), "DisplayPEP")
                    this.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                    this.oComponent.getModel("DisplayPEP").refresh(true);

                    this.NIApedido(codcli, vkbur);
                    this.OrganoGestor(codcli, vkbur, "");
                    this.UnidadTramitadora(codcli, vkbur, "");
                    this.OficinaContable(codcli, vkbur, "");
                    this.CodigoAdmon(codcli, vkbur, "");
                    this.Plataformapedido(codcli, vkbur, "");
                    this.DameMonedas();


                    /* 
                    VALIDACIÓN SI LOS CAMPOS VAN VACÍOS PARA QUE NO SE REDIRIJA A LA SECCIÓN DE ALTA DE PEDIDO 
                    */
                    if (idArea.getValue()) {
                        idArea.setValueState("None");
                    } else {
                        idArea.setValueState("Error");
                    }

                    if (idCCliente.getValue()) {
                        idCCliente.setValueState("None");
                    } else {
                        idCCliente.setValueState("Error");
                    }

                    if (idCanal.getValue()) {
                        idCanal.setValueState("None");
                    } else {
                        idCanal.setValueState("Error");
                    }

                    if (idSector.getValue()) {

                        idSector.setValueState("None");
                    } else {
                        idSector.setValueState("Error");
                    }

                    if (idzona.getValue()) {

                        idzona.setValueState("None");
                    } else {
                        idzona.setValueState("Error");
                    }

                    if (idCTipoPed.getValue()) {

                        idCTipoPed.setValueState("None");
                    } else {
                        idCTipoPed.setValueState("Error");
                    }

                    //VALIDACIÓN SI CONTIENE UN VALOR Y SI EL ESTADO DEL COMPONENTE NO ES ERROR 
                    if (idArea.getValue() && idArea.getValueState() != "Error" &&
                        idCCliente.getValue() && idCCliente.getValueState() != "Error" &&
                        idCanal.getValue() && idCanal.getValueState() != "Error" &&
                        idSector.getValue() && idSector.getValueState() != "Error" &&
                        idzona.getValue() && idzona.getValueState() != "Error" &&
                        idCTipoPed.getValue() && idCTipoPed.getValueState() != "Error") {

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
                }
            },

            // **ELIMINAR**
            onNavAltaContrato_OLD: function () {
                
                /*this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", TipoPed);
                TipoPed = "";
                this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", filtroClasePed);
                filtroClasePed = "";*/

                /**
                     * FRAMUMO - 05.03.24 - Recogemos el tipoPedido del input ya que las variables van vacias
                     */
                /*if (TipoPed == "" || TipoPed == undefined)  {
                    this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", this.getView().byId("idCTipoPed").getValue());
                } else {
                    this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", TipoPed);
                }
                TipoPed = "";

                if (filtroClasePed === "" || filtroClasePed === undefined) {
                    this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", this.getView().byId("idCTipoPed").getValue()); 
                } else {
                    this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", filtroClasePed);
                }
                //this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", filtroClasePed);
                filtroClasePed = "";*/
                /**
                 *  FRAMUMO - FIN 05.03.24
                 */


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
                //this.actualizaimp();

                //this.NIApedido(codcli, vkbur);
                //this.DIRpedido(codcli, vkbur);
                /* this.OrganoGestor(codcli, vkbur);
                 this.UnidadTramitadora(codcli, vkbur);
                 this.OficinaContable(codcli, vkbur);
                 this.CodigoAdmon(codcli, vkbur);
                 this.Plataformapedido(codcli, vkbur);*/
                //this.DameMonedas();

                /**
                 * Cuando ya navegamos al alta debe de borrar todos los campos de opciones 
                 * para que cuando se entre de nuevo aparezcan vacios para crear una nueva peticion
                 */
                /*this.getView().byId("idCTipoPed").setSelectedKey(null);
                //this.getView().byId("idCSociedad").setSelectedKey(null);
                this.getView().byId("idArea").setSelectedKey(null);
                this.getView().byId("idCanal").setSelectedKey(null);
                this.getView().byId("idSector").setSelectedKey(null);
                this.getView().byId("idzona").setSelectedKey(null);
                this.getView().byId("idCCliente").setValue(null);
                this.getView().byId("descrProv").setValue(null);
                this.getView().byId("idcontract").setSelectedKey(null);*/

                this.resetearInputsDialogoAlta("All");

                this.closeOptionsDiagContrato();

                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteAltaPedidos");
            },

            // **ELIMINAR**
            onOpenOrder_OLD: function (oEvent) {

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
                //const oI18nModel = this.oComponent.getModel("i18n");
                var soli = this.getSelectedPed(oEvent);
                var numsol = soli.IDSOLICITUD;

                var that = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                //var Totalizado;
                //var aFilterIdsCli, aFilterValuesCli, aFiltersCli;

                this.modoapp = "D";

                var config = {
                    mode: this.modoapp
                };

                var oModConfig = new JSONModel();
                oModConfig.setData(config);

                that.oComponent.setModel(oModConfig, "ModoApp");

                /*if (modoapp === "D"){
                   var claseped = this.getView("AltaPedidos.view.xml").byId("f_claseped");
                   claseped.setEditable(false);
                }*/

                //var aFilterIds, aFilterValues, aFilters;
                
                //var modApp;

                //aFilterIds = ["Vbeln"];
                //aFilterValues = [numsol.IDSOLICITUD];

                //aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.mainService.read("/SolicitudSet", {
                        //filters: aFilters,
                        filters: [new sap.ui.model.Filter("Vbeln", "EQ", numsol, "")],
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
                                //var oModelSolicitud_Cli = new JSONModel();
                                //var oModelSolicitud_Adj = new JSONModel();
                                var oModelSolicitud_Ped = new JSONModel();
                                /*var oModelSolicitud_Apr = new JSONModel();
                                var oModelSolicitud_Hist = new JSONModel();
                                var SolicitudAdjunto_A = [],
                                    Solicitud_Cli_A = [],
                                    SolicitudMod_A = [],
                                    SolicitudPed_A = [],
                                    SolicitudAprobacion_A = [],
                                    SolicitudHistorial_A = [];*/
                                var SolicitudPed_A = [], 
                                    SolicitudHistorial_A = [];

                                if (data.results[0].Erdat) {
                                    data.results[0].Erdat = Util.formatDate(data.results[0].Erdat);                                        
                                }

                                oModelDisplay.setData(data.results[0]);
                                that.oComponent.setModel(oModelDisplay, "DisplayPEP");

                                if (data.results[0].SolicitudAdjunto_A.results.length > 0) {
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

                                /*for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                    Totalizado += parseFloat(SolicitudPed_A.results[i].Netwr);
                                }*/

                                that.oComponent.setModel(new JSONModel([]), "DisplayPosPed");
                                oModelSolicitud_Ped.setData(SolicitudPed_A);
                                that.oComponent.getModel("DisplayPosPed").setData(oModelSolicitud_Ped.getData().results);
                                //that.oComponent.getModel("PedidoPos").setData(oModelSolicitud_Ped.getData().results);
                                //that.oComponent.setModel(that.oComponent.getModel("PedidoPos"), "DisplayPosPed");
                                
                                /*aFilterIdsCli.push("Kunnr");
                                aFilterValuesCli.push(data.results[0].Kunnr);
 
                                aFilterIdsCli.push("Bukrs");
                                aFilterValuesCli.push(data.results[0].Vkorg);
 
 
                                aFiltersCli = Util.createSearchFilterObject(aFilterIdsCli, aFilterValuesCli);
                                */
                                that.DatosAux(data.results[0].Vbeln);
                                that.condicionPago(data.results[0].Kunnr, data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                that.DatosCliente(data.results[0].Kunnr, data.results[0].Vkorg);
                                that.OficinaVenta(data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                that.motivopedido(data.results[0].Auart, data.results[0].Vkorg);                                

                                that.NIApedido(data.results[0].Kunnr, data.results[0].Vkorg);                                
                                that.OrganoGestor(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.UnidadTramitadora(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.OficinaContable(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.CodigoAdmon(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.Plataformapedido(data.results[0].Kunnr, data.results[0].Vkorg, "");

                                var title = that.oI18nModel.getProperty("detSolP") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().Vbeln).slice(-10);
                                that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                                //that.oComponent.getModel("DisplayPEP").setProperty("/param", false);

                                //Boton de CRUD
                                /*var button, modAdj;

                                if (that.modoapp === "D") {
                                    button = this.oI18nModel.getProperty("grabMod");

                                    if (data.results[0].ZdatePs !== '') {
                                        modAdj = false;
                                    }
                                }

                                var config = {
                                    //buttCRUD: button,
                                    //modAdj: modAdj,
                                    mode: that.modoapp
                                };

                                var oModConfig = new JSONModel();
                                oModConfig.setData(config);

                                that.oComponent.setModel(oModConfig, "ModoApp");*/

                                that.oComponent.getModel("ModoApp").setProperty("/Clasepedido", that.oComponent.getModel("DisplayPEP").getProperty("/Auart"));
                                that.oComponent.getModel("ModoApp").setProperty("/Vtext", that.oComponent.getModel("DisplayPEP").getProperty("/Spart"));
                                that.oComponent.getModel("ModoApp").setProperty("/CvCanal", that.oComponent.getModel("DisplayPEP").getProperty("/Vtweg"));
                                that.oComponent.getModel("ModoApp").setProperty("/CvSector", that.oComponent.getModel("DisplayPEP").getProperty("/Spart"));
                                that.oComponent.getModel("ModoApp").setProperty("/NomSoc", that.oComponent.getModel("DisplayPEP").getProperty("/Bukrs"));
                                that.oComponent.getModel("ModoApp").setProperty("/Nomcli", that.oComponent.getModel("DisplayPEP").getProperty("/Kunnr"));
                                that.oComponent.getModel("ModoApp").setProperty("/Ykostl", that.oComponent.getModel("DisplayPEP").getProperty("/Yykostkl"));
                                that.oComponent.getModel("ModoApp").setProperty("/Yaufnr", that.oComponent.getModel("DisplayPEP").getProperty("/Yyaufnr"));
                                that.oComponent.setModel(new JSONModel([]), "PedidoPos");
                                that.oComponent.getModel("ModoApp").refresh(true);
                                that.actualizaimp();

                            }
                            if (response) {
                                //var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                                oRouter.navTo("RouteAltaPedidos");
                            }
                        },
                    }),
                ]);

            },

            // **ELIMINAR**
            onEditOrder_OLD: function (oEvent) {
                //const oI18nModel = this.oComponent.getModel("i18n");
                var soli = this.getSelectedPed(oEvent);
                var numsol = soli.IDSOLICITUD;

                var that = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                //var Totalizado;

                //var aFilterIdsCli, aFilterValuesCli, aFiltersCli;
                //var aFilterIds, aFilterValues, aFilters;

                
                //var modApp;

                this.modoapp = "M";

                var config = {
                    mode: this.modoapp
                };

                var oModConfig = new JSONModel();
                oModConfig.setData(config);

                that.oComponent.setModel(oModConfig, "ModoApp");

                //aFilterIds = ["Vbeln"];
                //aFilterValues = [numsol.IDSOLICITUD];

                //aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                Promise.all([
                    this.mainService.read("/SolicitudSet", {
                        //filters: aFilters,
                        filters: [new sap.ui.model.Filter("Vbeln", "EQ", numsol, "")],
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
                                //var oModelSolicitud_Cli = new JSONModel();
                                //var oModelSolicitud_Adj = new JSONModel();
                                var oModelSolicitud_Ped = new JSONModel();
                                /*var oModelSolicitud_Apr = new JSONModel();
                                var oModelSolicitud_Hist = new JSONModel();
                                var SolicitudAdjunto_A = [],
                                    Solicitud_Cli_A = [],
                                    SolicitudMod_A = [],
                                    SolicitudPed_A = [],
                                    SolicitudAprobacion_A = [],
                                    SolicitudHistorial_A = [];*/

                                var SolicitudPed_A = [],
                                    SolicitudHistorial_A = [];

                                //that.oComponent.setModel(new JSONModel([]), "PedidoPos");

                                if (data.results[0].Erdat) {
                                    data.results[0].Erdat = Util.formatDate(data.results[0].Erdat);                                        
                                }

                                oModelDisplay.setData(data.results[0]);
                                that.oComponent.setModel(oModelDisplay, "DisplayPEP");

                                if (data.results[0].SolicitudAdjunto_A.results.length > 0) {
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
                                    oModHist.setData(historial);
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

                                /*for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                    Totalizado += parseFloat(SolicitudPed_A.results[i].Netwr);
                                }*/

                                that.oComponent.setModel(new JSONModel([]), "DisplayPosPed");
                                oModelSolicitud_Ped.setData(SolicitudPed_A);
                                that.oComponent.getModel("DisplayPosPed").setData(oModelSolicitud_Ped.getData().results);
                                //that.oComponent.setModel(that.oComponent.getModel("PedidoPos"), "DisplayPosPed");

                                that.DatosAux(data.results[0].Vbeln);
                                that.condicionPago(data.results[0].Kunnr, data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                that.DatosCliente(data.results[0].Kunnr, data.results[0].Vkorg);
                                that.OficinaVenta(data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                that.motivopedido(data.results[0].Auart, data.results[0].Vkorg);
                                
                                that.NIApedido(data.results[0].Kunnr, data.results[0].Vkorg);
                                that.OrganoGestor(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.UnidadTramitadora(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.OficinaContable(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.CodigoAdmon(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.Plataformapedido(data.results[0].Kunnr, data.results[0].Vkorg, "");
                                that.DameMonedas();

                                var title = that.oI18nModel.getProperty("detSolP") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().Vbeln).slice(-10);
                                that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                                //that.oComponent.getModel("DisplayPEP").setProperty("/param", false);

                                //Boton de CRUD
                                /*var button, modAdj;

                                if (that.modoapp === "M") {
                                    button = this.oI18nModel.getProperty("grabMod");

                                    if (data.results[0].ZdatePs !== '') {
                                        modAdj = false;
                                    }
                                }

                                var config = {
                                    //buttCRUD: button,
                                    //modAdj: modAdj,
                                    mode: that.modoapp

                                };

                                var oModConfig = new JSONModel();
                                oModConfig.setData(config);

                                that.oComponent.setModel(oModConfig, "ModoApp");*/

                                that.oComponent.getModel("ModoApp").setProperty("/Clasepedido", that.oComponent.getModel("DisplayPEP").getProperty("/Auart"));
                                //that.oComponent.getModel("ModoApp").setProperty("/NomSoc", that.oComponent.getModel("DisplayPEP").getProperty("/Vtext"));
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
                                that.actualizaimp();

                            }
                            if (response) {
                                oRouter.navTo("RouteAltaPedidos");
                            }
                        },
                    }),
                ]);
            },

            // **ELIMINAR**
            actualizaimp: function () {
                var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
                //this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", '0');
                //this.oComponent.getModel("PedidoCab").setProperty("/Moneda", 'EUR');

                //MODO DE MODIFICACION Y VISUALIZACION DE PEDIDOS
                if (modeApp == 'M' || modeApp == 'D') {
                    var datos = this.oComponent.getModel("DisplayPosPed").getData();
                    var sumCant = 0;
                    var sumImp = 0;
                    var sumCantBase = 0;
                    var moneda = "EUR";
                    for (var i = 0; i < datos.length; i++) {
                        var cantidades = datos[i].Kwmeng;
                        var cantbases = datos[i].Kpein;
                        var moneda = datos[i].Waerk;
                        var importes = datos[i].Netpr;
                        sumCant = (Number(sumCant) + Number(cantidades)).toFixed(2);
                        sumImp = (Number(sumImp) + Number(importes)).toFixed(2);
                        sumCantBase = (Number(sumCantBase) + Number(cantbases)).toFixed(2);
                    }
                    //MODO DE CREACION DE PEDIDOS
                } else if (modeApp == 'C') {
                    var datos = this.oComponent.getModel("PedidoPos").getData();
                    var sumCant = 0;
                    var sumImp = 0;
                    var sumCantBase = 0;
                    var moneda = "EUR";
                    for (var i = 0; i < datos.length; i++) {
                        var cantidades = datos[i].ReqQty;
                        var cantbases = datos[i].Kpein;
                        var moneda = datos[i].Waerk;
                        var importes = datos[i].CondValue;
                        sumCant = (Number(sumCant) + Number(cantidades)).toFixed(2);
                        sumImp = (Number(sumImp) + Number(importes)).toFixed(2);
                        sumCantBase = (Number(sumCantBase) + Number(cantbases)).toFixed(2);
                    }
                }
                var sumTotaldiv = 0;
                sumTotaldiv = (Number(sumImp / sumCantBase) * Number(sumCant)).toFixed(2);
                this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", sumTotaldiv);
                this.oComponent.getModel("PedidoCab").setProperty("/Moneda", moneda);
                this.oComponent.getModel("PedidoCab").refresh(true);
            },


            /*onBusqMateriales: function () {
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

            buildMaterialesModel: function (values) {
                if (values[0].results) {
                    sap.ui.core.BusyIndicator.hide();
                    var oModelMateriales = new JSONModel();
                    oModelMateriales.setData(values[0].results);
                    this.oComponent.setModel(oModelMateriales, "listadoMateriales");
                    this.oComponent.getModel("listadoMateriales").refresh(true);
                }
            },*/

            /*onBusqOrdenes: function () {
                var Ceco = filtroCeco;
                var Aufnr = this.getView().byId("f_codOrd").getValue();
                var Ktext = this.getView().byId("f_nomOrd").getValue();
                var Bukrs = this.getView().byId("f_ordbukrs").getValue();
                //var Bukrs = this.getView().byId("f_nifcAcr").getValue();

                var aFilterIds, aFilterValues, aFilters;

                //FILTRADO DE CLIENTES////////////////////////////////////////////////////////////////////////////////////////////

                aFilterIds = [
                    "Ceco",
                    "Aufnr",
                    "Ktext",
                    "Bukrs"
                ];
                aFilterValues = [
                    Ceco,
                    Aufnr,
                    Ktext,
                    Bukrs
                ];

                if (Ceco == "" || Ceco == undefined) {
                    var i = aFilterIds.indexOf("Ceco");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Aufnr == "" || Aufnr == undefined) {
                    var i = aFilterIds.indexOf("Aufnr");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Ktext == "" || Ktext == undefined) {
                    var i = aFilterIds.indexOf("Ktext");

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

                aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                sap.ui.core.BusyIndicator.show();

                Promise.all([
                    this.readDataEntity(this.mainService, "/OrdenIngresoSet", aFilters),
                ]).then(this.buildOrdenesModel.bind(this), this.errorFatal.bind(this));
            },

            buildOrdenesModel: function (values) {
                if (values[0].results) {
                    sap.ui.core.BusyIndicator.hide();
                    var oModelOrdenes = new JSONModel();
                    oModelOrdenes.setData(values[0].results);
                    this.oComponent.setModel(oModelOrdenes, "listadoOrdenes");
                    this.oComponent.getModel("listadoOrdenes").refresh(true);
                }
            },*/

            /*onBusqCecos: function () {
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

                if (Kostl == "" || Kostl == undefined) {
                    var i = aFilterIds.indexOf("Kostl");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Ltext == "" || Ltext == undefined) {
                    var i = aFilterIds.indexOf("Ltext");

                    if (i !== -1) {
                        aFilterIds.splice(i, 1);
                        aFilterValues.splice(i, 1);
                    }
                }

                if (Bukrs == "" || Bukrs == undefined) {
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

            buildCecosModel: function (values) {
                if (values[0].results) {
                    sap.ui.core.BusyIndicator.hide();
                    var oModelCecos = new JSONModel();
                    oModelCecos.setData(values[0].results);
                    this.oComponent.setModel(oModelCecos, "listadoCecos");
                    this.oComponent.getModel("listadoCecos").refresh(true);
                }
            },*/

            /*onBusqOficina: function () {
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

            buildOficinasModel: function (values) {
                if (values[0].results) {
                    sap.ui.core.BusyIndicator.hide();
                    var oModelOficinas = new JSONModel();
                    oModelOficinas.setData(values[0].results);
                    this.oComponent.setModel(oModelOficinas, "listadoOficinas");
                    this.oComponent.getModel("listadoOficinas").refresh(true);
                }
            },*/

            /*onPressMaterial: function (oEvent) {
                var mat = this.getSelectMat(oEvent, "listadoMateriales");
                filtroMaterial = mat.Matnr;
                nommat = mat.Maktx;
                this.getView().byId("f_material").setValue(filtroMaterial);
                this.byId("matDial").close();
            },

            onPressOrdenes: function (oEvent) {
                var ord = this.getSelectOrd(oEvent, "listadoOrdenes");
                filtroOrden = ord.Aufnr;
                nomord = ord.Ktext;
                this.getView().byId("f_ordenes").setValue(filtroOrden);
                this.byId("ordDial").close();
            },

            onPressCecos: function (oEvent) {
                var ceco = this.getSelectCeco(oEvent, "listadoCecos");
                filtroCeco = ceco.Kostl;
                nomceco = ceco.Ltext;
                this.getView().byId("f_cecos").setValue(filtroCeco);
                this.byId("cecoDial").close();
            },

            onPressOficinas: function (oEvent) {
                var ofi = this.getSelectOficinas(oEvent, "listadoOficinas");
                vkbur = ofi.Vkbur;
                this.getView().byId("f_oficinas").setValue(vkbur);
                this.byId("ofiDial").close();
            },*/

            /*CloseMatDiag: function () {
                this.byId("matDial").close();
            },

            CloseOrdDiag: function () {
                this.byId("ordDial").close();
            },

            CloseCecoDiag: function () {
                this.byId("cecoDial").close();
            },

            CloseOficinasDiag: function () {
                this.byId("ofiDial").close();
            },*/


            /*onValueHelpRequestMat: function (oEvent) {
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
            },*/

            /*_getDialogMaterial: function (sInputValue) {
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
            },*/

            //METODOS PARA LA IMPORTACIÓN DE UN CSV////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            /*onCSV: function (oEvent) {

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
                /*var sCustomConfirmButtonText = oButton.data("confirmButtonText");
                oDialog.setConfirmButtonText(sCustomConfirmButtonText);

                // toggle compact style
                syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
            },

            /*_configDialogCliente: function (oDialog) {
                var sResponsivePadding = oButton.data("responsivePadding");
                var sResponsiveStyleClasses =
                    "sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";

                if (sResponsivePadding) {
                    oDialog.addStyleClass(sResponsiveStyleClasses);
                }
                /*else {
                                   oDialog.removeStyleClass(sResponsiveStyleClasses);
                               }*/
            /*

                            // Set custom text for the confirmation button
                            var sCustomConfirmButtonText = oButton.data("confirmButtonText");
                            oDialog.setConfirmButtonText(sCustomConfirmButtonText);

                            // toggle compact style
                            syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
                        },*/

            /*_getDialogUpload: function (sInputValue) {
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
            },*/

            /*onUpload: function (e) {
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
            },*/


            


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

            /*createColumnConfig: function (oTable) {
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
                /*

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
            },*/

            /*onValueHelpRequest: function (oEvent) {
                this._getDialogCliente();
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
            },*/

            /*filterOption: function (oEvent) {
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
            },*/


            /*
            onChangeTipoPed: function () {
                //var mode = this.oComponent.getModel("ModoApp").getData();
                TipoPed = this.getView().byId("idCTipoPed").getSelectedKey();
                filtroClasePed = this.getView().byId("idCTipoPed")._getSelectedItemText();
                //mode.cped = true;
                //this.oComponent.getModel("ModoApp").refresh(true);
                //this.oComponent.getModel("ModoApp").setProperty("/cped", true);
                //this.oComponent.getModel("ModoApp").refresh(true);
                this.motivopedido(TipoPed, vkbur);
                //                this.oComponent.getModel("ModoApp").refresh(true);
            },*/

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


            /*onReqProv: function () {
                /*var mode = this.oComponent.getModel("ModoApp").getValue();
                mode.ccontr = true;
                this.oComponent.getModel("ModoApp").refresh(true);*/
                /*this.oComponent.getModel("ModoApp").setProperty("/ccontr", true);
                this.oComponent.getModel("ModoApp").refresh(true);
            },*/


            /*CloseOptionsDiag: function () {
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
            },*/
        
            //METODO PARA DESCARGA EXCEL
            onDownExcel: function (oEvent) {
                /*var aCols, oRowBinding, oSettings, oSheet, oTable;

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
                }*/
                this.DownLoadExcell(
                    filtroUsuario,
                    //Numped,
                    filtroFechaDsd,
                    filtroFechaHst,
                    filtroImporteDsd,
                    filtroImporteHst,
                    filtroEstado,
                    filtroClienteCod,
                    filtroCeco,
                    filtroOrden,
                    filtroOficionaVentas,
                    filtroLineaServicio,
                    filtroMaterial,
                    filtroResponsable,
                    filtroClasePed);
            },

            DownLoadExcell: function (filtroUsuario, filtroFechaDsd, filtroFechaHst, filtroImporteDsd, filtroImporteHst, filtroEstado, filtroClienteCod, filtroCeco, filtroOrden, filtroOficinaVentas, filtroLineaServicio, filtroMaterial, filtroResponsable, filtroClasePed) {
                var aFilterIds = [],
                    aFilterValues = [];

                var addFilter = function (id, value) {
                    if (value) {
                        aFilterIds.push(id);
                        aFilterValues.push(value);
                    }
                };

                addFilter("USUARIO", filtroUsuario);
                addFilter("FECHAD", Date.parse(filtroFechaDsd));
                addFilter("FECHAH", Date.parse(filtroFechaHst));
                addFilter("IMPORTED", filtroImporteDsd);
                addFilter("IMPORTEH", filtroImporteHst);
                addFilter("ESTADO", filtroEstado);
                addFilter("CLIENTE", filtroClienteCod);
                addFilter("CECO", filtroCeco);
                addFilter("ORDEN", filtroOrden);
                addFilter("ORGVENTAS", filtroOficinaVentas);
                addFilter("LINEA", filtroLineaServicio);
                addFilter("MATERIAL", filtroMaterial);
                addFilter("ZRESPONSABLE", filtroResponsable);
                addFilter("TIPO", filtroClasePed);

                var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

                //sap.ui.core.BusyIndicator.show();


                Promise.all([
                    this.readDataExcel(this.mainService, "/DamePedidosSet", aFilters)
                ]);
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



            /**
             * FRAMUMO - INI 04.03.24 - Modificamos la función de envio Mail 
             * para que mande la info desde el modelo de clientes
             */
            onEnviarMailAltaCliente: function () {
                // Se recuperan los valores del formulario
                /*var inputCIF = this.getView().byId("inputNifCliente").getValue();
                var inputNombre = this.getView().byId("inputNombreCliente").getValue();
                var inputTelefono = this.getView().byId("inputTelefonoCliente").getValue();
                var inputMailContacto = this.getView().byId("inputMailContacto").getValue();
                var inputCalle =  this.getView().byId("inputCalleCliente").getValue();
                var inputCodPostal = this.getView().byId("inputCodPostalCliente").getValue();
                var inputPoblacion = this.getView().byId("inputPoblacionCliente").getValue();
                var inputPais = this.getView().byId("inputPaisCliente").getValue();
                var inputRegion = this.getView().byId("inputRegionCliente").getValue();
                var inputPlataforma = this.getView().byId("inputPlataformaCliente").getValue();
                var inputOrganoGestor = this.getView().byId("inputOrganoGestorCliente").getValue();
                var inputUnidadTramitadora = this.getView().byId("inputUnidadTramitadoraCliente").getValue();
                var inputOficinaContable = this.getView().byId("inputOficinaContableCliente").getValue();
                var inputAdministracion = this.getView().byId("inputAdministracionCliente").getValue();
                var inputCondicionPago = this.getView().byId("inputCondicionPagoCliente").getValue();
                var idSociedad = this.getView().byId("idAreaClientes").getSelectedKey();
                var nombreSociedad = this.getView().byId("idAreaClientes").getValue();*/

                var altaClientes = this.oComponent.getModel("AltaClientes").getData();
                var that = this;
                var sUploadedFileName;

                //Tratamos los adjuntos que se envían en el alta de un cliente
                var oModAdj = this.oComponent.getModel("Adjuntos").getData();
                var oModAdj2 = [],
                    numdoc = 0;

                oModAdj.forEach(function (el) {
                    var adj;
                    numdoc = numdoc + 1;

                    if (el.URL) {
                        adj = {
                            Numdoc: numdoc.toString(),
                            Filename: el.Filename,
                            Descripcion: el.Descripcion
                        }
                    } else {
                        adj = {
                            Numdoc: numdoc.toString(),
                            Mimetype: el.Mimetype,
                            Filename: el.Filename,
                            Descripcion: el.Filename,
                            Content: el.Content
                        }
                    }
                    oModAdj2.push(adj);
                });


                /*var jsonAltaCliente = {
                    Vkorg: idSociedad,
                    Vtext: nombreSociedad,
                    Cif: inputCIF,
                    Nombre: inputNombre,
                    DirCalle: inputCalle,
                    DirCp: inputCodPostal,
                    DirPoblacion: inputPoblacion,
                    DirPais: inputPais,
                    DirRegion: inputRegion,
                    Mail: inputMailContacto,
                    Telefono: inputTelefono,
                    CondPago: inputCondicionPago,
                    Plataforma: inputPlataforma,
                    Centges: inputOrganoGestor,
                    Centuni: inputUnidadTramitadora,
                    Centpro: inputOficinaContable,
                    Codadm: inputAdministracion
                }*/

                var jsonAltaCliente = {
                    Vkorg: this.getView().byId("idAreaClientes").getSelectedKey(),
                    Vtext: this.getView().byId("idAreaClientes").getValue(),
                    Cif: altaClientes.Cif,
                    Nombre: altaClientes.Nombre,
                    DirCalle: altaClientes.DirCalle,
                    DirCp: altaClientes.DirCp,
                    DirPoblacion: altaClientes.DirPoblacion,
                    DirPais: altaClientes.DirPais,
                    DirRegion: altaClientes.DirRegion,
                    Mail: altaClientes.Mail,
                    Telefono: altaClientes.Telefono,
                    CondPago: altaClientes.CondPago,
                    Plataforma: altaClientes.Plataforma,
                    Centges: altaClientes.Centges,
                    Centuni: altaClientes.Centuni,
                    Centpro: altaClientes.Centpro,
                    Codadm: altaClientes.Codadm,
                    FicheroClienteSet: oModAdj2,
                    RespEnvioSet: {}
                };

                /*this.getView().byId("inputNifCliente").setValue("");
                this.getView().byId("inputNombreCliente").setValue("");
                this.getView().byId("inputTelefonoCliente").setValue("");
                this.getView().byId("inputMailContacto").setValue("");
                this.getView().byId("inputCalleCliente").setValue("");
                this.getView().byId("inputCodPostalCliente").setValue("");
                this.getView().byId("inputPoblacionCliente").setValue("");
                this.getView().byId("inputPaisCliente").setValue("");
                this.getView().byId("inputRegionCliente").setValue("");
                this.getView().byId("inputPlataformaCliente").setValue("");
                this.getView().byId("inputOrganoGestorCliente").setValue("");
                this.getView().byId("inputUnidadTramitadoraCliente").setValue("");
                this.getView().byId("inputOficinaContableCliente").setValue("");
                this.getView().byId("inputAdministracionCliente").setValue("");
                this.getView().byId("inputCondicionPagoCliente").setValue("");
                this.getView().byId("idAreaClientes").setSelectedKey(null);*/

                sap.ui.core.BusyIndicator.show();

                this.mainService.create("/AltaClienteSet", jsonAltaCliente, {
                    success: function (result) {
                        if (result.Coderror == 0) {
                            MessageBox.show(result.RespEnvioSet.Textolog, {
                                icon: sap.m.MessageBox.Icon.SUCCESS,
                                title: "Mail enviado",
                                initialFocus: null,
                                onClose: function (oAction) {
                                    that.getView().byId("idAreaClientes").setSelectedKey(null);
                                    that.oComponent.setModel(new JSONModel(), "AltaClientes");
                                    that.oComponent.setModel(new JSONModel([]), "Adjuntos");
                                    for (var i = 0; i < oModAdj2.length; i++) {
                                        sUploadedFileName = oModAdj2[i].Filename;
                                        setTimeout(function () {
                                            var oUploadCollection = that.getView().byId("UploadCollection");
                                            console.log("Entra");
                                            for (var i = 0; i < oUploadCollection.getItems().length; i++) {
                                                console.log("Entra2");
                                                if (oUploadCollection.getItems()[i].getFileName() === sUploadedFileName) {
                                                    oUploadCollection.removeItem(oUploadCollection.getItems()[i]);
                                                    break;
                                                }
                                            }

                                            // delay the success message in order to see other messages before
                                            //MessageToast.show("Event uploadComplete triggered");
                                        }.bind(this), 8000);
                                    }
                                    that.byId("OptionDialogCliente").close();
                                }
                            });
                        } else {
                            sap.m.MessageBox.error(result.Message, {
                                title: "Error",
                                initialFocus: null,
                            });
                        }
                        sap.ui.core.BusyIndicator.hide();
                    },
                    error: function (err) {
                        sap.m.MessageBox.error("Error, no se ha podido enviar el mail para el alta del cliente.", {
                            title: "Error",
                            initialFocus: null,
                        });
                        sap.ui.core.BusyIndicator.hide();
                    },
                    //async: true,
                });

            },

            UploadComplete: function (oEvent) {
                //this.getView().getModel().refresh();
                var sUploadedFileName = oEvent.getParameter("files")[0].fileName;
                setTimeout(function () {
                    var oUploadCollection = this.getView().byId("UploadCollection");
                    console.log("Entra");
                    for (var i = 0; i < oUploadCollection.getItems().length; i++) {
                        console.log("Entra2");
                        if (oUploadCollection.getItems()[i].getFileName() === sUploadedFileName) {
                            oUploadCollection.removeItem(oUploadCollection.getItems()[i]);
                            break;
                        }
                    }

                    // delay the success message in order to see other messages before
                    //MessageToast.show("Event uploadComplete triggered");
                }.bind(this), 8000);

            },

            /**
             * FRAMUMO - FIN 04.03.24 - Modificamos la función de envio Mail 
             * para que mande la info desde el modelo de clientes
             */

            /**
                FRAMUMO - INI 04.03.24 - Creamos funciones nuevas para
                la subida de ficheros adjuntos en Alta Clientes 
             */

            onChange: function (oEvt) {
                var fileDetails = oEvt.getParameters("file").files[0];
                sap.ui.getCore().fileUploaderArr = [];

                if (fileDetails) {
                    var mimeDet = fileDetails.type,
                        fileName = fileDetails.name;
                    var adjuntos = this.oComponent.getModel("Adjuntos").getData();
                    var nadj = adjuntos.length;

                    this.base64conversionMethod(mimeDet, fileName, fileDetails, nadj, adjuntos);
                } else {
                    sap.ui.getCore().fileUploaderArr = []
                }

                /*for (var i = 0; i < fileDetails.length; i++) {
                    if (fileDetails[i]) {
                        var mimeDet = fileDetails[i].type,
                            fileName = fileDetails[i].name;
                        var adjuntos = oModel.oData.Adjuntos;
                        var nadj = adjuntos.length;

                        this.base64conversionMethod(mimeDet, fileName, fileDetails[i], nadj, adjuntos);
                    }
                    
                }*/
            },

            onSelectionChange: function(oEvent) {
                var aSelectedFiles = oEvent.getParameter("files");
                console.log("Selected files:", aSelectedFiles);
            },

            base64conversionMethod: function (fileMime, fileName, fileDetails, DocNum, adjuntos) {
                var that = this;

                FileReader.prototype.readAsBinaryString = function (fileData) {
                    var binary = "";
                    var reader = new FileReader();

                    // eslint-disable-next-line no-unused-vars
                    reader.onload = function (e) {
                        var bytes = new Uint8Array(reader.result);
                        var length = bytes.byteLength;
                        for (var i = 0; i < length; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        that.base64conversionRes = btoa(binary);

                        var numdoc = (DocNum + 1).toString();
                        adjuntos.push({
                            "Numdoc": numdoc,
                            "Mimetype": fileMime,
                            "Filename": fileName,
                            "Content": that.base64conversionRes
                        });

                        oModel.oData.Adjuntos = adjuntos;
                        //that.getView().byId("fileUploader").setValue("");
                    };
                    reader.readAsArrayBuffer(fileData);
                };
                var reader = new FileReader();
                reader.onload = function (readerEvt) {
                    var binaryString = readerEvt.target.result;
                    that.base64conversionRes = btoa(binaryString);
                    var numdoc = (DocNum + 1).toString();
                    adjuntos.push({
                        "Numdoc": numdoc,
                        "Mimetype": fileMime,
                        "Content": that.base64conversionRes
                    });

                    oModel.oData.Adjuntos = adjuntos;
                    //that.getView().byId("fileUploader").setValue("");
                };
                reader.readAsBinaryString(fileDetails);

            },

            onStartUpload: function () {
                var oModAdj = new JSONModel();
                //Creamos el modelo con los Adjuntos para realizar la subida
                oModAdj = oModel.oData.Adjuntos;
                this.uploadFicheros(oModAdj);
            },

            onUploadComplete: function (oEvent) {
                this.getView().getModel().refresh();
                var sUploadedFileName = oEvent.getParameter("files")[0].fileName;
                setTimeout(function () {
                    var oUploadCollection = this.getView().byId("UploadCollection");
                    console.log("Entra");
                    for (var i = 0; i < oUploadCollection.getItems().length; i++) {
                        console.log("Entra2");
                        if (oUploadCollection.getItems()[i].getFileName() === sUploadedFileName) {
                            oUploadCollection.removeItem(oUploadCollection.getItems()[i]);
                            break;
                        }
                    }

                    // delay the success message in order to see other messages before
                    MessageToast.show("Event uploadComplete triggered");
                }.bind(this), 8000);

            },

            onBeforeUploadStarts: function (oEvent) {
                var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
                    name: "slug",
                    value: oEvent.getParameter("fileName")
                });

                oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
                oModel.getView().getModel();
                oModel.refreshSecurityToken();
                var oHeaders = oModel.oHeaders;
                var sToken = oHeaders['x-csrf-token'];
                var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
                    name: "x-csrf-token",
                    value: sToken
                });
                oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);
            },

            uploadFicheros: function (jsonAdjuntos) {
                let tasks = [];
                var oJson = {};
                var oModelAdj = this.getView().getModel();
                //var crear = "Han sido adjuntado correctamente el documento.";

                oModelAdj.setUseBatch(false);

                for (let i = 0; i < jsonAdjuntos.length; i++) {
                    // eslint-disable-next-line no-unused-vars
                    const delay = 10 * i;
                    oJson = {
                        //Ntrransporte: ntransporte,
                        Value: jsonAdjuntos[i].Content,
                        Filename: jsonAdjuntos[i].Filename,
                        Mimetype: jsonAdjuntos[i].Mimetype
                    };

                    //tasks.push(this.uploadFile(oModelAdj, oJson));
                }

                // eslint-disable-next-line no-unused-vars
                let results = Promise.all(tasks).then(results => {
                    //const itemsLength = oUploadCollection.getItems().length;
                    const itemsLength = results;

                    setTimeout(function () {
                        var oUploadCollection = this.byId("UploadCollection");
                        for (var i = 0; i < itemsLength.length; i++) {
                            var sUploadedFileName = itemsLength[i].Filename;
                            for (var j = 0; j < oUploadCollection.getItems().length; j++) {
                                if (oUploadCollection.getItems()[j].getFileName() === sUploadedFileName) {
                                    oUploadCollection.removeItem(oUploadCollection.getItems()[j]);
                                    oModel.oData.Adjuntos = [];
                                    sap.ui.core.BusyIndicator.hide();
                                    break;
                                }
                            }
                        }
                    }.bind(this), 2000);

                    /*for (var i = 0; i < itemsLength.length; i++) {
                        if (itemsLength[i].Filename) {
                            oUploadCollection.removeItem(oUploadCollection.getItems()[0]);
                            oModel.oData.Adjuntos = [];
                            sap.ui.core.BusyIndicator.hide();
                        }

                    }*/
                    sap.m.MessageBox.show(this.oI18nModel.getProperty("crear"), {
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        // eslint-disable-next-line no-unused-vars
                        onClose: function (oAction) {}
                    });
                });
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
                    inputTelefonoCliente.setValueState("Error");
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
                    inputEmailCliente.setValueState("Error");
                }
            },

            /* FORMATEAR NUMERO IMPORTE */
            onFormatImporte: function (Netwr) {
                importeFormat = this.oComponent.getModel("Usuario").getData()[0].Dcpfm;
                var numberFormat;
                switch (importeFormat) {

                    case "": //1.234.567,89
                        numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                            "maxFractionDigits": 2,
                            "decimalSeparator": ",",
                            "groupingEnabled": true,
                            "groupingSeparator": '.'
                        });

                        break;
                    case "X": //1,234,567.89
                        numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                            "maxFractionDigits": 2,
                            "decimalSeparator": ".",
                            "groupingEnabled": true,
                            "groupingSeparator": ','
                        });
                        break;
                    case "Y": //1 234 567,89
                        numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                            "maxFractionDigits": 2,
                            "decimalSeparator": ",",
                            "groupingEnabled": true,
                            "groupingSeparator": ' '
                        });
                        break;
                }
                var numeroFormateado = numberFormat.format(Netwr);
                return numeroFormateado;
            },

            /* FORMATEAR FECHA DOCUMENTO  */
            onFormatFechaDocVenta: function (Fechadoc) {

                fechaDocVentaFormat = this.oComponent.getModel("Usuario").getData()[0].Datfm;
                var dateFormat = Fechadoc;

                switch (fechaDocVentaFormat) {
                    case "1":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "dd.MM.YYYY"
                        });

                        break;
                    case "2":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "MM/dd/YYYY"
                        });
                        break;
                    case "3":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "MM-dd-YYYY"
                        });
                        break;

                    case "4":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "YYYY.MM.dd"
                        });
                        break;
                    case "5":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "YYYY/MM/dd"
                        });
                        break;
                    case "6":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "YYYY-MM-dd"
                        });
                        break;
                    case "7":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "GYY.MM.dd"
                        });
                        break;
                    case "8":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "GYY/MM/dd"
                        });
                        break;
                    case "9":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "GYY-MM-dd"
                        });
                        break;
                    case "A":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "YYYY/MM/dd"
                        });
                        break;
                    case "B":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "YYYY/MM/dd"
                        });

                        break;
                    case "C":
                        dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            pattern: "YYYY/MM/dd"
                        });

                        break;
                }

                var fechaFormateada = dateFormat.format(Fechadoc);
                return fechaFormateada;
            }
        });
    });