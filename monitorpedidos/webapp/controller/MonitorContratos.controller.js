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

    var SortOrder = CoreLibrary.SortOrder;

    // Variables no utilizadas ???
    //var sumTotal, nomSoc, Posped, Centges, Centuni, Centpro, Codadm, Plataforma, sAprob, socPed, condPago, vedit, checkMisPed, checkTodos;
    // var EdmType = exportLibrary.EdmType;

    // Variables utilizadas para los botones
    var btnEditar, accionLiberar, btnRescatar, accionRescatar;
    // Variables utilizadas en los filtros
    var filtroUsuario, filtroFechaDsdIni, filtroFechaHstIni, filtroFechaDsdFin, filtroFechaHstFin, filtroImporteDsd, filtroImporteHst, filtroEstado, filtroClienteCod, filtroClienteTxt, filtroCeco, filtroOrden, filtroOficionaVentas, filtroLineaServicio, filtroMaterial, filtroClasePed, filtroResponsable, nomceco, nomord, nommat;
    //var Usuario, Numped, Fechad, Fechah, Imported, Importeh, sStatus, Cliente, codceco, codord, LineaServicio, codmat, ClasePed, responsable;
    var usuario;
    var arrayFiltroClasePed = [];

    // variables utilizadas para los inputs del diálogo de alta
    var vkbur, vText, codcli, nomcli, numCont, nomCont, Cvcan, Cvsector, Bzirk, Bztxt, TipoPed;//, TipoPedTxt;

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


    return Controller.extend("monitorpedidos.controller.MonitorContratos", {
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
            this.oModel = this.
            oModel = this._createViewModel();

//            this.oComponent.setModel(oModClientes, "AltaClientes");
//            this.adjuntos = [];
//            this.oComponent.setModel(new JSONModel([]), "Adjuntos");
//            this.oComponent.setModel(new JSONModel(), "datosAdj");
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
            //this.motivosRechazo();

            // De primeras mostrará las solicitudes de Mi usuario
            this.getUser();
            this.AreasVenta();
            this.modoapp = "";

            /* Lógica que llama al metodo handleRouteMatched cuando se realiza un Router */
            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this._oRouter.attachRouteMatched(this.handleRouteMatched, this);

            this._oPriceFilter = null;
            this._oGlobalFilter = null;
        },

        /* Metodo para que cada vez que se abra la vista AltaPedidos, se realice la actualización del importe */
        handleRouteMatched: function (evt) {
            if (evt.getParameter("name") !== "MonitorPedidos") {
                // Cuando se acceda al monitor por primera vez, se refrescará desde la función getUser()
                if (filtroUsuario) {
                    this.onBusqSolicitudes();
                    //this.refrescarListadoContratos();
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

		filterTableContratos: function(oEvent) {
			var oColumn = oEvent.getParameter("column");

            if (oColumn != this.byId("Netwr") && 
                oColumn != this.byId("Impfacturado") && 
                oColumn != this.byId("Imppdtefacturar") &&
                oColumn != this.byId("Fvalidezini") &&
                oColumn != this.byId("Fvalidezfin")) {
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

            if (oColumn === this.byId("Netwr") || 
                oColumn === this.byId("Impfacturado") || 
                oColumn === this.byId("Imppdtefacturar")) {

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
            }
            else {
                var dFecha = new Date(sValue);
                // Si es de tipo fecha y el valor es válido
                if (sValue && Object.prototype.toString.call(dFecha) === "[object Date]" && !isNaN(dFecha)) {
                    dFecha.setMilliseconds(0);
                    dFecha.setSeconds(0);
                    dFecha.setMinutes(0);
                    dFecha.setHours(2);
                    this._oPriceFilter = new Filter(oColumn.mProperties.sortProperty, FilterOperator.EQ, dFecha);
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

		sortTableContratos: function(oEvent) {
			var oCurrentColumn = oEvent.getParameter("column");

            this._resetSortingState(); //No multi-column sorting

            if (oCurrentColumn != this.byId("Netwr") && 
                oCurrentColumn != this.byId("Impfacturado") && 
                oCurrentColumn != this.byId("Imppdtefacturar")) {

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

        // -------------------------------------- FUNCIONES FORMATEO DE CAMPOS --------------------------------------
        onFormatImporteFloat: function (sValue) {
            return parseFloat(sValue);
        },
        // FUNCION PARA FORMATEAR NUMERO IMPORTE
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

        // FUNCION PARA FORMATEAR LA FECHA DOCUMENTO
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

            this.refrescarListadoContratos();
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

/*            
            var inputUsuario = this.getView().byId("f_usuario").getValue();
            if (inputUsuario) {
                filtroUsuario = inputUsuario;
            }
*/
            //Numped = this.getView().byId("f_numsolic").getValue();
            filtroFechaDsdIni = this.getView().byId("DTPdesdeIni").getValue();
            filtroFechaHstIni = this.getView().byId("DTPhastaIni").getValue();
            filtroFechaDsdFin = this.getView().byId("DTPdesdeFin").getValue();
            filtroFechaHstFin = this.getView().byId("DTPhastaFin").getValue();
            filtroImporteDsd = this.getView().byId("f_impdesde").getValue();
            filtroImporteHst = this.getView().byId("f_imphasta").getValue();
            //filtroEstado
            // Si el usuario no ha seleccionado un cliente desde el diálogo, buscamos el código en el input
            if (!filtroClienteTxt) {
                filtroClienteCod = this.getView().byId("f_client").getValue();
            }
//            filtroCeco = this.getView().byId("f_cecos").getValue();
//            filtroOrden = this.getView().byId("f_ordenes").getValue();
            filtroOficionaVentas = this.getView().byId("f_oficinas").getValue();
            filtroMaterial = this.getView().byId("f_material").getValue();
//            filtroResponsable = this.getView().byId("f_approv").getValue();
            filtroLineaServicio = this.getView().byId("f_line").getSelectedKey();
            filtroClasePed = arrayFiltroClasePed;

            this.refrescarListadoContratos();
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
        ListadoContratos: function (
            filtroUsuario,
            //Numped,
            filtroFechaDsdIni,
            filtroFechaHstIni,
            filtroFechaDsdFin,
            filtroFechaHstFin,
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

            //addFilter("USUARIO", "");
            addFilter("FechadIni", Date.parse(filtroFechaDsdIni));
            addFilter("FechahIni", Date.parse(filtroFechaHstIni));
            addFilter("FechadFin", Date.parse(filtroFechaDsdFin));
            addFilter("FechahFin", Date.parse(filtroFechaHstFin));
            addFilter("Imported", filtroImporteDsd);
            addFilter("Importeh", filtroImporteHst);
            addFilter("Cliente", filtroClienteCod);
            addFilter("Ceco", filtroCeco);
            addFilter("Orden", filtroOrden);
            addFilter("Orgventas", filtroOficionaVentas);
            addFilter("Linea", filtroLineaServicio);
            addFilter("Material", filtroMaterial);
            addFilter("Zresponsable", filtroResponsable);
            addFilter("Tipo", filtroClasePed);

            var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

            sap.ui.core.BusyIndicator.show();

            Promise.all([
                this.readDataEntity(this.mainService, "/listadoContratosSet", aFilters),
            ]).then(this.buildListadoModel.bind(this), this.errorFatal.bind(this));
        },

        buildListadoModel: function (values) {
            if (values[0].results.length >= 1) {
                var oModelSolicitudes = new JSONModel(values[0].results);
                this.oComponent.setModel(oModelSolicitudes, "ListadoContratos");
            } else {
                this.oComponent.setModel(new JSONModel(), "ListadoContratos");
            }
            sap.ui.core.BusyIndicator.hide();
        },

         // FUNCIÓN PARA REFRESCAR LOS DATOS DEL LISTADO
         refrescarListadoContratos: function () {
            this.ListadoContratos(
                filtroUsuario,
                //Numped,
                filtroFechaDsdIni,
                filtroFechaHstIni,
                filtroFechaDsdFin,
                filtroFechaHstFin,
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

            if (this.oComponent.getModel("ListadoContratos")) {
                this.oComponent.getModel("ListadoContratos").refresh(true);
            }
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

        onBusqClientes: function () {
            var Kunnr = this.getView().byId("f_lifnrAcr") ? this.getView().byId("f_lifnrAcr").getValue() : "";
            var Name1 = this.getView().byId("f_nifAcr") ? this.getView().byId("f_nifAcr").getValue() : "";
            var Stcd1 = this.getView().byId("f_nameAcr") ? this.getView().byId("f_nameAcr").getValue() : "";
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
            this.DatosCliente(codcli, vkbur, "");

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
            this.resetearInputsDialogoAlta("Canal");

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
            var sector = inputSector.getValue().trim();

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

        // FUNCIONES PARA OBTENER EL CÓDIGO ADMINISTRACIÓN
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
                oModelMoneda.setSizeLimit(values[0].results.length);
            }
            this.oComponent.setModel(oModelMoneda, "listadoMoneda");
        },

        // -------------------------------------- FUNCIONES DESCARGA EXCEL --------------------------------------
        onDownExcel: function (oEvent) {
            this.DownLoadExcell(
                filtroUsuario,
                //Numped,
                filtroFechaDsdIni,
                filtroFechaHstIni,
                filtroFechaDsdFin,
                filtroFechaHstFin,
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

        DownLoadExcell: function (filtroUsuario, filtroFechaDsd, filtroFechaHst, filtroFechaDsdIni, filtroFechaHstIni, filtroFechaDsdFin, filtroFechaHstFin, filtroImporteDsd, filtroImporteHst, filtroEstado, filtroClienteCod, filtroCeco, filtroOrden, filtroOficinaVentas, filtroLineaServicio, filtroMaterial, filtroResponsable, filtroClasePed) {
            var aFilterIds = [],
                aFilterValues = [];

            var addFilter = function (id, value) {
                if (value) {
                    aFilterIds.push(id);
                    aFilterValues.push(value);
                }
            };
/*
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
*/
            var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

            Promise.all([
                this.readDataExcel(this.mainService, "/excelContratosSet", aFilters)
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

                
                case "MonitorPedidos":
                        this.onNavToMonitorPedidos();
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

        onSelectionChange: function(oEvent) {
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

        
        // -------------------------------------- FUNCIONES PARA EL MONITOR DE PEDIDOS --------------------------------------

        /** Navegar al Monitor de Pedidos */
        onNavToMonitorPedidos: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.getOwnerComponent().getRouter().navTo("RouteMonitorPedidos");

            /*
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("page1", null, true);
            }
            */

        }
    });
});