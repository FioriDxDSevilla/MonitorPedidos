sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Sorter",
    "sap/ui/core/library",
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
    function (Controller, Sorter, CoreLibrary, JSONModel, Fragment, History, Filter, FilterOperator, Util, MessageBox, ExportTypeCSV, Export, exportLibrary) {
        "use strict";

        // Ordenación monitor
        var SortOrder = CoreLibrary.SortOrder;

        // Variables no utilizadas ???
        //var sumTotal, nomSoc, Posped, Centges, Centuni, Centpro, Codadm, Plataforma, sAprob, socPed, condPago, vedit, checkMisPed, checkTodos;
        // var EdmType = exportLibrary.EdmType;

        // Variables utilizadas para los botones
        var btnEditar, accionLiberar, btnRescatar, accionRescatar;
        // Variables utilizadas en los filtros
        var filtroUsuario, filtroFechaDsd, filtroFechaHst, filtroImporteDsd, filtroImporteHst, filtroEstado, filtroClienteCod, filtroClienteTxt, filtroCeco, filtroOrden, filtroOficionaVentas, filtroLineaServicio, filtroMaterial, filtroClasePed, filtroResponsable, nomceco, nomord, nommat;
        //var Usuario, Numped, Fechad, Fechah, Imported, Importeh, sStatus, Cliente, codceco, codord, LineaServicio, codmat, ClasePed, responsable;
        var usuario;
        var arrayFiltroClasePed = [];

        // variables utilizadas para los inputs del diálogo de alta
        var vkbur, vText, codcli, nomcli, numCont, nomCont, Cvcan, Cvsector, Bzirk, Bztxt, TipoPed;//, TipoPedTxt;

        // Variables globales para el formateo de los campos 'FECHA DOC. VENTA' e 'IMPORTE'

        //var fechaDocVentaFormat;
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

        //var importeFormat;
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
                this.oComponent.getModel("Filtros").setProperty("/visibleMotivoRechazo", false);
                this.oComponent.getModel("Filtros").setProperty("/visibleFechaVenci", false);
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

                /* Lógica que llama al metodo handleRouteMatched cuando se realiza un Router */
                this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this._oRouter.attachRouteMatched(this.handleRouteMatched, this);
            },

            /* Metodo para que cada vez que se abra la vista AltaPedidos, se realice la actualización del importe */
            handleRouteMatched: function (evt) {
                if (evt.getParameter("name") !== "MonitorPedidos") {
                    // Cuando se acceda al monitor por primera vez, se refrescará desde la función getUser()
                    if (filtroUsuario) {
                        this.refrescarMonitor();
                    }
                }
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

            // -------------------------------------- EXCEPCIONES (ERROR FATAL) --------------------------------------
            errorFatal: function (e) {
                MessageBox.error(this.oI18nModel.getProperty("errFat"));
                sap.ui.core.BusyIndicator.hide();
            },

            // -------------------------------------- FILTROS Y ORDENACIÓN TABLA MONITOR --------------------------------------
            filterTablePedidos: function(oEvent) {
                var oColumn = oEvent.getParameter("column");

                if (oColumn != this.byId("Netwr") && 
                    oColumn != this.byId("Fechadoc")) {
                    return;
                }

                oEvent.preventDefault();

                var sValue = oEvent.getParameter("value");

                function clear() {
                    this._oPriceFilter = null;
                    oColumn.setFiltered(false);
                    this._filter();
                }

                if (!sValue) {
                    clear.apply(this);
                    return;
                }

                if (oColumn === this.byId("Netwr")) {

                    var fValue = null;
                    try {
                        fValue = parseFloat(sValue, 10);
                    } catch (e) {
                        // nothing
                    }

                    if (!isNaN(fValue)) {
                        this._oPriceFilter = new Filter(oColumn.mProperties.sortProperty, FilterOperator.BT, fValue - 100, fValue + 100);
                        oColumn.setFiltered(true);
                        this._filter();
                    } else {
                        clear.apply(this);
                    }
                }else {
                    let dateFormat = sap.ui.core.format.DateFormat.getDateInstance();
                    var dFecha = dateFormat.parse(sValue);
                    
                    // Si es de tipo fecha y el valor es válido
                    if (dFecha && !isNaN(dFecha)) {

                        var dDateStart = dFecha;
                        var dDateEnd = new Date(dDateStart);

                        // Set first date as start of day
                        dDateStart.setMilliseconds(0);
                        dDateStart.setSeconds(0);
                        dDateStart.setMinutes(0);
                        dDateStart.setHours(0);


                        // Set second date as end of day
                        dDateEnd.setMilliseconds(0);
                        dDateEnd.setSeconds(59);
                        dDateEnd.setMinutes(59);
                        dDateEnd.setHours(23);

                        this._oPriceFilter = new Filter(oColumn.mProperties.sortProperty, FilterOperator.BT, dDateStart, dDateEnd);
                        oColumn.setFiltered(true);
                        this._filter();
                    } else {
                        clear.apply(this);
                    }                
                }
            },
            _filter: function() {
                var oFilter = null;

                if (this._oGlobalFilter && this._oPriceFilter) {
                    oFilter = new Filter([this._oGlobalFilter, this._oPriceFilter], true);
                } else if (this._oGlobalFilter) {
                    oFilter = this._oGlobalFilter;
                } else if (this._oPriceFilter) {
                    oFilter = this._oPriceFilter;
                }

                this.byId("idTablePEPs").getBinding().filter(oFilter, "Application");
            },

            sortTablePedidos: function(oEvent) {
                var oCurrentColumn = oEvent.getParameter("column");

                this._resetSortingState(); //No multi-column sorting

                if (oCurrentColumn != this.byId("Netwr")) {
                    return;
                }

                oEvent.preventDefault();

                var sOrder = oEvent.getParameter("sortOrder");

                oCurrentColumn.setSorted(true);
                oCurrentColumn.setSortOrder(sOrder);

                var oSorter = new Sorter(oCurrentColumn.getSortProperty(), sOrder === SortOrder.Descending);
                //The date data in the JSON model is string based. For a proper sorting the compare function needs to be customized.
                oSorter.fnCompare = function(a, b) {

                    if (b == null) {
                        return -1;
                    }
                    if (a == null) {
                        return 1;
                    }

                    var aa = parseFloat(a);
                    var bb = parseFloat(b);

                    if (aa < bb) {
                        return -1;
                    }
                    if (aa > bb) {
                        return 1;
                    }
                    return 0;
                };

                this.byId("idTablePEPs").getBinding().sort(oSorter);
            },

            _resetSortingState: function() {
                var oTable = this.byId("idTablePEPs");
                var aColumns = oTable.getColumns();
                for (var i = 0; i < aColumns.length; i++) {
                    aColumns[i].setSorted(false);
                }
            },

            // -------------------------------------- FUNCIONES IMPORTE --------------------------------------
            calcularImporteTotal: function (cantidad, cantbase, importe) {
                return Number((importe / cantbase) * cantidad).toFixed(2);
            },

            // -------------------------------------- FUNCIONES FORMATEO DE CAMPOS --------------------------------------
            // FUNCION PARA FORMATEAR NUMERO IMPORTE
            onFormatImporte: function (Netwr) {
                var numFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance();
                return numFormat.format(Netwr);
            },

            // FUNCION PARA FORMATEAR LA FECHA DOCUMENTO
            onFormatFechaDocVenta: function (Fechadoc) {
                let dateFormat = sap.ui.core.format.DateFormat.getDateInstance();
                return dateFormat.format(Fechadoc);
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
                    oModelClasePed.setSizeLimit(values[0].results.length);
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

                var inputUsuario = this.getView().byId("f_usuario").getValue().trim();
                if (inputUsuario) {
                    filtroUsuario = inputUsuario;
                    this.getView().byId("rbGroup").setSelectedIndex(1); // Cambiamos el radio button a 'Todos'
                } else {
                    var oRbGroup = this.getView().byId("rbGroup"); // Get the RadioButtonGroup control
                    var oSelectedButton = oRbGroup.getSelectedButton(); // Get the selected radio button

                    if (oSelectedButton.getId() === "application-monitorpedidos-display-component---MonitorPedidos--rbTrue" || oSelectedButton.getId() === "application-ZPV-display-component---MonitorPedidos--rbTrue") {
                        filtroUsuario = this.oComponent.getModel("Usuario").getData()[0].Bname;
                    } else if (oSelectedButton.getId() === "application-monitorpedidos-display-component---MonitorPedidos--rbFalse" || oSelectedButton.getId() === "application-ZPV-display-component---MonitorPedidos--rbFalse") {
                        filtroUsuario = "";
                    };
                }

                //Numped = this.getView().byId("f_numsolic").getValue().trim();
                filtroFechaDsd = this.getView().byId("DTPdesde").getValue().trim();
                filtroFechaHst = this.getView().byId("DTPhasta").getValue().trim();
                filtroImporteDsd = this.getView().byId("f_impdesde").getValue().trim();
                filtroImporteHst = this.getView().byId("f_imphasta").getValue().trim();
                //filtroEstado
                // Si no está informado el input, reseteamos los valores del cliente
                if(!this.getView().byId("f_client").getValue().trim()){
                    filtroClienteCod = "";
                    filtroClienteTxt = "";
                }else if (!filtroClienteTxt) { // Si el usuario no ha seleccionado un cliente desde el diálogo, buscamos el código en el input
                    filtroClienteCod = this.getView().byId("f_client").getValue().trim();
                }
                filtroCeco = this.getView().byId("f_cecos").getValue().trim();
                filtroOrden = this.getView().byId("f_ordenes").getValue().trim();
                filtroOficionaVentas = this.getView().byId("f_oficinas").getValue().trim();
                filtroMaterial = this.getView().byId("f_material").getValue().trim();
                filtroResponsable = this.getView().byId("f_approv").getValue().trim();
                filtroLineaServicio = this.getView().byId("f_line").getSelectedKey();
                filtroClasePed = arrayFiltroClasePed;

                this.refrescarMonitor();
                filtroClienteTxt = "";
            },

            // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE CLIENTES EN LOS FILTROS PRINCIPALES
            onValueHelpRequestClienteMonitor: function (oEvent) {
                this._getDialogClienteMonitor();
            },

            _getDialogClienteMonitor: function (sInputValue) {
                this.oComponent.setModel(new JSONModel(), "FiltrosCli");
                this.oComponent.setModel(new JSONModel(), "listadoClientes"); 

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
                var Stcd1 = this.getView().byId("f_nameAcrMoni").getValue().trim();
                var Kunnr = this.getView().byId("f_lifnrAcrMoni").getValue().trim();
                var Name1 = this.getView().byId("f_nifAcrMoni").getValue().trim();

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
                this.oComponent.setModel(new JSONModel(), "FiltrosCeco");
                this.oComponent.setModel(new JSONModel(), "listadoCecos"); 

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
                var Kostl = this.getView().byId("f_codCecoMoni").getValue().trim();
                var Ltext = this.getView().byId("f_nomCecoMoni").getValue().trim();
                var Bukrs = this.getView().byId("f_cecoSocMoni").getValue().trim();

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
                this.oComponent.setModel(new JSONModel(), "FiltrosOrd");
                this.oComponent.setModel(new JSONModel(), "listadoOrdenes"); 

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
                var Aufnr = this.getView().byId("f_codOrdMoni").getValue().trim();
                var Ktext = this.getView().byId("f_nomOrdMoni").getValue().trim();
                var Bukrs = this.getView().byId("f_ordbukrsMoni").getValue().trim();

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
                this.oComponent.setModel(new JSONModel(), "FiltrosOficina");
                this.oComponent.setModel(new JSONModel(), "listadoOficinas"); 

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
                var Vkorg = this.getView().byId("f_VkorgOfiMoni").getValue().trim();
                var Vtweg = this.getView().byId("f_VtwegOfiMoni").getValue().trim();
                var Spart = this.getView().byId("f_SpartOfiMoni").getValue().trim();

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
                this.oComponent.setModel(new JSONModel(), "FiltrosMat");
                this.oComponent.setModel(new JSONModel(), "listadoMateriales");

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
                var Matnr = this.getView().byId("f_codMatMoni").getValue().trim();
                var Maktx = this.getView().byId("f_nomMatMoni").getValue().trim();
                var Matkl = this.getView().byId("f_grArtMoni").getValue().trim();

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

                // -- ACTUALIZAR EL TOTAL EN CADA ESTADO --
                var estados = ["", "REDA", "APRB", "FINA", "FACT", "PDTE", "COBR", "DEN", "BTN_APRB"];

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

                    if (estado === 'BTN_APRB') {
                        addFilter("ESTADO", "APRB");
                        addFilter("ZRESPONSABLE", usuario);
                    }else{
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
                    }                    

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
                            case 'BTN_APRB':
                                that.oComponent.getModel("Filtros").setProperty("/totalaprb", results[0]);
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
                let visibleMotivoRechazo = false, visibleFechaVenci = false;

                switch (skey) {
                    case "Free":
                        filtroEstado = "";
                        break;
                    case "Ok":
                        filtroEstado = "REDA";
                        btnEditar = true;
                        visibleMotivoRechazo = true;
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
                        visibleFechaVenci = true;
                        break;
                    case "Sales":
                        filtroEstado = "COBR";
                        break;
                    case "Cancel":
                        filtroEstado = "DEN";
                        visibleMotivoRechazo = true;
                        break;
                }

                // Visualizar columnas
                this.oComponent.getModel("Filtros").setProperty("/visibleMotivoRechazo", visibleMotivoRechazo);
                this.oComponent.getModel("Filtros").setProperty("/visibleFechaVenci", visibleFechaVenci);
                this.oComponent.getModel("Filtros").refresh(true);

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
                } else {
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
                } else {
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
                        // Quitar la marca roja si hay algún campo con error
                        if(this.getView().byId("fDatosCab")){
                            this.getView().byId("idArea").setValueState("None");
                            this.getView().byId("idCCliente").setValueState("None");
                            this.getView().byId("descrProv").setValueState("None");
                            this.getView().byId("idcontract").setValueState("None");
                            this.getView().byId("idCanal").setValueState("None");
                            this.getView().byId("idSector").setValueState("None");
                            this.getView().byId("idzona").setValueState("None");
                            this.getView().byId("idCTipoPed").setValueState("None");
                        }                        

                        // Resetear Sociedad
                        vkbur = "";
                        vText = "";
                        if (this.getView().byId("idArea")) {
                            this.getView().byId("idArea").setValue(null);
                            this.getView().byId("idArea").setSelectedKey(null);
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
                        this.oComponent.setModel(new JSONModel([]), "ContratoCliente");
                        if (this.getView().byId("idcontract")) {
                            this.getView().byId("idcontract").setValue(null);
                            this.getView().byId("idcontract").setSelectedKey(null);
                        }

                    case "Contrato":
                        // Resetear Contrato
                        numCont = "";
                        nomCont = "";
                        if (this.pDialogOptionsContrato) {
                            this.closeOptionsDiagContrato();
                        }

                        // Resetear Canal
                        Cvcan = "";
                        if (this.getView().byId("idCanal")) {
                            this.getView().byId("idCanal").setValue(null);
                            this.getView().byId("idCanal").setSelectedKey(null);
                        }

                    case "Canal":
                        // Resetear Sector
                        Cvsector = "";
                        this.oComponent.setModel(new JSONModel([]), "SectorVentas");
                        if (this.getView().byId("idSector")) {
                            this.getView().byId("idSector").setValue(null);
                            this.getView().byId("idSector").setSelectedKey(null);
                        }

                    case "Sector":
                        // Resetear Línea Servicio
                        Bzirk = "";
                        Bztxt = "";
                        this.oComponent.setModel(new JSONModel([]), "ZonaVentas");
                        if (this.getView().byId("idzona")) {
                            this.getView().byId("idzona").setValue(null);
                            this.getView().byId("idzona").setSelectedKey(null);
                        }

                        // Resetear Tipo Pedido
                        TipoPed = "";
                        //TipoPedTxt = "";
                        this.oComponent.setModel(new JSONModel([]), "TipospedidoAlta");
                        if (this.getView().byId("idCTipoPed")) {
                            this.getView().byId("idCTipoPed").setValue(null);
                            this.getView().byId("idCTipoPed").setSelectedKey(null);
                        }
                        break;
                }
            },

            // VALIDACIONES CAMBIO DE ESTADO DROPDOWNS/INPUTS ALTA DE PEDIDOS
            onChangeValueState: function (oEvent) {
                var value = sap.ui.getCore().byId(oEvent.getSource().sId);

                var response = value.getValue().toLowerCase();
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

                if (idArea.getValueState() != "Error" && idArea.getValue().trim()) {
                    idArea.setValueState("None");
                } else {
                    idArea.setValueState("Error");
                }

                if (idCCliente.getValue().trim()) {
                    idCCliente.setValueState("None");
                } else {
                    idCCliente.setValueState("Error");
                }

                if (idCanal.getValueState() != "Error" && idCanal.getValue().trim()) {
                    idCanal.setValueState("None");
                } else {
                    idCanal.setValueState("Error");
                }

                if (idSector.getValueState() != "Error" && idSector.getValue().trim()) {
                    idSector.setValueState("None");
                } else {
                    idSector.setValueState("Error");
                }

                if (idzona.getValueState() != "Error" && idzona.getValue().trim()) {
                    idzona.setValueState("None");
                } else {
                    idzona.setValueState("Error");
                }

                if (idCTipoPed.getValue().trim()) {
                    idCTipoPed.setValueState("None");
                } else {
                    idCTipoPed.setValueState("Error");
                }

                var validation = false;
                //VALIDACIÓN SI CONTIENE UN VALOR Y SI EL ESTADO DEL COMPONENTE NO ES ERROR 
                if (idArea.getValueState()      != "Error" &&
                    idCCliente.getValueState()  != "Error" &&
                    idCanal.getValueState()     != "Error" &&
                    idSector.getValueState()    != "Error" &&
                    idzona.getValueState()      != "Error" &&
                    idCTipoPed.getValueState()  != "Error") {

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
                    czona: false

                    /*
                    // Habilitar Ordenes cuando se selecciona el CECO
                    cordenes: false,
                    
                    // Título
                    Title: this.oI18nModel.getProperty("visPed"),

                    // Limpiar variables
                    ItmNumber: 10,
                    Nomcont: "",
                    Numcont: "",
                    */
                }

                var oModConfig = new JSONModel();
                oModConfig.setData(config);
                this.oComponent.setModel(oModConfig, "ModoApp");
                //this.oComponent.setModel(new JSONModel([]), "PedidoCab");
                //this.oComponent.setModel(new JSONModel([]), "PedidoPos");

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

            closeOptionsDiag: function () {
                this.resetearInputsDialogoAlta("All");
                this.byId("OptionDial").close();
            },

            // FUNCIONES DEL DESPLEGABLE DE SOCIEDAD
            onChangeArea: function () {
                this.resetearInputsDialogoAlta("Sociedad");

                var inputSociedad = this.getView().byId("idArea");
                var sociedad = inputSociedad.getValue();

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
                    this.oComponent.setModel(new JSONModel(), "listadoClientesAlta");
                    this.oComponent.setModel(new JSONModel(), "FiltrosCli");
                    this.oComponent.getModel("FiltrosCli").setProperty("/Bukrs", vkbur);
                    //this.oComponent.getModel("FiltrosCli").setProperty("/Kunnr", sInputValue);

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
                var Kunnr = this.getView().byId("f_lifnrAcr") ? this.getView().byId("f_lifnrAcr").getValue().trim() : "";
                var Name1 = this.getView().byId("f_nifAcr") ? this.getView().byId("f_nifAcr").getValue().trim() : "";
                var Stcd1 = this.getView().byId("f_nameAcr") ? this.getView().byId("f_nameAcr").getValue().trim() : "";
                var Bukrs = vkbur;

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
                    this.getView().byId("descrProv").setValue(null);
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
                this.DatosCliente(codcli, vkbur, "", "", "");

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

            DatosCliente: function (codcli, vkbur, Vbeln, Vtweg, Spart) {
                var aFilters = [],
                    aFilterIds = [],
                    aFilterValues = [];

                aFilterIds.push("Kunnr");
                aFilterValues.push(codcli);

                aFilterIds.push("Bukrs");
                aFilterValues.push(vkbur);

                aFilterIds.push("Vbeln");
                aFilterValues.push(Vbeln);

                aFilterIds.push("Vtweg");
                aFilterValues.push(Vtweg);
                
                aFilterIds.push("Spart");
                aFilterValues.push(Spart);


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
                    //this.oComponent.getModel("ModoApp").setProperty("/Codcli", values[0].results[0].Kunnr);
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
                    this.oComponent.getModel("ModoApp").setProperty("/Vbund", values[0].results[0].Vbund); // Soc.asociada al cliente
                    this.oComponent.getModel("ModoApp").setProperty("/Zterm", values[0].results[0].Zterm);
                    this.oComponent.getModel("ModoApp").refresh(true);

                    // Establecer el nombre cuando no se ha utilizado la búsqueda del Alta de pedidos
                    if (this.modoapp === "C" && !nomcli) {
                        nomcli = values[0].results[0].Nombre;
                        // if (this.getView().byId("idCCliente") && !this.getView().byId("idCCliente").getValue()) {
                        //     this.getView().byId("idCCliente").setValue(nomcli);
                        // }
                    }

                    // Si es una creación, establecemos la condición de pago de cabecera de la condición de pago del cliente
                    if (values[0].results[0].Zterm && this.oComponent.getModel("DisplayPEP") && !this.oComponent.getModel("DisplayPEP").getData().Zterm) {
                        this.oComponent.getModel("DisplayPEP").setProperty("/Zterm", values[0].results[0].Zterm)
                    }
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
                this.resetearInputsDialogoAlta("Contrato");

                var inputContrato = this.getView().byId("idcontract");
                var contrato = inputContrato.getValue();

                var contratos = new Set(this.oComponent.getModel("ContratoCliente").getData().map(item => item.Ktext));

                var canal = false;
                if (!contrato) {
                    inputContrato.setValueState("None");
                    this.resetearInputsDialogoAlta("Contrato");

                } else if (canal = contratos.has(contrato)) {
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

                    this.getView().byId("idCanal").setValue(Cvcan);
                    this.getView().byId("idSector").setValue(Cvsector);
                    this.getView().byId("idzona").setValue(Bzirk);
                } else {
                    inputContrato.setValueState("Error");
                }
                this.oComponent.getModel("ModoApp").setProperty("/cvcan", !canal);
                this.oComponent.getModel("ModoApp").setProperty("/cvsector", false);
                this.oComponent.getModel("ModoApp").setProperty("/czona", false);
                this.oComponent.getModel("ModoApp").refresh(true);
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
                    // No mostramos el canal 50 en el desplegable
                    let canales = values[0].results.filter(canal => canal.Vtweg !== '50');
                    oModelListCanalVentas.setData(canales);
                    //oModelListCanalVentas.setData(values[0].results);
                }
                this.oComponent.setModel(oModelListCanalVentas, "CanalVentas");
            },

            onChangeCanal: function () {
                this.resetearInputsDialogoAlta("Canal");

                var inputCanal = this.getView().byId("idCanal");
                var canal = inputCanal.getValue();

                var canales = new Set(this.oComponent.getModel("CanalVentas").getData().map(item => item.Vtweg));

                var validation;
                if (validation = canales.has(canal)) {
                    inputCanal.setValueState("None");
                    Cvcan = inputCanal.getSelectedKey();
                    this.SectorVentas();
                } else {
                    inputCanal.setValueState("Error");
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
                this.resetearInputsDialogoAlta("Sector");

                var inputSector = this.getView().byId("idSector");
                var sector = inputSector.getValue();

                var sectores = new Set(this.oComponent.getModel("SectorVentas").getData().map(item => item.Spart));

                var validation;
                if (validation = sectores.has(sector)) {
                    inputSector.setValueState("None");
                    Cvsector = inputSector.getSelectedKey();
                    this.ObtenerZonas();
                } else {
                    inputSector.setValueState("Error");
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
                var zona = inputZona.getSelectedKey();

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
                    //TipoPedTxt = values[0].results[0].Bezei;
                }
                this.oComponent.setModel(oModelTiposPed, "TipospedidoAlta");
                this.oComponent.getModel("TipospedidoAlta").refresh(true);
            },

            onCopyOrder: function (oEvent) {
                this.modoapp = "M";
                var config = {
                    mode: this.modoapp,
                    copy: true
                };
                var oModConfig = new JSONModel();
                oModConfig.setData(config);
                this.oComponent.setModel(oModConfig, "ModoApp");

                var soli = this.getSelectedPed(oEvent);
                var numsol = soli.IDSOLICITUD;
                sap.ui.core.BusyIndicator.show();
                this.onSolicitarPedido(numsol, false);
            },

            onDownloadInvoice: function (oEvent) {
                var soli = this.getSelectedPed(oEvent);
                var numFact = soli.Numfactura;
                var msg = this.oI18nModel.getProperty("errPedidoSinFactura");
                if (numFact === "") {
                    MessageBox.error(msg);
                } else {
                    sap.ui.core.BusyIndicator.show();
                    this.descargarPDFFactura(numFact);
                }
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
                this.onSolicitarPedido(numsol, false);
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
                this.onSolicitarPedido(numsol, false);
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
            onSolicitarPedido: function (numsol, refContrato) {
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

                                SolicitudPed_A = data.results[0].SolicitudPed_A

                                var last_ItmNumber = 0;
                                for (var i = 0; i < SolicitudPed_A.results.length; i++) {
                                    //var sreturn = "";
                                    //sreturn = SolicitudPed_A.results[i].Netwr;
                                    //SolicitudPed_A.results[i].Netwr = sreturn;
                                    //SolicitudPed_A.results[i].Ykostl = SolicitudPed_A.results[i].Yykostkl;
                                    //SolicitudPed_A.results[i].Yaufnr = SolicitudPed_A.results[i].Yyaufnr;

                                    SolicitudPed_A.results[i].Posnr = parseInt(SolicitudPed_A.results[i].Posnr);
                                    //SolicitudPed_A.results[i].Zzprsdt = Util.formatDate(SolicitudPed_A.results[i].Zzprsdt);
                                    last_ItmNumber = SolicitudPed_A.results[i].Posnr;

                                    if (that.modoapp === "C") { // Si es creación por contrato 'C'
                                        SolicitudPed_A.results[i].PoItmNo = SolicitudPed_A.results[i].Posnr;
                                        SolicitudPed_A.results[i].ItmNumber = SolicitudPed_A.results[i].Posnr;
                                        SolicitudPed_A.results[i].Material = SolicitudPed_A.results[i].Matnr;
                                        SolicitudPed_A.results[i].ShortText = SolicitudPed_A.results[i].Arktx;
                                        SolicitudPed_A.results[i].PriceDate = SolicitudPed_A.results[i].Zzprsdt;
                                        SolicitudPed_A.results[i].ReqQty = SolicitudPed_A.results[i].Kwmeng;
                                        SolicitudPed_A.results[i].SalesUnit = SolicitudPed_A.results[i].Zieme;
                                        SolicitudPed_A.results[i].CondValue = SolicitudPed_A.results[i].Netpr;
                                        SolicitudPed_A.results[i].Currency = SolicitudPed_A.results[i].Waerk;
                                    }

                                    // Importe Total por línea
                                    SolicitudPed_A.results[i].ImpTotal = that.calcularImporteTotal(SolicitudPed_A.results[i].Kwmeng, SolicitudPed_A.results[i].Kpein, SolicitudPed_A.results[i].Netpr);
                                }                                

                                // Si tiene contrato, se rellena el modelo con las posiciones del contrato
                                if (refContrato) {
                                    that.oComponent.setModel(new JSONModel([]), "PedidoPosContrato");
                                    oModelSolicitud_Ped.setData(SolicitudPed_A);
                                    that.oComponent.getModel("PedidoPosContrato").setData(oModelSolicitud_Ped.getData().results);

                                    /*if (that.modoapp === "M") { // Si es modificación, quitamos las posiciones del contrato que ya están referenciadas
                                        var posiciones = that.oComponent.getModel("DisplayPosPed").getData();
                                        var posicionesContrato = that.oComponent.getModel("PedidoPosContrato").getData();
                                        var posicionesPosnr = posiciones.map(posicion => posicion.Posnr);

                                        var objetosFiltrados = posicionesContrato.filter(posicionContrato =>
                                            !posicionesPosnr.includes(posicionContrato.Posnr)
                                        );

                                        that.oComponent.getModel("PedidoPosContrato").setData(objetosFiltrados);
                                        return;
                                    }*/
                                    if (that.modoapp === "M") return;
                                } else if (that.modoapp === "M" && data.results[0].contrato) { // Si es modificación y tiene contrato
                                    that.onSolicitarPedido(data.results[0].contrato, true);
                                }

                                // if (data.results[0].Erdat) {
                                //     data.results[0].Erdat = Util.formatDate(data.results[0].Erdat);
                                // }

                                oModelDisplay.setData(data.results[0]);
                                that.oComponent.setModel(oModelDisplay, "DisplayPEP");
                                that.oComponent.getModel("DisplayPEP").setProperty("/Last_ItmNumber", last_ItmNumber);

                                if (data.results[0].SolicitudAdjunto_A.results.length > 0 && !that.oComponent.getModel("ModoApp").getData().copy) {
                                    /*
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
                                    */

                                    var oModAdj = new JSONModel();
                                    var adjs = [],
                                        adj;
                                    data.results[0].SolicitudAdjunto_A.results.forEach(function (el) {
                                        //var url;
                                        //url = "";
                                        /*data.results[0].AdjuntoSHPSet.results.forEach(function (elshp) {
                                            if (el.Descripcion == elshp.Descriptivo && el.Documento == elshp.Adjunto) {
                                                url = elshp.Url;
                                            }
                                        });*/
                                        /*if (el.Mimetype === "XLS") {
                                            el.Icon = "sap-icon://excel-attachment";
                                        }else if (el.Mimetype === "PDF") {
                                            el.Icon = "sap-icon://pdf-reader";
                                        }else if (el.Mimetype === "TXT") {
                                            el.Icon = "sap-icon://attachment-text-file";
                                        }else{
                                            el.Icon = "sap-icon://attachment-text-file";
                                        }*/

                                        adj = {
                                            //Color: el.color,
                                            Icono: sap.ui.core.IconPool.getIconForMimeType(el.Url),
                                            Filename: el.Filename,
                                            Mimetype: el.Mimetype,
                                            Descripcion: el.Descripcion,
                                            Numdoc: el.Numdoc,
                                            Url: el.Url
                                            // Foltp: el.InstidB.slice(0,3),
                                            // Folyr: el.InstidB.slice(3,5),
                                            // Folno: el.InstidB.slice(5,17),
                                            // Objtp: el.InstidB.slice(17,20),
                                            // Objyr: el.InstidB.slice(20,22),
                                            // Objno: el.InstidB.slice(22,34),
                                            //Content: el.Content,
                                            //URL: url
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

                                if (SolicitudHistorial_A.results.length > 0 && !that.oComponent.getModel("ModoApp").getData().copy) {
                                    var oModHist = new JSONModel();
                                    oModHist.setData(SolicitudHistorial_A.results);
                                    that.oComponent.setModel(oModHist, "HistorialSol");

                                } else {
                                    that.oComponent.setModel(new JSONModel(), "HistorialSol");
                                }

                                if (that.modoapp === "C") { // Si es creación por contrato 'C'
                                    var title = that.oI18nModel.getProperty("detSolPCon") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().Vbeln).slice(-10);
                                    that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                                    that.oComponent.getModel("DisplayPEP").setProperty("/Faksk", "ZR");

                                } else { // Si es visualización 'D' o modificación 'M'
                                    that.oComponent.setModel(new JSONModel([]), "DisplayPosPed");
                                    oModelSolicitud_Ped.setData(SolicitudPed_A);
                                    that.oComponent.getModel("DisplayPosPed").setData(oModelSolicitud_Ped.getData().results);

                                    // Si es una copia
                                    if (that.oComponent.getModel("ModoApp").getData().copy) {
                                        var title = that.oI18nModel.getProperty("detSolCopia") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().Vbeln).slice(-10);
                                        that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                                        that.oComponent.getModel("DisplayPEP").setProperty("/Faksk", "ZR");
                                    } else {
                                        var title = that.oI18nModel.getProperty("detSolP") + " " + ('0000000000' + that.oComponent.getModel("DisplayPEP").getData().Vbeln).slice(-10);
                                        that.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                                    }
                                }

                                that.DatosAux(data.results[0].Vbeln);
                                //that.condicionPago(data.results[0].Kunnr, data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                that.DatosCliente(data.results[0].Kunnr, data.results[0].Vkorg, data.results[0].Vbeln, data.results[0].Vtweg, data.results[0].Spart);
                                that.OficinaVenta(data.results[0].Vkorg, data.results[0].Vtweg, data.results[0].Spart);
                                that.motivopedido(data.results[0].Auart, data.results[0].Vkorg);

                                that.NIApedido(data.results[0].Kunnr, data.results[0].Vkorg);
                                if (data.results[0].contrato) { // Si tiene contrato, Vbeln = numero contrato
                                    that.CamposDIR(data.results[0].Kunnr, data.results[0].Vkorg, data.results[0].contrato);
                                } else { // Si no tiene contrato, Vbeln = numero pedido
                                    that.CamposDIR(data.results[0].Kunnr, data.results[0].Vkorg, data.results[0].Vbeln);
                                }                                
                                if (that.modoapp === "M" || that.modoapp === "C") {
                                    that.DameMonedas();
                                }

                                that.oComponent.getModel("ModoApp").setProperty("/Vkbur", that.oComponent.getModel("DisplayPEP").getProperty("/Vkorg"));
                                that.oComponent.getModel("ModoApp").setProperty("/NomSoc", that.oComponent.getModel("DisplayPEP").getProperty("/Vtext"));
                                // Kunnr (Codcli) y Nomcli se rellenan en la función DatosCliente
                                // Numcont se rellena de DisplayPEP en modo D y M. En modo C se rellena del input
                                if (that.modoapp === "M" || that.modoapp === "D") {
                                    that.oComponent.getModel("ModoApp").setProperty("/Numcont", that.oComponent.getModel("DisplayPEP").getProperty("/contrato"));
                                }
                                that.oComponent.getModel("ModoApp").setProperty("/CvCanal", that.oComponent.getModel("DisplayPEP").getProperty("/Vtweg"));
                                that.oComponent.getModel("ModoApp").setProperty("/CvSector", that.oComponent.getModel("DisplayPEP").getProperty("/Spart"));
                                // Bztxt y Bzirk se rellenan en la función DatosAux
                                that.oComponent.getModel("ModoApp").setProperty("/Clasepedido", that.oComponent.getModel("DisplayPEP").getProperty("/Auart"));

                                //that.oComponent.getModel("ModoApp").setProperty("/Ykostl", that.oComponent.getModel("DisplayPEP").getProperty("/Yykostkl"));
                                //that.oComponent.getModel("ModoApp").setProperty("/Yaufnr", that.oComponent.getModel("DisplayPEP").getProperty("/Yyaufnr"));
                                that.oComponent.getModel("ModoApp").refresh(true);
                            }
                            if (response) {
                                if (that.modoapp === "C") { // Si es creación por contrato 'C'
                                    that._getDialogPedContrato();
                                } else { // Si es visualización 'D' o modificación 'M'
                                    oRouter.navTo("RouteAltaPedidos");
                                }
                            }
                        },
                    }),
                ]);
            },

            // ---------------------- FUNCION DESCARGAR FACTURA ----------------------
            descargarPDFFactura: function (numFact) {
                var that = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var sFName = "Factura_"+numFact;
                var sFType = "application/pdf";

                Promise.all([
                    this.mainService.read("/PdfFacturaSet('"+numFact+"')", {
                        success: function (data, response) {
                            if (data) {
                              var fContentDecoded = atob(data.Content)
                              var byteNumbers = new Array(fContentDecoded.length);
                              for (var i = 0; i < fContentDecoded.length; i++) {
                                  byteNumbers[i] = fContentDecoded.charCodeAt(i);
                              }
                              var byteArray = new Uint8Array(byteNumbers);
                              //1. Contenido
                              //2. Nombre
                              //3. Extensión
                              //4. Mimetype
                              // Docu: https://sapui5.hana.ondemand.com/sdk/#/api/sap.ui.core.util.File%23methods/sap.ui.core.util.File.save
                              //sap.ui.core.util.File.save(byteArray, sFName, sFType, sFType);
                                var blob = new Blob([byteArray], {
                                    type: "application/pdf"
                                });
                                var url = URL.createObjectURL(blob);
                                window.open(url, '_blank');
                            }
                            sap.ui.core.BusyIndicator.hide();
                        },
                        error: function (err) {
                            sap.m.MessageBox.error("Error, no se ha podido descargar la factura.", {
                                title: "Error",
                                initialFocus: null,
                            });
                            sap.ui.core.BusyIndicator.hide();
                        },
                    }),
                ]);
            },

            // -------------------------------------- FUNCIONES CREAR PEDIDO --------------------------------------
            // FUNCIÓN CREAR PEDIDO
            onNavAlta: function () {
                var validation = this.validarInputsDialogoAlta();
                if (validation) {
                    this.modoapp = "C";                    
                    this.oComponent.getModel("ModoApp").setProperty("/Vkbur", vkbur);
                    this.oComponent.getModel("ModoApp").setProperty("/NomSoc", vText);
                    this.oComponent.getModel("ModoApp").setProperty("/Kunnr", codcli);
                    this.oComponent.getModel("ModoApp").setProperty("/Nomcli", nomcli);
                    this.oComponent.getModel("ModoApp").setProperty("/Numcont", numCont);
                    //this.oComponent.getModel("ModoApp").setProperty("/Nomcont", nomCont);
                    this.oComponent.getModel("ModoApp").setProperty("/CvCanal", Cvcan);
                    this.oComponent.getModel("ModoApp").setProperty("/CvSector", Cvsector);
                    this.oComponent.getModel("ModoApp").setProperty("/Bzirk", Bzirk);
                    this.oComponent.getModel("ModoApp").setProperty("/Bztxt", Bztxt);
                    //this.oComponent.getModel("ModoApp").setProperty("/Tipopedido", TipoPed);
                    //this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", TipoPedTxt);
                    this.oComponent.getModel("ModoApp").setProperty("/Clasepedido", TipoPed);
                    this.oComponent.getModel("ModoApp").refresh(true);
                    this.oComponent.setModel(new JSONModel([]), "PedidoPos");

                    if (numCont) { // Si el pedido tiene contrato
                        this.onSolicitarPedido(numCont, true);
                    } else { // Si el pedido no es con contrato
                        this.oComponent.setModel(new JSONModel([]), "Adjuntos");
                        this.oComponent.setModel(new JSONModel(), "datosAdj");
                        this.oComponent.setModel(new JSONModel(), "HistorialSol");

                        //this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", '0');
                        //this.oComponent.getModel("PedidoCab").setProperty("/Moneda", 'EUR');
                        //this.oComponent.getModel("PedidoCab").refresh(true);

                        var title = this.oI18nModel.getProperty("detSolP");
                        this.oComponent.setModel(new JSONModel(), "DisplayPEP")
                        this.oComponent.getModel("DisplayPEP").setProperty("/Title", title);
                        this.oComponent.getModel("DisplayPEP").setProperty("/contrato", "");
                        this.oComponent.getModel("DisplayPEP").setProperty("/Faksk", "ZR");
                        this.oComponent.getModel("DisplayPEP").refresh(true);

                        this.DatosCliente(codcli, vkbur, "", Cvcan, Cvsector); // Aquí se recupera la condición de pago
                        //this.condicionPago(codcli, vkbur, Cvcan, Cvsector);
                        this.OficinaVenta(vkbur, Cvcan, Cvsector);
                        this.motivopedido(TipoPed, vkbur);

                        this.NIApedido(codcli, vkbur);
                        this.CamposDIR(codcli, vkbur, "");
                        this.DameMonedas();

                        /**
                         * Cuando ya navegamos al alta debe de borrar todos los campos de opciones 
                         * para que cuando se entre de nuevo aparezcan vacios para crear una nueva peticion
                         */
                        //this.resetearInputsDialogoAlta("All");
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
                var posiciones = this.oComponent.getModel("PedidoPos").getData();
                //let indexDeleted = 0;
                var itmNumber = 0;
                for (var i = 0; i < aSelectedIndices.length; i++) {
                    var indice = aSelectedIndices[i];
                    let posicionPed = pedidosContrato_Aux[indice];
                    itmNumber += 10;

                    var posicionN = {
                        ItmNumber: itmNumber, // La posición es autoincrementada
                        PoItmNo: posicionPed.PoItmNo, // Posición del contrato con referencia
                        Material: posicionPed.Matnr,
                        ShortText: posicionPed.Arktx,
                        PriceDate: new Date(posicionPed.Zzprsdt),
                        ReqQty: posicionPed.Kwmeng,
                        Kpein: posicionPed.Kpein,
                        SalesUnit: posicionPed.Zieme,
                        CondValue: posicionPed.Netpr,
                        Currency: posicionPed.Waerk,
                        Ukurs: posicionPed.Ukurs,
                        Yykostkl: posicionPed.Yykostkl,
                        Yyaufnr: posicionPed.Yyaufnr,
                        Zzkostl: posicionPed.Zzkostl,
                        Zzaufnr: posicionPed.Zzaufnr,
                        Kstar: posicionPed.Kstar,
                        Tdlinepos: posicionPed.Tdlinepos,
                        ImpTotal: posicionPed.ImpTotal
                    }
                    posiciones.push(posicionN);                    
                    //pedidosContrato.splice(indice - indexDeleted, 1); // Eliminarmos la posición del modelo de contratos
                    //indexDeleted++;
                }
                //this.oComponent.getModel("PedidoPosContrato").refresh(true);
                this.oComponent.getModel("PedidoPos").refresh(true);

                // Deseleccionar las opciones
                aSelectedIndices.forEach(function (oItem) {
                    oTable.setSelectedIndex(-1);
                });
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
                    //this.oComponent.getModel("ModoApp").setProperty("/NomSoc", values[0].results[0].Vtext);
                    // Guardar los datos de la línea de servicio
                    this.oComponent.getModel("ModoApp").setProperty("/Bztxt", values[0].results[0].Bztxt);
                    this.oComponent.getModel("ModoApp").setProperty("/Bzirk", values[0].results[0].Bzirk);
                    this.oComponent.getModel("ModoApp").refresh(true);
                }
            },

            // FUNCIONES PARA OBTENER LA CONDICIÓN DE PAGO
            /*condicionPago: function (codcli, vkbur, Cvcan, Cvsector) {
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
                /*    }
                }
            },*/

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

            // FUNCIONES PARA OBTENER LOS CAMPOS DIR
            CamposDIR: function (codcli, vkbur, Vbeln) {

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
                    this.readDataEntity(this.mainService, "/CamposDIRSet", aFilters),
                ]).then(this.buildCamposDIR.bind(this), this.errorFatal.bind(this));

            },

            buildCamposDIR: function (values) {
                if (values[0].results && values[0].results.length > 0) {
                    this.oComponent.getModel("ModoApp").setProperty("/Plataforma", values[0].results[0].Plataforma); // Plataforma
                    this.oComponent.getModel("ModoApp").setProperty("/Centges", values[0].results[0].Centges);       // DIR Órgano Gestor
                    this.oComponent.getModel("ModoApp").setProperty("/Centuni", values[0].results[0].Centuni);       // DIR Unidad Tramitadora
                    this.oComponent.getModel("ModoApp").setProperty("/Centpro", values[0].results[0].Centpro);       // DIR Oficina Contable
                    this.oComponent.getModel("ModoApp").setProperty("/Codadm", values[0].results[0].Codadm);         // DIR Administración
                    this.oComponent.getModel("ModoApp").refresh(true);
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
                    oModelMoneda.setSizeLimit(values[0].results.length);
                }
                this.oComponent.setModel(oModelMoneda, "listadoMoneda");
            },

            // -------------------------------------- FUNCIONES DESCARGA EXCEL --------------------------------------
            onDownExcel: function (oEvent) {
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

                Promise.all([
                    this.readDataExcel(this.mainService, "/excelPedidosSet", aFilters)
                ]);
            },

            readDataExcel: function (oModel, path, aFilters) {
                var sRuta = oModel.sServiceUrl + path + "/?$format=xlsx";
                window.open(sRuta, '_blank');
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
                var selectedKey = oEvent.getSource().getProperty("key");

                switch (selectedKey) {

                    case "CrearCliente":
                        this.onNavToCrearCliente(oEvent);
                        break;

                    case "CargaPedidos":
                        this.onGoToZpv();
                        break;

                    case "MonitorContratos":
                        this.onNavToMonitorContrato();
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
                                            for (var i = 0; i < oUploadCollection.getItems().length; i++) {
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
                    for (var i = 0; i < oUploadCollection.getItems().length; i++) {
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

            onSelectionChange: function (oEvent) {
                var aSelectedFiles = oEvent.getParameter("files");
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
                    for (var i = 0; i < oUploadCollection.getItems().length; i++) {
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
                        onClose: function (oAction) { }
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


        // -------------------------------------- FUNCIONES PARA EL MONITOR DE CONTRATOS --------------------------------------

            /** Navegar al Monitor de contratos */
            onNavToMonitorContrato: function(){
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                //oRouter.navTo("MonitorContratos");
                this.getOwnerComponent().getRouter().navTo("RouteMonitorContratos");

            }

        });
    });