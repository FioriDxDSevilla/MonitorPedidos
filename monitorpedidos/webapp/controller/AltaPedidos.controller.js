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
  "sap/ui/export/Spreadsheet",
  "sap/m/Dialog",
  "sap/m/DialogType",
  "sap/m/Button",
  "sap/m/ButtonType",
  "sap/m/Text"
],

  function (Controller, JSONModel, Fragment, History, Filter, FilterOperator, Util, MessageBox, ExportTypeCSV, Export, exportLibrary, Dialog, DialogType, Button, ButtonType, Text) {
    "use strict";
    
    // Variables inputs
    var tipoInputCeco, tipoInputOrden;//, tipoInputLibroMayor;
    var listadoValidarMateriales;

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
  
     var importeFormat;
     /*
     W -> 1.234.567,89
     X -> 1,234,567.89
     Y -> 1 234 567,89
     */
    
    return Controller.extend("monitorpedidos.controller.AltaPedidos", {

      onInit: function () {
        this.mainService = this.getOwnerComponent().getModel("mainService");
        this.oComponent = this.getOwnerComponent();
        this.oI18nModel = this.oComponent.getModel("i18n");
        
         /* Lógica que llama al metodo handleRouteMatched para que se realice la actualización del importe */
         this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
         this._oRouter.attachRouteMatched(this.handleRouteMatched, this);
      },
      
      /* Metodo para que cada vez que se abra la vista AltaPedidos, se realice la actualización del importe */
      handleRouteMatched: function (evt) {
        
        if (evt.getParameter("name") !== "AltaPedidos") {
          this.resetearEstadoInputsAltaPedido();
          // Si no hay datos en el modelo (cuando se refresca esta vista), vuelve al monitor
          if (!this.oComponent.getModel("ModoApp") || !this.oComponent.getModel("ModoApp").getData() || !this.oComponent.getModel("ModoApp").getData().NomSoc) {
            this.onCancelar();
          }else{
            // Si es una copia, se quita la barra de progreso
            if (this.oComponent.getModel("ModoApp").getData().copy) {
              sap.ui.core.BusyIndicator.hide();
            }
            this.actualizaimp();
            this.oComponent.setModel(new JSONModel(), "listadoLibroMayor"); 
          }        
        }
      },

      // -------------------------------------- FUNCIONES PARA EL BOTÓN DE CANCELAR Y VOLVER --------------------------------------
      onNavBack : function(){
        this.onCancelar();
      },

      // -------------------------------------- FUNCIÓN BOTÓN CANCELAR --------------------------------------
      onCancelar: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("RouteMonitorPedidos");
      },
      
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
      
      // -------------------------------------- FUNCIONES FORMATEO DE CAMPOS --------------------------------------
      // FUNCION PARA FORMATEAR NUMERO IMPORTE
      onFormatImporte: function (Netpr) {
        if (Netpr) {
          Netpr = Number(Netpr).toFixed(2);
        }
        var numFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance();
        return numFormat.format(Netpr);
      },

      // FUNCION PARA FORMATEAR NUMERO IMPORTE
      onFormatTipoCambio: function (Ukurs) {
        if (Ukurs) {
          Ukurs = Number(Ukurs).toFixed(5);
        }
        importeFormat = this.oComponent.getModel("Usuario").getData()[0].Dcpfm;
        var numberFormat;
        switch (importeFormat) {
 
          case ""://1.234.567,89
            numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
              "maxFractionDigits": 5,
              "decimalSeparator": ",",
            });
 
            break;
          case "X"://1,234,567.89
            numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
              "maxFractionDigits": 5,
              "decimalSeparator": ".",
            });
            break;
          case "Y"://1 234 567,89
            numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
              "maxFractionDigits": 5,
              "decimalSeparator": ",",
            });
            break;
        }
        var numeroFormateado = numberFormat.format(Ukurs);
        return numeroFormateado;
      },
 
      // FUNCION PARA FORMATEAR LA FECHA DOCUMENTO
      onFormatFechaDocVenta: function (Fechadoc) { 
        let dateFormat = sap.ui.core.format.DateFormat.getDateInstance();
        return dateFormat.format(Fechadoc);
      },

      // -------------------------------------- FUNCIONES IMPORTE --------------------------------------
      // FUNCIÓN ACTUALIZAR IMPORTE PEDIDO
      actualizaimp: function () {
        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        //this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", '0');
        //this.oComponent.getModel("PedidoCab").setProperty("/Moneda", 'EUR');
        var calculo = 0;
        var sumCalculo = 0;
        var moneda = "EUR";

        //MODO DE MODIFICACION Y VISUALIZACION DE PEDIDOS
        if (modeApp == 'M'|| modeApp == 'D') {
          var posiciones = this.oComponent.getModel("DisplayPosPed").getData();       
          for (var i = 0; i < posiciones.length; i++) {
            var cantidad = posiciones[i].Kwmeng;
            var cantbase = posiciones[i].Kpein;
            var moneda = posiciones[i].Waerk;
            var importe = posiciones[i].Netpr;
            calculo = Number((importe / cantbase) * cantidad);
            sumCalculo += calculo;
          }
          sumCalculo = Number(sumCalculo).toFixed(2);

          //MODO DE CREACION DE PEDIDOS
        } else if (modeApp == 'C') {
          var posiciones = this.oComponent.getModel("PedidoPos").getData();          
          for (var i = 0; i < posiciones.length; i++) {
            var cantidad = posiciones[i].ReqQty;
            var cantbase = posiciones[i].Kpein;
            var moneda = posiciones[i].Currency;
            var importe = posiciones[i].CondValue;
            calculo = Number((importe / cantbase) * cantidad);
            sumCalculo += calculo;
          }
          sumCalculo = Number(sumCalculo).toFixed(2);
        }

        this.oComponent.getModel("ModoApp").setProperty("/ImpPedido", this.onFormatImporte(sumCalculo));
        this.oComponent.getModel("ModoApp").setProperty("/Moneda", moneda);
        this.oComponent.getModel("ModoApp").refresh(true);
      },

      // FUNCIÓN CALCULAR IMPORTE TOTAL LÍNEA
      calcularImporteTotal: function (cantidad, cantbase, importe) {
        return Number((importe / cantbase) * cantidad).toFixed(2);
      },

      // -------------------------------------- FUNCIONES CECOS --------------------------------------
      // FUNCIONES DE CECOS
      onBusqCecos: function (Kostl, Ltext) {
        var Kokrs;
        if (tipoInputCeco === 'CecoIngresoCabecera' || tipoInputCeco === 'CecoIngresoPosicion') {
          Kokrs = this.oComponent.getModel("ModoApp").getProperty("/Vkbur"); // Sociedad del pedido
        }else{
          Kokrs = this.oComponent.getModel("ModoApp").getProperty("/Vbund"); // Sociedad asociada al cliente
          if (!Kokrs) {
            this.oComponent.setModel(new JSONModel(), "listadoCecos");
            return;
          }
        }
        

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
        addFilter("Kokrs", Kokrs);

        var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

        sap.ui.core.BusyIndicator.show();

        Promise.all([
          this.readDataEntity(this.mainService, "/CecoIngresoSet", aFilters),
        ]).then(this.buildCecosModel.bind(this), this.errorFatal.bind(this));
      },

      buildCecosModel: function (values) {
        var oModelCecos = new JSONModel();
        if (values[0].results) {
          oModelCecos.setData(values[0].results);
        }        
        this.oComponent.setModel(oModelCecos, "listadoCecos");
        this.oComponent.getModel("listadoCecos").refresh(true);
        sap.ui.core.BusyIndicator.hide();
      },

      getSelectCeco: function (oEvent, oModel) {
        var oModCeco = this.oComponent.getModel(oModel).getData();
        const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
        const sOperation = sOperationPath.split("/").slice(-1).pop();
        var idCeco = oModCeco[sOperation];
        return idCeco;
      },

      // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE CECOS
      onValueHelpCecosIngresoCabecera: function (oEvent) {
        tipoInputCeco = "CecoIngresoCabecera";
        this._getDialogCecosAlta();
      },

      onValueHelpCecosIntercoCabecera: function (oEvent) {
        tipoInputCeco = "CecoIntercoCabecera";
        this._getDialogCecosAlta();
      },

      onValueHelpCecosIngresoPosicion: function (oEvent) {
        tipoInputCeco = "CecoIngresoPosicion";
        this._getDialogCecosAlta();
      },

      onValueHelpCecosIntercoPosicion: function (oEvent) {
        tipoInputCeco = "CecoIntercoPosicion";
        this._getDialogCecosAlta();
      },

      _getDialogCecosAlta: function (sInputValue) {
        this.oComponent.setModel(new JSONModel(), "FiltrosCeco");
        this.oComponent.setModel(new JSONModel(), "listadoCecos");        

        var oView = this.getView();

        if (!this.pDialogCecosAlta) {
          this.pDialogCecosAlta = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragments.BusqCecoAlta",
            controller: this,
          }).then(function (oDialogCecosAlta) {
            // connect dialog to the root view of this component (models, lifecycle)
            oView.addDependent(oDialogCecosAlta);
            return oDialogCecosAlta;
          });
        }
        this.pDialogCecosAlta.then(function (oDialogCecosAlta) {
          oDialogCecosAlta.open(sInputValue);
        });
      },

      closeCecoDiagAlta: function () {
        this.byId("cecoDialAlta").close();
      },

      onBusqCecosAlta: function () {
        var Kostl = this.getView().byId("f_codCecoAlta").getValue().trim();
        var Ltext = this.getView().byId("f_nomCecoAlta").getValue().trim();
        this.onBusqCecos(Kostl, Ltext)
      },

      onPressCecosAlta: function (oEvent) {
        var ceco = this.getSelectCeco(oEvent, "listadoCecos");
        //codceco = ceco.Kostl;
        //nomceco = ceco.Ltext;
        //this.getView().byId("f_cecosCab").setValue(codceco);
        
        var codceco = ceco.Kostl;
        // Actualizamos el input de ceco
        switch (tipoInputCeco) {
          case "CecoIngresoCabecera":
            this.oComponent.getModel("DisplayPEP").setProperty("/Yykostkl", codceco);
            break;

          case "CecoIntercoCabecera":
            this.oComponent.getModel("DisplayPEP").setProperty("/Zzkostl", codceco);
            break;

          case "CecoIngresoPosicion":
            this.oComponent.getModel("posPedFrag").setProperty("/Yykostkl", codceco);
            this.getView().byId("f_cecosIngPos").setValueState("None");
            break;

          case "CecoIntercoPosicion":
            this.oComponent.getModel("posPedFrag").setProperty("/Zzkostl", codceco);
            break;
        
          default:
            break;
        }
        this.closeCecoDiagAlta();
      },      

      // -------------------------------------- FUNCIONES ORDENES --------------------------------------
      onBusqOrdenes: function (Aufnr, Ktext, Ceco) {
        var Bukrs;
        if (tipoInputOrden === 'OrdenIngresoCabecera' || tipoInputOrden === 'OrdenIngresoPosicion') {
          Bukrs = this.oComponent.getModel("ModoApp").getProperty("/Vkbur"); // Sociedad del pedido
        }else{
          Bukrs = this.oComponent.getModel("ModoApp").getProperty("/Vbund"); // Sociedad asociada al cliente
          if (!Bukrs) {
            this.oComponent.setModel(new JSONModel(), "listadoOrdenes");
            return;
          }
        }

        var aFilterIds = [],
            aFilterValues = [];

        var addFilter = function (id, value) {
            if (value) {
                aFilterIds.push(id);
                aFilterValues.push(value);
            }
        };

        addFilter("Aufnr", Aufnr);
        addFilter("Ktext", Ktext);
        addFilter("Bukrs", Bukrs);
        addFilter("Ceco", Ceco);

        var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

        sap.ui.core.BusyIndicator.show();        

        Promise.all([
          this.readDataEntity(this.mainService, "/OrdenIngresoSet", aFilters),
        ]).then(this.buildOrdenesModel.bind(this), this.errorFatal.bind(this));
      },

      buildOrdenesModel: function (values) {
        var oModelOrdenes = new JSONModel();
        if (values[0].results && values[0].results.length > 0) {         
          oModelOrdenes.setData(values[0].results);          
        } //else {
          //MessageBox.warning(this.oI18nModel.getProperty("noOrd"));
        //}
        this.oComponent.setModel(oModelOrdenes, "listadoOrdenes");
        this.oComponent.getModel("listadoOrdenes").refresh(true);        
        sap.ui.core.BusyIndicator.hide();
      },

      getSelectOrd: function (oEvent, oModel) {
        var oModOrd = this.oComponent.getModel(oModel).getData();
        const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
        const sOperation = sOperationPath.split("/").slice(-1).pop();
        var idOrden = oModOrd[sOperation];
        return idOrden;
      },
      
      // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE ORDENES
      onValueHelpOrdIngresoCabecera: function (oEvent) {
        tipoInputOrden = "OrdenIngresoCabecera";
        this._getDialogOrdenesAlta();
      },

      onValueHelpOrdIntercoCabecera: function (oEvent) {
        tipoInputOrden = "OrdenIntercoCabecera";
        this._getDialogOrdenesAlta();
      },

      onValueHelpOrdIngresoPosicion: function (oEvent) {
        tipoInputOrden = "OrdenIngresoPosicion";
        this._getDialogOrdenesAlta();
      },

      onValueHelpOrdIntercoPosicion: function (oEvent) {
        tipoInputOrden = "OrdenIntercoPosicion";
        this._getDialogOrdenesAlta();
      },

      _getDialogOrdenesAlta: function (sInputValue) {
        this.oComponent.setModel(new JSONModel(), "FiltrosOrd");
        this.oComponent.setModel(new JSONModel(), "listadoOrdenes");
        

        var oView = this.getView();

        if (!this.pDialogOrdenesAlta) {
          this.pDialogOrdenesAlta = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragments.BusqOrdenAlta",
            controller: this,
          }).then(function (oDialogOrdenesAlta) {
            // connect dialog to the root view of this component (models, lifecycle)
            oView.addDependent(oDialogOrdenesAlta);
            return oDialogOrdenesAlta;
          });
        }
        this.pDialogOrdenesAlta.then(function (oDialogOrdenesAlta) {
          oDialogOrdenesAlta.open(sInputValue);
        });
      },

      closeOrdDiagAlta: function () {
        this.byId("ordDialAlta").close();
      },

      onBusqOrdenesAlta: function () {
        var Aufnr = this.getView().byId("f_codOrdAlta").getValue().trim();
        var Ktext = this.getView().byId("f_nomOrdAlta").getValue().trim();
        var Ceco;

        switch (tipoInputOrden) {
          case "OrdenIngresoCabecera":
            Ceco = this.oComponent.getModel("DisplayPEP").getData().Yykostkl;
            break;

          case "OrdenIntercoCabecera":
            Ceco = this.oComponent.getModel("DisplayPEP").getData().Zzkostl;
            break;

          case "OrdenIngresoPosicion":
            Ceco = this.oComponent.getModel("posPedFrag").getData().Yykostkl;
            break;

          case "OrdenIntercoPosicion":
            Ceco = this.oComponent.getModel("posPedFrag").getData().Zzkostl;
            break;
        
          default:
            break;
        }

        this.onBusqOrdenes(Aufnr, Ktext, Ceco);
      },

      onPressOrdenesAlta: function (oEvent) {
        var ord = this.getSelectOrd(oEvent, "listadoOrdenes");
        //codord = ord.Aufnr;
        //nomord = ord.Ktext;
        //this.getView().byId("f_ordenesCab").setValue(codord);
        
        var codord = ord.Aufnr;
        // Actualizamos el input de orden
        switch (tipoInputOrden) {
          case "OrdenIngresoCabecera":
            this.oComponent.getModel("DisplayPEP").setProperty("/Yyaufnr", codord);
            break;

          case "OrdenIntercoCabecera":
            this.oComponent.getModel("DisplayPEP").setProperty("/Zzaufnr", codord);
            break;

          case "OrdenIngresoPosicion":
            this.oComponent.getModel("posPedFrag").setProperty("/Yyaufnr", codord);
            break;

          case "OrdenIntercoPosicion":
            this.oComponent.getModel("posPedFrag").setProperty("/Zzaufnr", codord);
            break;
        
          default:
            break;
        }
        this.closeOrdDiagAlta();
      },

      onPressCecosCabecera: function (oEvent) {
        var ceco = this.getSelectCeco(oEvent, "listadoCecos");
        //codceco = ceco.Kostl;
        //nomceco = ceco.Ltext;
        //this.getView().byId("f_cecosCab").setValue(codceco);
        
        var codceco = ceco.Kostl;
        // Actualizamos el input de ceco
        switch (tipoInputCeco) {
          case "CecoIngresoCabecera":
            this.oComponent.getModel("DisplayPEP").setProperty("/Yykostkl", codceco);
            break;

          case "CecoIntercoCabecera":
            this.oComponent.getModel("DisplayPEP").setProperty("/Zzkostl", codceco);
            break;

          case "CecoIngresoPosicion":            
            break;

          case "CecoIntercoPosicion":
            break;
        
          default:
            break;
        }
        
        this.closeCecoDiagAlta();
      },

      // --------------------------------- FUNCIONES LIBRO MAYOR ---------------------------------
      // FUNCIONES DE LIBRO MAYOR - Finalmente debe ser un campo NO modificable
      /*onBusqLibroMayor: function (Saknr, Txt50) {        
        var Bukrs = this.oComponent.getModel("ModoApp").getProperty("/Vkbur").toString();

        var aFilterIds = [],
            aFilterValues = [];

        var addFilter = function (id, value) {
            if (value) {
                aFilterIds.push(id);
                aFilterValues.push(value);
            }
        };

        addFilter("Saknr", Saknr);
        addFilter("Txt50", Txt50);
        addFilter("Kokrs", Bukrs);

        var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

        sap.ui.core.BusyIndicator.show();

        Promise.all([
          this.readDataEntity(this.mainService, "/LibroMayorSet", aFilters),
        ]).then(this.buildLibroMayorModel.bind(this), this.errorFatal.bind(this));
      },

      buildLibroMayorModel: function (values) {
        var oModelLibroMayor = new JSONModel();
        if (values[0].results) {
          oModelLibroMayor.setData(values[0].results);
        }
        this.oComponent.setModel(oModelLibroMayor, "listadoLibroMayor");
        this.oComponent.getModel("listadoLibroMayor").refresh(true);
        sap.ui.core.BusyIndicator.hide();
      },

      getSelectLibroMayor: function (oEvent, oModel) {
        var oModLibroMayor = this.oComponent.getModel(oModel).getData();
        const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
        const sOperation = sOperationPath.split("/").slice(-1).pop();
        var idLibroMayor = oModLibroMayor[sOperation];
        return idLibroMayor;
      },

      // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE CECOS
      onValueHelpLibroMayorCabecera: function (oEvent) {
        tipoInputLibroMayor = "LibroMayorCabecera";
        this._getDialogLibroMayorAlta();
      },

      onValueHelpLibroMayorPosicion: function (oEvent) {
        tipoInputLibroMayor = "LibroMayorPosicion";
        this._getDialogLibroMayorAlta();
      },

      _getDialogLibroMayorAlta: function (sInputValue) {
        this.oComponent.setModel(new JSONModel(), "FiltrosLibroMayor");
        this.oComponent.setModel(new JSONModel(), "listadoLibroMayor");

        var oView = this.getView();

        if (!this.pDialogLibroMayorAlta) {
          this.pDialogLibroMayorAlta = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragments.BusqLibroMayorAlta",
            controller: this,
          }).then(function (oDialogLibroMayorAlta) {
            // connect dialog to the root view of this component (models, lifecycle)
            oView.addDependent(oDialogLibroMayorAlta);
            return oDialogLibroMayorAlta;
          });
        }
        this.pDialogLibroMayorAlta.then(function (oDialogLibroMayorAlta) {
          oDialogLibroMayorAlta.open(sInputValue);
        });
      },

      closeLibroMayorDiagAlta: function () {
        this.byId("libroMayorDialAlta").close();
      },

      onBusqLibroMayorAlta: function () {
        var Saknr = this.getView().byId("f_ctaLibroMayorAlta").getValue().trim();
        var Txt50 = this.getView().byId("f_descLibroMayorAlta").getValue().trim();
        this.onBusqLibroMayor(Saknr, Txt50)
      },

      onPressLibroMayorAlta: function (oEvent) {
        var libroMayor = this.getSelectLibroMayor(oEvent, "listadoLibroMayor");
        
        var ctaLibroMayor = libroMayor.Saknr;
        // Actualizamos el input de libro mayor
        switch (tipoInputLibroMayor) {
          case "LibroMayorCabecera":
            this.oComponent.getModel("DisplayPEP").setProperty("/Kstar", ctaLibroMayor);
            break;

          case "LibroMayorPosicion":
            this.oComponent.getModel("posPedFrag").setProperty("/Kstar", ctaLibroMayor);
            break;
        
          default:
            break;
        }
        this.closeLibroMayorDiagAlta();
      },*/

      // -------------------------------------- FUNCIONES MATERIALES --------------------------------------
      // FUNCIONES DE MATERIALES
      onBusqMateriales: function (Matnr, Maktx, Matkl) {
        var Bzirk = this.oComponent.getModel("ModoApp").getData().Bzirk;
        var Vkorg = this.oComponent.getModel("ModoApp").getData().Vkbur;
        var Vtweg = this.oComponent.getModel("ModoApp").getData().CvCanal;

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
        addFilter("Bzirk", Bzirk);
        addFilter("Vkorg", Vkorg);
        addFilter("Vtweg", Vtweg);

        var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

        sap.ui.core.BusyIndicator.show();

        Promise.all([
          this.readDataEntity(this.mainService, "/DameMaterialSet", aFilters),
        ]).then(this.buildMaterialesModel.bind(this), this.errorFatal.bind(this));
      },

      buildMaterialesModel: function (values) {
        var oModelMateriales = new JSONModel();
        if(values[0].results) {
          oModelMateriales.setData(values[0].results);          
        }
        this.oComponent.setModel(oModelMateriales, "listadoMaterialesAlta");
        this.oComponent.getModel("listadoMaterialesAlta").refresh(true);
        if (listadoValidarMateriales) {
          this.oComponent.setModel(oModelMateriales, "listadoValidarMateriales");
          this.oComponent.getModel("listadoValidarMateriales").refresh(true);
          listadoValidarMateriales = false;
        }        
        sap.ui.core.BusyIndicator.hide();
      },

      getSelectMat: function (oEvent, oModel) {
        var oModMat = this.oComponent.getModel(oModel).getData();
        const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
        const sOperation = sOperationPath.split("/").slice(-1).pop();
        var idMaterial = oModMat[sOperation];
        return idMaterial;
      },

      // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE MATERIALES POSICIÓN
      onValueHelpRequestMatAlta: function () {
        this._getDialogMaterialAlta();
      },

      _getDialogMaterialAlta: function (sInputValue) {
        this.oComponent.setModel(new JSONModel(), "FiltrosMat");
        this.oComponent.setModel(new JSONModel(), "listadoMaterialesAlta");

        var oView = this.getView();

        if (!this.pDialogMaterialAlta) {
          this.pDialogMaterialAlta = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragments.BusqMaterialesAlta",
            controller: this,
          }).then(function (oDialogMaterialAlta) {
            // connect dialog to the root view of this component (models, lifecycle)
            oView.addDependent(oDialogMaterialAlta);
            return oDialogMaterialAlta;
          });
        }
        this.pDialogMaterialAlta.then(function (oDialogMaterialAlta) {
          oDialogMaterialAlta.open(sInputValue);
        });
      },

      closeMatDiagAlta: function () {
        this.byId("matDialAlta").close();
      },

      onBusqMaterialesAlta: function () {
        var Matnr = this.getView().byId("f_codMatAlta").getValue().trim();
        var Maktx = this.getView().byId("f_nomMatAlta").getValue().trim();
        var Matkl = this.getView().byId("f_grArtAlta").getValue().trim();        
        this.onBusqMateriales(Matnr, Maktx, Matkl);
      },
      
      onPressMaterialAlta: function (oEvent) {
        var mat = this.getSelectMat(oEvent, "listadoMaterialesAlta");
        var nommat = mat.Maktx;
        var codmat = mat.Matnr;        
        var unimedmat = mat.Meins;
        this.oComponent.getModel("posPedFrag").setProperty("/ShortText", nommat);
        this.oComponent.getModel("posPedFrag").setProperty("/Material", codmat);        
        this.oComponent.getModel("posPedFrag").setProperty("/SalesUnit", unimedmat);
        this.oComponent.getModel("posPedFrag").refresh(true);
        this.closeMatDiagAlta();
        this.getView().byId("f_material").setValueState("None");
      },

      // -------------------------------------- FUNCIONES TIPO DE CAMBIO --------------------------------------
      // FUNCIONES DE TIPO DE CAMBIO
      handleChangePriceDate: function (oEvent) {
        var oDP = oEvent.getSource(),
          sValue = oEvent.getParameter("value"),
          bValid = oEvent.getParameter("valid");
  
        if (bValid) {
          oDP.setValueState("None");
          let currency = this.oComponent.getModel("posPedFrag").getData().Currency;
          this.onBusqTipoCambio(sValue, currency);
        } else {
          oDP.setValueState("Error");
        }
      },

      onBusqTipoCambio: function(Gdatu, Fcurr) {

        var aFilterIds = [],
            aFilterValues = [];

          var addFilter = function (id, value) {
              if (value) {
                  aFilterIds.push(id);
                  aFilterValues.push(value);
              }
          };

          addFilter("Gdatu", Date.parse(Gdatu));
          addFilter("Fcurr", Fcurr);

          var aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);

          Promise.all([
              this.readDataEntity(this.mainService, "/TipoCambioSet", aFilters),
          ]).then(this.buildTipoCambio.bind(this), this.errorFatal.bind(this));
      },

      buildTipoCambio: function (values) {
          var oModelTipoCambio = new JSONModel();
          if (values[0].results) {
              oModelTipoCambio.setData(values[0].results[0]);
              this.oComponent.getModel("posPedFrag").setProperty("/Ukurs", values[0].results[0].Ukurs);
          }
      },
      

      // -------------------------------------- FUNCIONES BOTONES POSICIONES --------------------------------------
      // FUNCIÓN BOTÓN AGREGAR LÍNEA
      onAddPosPed: function () {

        this.resetearEstadoInputsAddPos();
        listadoValidarMateriales = true;
        this.onBusqMateriales("", "", "");

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        var pedidosPos;
        var posicion = 10;

        if (modeApp == 'M') {
          pedidosPos = this.oComponent.getModel("DisplayPosPed").getData();
          if (pedidosPos.length > 0) {
            posicion = Number(pedidosPos[pedidosPos.length - 1].Posnr) + 10;
          }
        } else {
          pedidosPos = this.oComponent.getModel("PedidoPos").getData();
          if (pedidosPos.length > 0) {
            posicion = Number(pedidosPos[pedidosPos.length - 1].ItmNumber) + 10;
          }
        }        

        var last_ItmNumber = this.oComponent.getModel("DisplayPEP").getData().Last_ItmNumber + 10;

        if (last_ItmNumber > posicion) {
          posicion = last_ItmNumber;
        }

        var currency = "EUR";
        var priceDate = Util.formatDate(new Date());
        var configPos = {
          mode: "A",
          type: "P",
          index: null,
          Vbelp: posicion,
          // Moneda EUR por defecto
          Currency: currency,
          // Fecha de hoy por defecto
          PriceDate: priceDate,
          // Los CECOS / OT se recogen de cabecera de manera predeterminada
          Yykostkl: this.oComponent.getModel("DisplayPEP").getData().Yykostkl,
          Yyaufnr: this.oComponent.getModel("DisplayPEP").getData().Yyaufnr,
          Zzkostl: this.oComponent.getModel("DisplayPEP").getData().Zzkostl,
          Zzaufnr: this.oComponent.getModel("DisplayPEP").getData().Zzaufnr,
          Kstar: this.oComponent.getModel("DisplayPEP").getData().Kstar          
        }
        
        // Tipo de Cambio por defecto (Ukurs = 1.00000)
        this.onBusqTipoCambio(priceDate, currency);

        var oModConfigPos = new JSONModel();
        oModConfigPos.setData(configPos);
        this.oComponent.setModel(oModConfigPos, "posPedFrag");
        this.oComponent.getModel("posPedFrag").refresh(true);

        this._getDialogAddPosicionesPed();
      },

      // FUNCIÓN BOTÓN MODIFICAR LÍNEA      
      onModPosPed: function (oEvent) {

        this.resetearEstadoInputsAddPos();
        listadoValidarMateriales = true;
        this.onBusqMateriales("", "", "");

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        
        //MODO DE MODIFICACION DE PEDIDOS
        if (modeApp == 'M') {
          var index = oEvent.getSource().getBindingContext("DisplayPosPed").getPath().split("/").slice(-1).pop();
          
          var posiciones = this.oComponent.getModel("DisplayPosPed").getData();
          var posiciones_Aux = JSON.parse(JSON.stringify(posiciones)); // Copy data model without references
          var posicion = posiciones_Aux[index];

          var configPos = {
            mode: "M",
            type: "P",
            index: index,
            Vbelp: posicion.Posnr,
            PoItmNo: posicion.PoItmNo,
            ShortText: posicion.Arktx,
            Material: posicion.Matnr,            
            PriceDate: Util.formatDate(new Date(posicion.Zzprsdt)),
            CondValue: posicion.Netpr,
            ReqQty: posicion.Kwmeng,
            Kpein: posicion.Kpein,
            Currency: posicion.Waerk,
            Ukurs: posicion.Ukurs,
            SalesUnit: posicion.Zieme,
            Yykostkl: posicion.Yykostkl,
            Yyaufnr: posicion.Yyaufnr,
            Zzkostl: posicion.Zzkostl,
            Zzaufnr: posicion.Zzaufnr,
            Kstar: posicion.Kstar,
            Tdlinepos: posicion.Tdlinepos
          }

          var oModConfigPos = new JSONModel();
          oModConfigPos.setData(configPos);
          this.oComponent.setModel(oModConfigPos, "posPedFrag");
          this.oComponent.getModel("posPedFrag").refresh(true);

          ///MODO DE CREACION DE PEDIDOS
        } else if (modeApp == 'C') {
          var index = oEvent.getSource().getBindingContext("PedidoPos").getPath().split("/").slice(-1).pop();
          
          var posiciones = this.oComponent.getModel("PedidoPos").getData();
          var posiciones_Aux = JSON.parse(JSON.stringify(posiciones)); // Copy data model without references
          var posicion = posiciones_Aux[index];

          var configPos = {
            mode: "M",
            type: "P",
            index: index,
            Vbelp: posicion.ItmNumber,  
            PoItmNo: posicion.PoItmNo,
            ShortText: posicion.ShortText,
            Material: posicion.Material,            
            PriceDate: Util.formatDate(new Date(posicion.PriceDate)),
            CondValue: posicion.CondValue,            
            ReqQty: posicion.ReqQty,
            Kpein: posicion.Kpein,
            Currency: posicion.Currency,
            Ukurs: posicion.Ukurs,
            SalesUnit: posicion.SalesUnit,
            Yykostkl: posicion.Yykostkl,
            Yyaufnr: posicion.Yyaufnr,
            Zzkostl: posicion.Zzkostl,
            Zzaufnr: posicion.Zzaufnr,
            Kstar: posicion.Kstar,
            Tdlinepos: posicion.Tdlinepos
          }

          var oModConfigPos = new JSONModel();
          oModConfigPos.setData(configPos);
          this.oComponent.setModel(oModConfigPos, "posPedFrag");
          this.oComponent.getModel("posPedFrag").refresh(true);          
        }

        this._getDialogAddPosicionesPed();
      },
      
      // FUNCIONES DIÁLOGO AÑADIR LÍNEA
      _getDialogAddPosicionesPed: function (sInputValue) {

        var oView = this.getView();
        
        if (!this.pDialogPosiciones) {
          this.pDialogPosiciones = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragments.AddPosicionesPed",
            controller: this,
          }).then(function (oDialogPosiciones) {
            // connect dialog to the root view of this component (models, lifecycle)
            oView.addDependent(oDialogPosiciones);
            return oDialogPosiciones;
          });

          ///DESHABILITAR SCROLL EN LOS INPUT NUMERICOS
          var oInput = this.byId("f_importpos");
          oInput.attachBrowserEvent("mousewheel", function (oEvent) {
            oEvent.preventDefault();
          });
          var oInput = this.byId("f_cantpos");
          oInput.attachBrowserEvent("mousewheel", function (oEvent) {
            oEvent.preventDefault();
          });
          var oInput = this.byId("f_cantbasepos");
          oInput.attachBrowserEvent("mousewheel", function (oEvent) {
            oEvent.preventDefault();
          });
        }

        this.pDialogPosiciones.then(function (oDialogPosiciones) {
          oDialogPosiciones.open(sInputValue);
        });
      },

      closePedPos: function () {
        this.byId("pedPosDial").close();
      },

      // VALIDAR LOS INPUTS DEL DIÁLOGO DE AÑADIR/MODIFICAR POSICIÓN
      validarInputsAddPos: function () {    
        // --Validación inputs obligatorios
        var inPosicion = this.getView().byId("f_tipopedpos");
        var inNomMaterial = this.getView().byId("f_nommat");
        var inFechaPrecio = this.getView().byId("DTPdesde");
        var inImporte = this.getView().byId("f_importpos");
        var inCantidad = this.getView().byId("f_cantpos");
        var inCantidadBase = this.getView().byId("f_cantbasepos");
        var inMoneda = this.getView().byId("f_monedapos");
        var inUnidad = this.getView().byId("f_unitpos");
        var inCecosIngPos = this.getView().byId("f_cecosIngPos");
        
        if (inPosicion.getValue().trim()) {
            inPosicion.setValueState("None");
        } else {
            inPosicion.setValueState("Error");
        }

        if (inNomMaterial.getValue().trim()) {
            inNomMaterial.setValueState("None");
        } else {
            inNomMaterial.setValueState("Error");
        }

        if (inFechaPrecio.getValue().trim()) {
            inFechaPrecio.setValueState("None");
        } else {
            inFechaPrecio.setValueState("Error");
        }

        if (!inImporte.getValue().trim()) {
            inImporte.setValueState("Error");
        }

        if (!inCantidad.getValue().trim()) {
            inCantidad.setValueState("Error");
        }

        if (!inCantidadBase.getValue().trim()) {
            inCantidadBase.setValueState("Error");
        }

        if (inMoneda.getValue().trim()) {
            inMoneda.setValueState("None");
        } else {
            inMoneda.setValueState("Error");
        }

        if (inUnidad.getValue().trim()) {
            inUnidad.setValueState("None");
        } else {
            inUnidad.setValueState("Error");
        }

        if (inCecosIngPos.getValue().trim()) {
            inCecosIngPos.setValueState("None");
        } else {
            inCecosIngPos.setValueState("Error");
        }

        // --Validación Materiales
        var materialesValidos = this.getView().getModel("listadoValidarMateriales").getData();

        var inMaterial = this.getView().byId("f_material");
        var material = inMaterial.getValue();
        var materialEncontrado = !!materialesValidos.find(materialValido => materialValido.Matnr === material);
        if (materialEncontrado) {
          inMaterial.setValueState("None");
        }else{
          inMaterial.setValueState("Error");
          inMaterial.setValueStateText("Material no permitido");
        }

        var validation = false;
        //VALIDACIÓN SI CONTIENE UN VALOR Y SI EL ESTADO DEL COMPONENTE NO ES ERROR 
        // Nota: Los CECOS y OT se validan en SAP
        if (inPosicion.getValueState()      != "Error" &&
            inNomMaterial.getValueState()   != "Error" &&
            inFechaPrecio.getValueState()   != "Error" &&
            inImporte.getValueState()       != "Error" &&
            inCantidad.getValueState()      != "Error" &&
            inCantidadBase.getValueState()  != "Error" &&
            inMoneda.getValueState()        != "Error" &&
            inUnidad.getValueState()        != "Error" &&
            inCecosIngPos.getValueState()   != "Error" &&
            inMaterial.getValueState()      != "Error") {
                validation = true;
        }
        
        return validation;
      },

      // RESETEAR LOS INPUTS DEL DIÁLOGO DE AÑADIR/MODIFICAR POSICIÓN
      resetearEstadoInputsAddPos: function () {
        // Quitar la marca roja si hay algún campo con error
        if(this.getView().byId("sf_PedPos")){
          this.getView().byId("f_tipopedpos").setValueState("None");
          this.getView().byId("f_material").setValueState("None");
          this.getView().byId("f_nommat").setValueState("None");
          this.getView().byId("DTPdesde").setValueState("None");
          this.getView().byId("f_importpos").setValueState("None");
          this.getView().byId("f_cantpos").setValueState("None");
          this.getView().byId("f_cantbasepos").setValueState("None");
          this.getView().byId("f_monedapos").setValueState("None");
          this.getView().byId("f_tipocambio").setValueState("None");
          this.getView().byId("f_unitpos").setValueState("None");
          this.getView().byId("f_cecosIngPos").setValueState("None");
          this.getView().byId("f_ordenesIngPos").setValueState("None");
          this.getView().byId("f_cecosIntPos").setValueState("None");
          this.getView().byId("f_ordenesIntPos").setValueState("None");
          this.getView().byId("f_libroMayorIntPOS").setValueState("None");
          this.getView().byId("textAreaPosFact").setValueState("None");
        }
      },

      resetearEstadoInputsAltaPedido: function () {
        // Quitar la marca roja si hay algún campo con error
        if(this.getView().byId("fAltaCab")){
          this.getView().byId("f_denoped").setValueState("None");
          this.getView().byId("idOficinaV").setValueState("None");
          this.getView().byId("f_refped").setValueState("None");
          this.getView().byId("f_cecosIngresoCab").setValueState("None");
          this.getView().byId("f_ordenesIngresoCab").setValueState("None");
          this.getView().byId("f_cecosIntercoCab").setValueState("None");
          this.getView().byId("f_ordenesIntercoCab").setValueState("None");
          this.getView().byId("f_libroMayorInterco").setValueState("None");
          this.getView().byId("f_campomotivo").setValueState("None");
          this.getView().byId("f_campocondicion").setValueState("None");
          this.getView().byId("f_camponia").setValueState("None");
          this.getView().byId("textAreaCabFact").setValueState("None");
        }
      },

      addPedPos: function () {

        // Validaciones
        var validation = this.validarInputsAddPos();
        if (!validation){
          return;
        }

        var posiciones = [];
        var posicionN;

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        
        var posPedFrag = this.oComponent.getModel("posPedFrag").getData();
        var modePosPed = posPedFrag.mode;

        //posactual = ('000000' + posactual).slice(-6); // Establecemos el formato de 6 caracteres 000010
        
        // Tipo cambio
        var tipocambio = this.getView().byId("f_tipocambio").getValue().trim();

        // Importe Total por línea
        var impTotal = this.calcularImporteTotal(posPedFrag.ReqQty, posPedFrag.Kpein, posPedFrag.CondValue);
        
        if (modeApp == 'M') {
          posiciones = this.oComponent.getModel("DisplayPosPed").getData();

          //Mapeamos las posiciones
          posicionN = {
            Posnr: posPedFrag.Vbelp,
            PoItmNo: posPedFrag.PoItmNo,
            Matnr: posPedFrag.Material,
            Arktx: posPedFrag.ShortText,
            Zzprsdt: new Date(posPedFrag.PriceDate),
            Kwmeng: posPedFrag.ReqQty,
            Kpein: posPedFrag.Kpein,
            Zieme: posPedFrag.SalesUnit,
            Netpr: posPedFrag.CondValue,
            Waerk: posPedFrag.Currency,
            Ukurs: tipocambio,
            Yykostkl: posPedFrag.Yykostkl,
            Yyaufnr: posPedFrag.Yyaufnr,
            Zzkostl: posPedFrag.Zzkostl,
            Zzaufnr: posPedFrag.Zzaufnr,
            Kstar: posPedFrag.Kstar,
            Tdlinepos: posPedFrag.Tdlinepos,
            ImpTotal: impTotal
          }

          if (modePosPed == 'M') {
            var indexPosPed = posPedFrag.index;
            // Modificamos la posición seleccionada
            posiciones[indexPosPed] = posicionN;
          } else {
            posiciones.push(posicionN);
          }
          this.oComponent.getModel("DisplayPosPed").refresh(true);
        } else {
          posiciones = this.oComponent.getModel("PedidoPos").getData();

          //Mapeamos las posiciones
          posicionN = {
            ItmNumber: posPedFrag.Vbelp,
            PoItmNo: posPedFrag.PoItmNo,
            Material: posPedFrag.Material,
            ShortText: posPedFrag.ShortText,
            PriceDate: new Date(posPedFrag.PriceDate),
            ReqQty: posPedFrag.ReqQty,
            Kpein: posPedFrag.Kpein,
            SalesUnit: posPedFrag.SalesUnit,
            CondValue: posPedFrag.CondValue,
            Currency: posPedFrag.Currency,
            Ukurs: tipocambio,
            Yykostkl: posPedFrag.Yykostkl,
            Yyaufnr: posPedFrag.Yyaufnr,
            Zzkostl: posPedFrag.Zzkostl,
            Zzaufnr: posPedFrag.Zzaufnr,
            Kstar: posPedFrag.Kstar,
            Tdlinepos: posPedFrag.Tdlinepos,
            ImpTotal: impTotal
          }

          if (modePosPed == 'M') {
            var indexPosPed = posPedFrag.index;
            // Modificamos la posición seleccionada
            posiciones[indexPosPed] = posicionN;
          } else {
            posiciones.push(posicionN);
          }
          this.oComponent.getModel("PedidoPos").refresh(true);
        }
        this.actualizaimp();
        this.closePedPos();
      },

      // FUNCIONES COPIAR LÍNEA
      onCopyPosPed: function () {

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;

        if (modeApp == 'M') {
          var oTable = this.getView().byId("TablaPosicionesDisp");
          var aContexts = oTable.getSelectedIndices();

          if (aContexts.length == 0) {
            //Mostramos un error porque no se ha seleccionado una linea
            MessageBox.warning(this.oI18nModel.getProperty("errModPos"));
          } else {
            var posiciones = this.oComponent.getModel("DisplayPosPed").getData();
            var posiciones_Aux = JSON.parse(JSON.stringify(posiciones)); // Copy data model without references
            var pedidoCopy = posiciones_Aux[aContexts[0]];
            var posicion = Number(posiciones_Aux[posiciones_Aux.length - 1].Posnr) + 10;
            var last_ItmNumber = this.oComponent.getModel("DisplayPEP").getData().Last_ItmNumber + 10;
            if (last_ItmNumber > posicion) {
              posicion = last_ItmNumber;
            }
            pedidoCopy.Posnr = posicion;
            pedidoCopy.Zzprsdt = new Date(pedidoCopy.Zzprsdt);
            //pedidoCopy.Posnr = ('000000' + itmNumberCopy).slice(-6);

            posiciones.push(pedidoCopy);
            this.oComponent.getModel("DisplayPosPed").refresh(true);
          }

        } else {
          var oTable = this.getView().byId("TablaPosiciones");
          var aContexts = oTable.getSelectedIndices();

          if (aContexts.length == 0) {
            //Mostramos un error porque no se ha seleccionado una linea
            MessageBox.warning(this.oI18nModel.getProperty("errModPos"));
          } else {
            var posiciones = this.oComponent.getModel("PedidoPos").getData();
            var posiciones_Aux = JSON.parse(JSON.stringify(posiciones)); // Copy data model without references
            var pedidoCopy = posiciones_Aux[aContexts[0]];
            var posicion = Number(posiciones_Aux[posiciones_Aux.length - 1].ItmNumber) + 10;
            var last_ItmNumber = this.oComponent.getModel("DisplayPEP").getData().Last_ItmNumber + 10;
            if (last_ItmNumber > posicion) {
              posicion = last_ItmNumber;
            }
            pedidoCopy.ItmNumber = posicion;
            pedidoCopy.PriceDate = new Date(pedidoCopy.PriceDate);
            //pedidoCopy.ItmNumber = ('000000' + itmNumberCopy).slice(-6);

            posiciones.push(pedidoCopy);
            this.oComponent.getModel("PedidoPos").refresh(true);
          }
        }
        this.actualizaimp();
      },

      // FUNCIÓN BOTÓN BORRAR LÍNEA      
      onDeletePosPed: function (oEvent) {

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        
        //MODO DE MODIFICACION DE PEDIDOS
        if (modeApp == 'M') {
          var oTable = this.getView().byId("TablaPosicionesDisp");
          var aContexts = oTable.getSelectedIndices();

          if (aContexts.length == 0) {
            //Mostramos un error porque no se ha seleccionado una linea
            MessageBox.warning(this.oI18nModel.getProperty("errModPos"));
          } else {
            var posiciones = this.oComponent.getModel("DisplayPosPed").getData();

            var index = aContexts[0];

            // Si tiene contrato, lo añadimos al modelo para que pueda ser seleccionable
            // if (this.oComponent.getModel("ModoApp").getData().Numcont) {
            //   var posicionesContrato = this.oComponent.getModel("PedidoPosContrato").getData();
            //   posicionesContrato.push(posiciones[index]);
            //   this.oComponent.getModel("PedidoPosContrato").refresh(true);
            // }

            posiciones.splice(index, 1); // Eliminarmos la posición del modelo
            this.oComponent.getModel("DisplayPosPed").refresh(true);
            oTable.clearSelection();
          }

          ///MODO DE CREACION DE PEDIDOS
        } else if (modeApp == 'C') {
          var oTable = this.getView().byId("TablaPosiciones");
          var aContexts = oTable.getSelectedIndices();

          if (aContexts.length == 0) {
            //Mostramos un error porque no se ha seleccionado una linea
            MessageBox.warning(this.oI18nModel.getProperty("errModPos"));
          } else {
            var posiciones = this.oComponent.getModel("PedidoPos").getData();

            var index = aContexts[0];

            // Si tiene contrato, lo añadimos al modelo para que pueda ser seleccionable
            // if (this.oComponent.getModel("ModoApp").getData().Numcont) {
            //   var posicionesContrato = this.oComponent.getModel("PedidoPosContrato").getData();
            //   let posicionBorrar = posiciones[index];
            //   let posicionN = {
            //     Posnr: posicionBorrar.ItmNumber,
            //     Matnr: posicionBorrar.Material,
            //     Arktx: posicionBorrar.ShortText,
            //     Zzprsdt: new Date(posicionBorrar.PriceDate),
            //     Kwmeng: posicionBorrar.ReqQty,
            //     Kpein: posicionBorrar.Kpein,
            //     Zieme: posicionBorrar.SalesUnit,
            //     Netpr: posicionBorrar.CondValue,
            //     Waerk: posicionBorrar.Currency,
            //     Ukurs: posicionBorrar.Ukurs,
            //     Yykostkl: posicionBorrar.Yykostkl,
            //     Yyaufnr: posicionBorrar.Yyaufnr,
            //     Zzkostl: posicionBorrar.Zzkostl,
            //     Zzaufnr: posicionBorrar.Zzaufnr,
            //     Kstar: posicionBorrar.Kstar
            //   }
            //   posicionesContrato.push(posicionN);
            //   this.oComponent.getModel("PedidoPosContrato").refresh(true);
            // }

            posiciones.splice(index, 1); // Eliminarmos la posición del modelo
            this.oComponent.getModel("PedidoPos").refresh(true);
            oTable.clearSelection();
          }          
        }  
        this.actualizaimp();      
      },

      // ------------------ FUNCIONES BOTÓN AGREGAR CON REFERENCIA A CONTRATO ------------------
      onAddPosPedCon: function () {
        this._getDialogPedContrato();
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

      onNavAltaContrato: function () {

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        
        var oTable = this.getView().byId("TablaPosicionesContrato");
        var aSelectedIndices = oTable.getSelectedIndices();
        
        var pedidosContrato = this.oComponent.getModel("PedidoPosContrato").getData();
        var pedidosContrato_Aux = JSON.parse(JSON.stringify(pedidosContrato)); // Copy data model without references
        var posiciones;
        //let indexDeleted = 0;
        var itmNumber = 0;

        if (modeApp == 'M') {
          posiciones = this.oComponent.getModel("DisplayPosPed").getData();
          if (posiciones.length > 0) {
            itmNumber = Number(posiciones[posiciones.length - 1].Posnr);
          }
        } else {
          posiciones = this.oComponent.getModel("PedidoPos").getData();
          if (posiciones.length > 0) {
            itmNumber = Number(posiciones[posiciones.length - 1].ItmNumber);
          }
        }
        
        for (var i = 0; i < aSelectedIndices.length; i++) {
          var indice = aSelectedIndices[i];
          let posicionPed = pedidosContrato_Aux[indice];
          itmNumber += 10;
          
          if (modeApp === 'C') {

            // Importe Total por línea
            var impTotal = this.calcularImporteTotal(posicionPed.Kwmeng, posicionPed.Kpein, posicionPed.Netpr);
        
            var posicionN = {
              ItmNumber: itmNumber,
              PoItmNo: posicionPed.PoItmNo,
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
              ImpTotal: impTotal
            }
            posiciones.push(posicionN);

          }else{
            // Importe Total por línea
            var impTotal = this.calcularImporteTotal(posicionPed.Kwmeng, posicionPed.Kpein, posicionPed.Netpr);
            posicionPed.ImpTotal = impTotal;
            posicionPed.Posnr = itmNumber;            
            posicionPed.Zzprsdt = new Date(posicionPed.Zzprsdt);
            posiciones.push(posicionPed);
          }
          //pedidosContrato.splice(indice-indexDeleted, 1); // Eliminarmos la posición del modelo de contratos
          //indexDeleted++;
        }
        //this.oComponent.getModel("PedidoPosContrato").refresh(true);

        if (modeApp === 'M') {
          this.oComponent.getModel("DisplayPosPed").refresh(true);
        }else{
          this.oComponent.getModel("PedidoPos").refresh(true);
        }

        // Deseleccionar las opciones
        aSelectedIndices.forEach(function (oItem) {
          oTable.setSelectedIndex(-1);
        });
        this.actualizaimp();
        this.closeOptionsDiagContrato();
      },

      closeOptionsDiagContrato: function () {
        this.byId("OptionDialContrato").close();
      },

      // -------------------------------------- FUNCIÓN BOTÓN GRABAR --------------------------------------
      // VALIDACIONES CAMBIO DE ESTADO DROPDOWNS/INPUTS GRABAR
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

            // Si es el input de moneda y viene la fecha informada, obtenemos el tipo de cambio
            if ((value.getId() === "application-monitorpedidos-display-component---AltaPedidos--f_monedapos" || 
                value.getId() === "application-ZPV-display-component---AltaPedidos--f_monedapos") &&
                this.oComponent.getModel("posPedFrag").getData().PriceDate) {
                  let priceDate = this.oComponent.getModel("posPedFrag").getData().PriceDate;
                  this.onBusqTipoCambio(priceDate, response);
            }
        } else {
            value.setValueState("Error");
        }
    },

    // VALIDAR LA ACTUALIZACIÓN DE LOS INPUTS DE ALTA DE PEDIDOS
    onLiveChangeRequired: function (oEvent) {
			var input = sap.ui.getCore().byId(oEvent.getSource().sId);
      var value = input.getValue().trim();
			if (value && value.trim() !== '') {
        input.setValueState("None");
      } else {
        input.setValueState("Error");
        input.setValueStateText("Campo obligatorio");
      }
		},

    onLiveChangePositiveNumber: function (oEvent) {
			var input = sap.ui.getCore().byId(oEvent.getSource().sId);
      var value = input.getValue().trim();
			if (value) {
        if (value >= 0) {
          input.setValueState("None");
        }else{
          input.setValueState("Error");
          input.setValueStateText("Solo se permiten valores positivos");
        }        
      } else {
        input.setValueState("Error");
        input.setValueStateText("Campo obligatorio");
      }
		},

    // QUITAR EL MENSAJE DE ERROR EN EL INPUT CUANDO SE RELLENA UN CAMPO OPCIONAL
    onLiveChangeOptional: function (oEvent) {
			var input = sap.ui.getCore().byId(oEvent.getSource().sId);
      input.setValueState("None");
		},

    // VALIDAR LOS INPUTS DEL DIÁLOGO DE ALTA DE PEDIDOS
      validarInputsGrabar: function () {    
        // --Validación inputs obligatorios
        var inDenominacion = this.getView().byId("f_denoped");
        var inOficinaVentas = this.getView().byId("idOficinaV");
        var inNumPedCliente = this.getView().byId("f_refped");
        var inMotivoPedido = this.getView().byId("f_campomotivo");
        var inCondicionPago = this.getView().byId("f_campocondicion");
        var inNIA = this.getView().byId("f_camponia");
        var inTxtCabecera = this.getView().byId("textAreaCabFact");
        
        if (inDenominacion.getValue().trim()) {
          inDenominacion.setValueState("None");
        } else {
          inDenominacion.setValueState("Error");
        }

        // Validación Oficina de ventas
        var oficina = inOficinaVentas.getSelectedKey();
        var oficinasVenta = new Set(this.oComponent.getModel("OficinaVenta").getData().map(item => item.Vkbur));

        if (oficina && oficinasVenta.has(oficina)) {
          inOficinaVentas.setValueState("None");
        } else {
          inOficinaVentas.setValueState("Error");
        }

        if (inNumPedCliente.getValue().trim()) {
            inNumPedCliente.setValueState("None");
        } else {
            inNumPedCliente.setValueState("Error");
        }

        // Validación motivo de pedido        
        var motivo = inMotivoPedido.getSelectedKey();
        var motivosPed = new Set(this.oComponent.getModel("listadoMotivo").getData().map(item => item.Augru));

        if (motivo && motivosPed.has(motivo)) {
          inMotivoPedido.setValueState("None");
        } else {
          inMotivoPedido.setValueState("Error");
        }

        if (inCondicionPago.getValue().trim()) {
            inCondicionPago.setValueState("None");
        } else {
            inCondicionPago.setValueState("Error");
        }

        if (inNIA.getValue().trim()) {
            inNIA.setValueState("None");
        } else {
            inNIA.setValueState("Error");
        }

        if (inTxtCabecera.getValue().trim()) {
          inTxtCabecera.setValueState("None");
        } else {
          inTxtCabecera.setValueState("Error");
        }

        var validation = false;
        // VALIDACIÓN SI CONTIENE UN VALOR Y SI EL ESTADO DEL COMPONENTE NO ES ERROR
        // Nota: Los CECOS y OT se validan en SAP
        if (inDenominacion.getValueState()  != "Error" &&
            inOficinaVentas.getValueState() != "Error" &&
            inNumPedCliente.getValueState() != "Error" &&
            inMotivoPedido.getValueState()  != "Error" &&
            inCondicionPago.getValueState() != "Error" &&
            inNIA.getValueState()           != "Error" &&
            inTxtCabecera.getValueState()   != "Error") {
                validation = true;
        }
        
        return validation;
    },

    onGrabar: function () {
        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        var isCopy = this.oComponent.getModel("ModoApp").getData().copy;
        
        var posiciones;
        if (modeApp === 'M') {
          posiciones = this.getView().getModel("DisplayPosPed").getData();
        }else{
          posiciones = this.getView().getModel("PedidoPos").getData();
        }
        
        // Validaciones
        var validation = this.validarInputsGrabar();
        if (!validation){
          MessageBox.error("Se ha producido un error en la validación de los datos introducidos");
          return;
        }

        // Validamos que el pedido tiene alguna posición
        if (!posiciones || posiciones.length < 1) {
          MessageBox.error("No se puede grabar un pedido sin posiciones");
          return;  
        }

        var that = this;
        sap.ui.core.BusyIndicator.show();

        var message;
        var crear = "Se ha creado la solicitud de Venta: ";
        var modificar = "Se ha modificado la solicitud de Venta: "

        //Fechas de Cabecera
        var ReqDate = Date.parse(new Date());
        var PurchDate = Date.parse(new Date());
        var BillDate = Date.parse(new Date());
        var DocDate = Date.parse(new Date());
        var PriceDate = Date.parse(new Date());
        var QtValidF = Date.parse(new Date());
        var QtValidT = Date.parse(new Date());
        var CtValidF = Date.parse(new Date());
        var CtValidT = Date.parse(new Date());
        var WarDate = Date.parse(new Date());
        var FixValDy = Date.parse(new Date());
        var ServDate = Date.parse(new Date());
        var CmlqtyDat = Date.parse(new Date());
        var PsmPstngDate = Date.parse(new Date());
        var PoDatS = Date.parse(new Date());
        var DunDate = Date.parse(new Date());
        
        // Fechas de Posición
        var TpDate = Date.parse(new Date());
        var GiDate = Date.parse(new Date());        
        var MsDate = Date.parse(new Date());
        var LoadDate = Date.parse(new Date());        
        var DlvDate = Date.parse(new Date());
        var Conpricdat = Date.parse(new Date());

        // Datos Alta Pedidos
        var Vbeln = this.oComponent.getModel("DisplayPEP").getData().Vbeln; // Número de pedido (solo al modificar)

        var PpSearch = this.oComponent.getModel("DisplayPEP").getData().Ktext; // Denominación
        var PartnNumb = this.oComponent.getModel("ModoApp").getData().Kunnr; // Código de cliente
        var Ref1 = this.oComponent.getModel("ModoApp").getData().Numcont; // Contrato

        var DocType = this.oComponent.getModel("ModoApp").getData().Clasepedido; // Clase de Pedido
        var SalesOrg = this.oComponent.getModel("ModoApp").getData().Vkbur; // Organización de Ventas / Sociedad
        var SalesDist = this.oComponent.getModel("ModoApp").getData().Bzirk; // Línea Servicio
        var DistrChan = this.oComponent.getModel("ModoApp").getData().CvCanal; // Canal
        var Division = this.oComponent.getModel("ModoApp").getData().CvSector; // Sector
        var SalesOff = this.oComponent.getModel("DisplayPEP").getData().Vkbur; // Oficina de Ventas
        var PurchNoC = this.oComponent.getModel("DisplayPEP").getData().Bstnk; // Nº de Pedido de Cliente
        var Yykostkl = this.oComponent.getModel("DisplayPEP").getData().Yykostkl; // Ceco Ingreso
        var Yyaufnr = this.oComponent.getModel("DisplayPEP").getData().Yyaufnr; // Orden Ingreso
        var Zzkostl = this.oComponent.getModel("DisplayPEP").getData().Zzkostl; // Ceco Interco
        var Zzaufnr = this.oComponent.getModel("DisplayPEP").getData().Zzaufnr; // Orden Interco
        var Kstar = this.oComponent.getModel("DisplayPEP").getData().Kstar; // Libro Mayor Interco
        var OrdReason = this.oComponent.getModel("DisplayPEP").getData().Augru; // Motivo de Pedido
        var BillBlock = this.oComponent.getModel("DisplayPEP").getData().Faksk; // Bloqueo de Factura
        var Zznia = this.oComponent.getModel("ModoApp").getData().Nia; // NIA
        var TxtCabecera = this.oComponent.getModel("DisplayPEP").getData().Tdlinecab; // Texto de Cabecera
        var TxtAclaraciones = this.oComponent.getModel("DisplayPEP").getData().Tdlineacl; // Texto de aclaraciones
        var SmtpAddr = this.oComponent.getModel("ModoApp").getData().SmtpAddr; // Mail destina de factura
        // -- Otros campos --        
        // -Responsable
        var Zzresponsable = "";
        
        // -Role
        var PartnRole = "AG";

        // -Moneda
        var Currency; 
        // Si existe la moneda en el pedido se mantiene
        if (this.oComponent.getModel("DisplayPEP").getData().Waerk) {
          Currency = this.oComponent.getModel("DisplayPEP").getData().Waerk;
        }else{ // Si es un nuevo pedido, cogemos la moneda de la primera posición
          Currency = posiciones[0].Currency;
          this.oComponent.getModel("DisplayPEP").setProperty("/Waerk", Currency);
        }

        // --ADJUNTOS (FicheroModSet)
        var oModAdj = this.oComponent.getModel("Adjuntos").getData();
        var oModAdj2 = [];//, numdoc = 0;
        
        oModAdj.forEach(function (el) {
          //numdoc++;

          var adj = {
            Numdoc: el.Numdoc,
            Filename: el.Filename,
            Descripcion: el.Descripcion,
            Mimetype: el.Mimetype,
            Content: el.Content
          }

          // if (!el.URL) {
          //   adj.Mimetype = el.Mimetype;
          //   adj.Content = el.Content;
          // }

          oModAdj2.push(adj);
        });
        
        
        // --POSCIONES (SolicitudPepCrSet, SolicitudPedCondSet, SolicitudPedQtySet, PedidoTextosModSet)
        var PedidoPosicionSet = [];
        var PedidoCondicionSet = [];
        var PedidoCantidadSet = [];
        var PedidoTextosSet_Aux = [];
        for (var i = 0; i < posiciones.length; i++) {     
          
          var PoItmNo;
          if (posiciones[i].PoItmNo) {
            PoItmNo = posiciones[i].PoItmNo.toString();
          }
          
          if (modeApp === 'M') {
            // Entidad PedidoPosicionModSet
            let objPedidoPosicionSet = {
              ItmNumber: posiciones[i].Posnr.toString(), // Posición
              PoItmNo: PoItmNo, // Posición del contrato con referencia
              Material: posiciones[i].Matnr, // Material
              ShortText: posiciones[i].Arktx, // Descripción Material
              BillDate: "\/Date(" + BillDate + ")\/",
              PurchDate: "\/Date(" + PurchDate + ")\/",
              PoDatS: "\/Date(" + PoDatS + ")\/",
              FixValDy: "\/Date(" + FixValDy + ")\/",
              ServDate: "\/Date(" + ServDate + ")\/",
              PriceDate: "\/Date(" + Date.parse(posiciones[i].Zzprsdt) + ")\/", // Fecha Precio
              SalesUnit: posiciones[i].Zieme, // Unidades
              Plant: SalesOrg,
              Ukurs: posiciones[i].Ukurs, // Tipo de Cambio
              Yykostkl: posiciones[i].Yykostkl, // Ceco Ingreso
              Yyaufnr: posiciones[i].Yyaufnr, // Orden Ingreso
              Zzkostl: posiciones[i].Zzkostl, // Ceco Interco
              Zzaufnr: posiciones[i].Zzaufnr, // Orden Interco
              Kstar: posiciones[i].Kstar, // Libro Mayor Interco
              Tdlinepos: posiciones[i].Tdlinepos // Texto Posición Factura
            };
            PedidoPosicionSet.push(objPedidoPosicionSet);

            // Entidad PedidoCondicionModSet
            let objPedidoCondicionSet = {
              CondType: 'PR00',
              ItmNumber: posiciones[i].Posnr.toString(), // Posición
              CondPUnt: posiciones[i].Kpein, // Cantidad Base
              CondUnit: posiciones[i].Zieme, // Unidades
              CondValue: posiciones[i].Netpr, // Importe
              Currency: posiciones[i].Waerk, // Moneda
              Conpricdat: "\/Date(" + Conpricdat + ")\/",
            };
            PedidoCondicionSet.push(objPedidoCondicionSet);

            // Entidad PedidoCantidadModSet
            let objPedidoCantidadSet = {
              //Secu: (i + 1).toString(),
              ItmNumber: posiciones[i].Posnr.toString(), // Posición
              ReqQty: posiciones[i].Kwmeng, // Cantidad
              ReqDate: "\/Date(" + ReqDate + ")\/",
              TpDate: "\/Date(" + TpDate + ")\/",
              GiDate: "\/Date(" + GiDate + ")\/",
              MsDate: "\/Date(" + MsDate + ")\/",
              LoadDate: "\/Date(" + LoadDate + ")\/",
              DlvDate: "\/Date(" + DlvDate + ")\/",
            };
            PedidoCantidadSet.push(objPedidoCantidadSet);
                        
          }else{
            // Entidad PedidoPosicionSet
            let objPedidoPosicionSet = {
              ItmNumber: posiciones[i].ItmNumber.toString(), // Posición Nueva
              PoItmNo: PoItmNo, // Posición del contrato con referencia
              Material: posiciones[i].Material, // Material
              ShortText: posiciones[i].ShortText, // Descripción Material
              BillDate: "\/Date(" + BillDate + ")\/",
              PurchDate: "\/Date(" + PurchDate + ")\/",
              PoDatS: "\/Date(" + PoDatS + ")\/",
              FixValDy: "\/Date(" + FixValDy + ")\/",
              ServDate: "\/Date(" + ServDate + ")\/",
              PriceDate: "\/Date(" + Date.parse(posiciones[i].PriceDate) + ")\/", // Fecha Precio
              SalesUnit: posiciones[i].SalesUnit, // Unidades
              Plant: SalesOrg,
              Ukurs: posiciones[i].Ukurs, // Tipo de Cambio
              Yykostkl: posiciones[i].Yykostkl, // Ceco Ingreso
              Yyaufnr: posiciones[i].Yyaufnr, // Orden Ingreso
              Zzkostl: posiciones[i].Zzkostl, // Ceco Interco
              Zzaufnr: posiciones[i].Zzaufnr, // Orden Interco
              Kstar: posiciones[i].Kstar, // Libro Mayor Interco
              Tdlinepos: posiciones[i].Tdlinepos // Texto Posición Factura
            };
            PedidoPosicionSet.push(objPedidoPosicionSet);

            // Entidad PedidoCondicionSet
            let objPedidoCondicionSet = {
              CondType: 'PR00',
              ItmNumber: posiciones[i].ItmNumber.toString(), // Posición
              CondPUnt: posiciones[i].Kpein, // Cantidad Base
              CondUnit: posiciones[i].SalesUnit, // Unidades
              CondValue: posiciones[i].CondValue, // Importe
              Currency: posiciones[i].Currency, // Moneda
              Conpricdat: "\/Date(" + Conpricdat + ")\/",
            };
            PedidoCondicionSet.push(objPedidoCondicionSet);

            // Entidad PedidoCantidadSet
            let objPedidoCantidadSet = {
              //Secu: (i + 1).toString(),
              ItmNumber: posiciones[i].ItmNumber.toString(), // Posición
              ReqQty: posiciones[i].ReqQty, // Cantidad
              ReqDate: "\/Date(" + ReqDate + ")\/",
              TpDate: "\/Date(" + TpDate + ")\/",
              GiDate: "\/Date(" + GiDate + ")\/",
              MsDate: "\/Date(" + MsDate + ")\/",
              LoadDate: "\/Date(" + LoadDate + ")\/",
              DlvDate: "\/Date(" + DlvDate + ")\/",
            };
            PedidoCantidadSet.push(objPedidoCantidadSet);            
          }
          
          // ***REVISAR***
          // Entidad PedidoTextosSet
          let objPedidoTextosSet;
          if (TxtCabecera != null && TxtAclaraciones == null) {
            objPedidoTextosSet = {
              Textid: '0001',
              Langu: 'ES',
              Textline: TxtCabecera
            };
            PedidoTextosSet_Aux.push(objPedidoTextosSet);
          } else if (TxtCabecera == null && TxtAclaraciones != null) {
            objPedidoTextosSet = {
              Textid: 'Z003',
              Langu: 'ES',
              Textline: TxtAclaraciones
            };
            PedidoTextosSet_Aux.push(objPedidoTextosSet);
          } else if (TxtCabecera != null && TxtAclaraciones != null) {
            if (TxtCabecera) {
              objPedidoTextosSet = {
                Textid: '0001',
                Langu: 'ES',
                Textline: TxtCabecera
              };
              PedidoTextosSet_Aux.push(objPedidoTextosSet);
            }
            if (TxtAclaraciones) {
              objPedidoTextosSet = {
                Textid: 'Z003',
                Langu: 'ES',
                Textline: TxtAclaraciones
              };
              PedidoTextosSet_Aux.push(objPedidoTextosSet);
            }
          }
        }

        // Entidad PedidoTextosSet
        let PedidoTextosSet = [];
        let uniqueObject = {};

        for (let i in PedidoTextosSet_Aux) {
          var objTextId = PedidoTextosSet_Aux[i]['Textid'];
          uniqueObject[objTextId] = PedidoTextosSet_Aux[i];
        }

        for (i in uniqueObject) {
          PedidoTextosSet.push(uniqueObject[i]);
        }

        // -------------------- MODO CREACIÓN --------------------
        if (modeApp === 'C' || isCopy) {
          var oJson = {
            PpSearch: PpSearch,
            Ref1: Ref1,
            DocType: DocType,
            SalesOrg: SalesOrg,
            SalesDist: SalesDist,
            DistrChan: DistrChan,
            Division: Division,
            SalesOff: SalesOff,            
            PurchNoC: PurchNoC,
            Zzkostl: Zzkostl,
            Zzaufnr: Zzaufnr,
            Kstar: Kstar,
            OrdReason: OrdReason,
            BillBlock: BillBlock,
            Currency: Currency,
            ReqDateH: "\/Date(" + ReqDate + ")\/",
            PurchDate: "\/Date(" + PurchDate + ")\/",
            BillDate: "\/Date(" + BillDate + ")\/",
            DocDate: "\/Date(" + DocDate + ")\/",
            PriceDate: "\/Date(" + PriceDate + ")\/",
            QtValidF: "\/Date(" + QtValidF + ")\/",
            QtValidT: "\/Date(" + QtValidT + ")\/",
            CtValidF: "\/Date(" + CtValidF + ")\/",
            CtValidT: "\/Date(" + CtValidT + ")\/",
            WarDate: "\/Date(" + WarDate + ")\/",
            FixValDy: "\/Date(" + FixValDy + ")\/",
            ServDate: "\/Date(" + ServDate + ")\/",
            CmlqtyDat: "\/Date(" + CmlqtyDat + ")\/",
            PsmPstngDate: "\/Date(" + PsmPstngDate + ")\/",
            PoDatS: "\/Date(" + PoDatS + ")\/",
            DunDate: "\/Date(" + DunDate + ")\/",
            PedidoClienteSet: {
              PartnNumb: PartnNumb,
              PartnRole: PartnRole,
              SmtpAddr: SmtpAddr
            },
            PedidoExtensionSet: {
              Zznia: Zznia,
              Zzresponsable: Zzresponsable,
              Yykostkl: Yykostkl,
              Yyaufnr: Yyaufnr
            },
            FicheroSet: oModAdj2,
            PedidoPosicionSet: PedidoPosicionSet,
            PedidoCondicionSet: PedidoCondicionSet,
            PedidoCantidadSet: PedidoCantidadSet,
            PedidoTextosSet: PedidoTextosSet,            
            PedidoRespuestaSet: {
              //Idsolc: Idsolc,
            }
          };
  
          this.mainService.create("/PedidoCabSet", oJson, {
            success: function (result) {
              sap.ui.core.BusyIndicator.hide();
              if (result.Vbeln && result.Vbeln !== "0") {
                message = crear + result.Vbeln;
  
                MessageBox.show(message, {
                  icon: sap.m.MessageBox.Icon.SUCCESS,
                  onClose: function (oAction) {
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
                    oRouter.navTo("RouteMonitorPedidos");
                  }
                });
              } else if (result.PedidoRespuestaSet.Mensaje) {
                MessageBox.error(result.PedidoRespuestaSet.Mensaje);
              }              
            },
            error: function (err) {
              sap.m.MessageBox.error("Solicitud no creada.", {
                title: "Error",
                initialFocus: null,
              });
              sap.ui.core.BusyIndicator.hide();              
            },
            async: true
          });

          // -------------------- MODO MODIFICACIÓN --------------------
        }else{
          var oJson = {
            Vbeln: Vbeln,
            PpSearch: PpSearch,
            Ref1: Ref1,
            DocType: DocType,
            SalesOrg: SalesOrg,
            SalesDist: SalesDist,
            DistrChan: DistrChan,
            Division: Division,
            SalesOff: SalesOff,
            PurchNoC: PurchNoC,
            Zzkostl: Zzkostl,
            Zzaufnr: Zzaufnr,
            Kstar: Kstar,
            OrdReason: OrdReason,
            BillBlock: BillBlock,
            Currency: Currency,
            ReqDateH: "\/Date(" + ReqDate + ")\/",
            PurchDate: "\/Date(" + PurchDate + ")\/",
            BillDate: "\/Date(" + BillDate + ")\/",
            DocDate: "\/Date(" + DocDate + ")\/",
            PriceDate: "\/Date(" + PriceDate + ")\/",
            QtValidF: "\/Date(" + QtValidF + ")\/",
            QtValidT: "\/Date(" + QtValidT + ")\/",
            CtValidF: "\/Date(" + CtValidF + ")\/",
            CtValidT: "\/Date(" + CtValidT + ")\/",
            WarDate: "\/Date(" + WarDate + ")\/",
            FixValDy: "\/Date(" + FixValDy + ")\/",
            ServDate: "\/Date(" + ServDate + ")\/",
            CmlqtyDat: "\/Date(" + CmlqtyDat + ")\/",
            PsmPstngDate: "\/Date(" + PsmPstngDate + ")\/",
            PoDatS: "\/Date(" + PoDatS + ")\/",
            DunDate: "\/Date(" + DunDate + ")\/",
            PedidoClienteModSet: {
              PartnNumb: PartnNumb,
              PartnRole: PartnRole,
              SmtpAddr: SmtpAddr
            },
            PedidoExtensionModSet: {
              Zznia: Zznia,
              Zzresponsable: Zzresponsable,
              Yykostkl: Yykostkl,
              Yyaufnr: Yyaufnr
            },
            FicheroModSet: oModAdj2,
            PedidoPosicionModSet: PedidoPosicionSet,
            PedidoCondicionModSet: PedidoCondicionSet,
            PedidoCantidadModSet: PedidoCantidadSet,
            PedidoTextosModSet: PedidoTextosSet,            
            PedidoRespuestaModSet: {
              //Idsolc: Idsolc,
            }
          };

          this.mainService.create("/PedidoModSet", oJson, {
            success: function (result) {
              sap.ui.core.BusyIndicator.hide();
              if (result.Vbeln && result.Vbeln !== "0") {                
                message = modificar + result.Vbeln;
                MessageBox.show(message, {
                  icon: sap.m.MessageBox.Icon.SUCCESS,
                  onClose: function (oAction) {
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
                    oRouter.navTo("RouteMonitorPedidos");
                  }
                });
              } else if (result.PedidoRespuestaModSet.Mensaje) {
                MessageBox.error(result.PedidoRespuestaModSet.Mensaje);
              }
            },
            error: function (err) {
              sap.m.MessageBox.error("Solicitud no Modificada.", {
                title: "Error",
                initialFocus: null,
              });
              sap.ui.core.BusyIndicator.hide();
            },
            async: true,
          });
        }      
      },

      /*ABRIR GESTOR DE ARCHIVOS*/
      handleUploadPress: function (oEvent) {
        this.act_adj = null;
        
        var fileDetails = oEvent.getParameters("file").files[0];
        //sap.ui.getCore().fileUploaderArr = [];
        if (fileDetails) {
          var fileName = fileDetails.name;
          var mimeDet = fileDetails.type;

          // En los mails (msg) que se adjuntan, el campo mime no se determina correctamente
          // Se fuerza a este tipo cuando venga vacío, en las pruebas es el tipo asignado
          // para otros archivos que están en la misma situación (ej .exe)
          if (mimeDet === "") {
            mimeDet = "application/vnd.ms-outlook";
          }

          var adjuntos = this.oComponent.getModel("Adjuntos").getData();
          var nadj = adjuntos.length;
          this.base64conversionMethod(mimeDet, fileName, fileDetails, nadj, adjuntos)
        } else {
          //sap.ui.getCore().fileUploaderArr = []
        }
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
                that.act_adj = {
                    "Numdoc": numdoc,
                    "Mimetype": fileMime,
                    "Filename": fileName,
                    "Content": that.base64conversionRes
                };

                //that.oComponent.getModel("Adjuntos").setData(adjuntos);
                //oModel.oData.Adjuntos = adjuntos;
                //that.getView().byId("fileUploader").setValue("");
            };
            reader.readAsArrayBuffer(fileData);
        };
        var reader = new FileReader();
        reader.onload = function (readerEvt) {
            var binaryString = readerEvt.target.result;
            that.base64conversionRes = btoa(binaryString);
            var numdoc = (DocNum + 1).toString();
            that.act_adj = {
                "Numdoc": numdoc,
                "Mimetype": fileMime,
                "Content": that.base64conversionRes
            };

            //that.oComponent.getModel("Adjuntos").setData(adjuntos);
            //oModel.oData.Adjuntos = adjuntos;
            //that.getView().byId("fileUploader").setValue("");
        };
        reader.readAsBinaryString(fileDetails);
      },

      /* Botón para la funcionalidad de meterlo en la tabla de los adjuntos*/
      onAttFile: function () {
        /*var adjuntos = this.oComponent.getModel("Adjuntos").getData();
        var oMdesc = this.oComponent.getModel("datosAdj").getData();
        var desc = oMdesc.Desc;

        if (!desc) {
          MessageBox.error(this.oI18nModel.getProperty("errDesArch"));
          return;
        } else if (!this.act_adj) {
          MessageBox.error(this.oI18nModel.getProperty("errNoArch"));
          return;
        } else {

          this.act_adj.Descripcion = desc;
          adjuntos.push(this.act_adj);
          this.oComponent.getModel("Adjuntos").refresh(true);
          this.getView().byId("descPresAdjunto").setValue("");
          this.getView().byId("fileUploader").setValue("");
          this.act_adj = null;
        }*/


        var adjuntos = this.oComponent.getModel("Adjuntos").getData();
        var oMdesc = this.oComponent.getModel("datosAdj").getData();
        var desc = oMdesc.Desc;
        if (!desc) {
          MessageBox.error(this.oI18nModel.getProperty("errDesArch"));
          return
        } else if (!this.act_adj) {
          MessageBox.error(this.oI18nModel.getProperty("errNoArch"));
          return
        } else {
          this.act_adj.Descripcion = desc;
          adjuntos.push(this.act_adj);
          this.oComponent.getModel("Adjuntos").refresh(true);
          this.getView().byId("descAdjunto").setValue("");
          this.getView().byId("fileUploader").setValue("");
          this.act_adj = null;
        }

      },

      /* Función para eliminar un adjunto de la tabla */
      onDeleteAdj: function (oEvent) {

        var oModAdj = this.oComponent.getModel("Adjuntos");
        var adjs = oModAdj.getData();
        const sOperationPath = oEvent
          .getSource()
          .getBindingContext("Adjuntos")
          .getPath();
        
        MessageBox.confirm(this.oI18nModel.getProperty("warningDelAdj"), {
          emphasizedAction: MessageBox.Action.OK,
          onClose: function (oEventConfirm) {
            if (oEventConfirm === MessageBox.Action.OK) {

              const sOperation = sOperationPath.split("/").slice(-1).pop();
      
              adjs.splice(sOperation, 1);
      
              this.oComponent.setModel(new JSONModel(adjs), "Adjuntos");
          }
          }.bind(this)
        });
      },


      onPressIcono: function(oEvent) {
        var adj = this.Adjunto(oEvent);
        
        var fName = adj.Filename;
        var fType = adj.Mimetype;
        var fContent = adj.Content;
        var fNumdoc = adj.Numdoc;

        //*** */
        /*
        oEvent.preventDefault();
				this._download(adj)
					.then((blob) => {
						var url = window.URL.createObjectURL(blob);
						//open in the browser
						window.open(url);					
					})
					.catch((err)=> {
						console.log(err);
					});	*/

        // var fContentDecoded = atob(fContent);
        // var byteNumbers = new Array(fContentDecoded.length);
        // for (var i = 0; i < fContentDecoded.length; i++) {
        //     byteNumbers[i] = fContentDecoded.charCodeAt(i);
        // }
        // var byteArray = new Uint8Array(byteNumbers);

        // var byteArray = this.parseHexString(fContent);
        // var blob = new Blob([byteArray], {
        //     type: fType
        // });
        // var url = URL.createObjectURL(blob);
        // window.open(url, '_blank');

        //fContent = atob(fContent);
        //sap.ui.core.util.File.save(fContent, fName.substring(0, fName.length-3), "PDF", fType);

        //*** */
        //sap.m.URLHelper.redirect(adj.Url + "/Content/$value", true);

        //*** */
        /*var fileName = adj.Filename;
        var fileContent = adj.Content;

        // Crear un Blob con el contenido del archivo
        var blob = new Blob([fileContent], { type: adj.Mimetype });

        // Crear una URL para el Blob
        var url = window.URL.createObjectURL(blob);

        // Codificar el nombre del archivo y la URL
        var encodedFileName = encodeURI(fileName);
        var encodedUrl = encodeURI(url);

        // Crear un enlace para descargar el archivo
        var link = document.createElement("a");
        link.setAttribute("href", encodedUrl);
        link.setAttribute("download", encodedFileName);

        // Simular el clic en el enlace para iniciar la descarga
        document.body.appendChild(link);
        link.click();

        // Limpiar el objeto URL creado
        window.URL.revokeObjectURL(url);*/

        //*** */
        /*
        var sServiceUrl = adj.Url + "/Content/$value";
        var oUplColItem = new UploadCollectionItem();
        oUplColItem.setUrl(sServiceUrl);
        oUplColItem.setMimeType("application/pdf");
        oUplColItem.download(false);*/

        sap.ui.core.BusyIndicator.show();

        Promise.all([
          this.mainService.read("/SolicitudAdjuntoSet('"+fNumdoc+"')", {
              success: function (data, response) {
                  if (data) {
                    //let fContent = atob(data.Content);
                    //sap.ui.core.util.File.save(fContent, data.Filename.substring(0, data.Filename.length-3), "PDF", data.Mimetype, "utf-16");

                    //sap.m.URLHelper.redirect(data.Content);

                    var fContentDecoded = atob(data.Content)
                    //var fContentDecoded = new Buffer.from(fContent, 'base64');

                    //File.save(fContentDecoded, fName, "pdf", fType);

                    var byteNumbers = new Array(fContentDecoded.length);
                    for (var i = 0; i < fContentDecoded.length; i++) {
                        byteNumbers[i] = fContentDecoded.charCodeAt(i);
                    }
                    var byteArray = new Uint8Array(byteNumbers);
                    // var blob = new Blob([byteArray], {
                    //     type: fType
                    // });
                    // var url = URL.createObjectURL(blob);
                    // window.open(url, '_blank');
                    
                    // let arrayfName = fName.split('.');
                    // let name = arrayfName[0];
                    // let extension = arrayfName[arrayfName.length-1];
                    //1. Contenido
                    //2. Nombre
                    //3. Extensión
                    //4. Mimetype
                    // Docu: https://sapui5.hana.ondemand.com/sdk/#/api/sap.ui.core.util.File%23methods/sap.ui.core.util.File.save
                    sap.ui.core.util.File.save(byteArray, fName, fType, fType);
                  }
                  sap.ui.core.BusyIndicator.hide();
              },
              error: function (err) {
                  sap.m.MessageBox.error("Error, no se ha podido descargar el adjunto.", {
                      title: "Error",
                      initialFocus: null,
                  });
                  sap.ui.core.BusyIndicator.hide();
              },
          })
        ]);
        /*
        Promise.all([
          this.readDataEntity(this.mainService, "/LibroMayorSet", aFilters),
        ]).then(this.buildAdjuntoModel.bind(this), this.errorFatal.bind(this));
        */
      },

			/*_download: function (item) {
				var settings = {
					//url: item.Url + "/Content/$value",
          url: "http://localhost:8080/sap/opu/odata/sap/ZUI5_MONITOR_PEDIDOS_SRV/SolicitudAdjuntoSet('FOL29000000000004EXT49000000000189')/Content/$value",
					method: "GET",
					xhrFields:{
						responseType: "blob"
					}
				}	

				return new Promise((resolve, reject) => {
					$.ajax(settings)
					.done((result, textStatus, request) => {
						resolve(result);
					})
					.fail((err) => {
						reject(err);
					})
				});						
			},

      buildAdjuntoModel: function (values) {
        // var oModelAdjunto = new JSONModel();
        // if (values[0].results) {
        //   oModelAdjunto.setData(values[0].results);
        // }
        // this.oComponent.setModel(oModelAdjunto, "listadoLibroMayor");
        // this.oComponent.getModel("listadoLibroMayor").refresh(true);
        // sap.ui.core.BusyIndicator.hide();
      },

      parseHexString: function(str) { 
        var result = [];
        while (str.length >= 2) { 
            result.push(parseInt(str.substring(0, 2), 16));
            str = str.substring(2, str.length);
        }
    
        return result;
      },*/

      Adjunto: function(oEvent) {
        var oModAdj = this.oComponent.getModel("Adjuntos").getData();
        const sOperationPath = oEvent.getSource().getBindingContext("Adjuntos").getPath();
        const sOperation = sOperationPath.split("/").slice(-1).pop();

        var sum = oModAdj[sOperation];

        return sum;
      }      
    });
  });