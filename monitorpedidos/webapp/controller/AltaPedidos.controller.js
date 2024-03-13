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
    var codmat, nommat,unimedmat, fechaPos, codordPos, nomordPos, codcecoPos, nomcecoPos, sStatus;
    
    // Variables inputs
    var tipoInputCeco, tipoInputOrden, tipoInputLibroMayor;
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
    
    return Controller.extend("monitorpedidos.controller.AltaPedidos", {

      onInit: function () {
        this.mainService = this.getOwnerComponent().getModel("mainService");
        this.oComponent = this.getOwnerComponent();
        this.oI18nModel = this.oComponent.getModel("i18n");

        // var oModAdj = new JSONModel();
        // var oModAdjSHP = new JSONModel();
        // var modeApp = this.oComponent.getModel("ModoApp").getData().mode;

         /* Lógica que llama al metodo handleRouteMatched para que se realice la actualización del importe */
         this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
         this._oRouter.attachRouteMatched(this.handleRouteMatched, this);
      },
      
      /* Metodo para que cada vez que se abra la vista AltaPedidos, se realice la actualización del importe */
      handleRouteMatched: function (evt) {
        if (evt.getParameter("name") !== "AltaPedidos") {
          this.actualizaimp();
          this.oComponent.setModel(new JSONModel(), "listadoLibroMayor");
        }
      },

      // -------------------------------------- FUNCIONES PARA EL BOTÓN DE CANCELAR Y VOLVER --------------------------------------
      onNavBack : function(){
        this.onCancelar();
      },

      // -------------------------------------- FUNCIÓN BOTÓN CANCELAR --------------------------------------
      onCancelar: function () {
        /*this.getView().byId("textAreaCabFact").setValue(null);
        this.getView().byId("textAreaCabInfRech").setValue(null);
        this.getView().byId("textAreaCabAcl").setValue(null);
        this.getView().byId("f_refped").setValue(null);
        this.getView().byId("f_denoped").setValue(null);
        this.getView().byId("f_campomotivo").setSelectedKey(null);
        this.getView().byId("f_campocondicion").setSelectedKey(null);
        this.getView().byId("f_camponia").setSelectedKey(null);
        this.getView().byId("f_campoplat").setSelectedKey(null);
        this.getView().byId("f_campogest").setSelectedKey(null);
        this.getView().byId("f_campoundTram").setSelectedKey(null);
        this.getView().byId("f_campoofcont").setSelectedKey(null);
        this.getView().byId("f_campoAdm").setSelectedKey(null);
        this.getView().byId("idOficinaV").setSelectedKey(null);
        this.getView().byId("f_cecosCab").setValue(null);
        this.getView().byId("f_ordenesCab").setValue(null);
        this.getView().byId("f_ordenesCab").setValue(null);*/
        //this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", null);
        //this.oComponent.getModel("PedidoCab").setProperty("/Moneda", null);

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
        //var expression = /[.,]/;
        if (Netpr) {
          Netpr = Number(Netpr).toFixed(2);
        }
        importeFormat = this.oComponent.getModel("Usuario").getData()[0].Dcpfm;
        var numberFormat;
        switch (importeFormat) {
 
          case ""://1.234.567,89
            numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
              "maxFractionDigits": 2,
              "decimalSeparator": ",",
              "groupingEnabled": true,
              "groupingSeparator": '.'
            });
 
            break;
          case "X"://1,234,567.89
            numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
              "maxFractionDigits": 2,
              "decimalSeparator": ".",
              "groupingEnabled": true,
              "groupingSeparator": ','
            });
            break;
          case "Y"://1 234 567,89
            numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
              "maxFractionDigits": 2,
              "decimalSeparator": ",",
              "groupingEnabled": true,
              "groupingSeparator": ' '
            });
            break;
        }
        var numeroFormateado = numberFormat.format(Netpr);
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

      // -------------------------------------- FUNCIÓN ACTUALIZAR EL IMPORTE --------------------------------------
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

        this.oComponent.getModel("ModoApp").setProperty("/ImpPedido", sumCalculo);
        this.oComponent.getModel("ModoApp").setProperty("/Moneda", moneda);
        this.oComponent.getModel("ModoApp").refresh(true);
      },

      // -------------------------------------- FUNCIONES CECOS --------------------------------------
      // FUNCIONES DE CECOS
      onBusqCecos: function (Kostl, Ltext) {
        /*
        var Kostl = this.getView().byId("f_codCeco").getValue();
        var Ltext = this.getView().byId("f_nomCeco").getValue();
        */

        //var Bukrs = this.getView().byId("f_cecoSoc").getValue();
        //var Bukrs = this.getOwnerComponent().getModel("ModoApp").getProperty("/Vkbur");
        //var Bukrs = this.getView().byId("f_nifcAcr").getValue();
        
        /*var Bukrs;
        if (this.getOwnerComponent().getModel("ModoApp").getProperty("/mode") == 'M') {
          Bukrs = this.getOwnerComponent().getModel("DisplayPEP").getProperty("/Vkorg");
        } else {
          Bukrs = this.getOwnerComponent().getModel("ModoApp").getProperty("/Vkbur");
        }*/
        var Bukrs = this.oComponent.getModel("ModoApp").getProperty("/Vkbur");

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
        var Kostl = this.getView().byId("f_codCecoAlta").getValue();
        var Ltext = this.getView().byId("f_nomCecoAlta").getValue();
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
      onBusqOrdenes: function (Aufnr, Ktext, Bukrs, Ceco) {
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
        } else {
          MessageBox.warning(this.oI18nModel.getProperty("noOrd"));
        }
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
        var Aufnr = this.getView().byId("f_codOrdAlta").getValue();
        var Ktext = this.getView().byId("f_nomOrdAlta").getValue();
        var Bukrs = this.getView().byId("f_ordbukrsAlta").getValue();
        //var Ceco = codceco;
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

        this.onBusqOrdenes(Aufnr, Ktext, Bukrs, Ceco);
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
      // FUNCIONES DE LIBRO MAYOR
      onBusqLibroMayor: function (Saknr, Txt50) {        
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
        var Saknr = this.getView().byId("f_ctaLibroMayorAlta").getValue();
        var Txt50 = this.getView().byId("f_descLibroMayorAlta").getValue();
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
      },

      // -------------------------------------- FUNCIONES MATERIALES --------------------------------------
      // FUNCIONES DEL DIÁLOGO DE BÚSQUEDA DE MATERIALES POSICIÓN
      onValueHelpRequestMatAlta: function () {
        this._getDialogMaterialAlta();
      },

      _getDialogMaterialAlta: function (sInputValue) {
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
        var Matnr = this.getView().byId("f_codMatAlta").getValue();
        var Maktx = this.getView().byId("f_nomMatAlta").getValue();
        var Matkl = this.getView().byId("f_grArtAlta").getValue();
        var Bzirk = this.oComponent.getModel("ModoApp").getData().Bzirk;

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
        sap.ui.core.BusyIndicator.hide();
      },

      onPressMaterialAlta: function (oEvent) {
        var mat = this.getSelectMat(oEvent, "listadoMaterialesAlta");
        /*
        codmat = mat.Matnr;
        nommat = mat.Maktx;
        unimedmat=mat.Meins;
        this.getView().byId("f_material").setValue(codmat);
        this.getView().byId("f_nommat").setValue(nommat);
        this.getView().byId("f_unitpos").setValue(unimedmat);

        this.oComponent.getModel("posPedFrag").setProperty("/Matnr", codmat);
        this.oComponent.getModel("posPedFrag").refresh(true);
        */

        var nommat = mat.Maktx;
        var codmat = mat.Matnr;        
        var unimedmat = mat.Meins;
        this.oComponent.getModel("posPedFrag").setProperty("/ShortText", nommat);
        this.oComponent.getModel("posPedFrag").setProperty("/Material", codmat);        
        this.oComponent.getModel("posPedFrag").setProperty("/SalesUnit", unimedmat);
        this.oComponent.getModel("posPedFrag").refresh(true);
        this.closeMatDiagAlta();
      },

      getSelectMat: function (oEvent, oModel) {
        var oModMat = this.oComponent.getModel(oModel).getData();
        const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
        const sOperation = sOperationPath.split("/").slice(-1).pop();
        var idMaterial = oModMat[sOperation];
        return idMaterial;
      },

      // -------------------------------------- FUNCIONES BOTONES POSICIONES --------------------------------------
      // FUNCIÓN BOTÓN AGREGAR LÍNEA
      onAddPosPed: function () {

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

        var configPos = {
          mode: "A",
          type: "P",
          index: null,
          Vbelp: posicion,
          // Moneda EUR por defecto
          Currency: "EUR",
          // Fecha de hoy por defecto
          PriceDate: Util.formatDate(new Date()),
          // Los CECOS / OT se recogen de cabecera de manera predeterminada
          Yykostkl: this.oComponent.getModel("DisplayPEP").getData().Yykostkl,
          Yyaufnr: this.oComponent.getModel("DisplayPEP").getData().Yyaufnr,
          Zzkostl: this.oComponent.getModel("DisplayPEP").getData().Zzkostl,
          Zzaufnr: this.oComponent.getModel("DisplayPEP").getData().Zzaufnr,
          Kstar: this.oComponent.getModel("DisplayPEP").getData().Kstar          
        }

        var oModConfigPos = new JSONModel();
        oModConfigPos.setData(configPos);
        this.oComponent.setModel(oModConfigPos, "posPedFrag");
        this.oComponent.getModel("posPedFrag").refresh(true);

        this._getDialogAddPosicionesPed();
      },

      // FUNCIÓN BOTÓN MODIFICAR LÍNEA      
      onModPosPed: function (oEvent) {

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        
        //MODO DE MODIFICACION DE PEDIDOS
        if (modeApp == 'M') {
          var index = oEvent.getSource().getBindingContext("DisplayPosPed").getPath().split("/").slice(-1).pop();
          
          var posiciones = this.oComponent.getModel("DisplayPosPed").getData();
          var posiciones_Aux = JSON.parse(JSON.stringify(posiciones)); // Copy data model without references
          var posicion = posiciones_Aux[index];

          /*
          if (items[0].BillDate) {
            fechaPos = items[0].PriceDate
          } else {
            fechaPos = items[0].Erdat;
            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "YYYY-MM-dd" });
            fechaPos = dateFormat.format(fechaPos);
          }*/

          var configPos = {
            mode: "M",
            type: "P",
            index: index,
            Vbelp: posicion.Posnr,
            Material: posicion.Matnr,
            ShortText: posicion.Arktx,
            PriceDate: Util.formatDate(new Date(posicion.Zzprsdt)),
            ReqQty: posicion.Kwmeng,
            Kpein: posicion.Kpein,
            SalesUnit: posicion.Meins,
            CondValue: posicion.Netpr,
            Currency: posicion.Waerk,
            Yykostkl: posicion.Yykostkl,
            Yyaufnr: posicion.Yyaufnr,
            Zzkostl: posicion.Zzkostl,
            Zzaufnr: posicion.Zzaufnr,
            Kstar: posicion.Kstar
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
          
          //Obtenemos la fecha de la linea seleccionada
          //fechaPos = items[0].Erdat;

          var configPos = {
            mode: "M",
            type: "P",
            index: index,
            Vbelp: posicion.ItmNumber,            
            Material: posicion.Material,
            ShortText: posicion.ShortText,
            PriceDate: Util.formatDate(new Date(posicion.PriceDate)),
            ReqQty: posicion.ReqQty,
            Kpein: posicion.Kpein,
            SalesUnit: posicion.SalesUnit,
            CondValue: posicion.CondValue,
            Currency: posicion.Currency,
            Yykostkl: posicion.Yykostkl,
            Yyaufnr: posicion.Yyaufnr,
            Zzkostl: posicion.Zzkostl,
            Zzaufnr: posicion.Zzaufnr,
            Kstar: posicion.Kstar
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

      addPedPos: function () {
        var posiciones = [];
        var posicionN;

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        
        var posPedFrag = this.oComponent.getModel("posPedFrag").getData();
        var modePosPed = posPedFrag.mode;

        //posactual = ('000000' + posactual).slice(-6); // Establecemos el formato de 6 caracteres 000010
        
        if (modeApp == 'M') {
          posiciones = this.oComponent.getModel("DisplayPosPed").getData();

          //Mapeamos las posiciones
          posicionN = {
            Posnr: posPedFrag.Vbelp,
            Matnr: posPedFrag.Material,
            Arktx: posPedFrag.ShortText,
            Zzprsdt: new Date(posPedFrag.PriceDate),
            Kwmeng: posPedFrag.ReqQty,
            Kpein: posPedFrag.Kpein,
            Meins: posPedFrag.SalesUnit,
            Netpr: posPedFrag.CondValue,
            Waerk: posPedFrag.Currency,
            Yykostkl: posPedFrag.Yykostkl,
            Yyaufnr: posPedFrag.Yyaufnr,
            Zzkostl: posPedFrag.Zzkostl,
            Zzaufnr: posPedFrag.Zzaufnr,
            Kstar: posPedFrag.Kstar
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
            Material: posPedFrag.Material,
            ShortText: posPedFrag.ShortText,
            PriceDate: new Date(posPedFrag.PriceDate),
            ReqQty: posPedFrag.ReqQty,
            Kpein: posPedFrag.Kpein,
            SalesUnit: posPedFrag.SalesUnit,
            CondValue: posPedFrag.CondValue,
            Currency: posPedFrag.Currency,
            Yykostkl: posPedFrag.Yykostkl,
            Yyaufnr: posPedFrag.Yyaufnr,
            Zzkostl: posPedFrag.Zzkostl,
            Zzaufnr: posPedFrag.Zzaufnr,
            Kstar: posPedFrag.Kstar
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
            pedidoCopy.Posnr = Number(posiciones_Aux[posiciones_Aux.length - 1].Posnr) + 10;
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
            pedidoCopy.ItmNumber = Number(posiciones_Aux[posiciones_Aux.length - 1].ItmNumber) + 10;
            //pedidoCopy.ItmNumber = ('000000' + itmNumberCopy).slice(-6);

            posiciones.push(pedidoCopy);
            this.oComponent.getModel("PedidoPos").refresh(true);
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
        var results_array = [];
        var oldPos = (modeApp === 'M')? this.oComponent.getModel("DisplayPosPed").getData() : this.oComponent.getModel("PedidoPos").getData();
        var posnr_ItmNumber = oldPos.length * 10;

        for (var i = 0; i < aSelectedIndices.length; i++) {
          var indice = aSelectedIndices[i];
          var posicionPed = pedidosContrato_Aux[indice];
          posnr_ItmNumber = posnr_ItmNumber + 10;
          if (modeApp === 'C') {
            
            var posicionN = {
              ItmNumber: posnr_ItmNumber,
              Material: posicionPed.Matnr,
              ShortText: posicionPed.Arktx,
              PriceDate: posicionPed.Zzprsdt,
              ReqQty: posicionPed.Kwmeng,
              Kpein: posicionPed.Kpein,
              SalesUnit: posicionPed.Meins,
              CondValue: posicionPed.Netpr,
              Currency: posicionPed.Waerk,
              Yykostkl: posicionPed.Yykostkl,
              Yyaufnr: posicionPed.Yyaufnr,
              Zzkostl: posicionPed.Zzkostl,
              Zzaufnr: posicionPed.Zzaufnr,
              Kstar: posicionPed.Kstar
            }
            results_array.push(posicionN);

          }else{
            posicionPed.Posnr = posnr_ItmNumber;
            results_array.push(posicionPed);
          }
        }
        results_array = oldPos.concat(results_array);

        if (modeApp === 'M') {
          this.oComponent.getModel("DisplayPosPed").setData(results_array);
          this.oComponent.getModel("DisplayPosPed").refresh(true);
        }else{
          this.oComponent.getModel("PedidoPos").setData(results_array);
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

      // FUNCIONES BORRAR LÍNEA
      onDeletePosPed: function (oEvent, serv, pos) {

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;

        //MODO DE CREACION DE PEDIDO

        if (modeApp == 'C') {
          var oTable = this.getView().byId("TablaPosiciones");
          var oModel = this.getView().getModel("PedidoPos");
          var aContexts = oTable.getSelectedIndices();
          var items = aContexts.map(function (c) {
            return this.oComponent.getModel("PedidoPos").getProperty("/" + c);
          }.bind(this));

          if (items.length == 1) {

            var that = this;
            that.posIn = pos;
            var selrow = items[0];
            var indice = aContexts[0];
            var ques;

            //Se comprueba que la pos no esté eliminada la posición                    
            if (selrow.Loekz == 'L') {
              MessageBox.warning(this.oI18nModel.getProperty("errPosBorr"));
            } else {
              if (pos) {
                //Estamos eliminando una Posición y eliminaremos todos los servicios
                ques = this.oI18nModel.getProperty("delPosQ");
              } else if (serv) {
                //Eliminamos solo el servicio marcado
                ques = this.oI18nModel.getProperty("delServQ");
              }
              that.ques = ques;
              that.ItmNumber = selrow.ItmNumber;
              that.indice = indice;

              that.deletePosTable(that.ItmNumber, false, that);
            }
          } else {
            MessageBox.error(this.oI18nModel.getProperty("errpedPosUn"));
          }
        }

        //MODO DE MODIFICACION DE PEDIDO

        else if (modeApp == 'M') {
          var oTable = this.getView().byId("TablaPosicionesDisp");
          var oModel = this.getView().getModel("DisplayPosPed");
          var aRows = oModel.getData();
          var aContexts = oTable.getSelectedIndices();
          var items = aContexts.map(function (c) {
            return this.oComponent.getModel("DisplayPosPed").getProperty("/" + c);
          }.bind(this));


          if (items.length == 1) {

            var that = this;
            that.posIn = pos;
            var selrow = items[0];
            var indice = aContexts[0];
            var ques;

            //Se comprueba que la pos no esté eliminada la posición                    
            if (selrow.Loekz == 'L') {
              MessageBox.warning(this.oI18nModel.getProperty("errPosBorr"));
            } else {
              if (pos) {
                //Estamos eliminando una Posición y eliminaremos todos los servicios
                ques = this.oI18nModel.getProperty("delPosQ");
              } else if (serv) {
                //Eliminamos solo el servicio marcado
                ques = this.oI18nModel.getProperty("delServQ");
              }
              that.ques = ques;
              that.ItmNumber = selrow.ItmNumber;
              that.indice = indice;

              that.deletePosTable(that.ItmNumber, false, that);
            }
          } else {
            MessageBox.error(this.oI18nModel.getProperty("errpedPosUn"));
          }
        }

      },

      deletePosTable: function (posPed, posTab, that) {
        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;

        //MODO DE CREACION DE PEDIDO
        if (modeApp == 'C') {
          var posped = that.getView().getModel("PedidoPos").getData();

          if (!posPed) {

            //Si estamos eliminando una posición "padre" que no es la ultima
            if (posped[posTab].PosnrT && posped.length > 1 && posTab + 1 < posped.length) {

              if (posped[posTab + 1].Posnr === posped[posTab].PosnrT) {
                posped[posTab + 1].PosnrT = posped[posTab].PosnrT;
              }

            }
            //posped.splice(posTab, 1);
            if (modeApp != "A" || posped[posTab].modificabe) {
              posped.splice(posTab, 1);
            } else {
              posped[posTab].iconoB = "sap-icon://delete";
              posped[posTab].iconoM = true;
              posped[posTab].Loekz = "L";
            }

          } else if (!posTab) {

            for (var i = posped.length - 1; i >= 0; i--) {

              if (posped[i].ItmNumber == posPed) {
                if (modeApp != "A") {
                  posped.splice(i, 1);
                } else {
                  posped[i].iconoB = "sap-icon://delete";
                  posped[i].iconoM = true;
                  posped[i].Loekz = "L";
                }
              }

            }

          }

          //that.ordenaPedPos(true);
          //that.oComponent.getModel("PedidoPos").refresh(true);

          //Si estamos eliminando la posición 10 en la creación
          if (posPed == 10 && modeApp != "A") {
            //Vemos las posiciones de la tabla actual
            posped = that.getView().getModel("PedidoPos").getData();

            var posidNew;
            if (posped.length > 0) {
              //Se calcula el Departamento en función de la pos 10
              for (var i = posped.length - 1; i >= 0; i--) {
                if (posped[i].Posnr == 10) {
                  posidNew = posped[i].Posid;
                }
              }

              if (posidNew) {

                var oJson = {
                  POSID: posidNew
                }
              }

            } else {
            }
          }

          //MODO DE MODIFICACION DE PEDIDO
        } else if (modeApp == 'M') {
          var posped = that.getView().getModel("DisplayPosPed").getData();

          if (!posPed) {

            //Si estamos eliminando una posición "padre" que no es la ultima
            if (posped[posTab].PosnrT && posped.length > 1 && posTab + 1 < posped.length) {

              if (posped[posTab + 1].Posnr === posped[posTab].PosnrT) {
                posped[posTab + 1].PosnrT = posped[posTab].PosnrT;
              }

            }
            //posped.splice(posTab, 1);
            if (modeApp != "A" || posped[posTab].modificabe) {
              posped.splice(posTab, 1);
            } else {
              posped[posTab].iconoB = "sap-icon://delete";
              posped[posTab].iconoM = true;
              posped[posTab].Loekz = "L";
            }

          } else if (!posTab) {

            for (var i = posped.length - 1; i >= 0; i--) {

              if (posped[i].ItmNumber == posPed) {
                if (modeApp != "A") {
                  posped.splice(i, 1);
                } else {
                  posped[i].iconoB = "sap-icon://delete";
                  posped[i].iconoM = true;
                  posped[i].Loekz = "L";
                }
              }

            }

          }

          //that.ordenaPedPos(true);
          //that.oComponent.getModel("PedidoPos").refresh(true);

          //Si estamos eliminando la posición 10 en la creación
          if (posPed == 10 && modeApp != "A") {
            //Vemos las posiciones de la tabla actual
            posped = that.getView().getModel("PedidoPos").getData();

            var posidNew;
            if (posped.length > 0) {
              //Se calcula el Departamento en función de la pos 10
              for (var i = posped.length - 1; i >= 0; i--) {
                if (posped[i].Posnr == 10) {
                  posidNew = posped[i].Posid;
                }
              }

              if (posidNew) {

                var oJson = {
                  POSID: posidNew
                }
              }

            } else {
            }
          }
        }


      },

      // -------------------------------------- FUNCIÓN BOTÓN GRABAR --------------------------------------
      validarDatosGrabar: function () {

      },

      onGrabar: function () {
        sap.ui.core.BusyIndicator.show();

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;

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
        var PartnNumb = this.oComponent.getModel("ModoApp").getData().Codcli; // Código de cliente
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
        var TxtCabecera = this.oComponent.getModel("DisplayPEP").getData().Tdlinecab; // Texto de Cabecera
        //var TxtInfRechazo = this.getView().byId("textAreaCabInfRech").getValue(); // Información de rechazo
        var TxtAclaraciones = this.oComponent.getModel("DisplayPEP").getData().Tdlineacl; // Texto de aclaraciones

        // Otros
        var Currency = this.oComponent.getModel("DisplayPEP").getData().Currency; // Moneda *****solo
        var Zznia = this.oComponent.getModel("ModoApp").getData().Nia;
        var Zzresponsable = "";
        var PartnRole = "AG";
      
        // -------------------- MODO MODIFICACIÓN --------------------
        if (modeApp === 'M') {
          
          // --ADJUNTOS (FicheroModSet)
          var oModAdj = this.oComponent.getModel("Adjuntos").getData();
          var oModAdj2 = [], numdoc = 0;
          
          oModAdj.forEach(function (el) {
            numdoc++;

            var adj = {
              Numdoc: numdoc.toString(),
              Filename: el.Filename,
              Descripcion: el.Descripcion
            }

            if (!el.URL) {
              adj.Mimetype = el.Mimetype;
              adj.Content = el.Content;
            }

            oModAdj2.push(adj);
          });

          // --POSCIONES (SolicitudPepCrSet, SolicitudPedCondSet, SolicitudPedQtySet, PedidoTextosModSet)
          var posiciones = this.getView().getModel("DisplayPosPed").getData();

          var SolicitudPepCrSet = [];
          var SolicitudPedCondSet = [];
          var SolicitudPedQtySet = [];
          var PedidoTextosModSet_Aux = [];
          for (var i = 0; i < posiciones.length; i++) {

            // Entidad SolicitudPepCrSet
            let objSolicitudPepCrSet = {
              ItmNumber: posiciones[i].Posnr.toString(),
              ShortText: posiciones[i].Arktx,
              Material: posiciones[i].Matnr,
              BillDate: "\/Date(" + BillDate + ")\/",
              PurchDate: "\/Date(" + PurchDate + ")\/",
              PoDatS: "\/Date(" + PoDatS + ")\/",
              FixValDy: "\/Date(" + FixValDy + ")\/",
              PriceDate: "\/Date(" + Date.parse(posiciones[i].Zzprsdt) + ")\/",
              ServDate: "\/Date(" + ServDate + ")\/",
              SalesUnit: posiciones[i].Meins,
              Plant: this.oComponent.getModel("ModoApp").getData().Vkbur,              
              Yykostkl: posiciones[i].Yykostkl,
              Yyaufnr: posiciones[i].Yyaufnr,
              Zzkostl: posiciones[i].Zzkostl,
              Zzaufnr: posiciones[i].Zzaufnr,
              Kstar: posiciones[i].Kstar
            };
            SolicitudPepCrSet.push(objSolicitudPepCrSet);

            // Entidad SolicitudPedCondSet
            let objSolicitudPedCondSet = {
              ItmNumber: posiciones[i].Posnr.toString(),
              CondValue: posiciones[i].Netpr,
              CondType: 'PR00',
              CondPUnt: posiciones[i].Kpein,
              CondUnit: posiciones[i].Meins,
              Currency: 'EUR',
              Conpricdat: "\/Date(" + Conpricdat + ")\/",
            };
            SolicitudPedCondSet.push(objSolicitudPedCondSet);

            // Entidad SolicitudPedQtySet
            let objSolicitudPedQtySet = {
              //Secu: (i + 1).toString(),
              ItmNumber: posiciones[i].Posnr.toString(),
              ReqQty: posiciones[i].Kpein,
              ReqDate: "\/Date(" + ReqDate + ")\/",
              TpDate: "\/Date(" + TpDate + ")\/",
              GiDate: "\/Date(" + GiDate + ")\/",
              MsDate: "\/Date(" + MsDate + ")\/",
              LoadDate: "\/Date(" + LoadDate + ")\/",
              DlvDate: "\/Date(" + DlvDate + ")\/",
            };
            SolicitudPedQtySet.push(objSolicitudPedQtySet);

            // Entidad PedidoTextosModSet
            let objPedidoTextosModSet;
            if (TxtCabecera != null && TxtAclaraciones == null) {
              objPedidoTextosModSet = {
                Textid: '001',
                Langu: 'ES',
                Textline: TxtCabecera
              };
              PedidoTextosModSet_Aux.push(objPedidoTextosModSet);
            } else if (TxtCabecera == null && TxtAclaraciones != null) {
              objPedidoTextosModSet = {
                Textid: 'Z003',
                Langu: 'ES',
                Textline: TxtAclaraciones
              };
              PedidoTextosModSet_Aux.push(objPedidoTextosModSet);
            } else if (TxtCabecera != null && TxtAclaraciones != null) {
              if (TxtCabecera) {
                objPedidoTextosModSet = {
                  Textid: '0001',
                  Langu: 'ES',
                  Textline: TxtCabecera
                };
                PedidoTextosModSet_Aux.push(objPedidoTextosModSet);
              }
              if (TxtAclaraciones) {
                objPedidoTextosModSet = {
                  Textid: 'Z003',
                  Langu: 'ES',
                  Textline: TxtAclaraciones
                };
                PedidoTextosModSet_Aux.push(objPedidoTextosModSet);
              }
            }
          }

          // Entidad PedidoTextosModSet
          let PedidoTextosModSet = [];
          let uniqueObject = {};

          for (let i in PedidoTextosModSet_Aux) {
            var objTextId = PedidoTextosModSet_Aux[i]['Textid'];
            uniqueObject[objTextId] = PedidoTextosModSet_Aux[i];
          }

          for (i in uniqueObject) {
            PedidoTextosModSet.push(uniqueObject[i]);
          }

          var oJson = {
            Vbeln: Vbeln,
            DocType: DocType,
            SalesOrg: SalesOrg,
            SalesDist: SalesDist,
            DistrChan: DistrChan,
            Division: Division,
            SalesOff: SalesOff,
            PpSearch: PpSearch,
            PurchNoC: PurchNoC,
            BillBlock: BillBlock,
            Currency: Currency,
            OrdReason: OrdReason,
            Ref1: Ref1,
            Zzkostl: Zzkostl,
            Zzaufnr: Zzaufnr,
            Kstar: Kstar,
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
              PartnRole: PartnRole
            },
            PedidoExtensionModSet: {
              Zznia: Zznia,
              Zzresponsable: Zzresponsable,
              Yykostkl: Yykostkl,
              Yyaufnr: Yyaufnr
            },
            FicheroModSet: oModAdj2,
            PedidoPosicionModSet: SolicitudPepCrSet,
            PedidoCondicionModSet: SolicitudPedCondSet,
            PedidoCantidadModSet: SolicitudPedQtySet,
            PedidoTextosModSet: PedidoTextosModSet,            
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

          // -------------------- MODO CREACIÓN --------------------
        }else{

          // --POSCIONES (SolicitudPepCrSet, SolicitudPedCondSet, SolicitudPedQtySet, PedidoTextosModSet)
          var posiciones = this.getView().getModel("PedidoPos").getData();

          var PedidoPosicionSet = [];
          var PedidoCondicionSet = [];
          var PedidoCantidadSet = [];
          var PedidoTextosSet_Aux = [];
          for (var i = 0; i < posiciones.length; i++) {

            // Entidad PedidoPosicionSet
            let objPedidoPosicionSet = {
              ItmNumber: posiciones[i].ItmNumber.toString(),
              ShortText: posiciones[i].ShortText,
              Material: posiciones[i].Material,
              BillDate: "\/Date(" + BillDate + ")\/",
              PurchDate: "\/Date(" + PurchDate + ")\/",
              PoDatS: "\/Date(" + PoDatS + ")\/",
              FixValDy: "\/Date(" + FixValDy + ")\/",
              PriceDate: "\/Date(" + Date.parse(posiciones[i].PriceDate) + ")\/",
              ServDate: "\/Date(" + ServDate + ")\/",
              SalesUnit: posiciones[i].SalesUnit,
              Plant: this.oComponent.getModel("ModoApp").getData().Vkbur,
              Yykostkl: posiciones[i].Yykostkl,
              Yyaufnr: posiciones[i].Yyaufnr,
              Zzkostl: posiciones[i].Zzkostl,
              Zzaufnr: posiciones[i].Zzaufnr,
              Kstar: posiciones[i].Kstar
            };
            PedidoPosicionSet.push(objPedidoPosicionSet);

            // Entidad PedidoCondicionSet
            let objPedidoCondicionSet = {
              ItmNumber: posiciones[i].ItmNumber.toString(),
              CondValue: posiciones[i].CondValue,
              CondType: 'PR00',
              CondPUnt: posiciones[i].Kpein,
              CondUnit: posiciones[i].SalesUnit,
              Currency: 'EUR',
              Conpricdat: "\/Date(" + Conpricdat + ")\/",
            };
            PedidoCondicionSet.push(objPedidoCondicionSet);

            // Entidad PedidoCantidadSet
            let objPedidoCantidadSet = {
              //Secu: (i + 1).toString(),
              ItmNumber: posiciones[i].ItmNumber.toString(),
              ReqQty: posiciones[i].ReqQty,
              ReqDate: "\/Date(" + ReqDate + ")\/",
              TpDate: "\/Date(" + TpDate + ")\/",
              GiDate: "\/Date(" + GiDate + ")\/",
              MsDate: "\/Date(" + MsDate + ")\/",
              LoadDate: "\/Date(" + LoadDate + ")\/",
              DlvDate: "\/Date(" + DlvDate + ")\/",
            };
            PedidoCantidadSet.push(objPedidoCantidadSet);

            // Entidad PedidoTextosSet
            let objPedidoTextosSet;
            if (TxtCabecera != null && TxtAclaraciones == null) {
              objPedidoTextosSet = {
                Textid: '001',
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

          var oJson = {
            DocType: DocType,
            SalesOrg: SalesOrg,
            SalesDist: SalesDist,
            DistrChan: DistrChan,
            Division: Division,
            SalesOff: SalesOff,
            PpSearch: PpSearch,
            PurchNoC: PurchNoC,
            BillBlock: BillBlock,
            Currency: Currency,
            OrdReason: OrdReason,
            Ref1: Ref1,
            Zzkostl: Zzkostl,
            Zzaufnr: Zzaufnr,
            Kstar: Kstar,
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
              PartnRole: PartnRole
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
        }        
      },
      
      


























      



      // ------------------------------------- BACK UP -------------------------------------

      addPedPos_OLD: function () {
        var posiciones = [];
        var posicionN;

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        //var posPedFrag = this.oComponent.getModel("posPedFrag").getData();
        //var modePosPed = posPedFrag.mode;

        var fechaposicion = this.getView().byId("DTPdesde").getValue();
        var posactual = this.getView().byId("f_tipopedpos").getValue();
        posactual = ('000000' + posactual).slice(-6); // Establecemos el formato de 6 caracteres 000010
        var matactual = this.getView().byId("f_material").getValue();
        var descactual = this.getView().byId("f_nommat").getValue();
        var cantactual = this.getView().byId("f_cantpos").getValue();
        var cantbaseactual = this.getView().byId("f_cantbasepos").getValue();
        var unitactual = this.getView().byId("f_unitpos").getValue();
        var importactual = this.getView().byId("f_importpos").getValue();
        var monedactual = this.getView().byId("f_monedapos").getValue();
        var cecosposicion = this.getView().byId("f_cecosPOS").getValue();
        var ordenposicion = this.getView().byId("f_ordenesPOS").getValue();

        if (modeApp == 'M') {
          posiciones = this.oComponent.getModel("DisplayPosPed").getData();

          //Mapeamos las posiciones
          posicionN = {
            CondType: "PR00",
            PriceDate: fechaposicion,
            Posnr: posactual,
            Matnr: matactual,
            Arktx: descactual,
            Kwmeng: cantactual,
            Kpein: cantbaseactual,
            Meins: unitactual,
            Netpr: importactual,
            Waerk: monedactual,
            Yykostl: cecosposicion,
            Yyaufnr: ordenposicion,
            Ykostl: cecosposicion,
            Yaufnr: ordenposicion
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
            CondType: "PR00",
            PriceDate: fechaposicion,
            ItmNumber: posactual,
            Material: matactual,
            ShortText: descactual,
            ReqQty: cantactual,
            Kpein: cantbaseactual,
            SalesUnit: unitactual,
            CondValue: importactual,
            Currency: monedactual,
            Yykostl: cecosposicion,
            Yyaufnr: ordenposicion,
            Ykostl: cecosposicion,
            Yaufnr: ordenposicion
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
      },

      onModPosPed_OLD: function (oEvent) {

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        var oTable, aContexts, items;
        //MODO DE MODIFICACION DE PEDIDOS
        if (modeApp == 'M') {
          oTable = this.getView().byId("TablaPosicionesDisp");
          var index = oEvent.getSource().getBindingContext("DisplayPosPed").getPath().split("/").slice(-1).pop();
          aContexts = [index];
          items = aContexts.map(function (c) {
            return this.oComponent.getModel("DisplayPosPed").getProperty("/" + c);
          }.bind(this));
          //Obtenemos la fecha de la linea seleccionada

          if (items[0].BillDate) {
            fechaPos = items[0].PriceDate
          } else {
            fechaPos = items[0].Erdat;
            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "YYYY-MM-dd" });
            fechaPos = dateFormat.format(fechaPos);
          }

            ///////ABRIR DIALOGO
            var oView = this.getView();
            var configPos = {
              mode: "M",
              type: "P",
              index: aContexts[0],
              Vbelp: items[0].Posnr,
              ShortText: items[0].Arktx,
              Material: items[0].Matnr,
              BillDate: fechaPos,
              CondValue: items[0].Netpr,
              ReqQty: items[0].Kwmeng,
              Kpein: items[0].Kpein,
              Currency: items[0].Waerk,
              SalesUnit: items[0].Meins,
              Yykostl: items[0].Yykostl,
              Yyaufnr: items[0].Yyaufnr,
              Ykostl: items[0].Ykostl,
              Yaufnr: items[0].Yaufnr
            }

            var oModConfigPos = new JSONModel();
            oModConfigPos.setData(configPos);
            this.oComponent.setModel(oModConfigPos, "posPedFrag");
            this.oComponent.getModel("posPedFrag").refresh(true);

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
              oDialogPosiciones.open();
            });


          ///MODO DE CREACION DE PEDIDOS
        } else if (modeApp == 'C') {
          oTable = this.getView().byId("TablaPosiciones");
          var index = oEvent.getSource().getBindingContext("PedidoPos").getPath().split("/").slice(-1).pop();
          aContexts = [index];          
          items = aContexts.map(function (c) {
            return this.oComponent.getModel("PedidoPos").getProperty("/" + c);
          }.bind(this));
          //Obtenemos la fecha de la linea seleccionada
          fechaPos = items[0].Erdat;

          ///////ABRIR DIALOGO
          var oView = this.getView();
          var configPos = {
            mode: "M",
            type: "P",
            index: aContexts[0],
            Vbelp: items[0].ItmNumber,
            ShortText: items[0].ShortText,
            Material: items[0].Material,
            BillDate: items[0].BillDate,
            CondValue: items[0].CondValue,
            ReqQty: items[0].ReqQty,
            Kpein: items[0].Kpein,
            Currency: items[0].Currency,
            SalesUnit: items[0].SalesUnit,
            Yykostl: items[0].Yykostl,
            Yyaufnr: items[0].Yyaufnr,
            Ykostl: items[0].Ykostl,
            Yaufnr: items[0].Yaufnr
          }


          var oModConfigPos = new JSONModel();
          oModConfigPos.setData(configPos);
          this.oComponent.setModel(oModConfigPos, "posPedFrag");
          this.oComponent.getModel("posPedFrag").refresh(true);

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
            oDialogPosiciones.open();
          });
        }
      },

      // Eliminar????
      ordenaPedPos: function (actualiza) {

        var posiciones = this.oComponent.getModel("PedidoPos").getData();
        //var secuModi = this.oComponent.getModel("ModoApp").getData().secuModi;
        //var modeApp = this.oComponent.getModel("ModoApp").getData().mode;

        var posicionesN = [],
          posicionN;

        if (posiciones.length > 0) {

          var posInicial = 10;
          var secu = 1;
          var sumTotal = 0;
          var cantTotal = 0;
          var cantBaseTotal = 0;

          for (var i = 0; i <= posiciones.length - 1; i++) {

            posicionN = Object.assign({}, posiciones[i]);

            if (i == 0) {

              posicionN.ItmNumber = posInicial;

              //posicionN.PosnrT = posInicial;
              //posicionN.Secu      = secu;
            } else {

              if (posiciones[i].ItmNumber == posAnt) {

                posicionN.ItmNumber = posicionesN[i - 1].ItmNumber;

                //posicionN.PosnrT = "";
                //posicionN.Secu      = secu;//posicionesN[i-1].Secu + 1;
              } else {

                posicionN.ItmNumber = posicionesN[i - 1].ItmNumber + 10;

                //posicionN.PosnrT = posicionesN[i - 1].Posnr + 10
                //posicionN.Secu      = secu;//1;
              }

            }

            posicionN.Secu = posiciones[i].Secu;
            posicionesN.push(posicionN);
            secu = secu + 1;
            var posAnt = posicionesN[i].ItmNumber;
          }
          //ACTUALIZACION IMPORTES    
          this.actualizaimp();

          //var PosSigCre = posicionesN[posiciones.length - 1].Posnr;
          var PosSigCre = posicionesN[posiciones.length - 1].ItmNumber
          var posSig = this.oComponent.getModel("posPedFrag").getData().Vbelp;
          posSig = PosSigCre + 10;
          //this.oComponent.getModel("ModoApp").setProperty("/posPed", posSig);
          //this.oComponent.getModel("ModoApp").setProperty("/secuModi", secuModi);
          //this.oComponent.getModel("ModoApp").refresh(true);

          var oModPos = new JSONModel();

          oModPos.setData(posicionesN);

          this.oComponent.setModel(oModPos, "PedidoPos");
          this.oComponent.getModel("PedidoPos").setProperty("/posSig", posSig);

        } else {

          //this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", '0');
          //this.oComponent.getModel("PedidoCab").setProperty("/Moneda", 'EUR');
          //this.oComponent.getModel("PedidoCab").refresh(true);
          this.actualizaimp();

          var posSig = this.oComponent.getModel("posPedFrag").getData().ItmNumber;
          posSig = 10;
          this.oComponent.getModel("posPedFrag").setProperty("/posPed", posSig);
          //this.oComponent.getModel("posPedFrag").refresh(true);

          //this.oComponent.getModel("PedidoPos").refresh(true);
        }
        this.oComponent.setModel(new JSONModel(), "listadoCecos");
        this.oComponent.setModel(new JSONModel(), "listadoOrdenes");
        this.oComponent.setModel(new JSONModel(), "listadoMaterialesAlta");

        this.byId("pedPosDial").close();
      },      

      onDeletePosPed_OLD: function (oEvent) {
        this.deletePosPed_OLD(oEvent, false, true);
      },

      deletePosPed_OLD: function (oEvent, serv, pos) {

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;

        //MODO DE CREACION DE PEDIDO

        if (modeApp == 'C') {
          var oTable = this.getView().byId("TablaPosiciones");
          var oModel = this.getView().getModel("PedidoPos");
          var aContexts = oTable.getSelectedIndices();
          var items = aContexts.map(function (c) {
            return this.oComponent.getModel("PedidoPos").getProperty("/" + c);
          }.bind(this));

          if (items.length == 1) {

            var that = this;
            that.posIn = pos;
            var selrow = items[0];
            var indice = aContexts[0];
            var ques;

            //Se comprueba que la pos no esté eliminada la posición                    
            if (selrow.Loekz == 'L') {
              MessageBox.warning(this.oI18nModel.getProperty("errPosBorr"));
            } else {
              if (pos) {
                //Estamos eliminando una Posición y eliminaremos todos los servicios
                ques = this.oI18nModel.getProperty("delPosQ");
              } else if (serv) {
                //Eliminamos solo el servicio marcado
                ques = this.oI18nModel.getProperty("delServQ");
              }
              that.ques = ques;
              that.ItmNumber = selrow.ItmNumber;
              that.indice = indice;

              that.deletePosTable(that.ItmNumber, false, that);
            }
          } else {
            MessageBox.error(this.oI18nModel.getProperty("errpedPosUn"));
          }
        }

        //MODO DE MODIFICACION DE PEDIDO

        else if (modeApp == 'M') {
          var oTable = this.getView().byId("TablaPosicionesDisp");
          var oModel = this.getView().getModel("DisplayPosPed");
          var aRows = oModel.getData();
          var aContexts = oTable.getSelectedIndices();
          var items = aContexts.map(function (c) {
            return this.oComponent.getModel("DisplayPosPed").getProperty("/" + c);
          }.bind(this));


          if (items.length == 1) {

            var that = this;
            that.posIn = pos;
            var selrow = items[0];
            var indice = aContexts[0];
            var ques;

            //Se comprueba que la pos no esté eliminada la posición                    
            if (selrow.Loekz == 'L') {
              MessageBox.warning(this.oI18nModel.getProperty("errPosBorr"));
            } else {
              if (pos) {
                //Estamos eliminando una Posición y eliminaremos todos los servicios
                ques = this.oI18nModel.getProperty("delPosQ");
              } else if (serv) {
                //Eliminamos solo el servicio marcado
                ques = this.oI18nModel.getProperty("delServQ");
              }
              that.ques = ques;
              that.ItmNumber = selrow.ItmNumber;
              that.indice = indice;

              that.deletePosTable(that.ItmNumber, false, that);
            }
          } else {
            MessageBox.error(this.oI18nModel.getProperty("errpedPosUn"));
          }
        }

      },

      deletePosTable_OLD: function (posPed, posTab, that) {
        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;

        //MODO DE CREACION DE PEDIDO
        if (modeApp == 'C') {
          var posped = that.getView().getModel("PedidoPos").getData();

          if (!posPed) {

            //Si estamos eliminando una posición "padre" que no es la ultima
            if (posped[posTab].PosnrT && posped.length > 1 && posTab + 1 < posped.length) {

              if (posped[posTab + 1].Posnr === posped[posTab].PosnrT) {
                posped[posTab + 1].PosnrT = posped[posTab].PosnrT;
              }

            }
            //posped.splice(posTab, 1);
            if (modeApp != "A" || posped[posTab].modificabe) {
              posped.splice(posTab, 1);
            } else {
              posped[posTab].iconoB = "sap-icon://delete";
              posped[posTab].iconoM = true;
              posped[posTab].Loekz = "L";
            }

          } else if (!posTab) {

            for (var i = posped.length - 1; i >= 0; i--) {

              if (posped[i].ItmNumber == posPed) {
                if (modeApp != "A") {
                  posped.splice(i, 1);
                } else {
                  posped[i].iconoB = "sap-icon://delete";
                  posped[i].iconoM = true;
                  posped[i].Loekz = "L";
                }
              }

            }

          }

          that.ordenaPedPos(true);
          //that.oComponent.getModel("PedidoPos").refresh(true);

          //Si estamos eliminando la posición 10 en la creación
          if (posPed == 10 && modeApp != "A") {
            //Vemos las posiciones de la tabla actual
            posped = that.getView().getModel("PedidoPos").getData();

            var posidNew;
            if (posped.length > 0) {
              //Se calcula el Departamento en función de la pos 10
              for (var i = posped.length - 1; i >= 0; i--) {
                if (posped[i].Posnr == 10) {
                  posidNew = posped[i].Posid;
                }
              }

              if (posidNew) {

                var oJson = {
                  POSID: posidNew
                }
              }

            } else {
            }
          }

          //MODO DE MODIFICACION DE PEDIDO
        } else if (modeApp == 'M') {
          var posped = that.getView().getModel("DisplayPosPed").getData();

          if (!posPed) {

            //Si estamos eliminando una posición "padre" que no es la ultima
            if (posped[posTab].PosnrT && posped.length > 1 && posTab + 1 < posped.length) {

              if (posped[posTab + 1].Posnr === posped[posTab].PosnrT) {
                posped[posTab + 1].PosnrT = posped[posTab].PosnrT;
              }

            }
            //posped.splice(posTab, 1);
            if (modeApp != "A" || posped[posTab].modificabe) {
              posped.splice(posTab, 1);
            } else {
              posped[posTab].iconoB = "sap-icon://delete";
              posped[posTab].iconoM = true;
              posped[posTab].Loekz = "L";
            }

          } else if (!posTab) {

            for (var i = posped.length - 1; i >= 0; i--) {

              if (posped[i].ItmNumber == posPed) {
                if (modeApp != "A") {
                  posped.splice(i, 1);
                } else {
                  posped[i].iconoB = "sap-icon://delete";
                  posped[i].iconoM = true;
                  posped[i].Loekz = "L";
                }
              }

            }

          }

          that.ordenaPedPos(true);
          //that.oComponent.getModel("PedidoPos").refresh(true);

          //Si estamos eliminando la posición 10 en la creación
          if (posPed == 10 && modeApp != "A") {
            //Vemos las posiciones de la tabla actual
            posped = that.getView().getModel("PedidoPos").getData();

            var posidNew;
            if (posped.length > 0) {
              //Se calcula el Departamento en función de la pos 10
              for (var i = posped.length - 1; i >= 0; i--) {
                if (posped[i].Posnr == 10) {
                  posidNew = posped[i].Posid;
                }
              }

              if (posidNew) {

                var oJson = {
                  POSID: posidNew
                }
              }

            } else {
            }
          }
        }


      },

      onCrear_OLD: function () {

        var oJson;
        var SolicitudPepCrSet = [];

        var SolicitudPedCondSet = [];
        var SolicitudPedQtySet = [];
        var ordTextSet = [];
        var BapeVbaK = [];
        var BapeVbakx = [];
        var obj = {};
        var objCond = {};
        var objQty = {};
        var objTxt = {};

        if (!this.getView().getModel("PedidoPos")) {
          this.oComponent.setModel(new JSONModel([]), "PedidoPos");
        }
        var Posiciones = this.getView().getModel("PedidoPos").getData();
        if (this.oComponent.getModel("ModoApp").getProperty("/mode") == 'M') {
          var PosicionesMod = this.getView().getModel("DisplayPosPed").getData();
          var results_arrayMod = PosicionesMod;
        }

        var results_array = Posiciones;


        var message;
        var that = this;
        var crear = "Se ha creado la solicitud de Venta: ";
        var modificar = "Se ha modificado la solicitud de Venta: "

        //var cabecera = Object.assign({}, this.oComponent.getModel("ModoApp").getData());
        //var posiciones = this.oComponent.getModel("PedidoPos").getData(); 
        //Object.assign({}, this.oComponent.getModel("PedidoCab").getData()),


        /*cabecera.DocType = this.oComponent.getModel("ModoApp").getData().Tipopedido;
        cabecera.SalesOrg = this.oComponent.getModel("ModoApp").getData().Vkbur;
        cabecera.DistrChan = this.oComponent.getModel("ModoApp").getData().CvCanal;
        cabecera.Division = this.oComponent.getModel("ModoApp").getData().CvSector;
        cabecera.SalesOff = this.getView().byId("idOficinaV").getValue();
        cabecera.BillBlock = "ZR";
        cabecera.Currency = this.getView().byId("idMoneda").getText();*/

        console.log(this.oComponent.getModel("DisplayPEP").getData());
        
        if (this.oComponent.getModel("ModoApp").getProperty("/mode") == 'M') {
          var Vbeln = this.oComponent.getModel("DisplayPEP").getData().Vbeln
          var DocType = this.oComponent.getModel("ModoApp").getData().Tipopedido;
          var SalesOrg = this.oComponent.getModel("DisplayPEP").getData().Vkbur;
          var DistrChan = this.oComponent.getModel("ModoApp").getData().CvCanal;
          var Division = this.oComponent.getModel("ModoApp").getData().CvSector;
          var SalesOff = this.oComponent.getModel("DisplayPEP").getData().Vkbur;
          var PpSearch = this.getView().byId("f_denoped").getValue();
          var PurchNoC = this.getView().byId("f_refped").getValue();
          var SalesDist = this.oComponent.getModel("ModoApp").getData().Bzirk;
          var BillBlock = "ZR";
          var Currency = this.oComponent.getModel("DisplayPEP").getData().Currency;
          //var Currency = this.oComponent.getModel("PedidoCab").getData().Moneda;
          var TxtCabecera = this.getView().byId("textAreaCabFact").getValue();
          //var TxtInfRechazo = this.getView().byId("textAreaCabInfRech").getValue();
          var TxtAclaraciones = this.getView().byId("textAreaCabAcl").getValue();
          var Zznia = this.oComponent.getModel("DisplayPEP").getData().Zznia;
          var Zzresponsable = "";
          var Yykostkl = this.oComponent.getModel("DisplayPEP").getData().Yykostkl;
          var Yyaufnr = this.oComponent.getModel("DisplayPEP").getData().Yyaufnr;

        } else {

          var DocType = this.oComponent.getModel("ModoApp").getData().Tipopedido;
          var SalesOrg = this.oComponent.getModel("ModoApp").getData().Vkbur;
          var DistrChan = this.oComponent.getModel("ModoApp").getData().CvCanal;
          var Division = this.oComponent.getModel("ModoApp").getData().CvSector;
          var SalesOff = this.getView().byId("idOficinaV").getSelectedKey();
          var PpSearch = this.getView().byId("f_denoped").getValue();
          var PurchNoC = this.getView().byId("f_refped").getValue();
          var SalesDist = this.oComponent.getModel("ModoApp").getData().Bzirk;
          var BillBlock = "ZR";
          var OrdReason = this.getView().byId("f_campomotivo").getSelectedKey();
          //var Currency = this.getView().byId("idMoneda").getText();
          //var Currency = this.oComponent.getModel("PedidoCab").getData().Moneda;
          var TxtCabecera = this.getView().byId("textAreaCabFact").getValue();
          //var TxtInfRechazo = this.getView().byId("textAreaCabInfRech").getValue();
          var TxtAclaraciones = this.getView().byId("textAreaCabAcl").getValue();
          var Zznia = this.getView().byId("f_camponia").getSelectedKey();
          var Zzresponsable = "";
          var Yykostkl = codcecoIngreso;
          var Yyaufnr = codordIngreso;
        }


        /*cabecera.Erdat = this.getView().byId("fechaAltaPed").getValue();
        var fechihd = Date.parse(cabecera.Erdat);
        cabecera.Erdat = "\/Date(" + fechihd + ")\/";
        cabecera.Ernam = this.getView().byId("inputsolic").getValue();
        cabecera.Ernam = "Pepe Prueba"
        cabecera.Kunnr = codcli;
        cabecera.Mail = this.getView().byId("inputmail").getValue();
        cabecera.ImpPedido = this.getView().byId("inputimport").getValue();
        cabecera.ImpPedido = "100";
        cabecera.Vbtyp = this.getView().byId("f_typeAlta").getSelectedKey();
        cabecera.Ekorg = this.getView().byId("f_orgAlta").getSelectedKey();
        cabecera.SdDoc = this.getView().byId("f_contratoAlta").getSelectedKey();
        cabecera.Text = this.getView().byId("descAltaPed").getValue();
        cabecera.FRechazo = "\/Date(" + fechihd + ")\/";
        cabecera.FechaApro = "\/Date(" + fechihd + ")\/";*/

        //pedidosClientes.PartnRole = "AG";
        //pedidosClientes.PartnNumb = this.oComponent.getModel("ModoApp").getData().Codcli;
        var PartnRole = "AG";


        if (this.oComponent.getModel("ModoApp").getProperty("/mode") == 'M') {
          var PartnNumb = this.oComponent.getModel("DisplayPEP").getData().Kunnr;
        } else {
          var PartnNumb = this.oComponent.getModel("ModoApp").getData().Codcli;
        }
        //var PartnNumb = this.oComponent.getModel("ModoApp").getData().Codcli;



        //pedidosCondicion = this.oComponent.getModel("PedidoCond").getData(); 

        //Fechas de Cabecera
        var ReqDate = Date.parse(new Date());
        var DocDate = Date.parse(new Date());
        var BillDate = Date.parse(new Date());
        var PurchDate = Date.parse(new Date());
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
        var ReqDate = Date.parse(new Date());
        var TpDate = Date.parse(new Date());
        var MsDate = Date.parse(new Date());
        var LoadDate = Date.parse(new Date());
        var GiDate = Date.parse(new Date());
        var DlvDate = Date.parse(new Date());
        var Conpricdat = Date.parse(new Date());


        if (this.oComponent.getModel("ModoApp").getProperty("/mode") == 'M') {
          for (var i = 0; i < PosicionesMod.length; i++) {
            obj = {
              //Secu: (i + 1).toString(),
              ItmNumber: results_arrayMod[i].Posnr.toString(),
              Material: results_arrayMod[i].Matnr,
              BillDate: "\/Date(" + BillDate + ")\/",
              PurchDate: "\/Date(" + PurchDate + ")\/",
              PoDatS: "\/Date(" + PoDatS + ")\/",
              FixValDy: "\/Date(" + FixValDy + ")\/",
              PriceDate: "\/Date(" + PriceDate + ")\/",
              ServDate: "\/Date(" + ServDate + ")\/",
              //Importe: results_array[i].Importe.toString(),
              SalesUnit: results_arrayMod[i].Meins,
              Plant: this.oComponent.getModel("ModoApp").getData().Vkbur,
            };
            SolicitudPepCrSet.push(obj);
            obj = {};
          }

          //Fechas de Condiciones
          for (var i = 0; i < PosicionesMod.length; i++) {
            objCond = {
              //Secu: (i + 1).toString(),
              ItmNumber: results_arrayMod[i].Posnr.toString(),
              CondValue: results_arrayMod[i].Netpr,
              CondType: 'PR00',
              CondPUnt: results_arrayMod[i].Kpein,
              CondUnit: results_arrayMod[i].Meins,
              Currency: 'EUR',
              Conpricdat: "\/Date(" + Conpricdat + ")\/",
            };
            SolicitudPedCondSet.push(objCond);
            objCond = {};
          }

          //Fechas de Cantidades
          for (var i = 0; i < PosicionesMod.length; i++) {
            objQty = {
              //Secu: (i + 1).toString(),
              ItmNumber: results_arrayMod[i].Posnr.toString(),
              ReqQty: results_arrayMod[i].Kpein,
              ReqDate: "\/Date(" + ReqDate + ")\/",
              TpDate: "\/Date(" + TpDate + ")\/",
              GiDate: "\/Date(" + GiDate + ")\/",
              MsDate: "\/Date(" + MsDate + ")\/",
              LoadDate: "\/Date(" + LoadDate + ")\/",
              DlvDate: "\/Date(" + DlvDate + ")\/",
            };
            SolicitudPedQtySet.push(objQty);
            objQty = {};
          }

          /*for (var i = 0; i < Posiciones.length; i++) {
            objCli = {
                Secu: (i + 1).toString(),
                PartnNumb: PartnNumb,
                PartnRole: PartnRole
            };
            SolicitudClienteSet.push(objCli);
            objCli = {};                
           } */

          /* if (TxtCabecera) {
             objTxt = {
               Textid: 'Z001',
                 Langu: 'ES',
                 Textline: TxtCabecera
             };
             ordTextSet.push(objTxt);
             objTxt = {};
           } else if (TxtCabecera && TxtInfRechazo) {
             for (var i = 0; i < ordTextSet.length; i++) {
               objTxt = {
                 Textid: 'Z002',
                   Langu: 'ES',
                   Textline: TxtInfRechazo
               };
               ordTextSet.push(objTxt);
               objTxt = {};
             }
           } else if (TxtCabecera && TxtAclaraciones && TxtAclaraciones) {
             for (var i = 0; i < ordTextSet.length; i++) {
               objTxt = {
                 Textid: 'Z003',
                   Langu: 'ES',
                   Textline: TxtAclaraciones
               };
               ordTextSet.push(objTxt);
               objTxt = {};
             }
           }*/

          /*if (TxtCabecera !== undefined && TxtInfRechazo == undefined && TxtAclaraciones == undefined) {
            for (var i = 0; i < Posiciones.length; i++) {
              //const element = array[index];
              objTxt  = {
                Textid: 'Z001',
                Langu: 'ES',
                Textline: TxtCabecera
              };
              ordTextSet.push(objTxt);
              objTxt = {};
             }  
          } else if (TxtCabecera !== undefined && TxtInfRechazo != undefined && TxtAclaraciones == undefined) {
            for (var i = 0; i < Posiciones.length; i++) {
              //const element = array[index];
              objTxt  = {
                Textid: 'Z002',
                Langu: 'ES',
                Textline: TxtInfRechazo
              };
              ordTextSet.push(objTxt);
              objTxt = {};
             }  
          } else if (TxtCabecera !== undefined && TxtInfRechazo != undefined && TxtAclaraciones != undefined) {
            for (var i = 0; i < Posiciones.length; i++) {
              //const element = array[index];
              objTxt  = {
                Textid: 'Z003',
                Langu: 'ES',
                Textline: TxtAclaraciones
              };
              ordTextSet.push(objTxt);
              objTxt = {};
             }  
          }*/

          for (var i = 0; i < PosicionesMod.length; i++) {
            if (TxtCabecera != null && TxtAclaraciones == null) {
              objTxt = {
                Textid: '001',
                Langu: 'ES',
                Textline: TxtCabecera
              };
              ordTextSet.push(objTxt);
              objTxt = {};
            } else if (TxtCabecera == null && TxtAclaraciones != null) {
              objTxt = {
                Textid: 'Z003',
                Langu: 'ES',
                Textline: TxtAclaraciones
              };
              ordTextSet.push(objTxt);
              objTxt = {};
            } else if (TxtCabecera != null && TxtAclaraciones != null) {
              if (TxtCabecera) {
                objTxt = {
                  Textid: '0001',
                  Langu: 'ES',
                  Textline: TxtCabecera
                };
                ordTextSet.push(objTxt);
                objTxt = {};
              }
              if (TxtAclaraciones) {
                objTxt = {
                  Textid: 'Z003',
                  Langu: 'ES',
                  Textline: TxtAclaraciones
                };
                ordTextSet.push(objTxt);
                objTxt = {};
              }
            }

          }
        }

        //Fechas de Posiciones

        for (var i = 0; i < Posiciones.length; i++) {
          obj = {
            //Secu: (i + 1).toString(),
            ItmNumber: results_array[i].ItmNumber.toString(),
            Material: results_array[i].Material,
            BillDate: "\/Date(" + BillDate + ")\/",
            PurchDate: "\/Date(" + PurchDate + ")\/",
            PoDatS: "\/Date(" + PoDatS + ")\/",
            FixValDy: "\/Date(" + FixValDy + ")\/",
            // **Revisar**
            //PriceDate: "\/Date(" + Date.parse(Posiciones[i].PriceDate) + ")\/",
            PriceDate: "\/Date(" + PriceDate + ")\/",
            ServDate: "\/Date(" + ServDate + ")\/",
            //Importe: results_array[i].Importe.toString(),
            SalesUnit: results_array[i].SalesUnit,
            Plant: this.oComponent.getModel("ModoApp").getData().Vkbur,
            Yykostkl: results_array[i].Ykostl,
            Yyaufnr: results_array[i].Yaufnr,
          };
          SolicitudPepCrSet.push(obj);
          obj = {};
        }

        //Fechas de Condiciones
        for (var i = 0; i < Posiciones.length; i++) {
          objCond = {
            //Secu: (i + 1).toString(),
            ItmNumber: results_array[i].ItmNumber.toString(),
            CondValue: results_array[i].CondValue,
            CondType: 'PR00',
            CondPUnt: results_array[i].Kpein,
            CondUnit: results_array[i].SalesUnit,
            Currency: 'EUR',
            Conpricdat: "\/Date(" + Conpricdat + ")\/",
          };
          SolicitudPedCondSet.push(objCond);
          objCond = {};
        }

        //Fechas de Cantidades
        for (var i = 0; i < Posiciones.length; i++) {
          objQty = {
            //Secu: (i + 1).toString(),
            ItmNumber: results_array[i].ItmNumber.toString(),
            ReqQty: results_array[i].ReqQty,
            ReqDate: "\/Date(" + ReqDate + ")\/",
            TpDate: "\/Date(" + TpDate + ")\/",
            GiDate: "\/Date(" + GiDate + ")\/",
            MsDate: "\/Date(" + MsDate + ")\/",
            LoadDate: "\/Date(" + LoadDate + ")\/",
            DlvDate: "\/Date(" + DlvDate + ")\/",
          };
          SolicitudPedQtySet.push(objQty);
          objQty = {};
        }

        /*for (var i = 0; i < Posiciones.length; i++) {
          objCli = {
              Secu: (i + 1).toString(),
              PartnNumb: PartnNumb,
              PartnRole: PartnRole
          };
          SolicitudClienteSet.push(objCli);
          objCli = {};                
         } */

        /* if (TxtCabecera) {
           objTxt = {
             Textid: 'Z001',
               Langu: 'ES',
               Textline: TxtCabecera
           };
           ordTextSet.push(objTxt);
           objTxt = {};
         } else if (TxtCabecera && TxtInfRechazo) {
           for (var i = 0; i < ordTextSet.length; i++) {
             objTxt = {
               Textid: 'Z002',
                 Langu: 'ES',
                 Textline: TxtInfRechazo
             };
             ordTextSet.push(objTxt);
             objTxt = {};
           }
         } else if (TxtCabecera && TxtAclaraciones && TxtAclaraciones) {
           for (var i = 0; i < ordTextSet.length; i++) {
             objTxt = {
               Textid: 'Z003',
                 Langu: 'ES',
                 Textline: TxtAclaraciones
             };
             ordTextSet.push(objTxt);
             objTxt = {};
           }
         }*/

        /*if (TxtCabecera !== undefined && TxtInfRechazo == undefined && TxtAclaraciones == undefined) {
          for (var i = 0; i < Posiciones.length; i++) {
            //const element = array[index];
            objTxt  = {
              Textid: 'Z001',
              Langu: 'ES',
              Textline: TxtCabecera
            };
            ordTextSet.push(objTxt);
            objTxt = {};
           }  
        } else if (TxtCabecera !== undefined && TxtInfRechazo != undefined && TxtAclaraciones == undefined) {
          for (var i = 0; i < Posiciones.length; i++) {
            //const element = array[index];
            objTxt  = {
              Textid: 'Z002',
              Langu: 'ES',
              Textline: TxtInfRechazo
            };
            ordTextSet.push(objTxt);
            objTxt = {};
           }  
        } else if (TxtCabecera !== undefined && TxtInfRechazo != undefined && TxtAclaraciones != undefined) {
          for (var i = 0; i < Posiciones.length; i++) {
            //const element = array[index];
            objTxt  = {
              Textid: 'Z003',
              Langu: 'ES',
              Textline: TxtAclaraciones
            };
            ordTextSet.push(objTxt);
            objTxt = {};
           }  
        }*/

        for (var i = 0; i < Posiciones.length; i++) {
          if (TxtCabecera != null && TxtAclaraciones == null) {
            objTxt = {
              Textid: '001',
              Langu: 'ES',
              Textline: TxtCabecera
            };
            ordTextSet.push(objTxt);
            objTxt = {};
          } else if (TxtCabecera == null && TxtAclaraciones != null) {
            objTxt = {
              Textid: 'Z003',
              Langu: 'ES',
              Textline: TxtAclaraciones
            };
            ordTextSet.push(objTxt);
            objTxt = {};
          } else if (TxtCabecera != null && TxtAclaraciones != null) {
            if (TxtCabecera) {
              objTxt = {
                Textid: '0001',
                Langu: 'ES',
                Textline: TxtCabecera
              };
              ordTextSet.push(objTxt);
              objTxt = {};
            }
            if (TxtAclaraciones) {
              objTxt = {
                Textid: 'Z003',
                Langu: 'ES',
                Textline: TxtAclaraciones
              };
              ordTextSet.push(objTxt);
              objTxt = {};
            }
          }

        }

        /**
         *  
         * 
         */

        //Tratamiento de adjuntos
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
              Descripcion: el.Descripcion,
              Content: el.Content
            }
          }
          oModAdj2.push(adj);
        });

        let newArray = [];
        let uniqueObject = {};

        for (let i in ordTextSet) {
          var objTextId = ordTextSet[i]['Textid'];
          uniqueObject[objTextId] = ordTextSet[i];
        }

        for (i in uniqueObject) {
          newArray.push(uniqueObject[i]);
        }



        if (this.oComponent.getModel("ModoApp").getProperty("/mode") == 'M') {
          oJson = {
            Vbeln: Vbeln,
            DocType: DocType,
            SalesOrg: SalesOrg,
            SalesDist: SalesDist,
            DistrChan: DistrChan,
            Division: Division,
            SalesOff: SalesOff,
            PpSearch: PpSearch,
            PurchNoC: PurchNoC,
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
              PartnRole: PartnRole
            },
            PedidoExtensionModSet: {
              Zznia: Zznia,
              Zzresponsable: Zzresponsable,
              Yykostkl: Yykostkl,
              Yyaufnr: Yyaufnr
            },
            //          PedidoTextosSet: [TextId:'0001' , TextLine: TxtCabecera], Z002 Rechazo, Z003 Aclaraciones
            PedidoTextosModSet: newArray,
            PedidoPosicionModSet: SolicitudPepCrSet,
            PedidoCondicionModSet: SolicitudPedCondSet,
            PedidoCantidadModSet: SolicitudPedQtySet,
            FicheroModSet: oModAdj2, //oModAdj,
            PedidoRespuestaModSet: {
              //Idsolc: Idsolc,
            }
          };

        } else {

          var contrato = "";
          if(this.oComponent.getModel("DisplayPEP")){
            contrato = this.oComponent.getModel("DisplayPEP").getData().contrato;
          }
          oJson = {
            DocType: DocType,
            SalesOrg: SalesOrg,
            SalesDist: SalesDist,
            DistrChan: DistrChan,
            OrdReason: OrdReason,
            Division: Division,
            SalesOff: SalesOff,
            PpSearch: PpSearch,
            PurchNoC: PurchNoC,
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
            Ref1: contrato,
            PedidoClienteSet: {
              PartnNumb: PartnNumb,
              PartnRole: PartnRole
            },
            PedidoExtensionSet: {
              Zznia: Zznia,
              Zzresponsable: Zzresponsable,
              Yykostkl: Yykostkl,
              Yyaufnr: Yyaufnr
            },
            //          PedidoTextosSet: [TextId:'0001' , TextLine: TxtCabecera], Z002 Rechazo, Z003 Aclaraciones
            PedidoTextosSet: newArray,
            PedidoPosicionSet: SolicitudPepCrSet,
            PedidoCondicionSet: SolicitudPedCondSet,
            PedidoCantidadSet: SolicitudPedQtySet,
            FicheroSet: oModAdj2, //oModAdj,
            PedidoRespuestaSet: {
              //Idsolc: Idsolc,
            }
          };

        }
        sap.ui.core.BusyIndicator.show();
        
        if (this.oComponent.getModel("ModoApp").getProperty("/mode") == 'M') {

          that.mainService.create("/PedidoModSet", oJson, {
            success: function (result) {
              if (result.Vbeln && result.Vbeln !== "0") {
                sap.ui.core.BusyIndicator.hide();
                message = modificar + result.Vbeln;

                MessageBox.show(message, {
                  icon: sap.m.MessageBox.Icon.SUCCESS,
                  onClose: function (oAction) {
                    that.getView().byId("textAreaCabFact").setValue(null);
                    that.getView().byId("textAreaCabInfRech").setValue(null);
                    that.getView().byId("textAreaCabAcl").setValue(null);
                    that.getView().byId("f_refped").setValue(null);
                    that.getView().byId("f_denoped").setValue(null);
                    that.getView().byId("f_campomotivo").setSelectedKey(null);
                    that.getView().byId("f_campocondicion").setSelectedKey(null);
                    that.getView().byId("f_camponia").setSelectedKey(null);
                    that.getView().byId("f_campoplat").setSelectedKey(null);
                    that.getView().byId("f_campogest").setSelectedKey(null);
                    that.getView().byId("f_campoundTram").setSelectedKey(null);
                    that.getView().byId("f_campoofcont").setSelectedKey(null);
                    that.getView().byId("f_campoAdm").setSelectedKey(null);
                    that.getView().byId("idOficinaV").setSelectedKey(null);
                    that.getView().byId("f_cecosCab").setValue(null);
                    that.getView().byId("f_ordenesCab").setValue(null);

                    if (that.getView().byId("f_cecosPOS")) {
                      that.getView().byId("f_cecosPOS").setValue(null);
                    }
                    if (that.getView().byId("f_ordenesPOS")) {
                      that.getView().byId("f_ordenesPOS").setValue(null);
                    }

                    /*that.getView().byId("idCTipoPed").setSelectedKey(null);
                    that.getView().byId("idCSociedad").setSelectedKey(null);
                    that.getView().byId("idArea").setSelectedKey(null);
                    that.getView().byId("idCanal").setSelectedKey(null);
                    that.getView().byId("idSector").setSelectedKey(null);
                    that.getView().byId("idzona").setSelectedKey(null);
                    that.getView().byId("idCCliente").setValue(null);
                    that.getView().byId("idcontract").setSelectedKey(null);*/
                    //that.byId("OptionDial").close();
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
                    oRouter.navTo("RouteMonitorPedidos");
                  }
                });
              } else if (result.PedidoRespuestaModSet.Mensaje) {
                sap.ui.core.BusyIndicator.hide();
                MessageBox.error(result.PedidoRespuestaModSet.Mensaje);
              }
            },
            error: function (err) {
              sap.m.MessageBox.error("Solicitud no Modificada.", {
                title: "Error",
                initialFocus: null,
              });
              //oTable.clearSelection();
              sap.ui.core.BusyIndicator.hide();
            },
            async: true,
          });
        } else {

          this.mainService.create("/PedidoCabSet", oJson, {
            success: function (result) {
              if (result.Vbeln && result.Vbeln !== "0") {
                sap.ui.core.BusyIndicator.hide();
                message = crear + result.Vbeln;

                MessageBox.show(message, {
                  icon: sap.m.MessageBox.Icon.SUCCESS,
                  onClose: function (oAction) {
                    that.getView().byId("textAreaCabFact").setValue(null);
                    that.getView().byId("textAreaCabInfRech").setValue(null);
                    that.getView().byId("textAreaCabAcl").setValue(null);
                    that.getView().byId("f_refped").setValue(null);
                    that.getView().byId("f_denoped").setValue(null);
                    that.getView().byId("f_campomotivo").setSelectedKey(null);
                    that.getView().byId("f_campocondicion").setSelectedKey(null);
                    that.getView().byId("f_camponia").setSelectedKey(null);
                    that.getView().byId("f_campoplat").setSelectedKey(null);
                    that.getView().byId("f_campogest").setSelectedKey(null);
                    that.getView().byId("f_campoundTram").setSelectedKey(null);
                    that.getView().byId("f_campoofcont").setSelectedKey(null);
                    that.getView().byId("f_campoAdm").setSelectedKey(null);
                    that.getView().byId("idOficinaV").setSelectedKey(null);
                    that.getView().byId("f_cecosCab").setValue(null);
                    that.getView().byId("f_ordenesCab").setValue(null);

                    /*that.getView().byId("idCTipoPed").setSelectedKey(null);
                    that.getView().byId("idCSociedad").setSelectedKey(null);
                    that.getView().byId("idArea").setSelectedKey(null);
                    that.getView().byId("idCanal").setSelectedKey(null);
                    that.getView().byId("idSector").setSelectedKey(null);
                    that.getView().byId("idzona").setSelectedKey(null);
                    that.getView().byId("idCCliente").setValue(null);
                    that.getView().byId("idcontract").setSelectedKey(null);*/
                    //that.byId("OptionDial").close();
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
                    oRouter.navTo("RouteMonitorPedidos");
                  }
                });
              } else if (result.PedidoRespuestaSet.Mensaje) {
                sap.ui.core.BusyIndicator.hide();
                MessageBox.error(result.PedidoRespuestaSet.Mensaje);
              }
            },
            error: function (err) {
              sap.ui.core.BusyIndicator.hide();
              sap.m.MessageBox.error("Solicitud no creada.", {
                title: "Error",
                initialFocus: null,
              });
            },
            async: true
          });
        }
        if (that.getView().byId("f_cecosPOS")) {
          that.getView().byId("f_cecosPOS").setValue(null);
        }
        if (that.getView().byId("f_ordenesPOS")) {
          that.getView().byId("f_ordenesPOS").setValue(null);
        }
      },

      /*fechahoy: function () {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        var today1 = (dd + ' ' + mm + ', ' + yyyy);
        //var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "YYYY/MM/DD" });   
        //var todayFormatted = dateFormat.format(today1);

        this.getView().byId("DTPdesde").setValue(today1);
      },*/

      /*resolveCreatePed: function (result) {

        var message;
        var crear = this.oI18nModel.getProperty("txtCrea");
        var that = this;

        sap.ui.core.BusyIndicator.hide();
        if (result[0].PedidoRespuesta.Mensaje == "" && result[0].PedidoRespuesta.Vbeln != "") {

          message = (result[0].PedidoRespuesta.Mensaje + "\n" + crear + result[0].PedidoRespuesta.Vbeln);
          MessageBox.show(message, {
            icon: sap.m.MessageBox.Icon.SUCCESS,
            onClose: function (oAction) {
              that.oComponent.setModel(new JSONModel(), "ModoApp");
              that.oComponent.setModel(new JSONModel(), "Adjuntos");
              that.oComponent.setModel(new JSONModel(), "listadoCecos");
              that.oComponent.setModel(new JSONModel(), "listadoOrdenes");
              that.oComponent.setModel(new JSONModel(), "listadoServicios");
              that.getView().byId("textAreaCabFact").setValue(null);
              that.getView().byId("textAreaCabInfRech").setValue(null);
              that.getView().byId("textAreaCabAcl").setValue(null);
              var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
              oRouter.navTo("RouteView1");
            }
          });
        } else {
          message = (result[0].PedidoRespuesta.Mensaje);
          MessageBox.error(message);
        }
      },*/

      
      /*validaForm: function (formulario) {
        var oForm = this.getView().byId(formulario).getContent();
        var error = "";

        oForm.forEach(function (Field) {
          if (typeof Field.getValue === "function") {
            if (!Field.getValue() || Field.getValue().length < 1) {
              Field.setValueState("Error");
              error = "X"
            } else {
              Field.setValueState("None");
            }
          }
        });
        return error;
      },*/

      
      


      /*_getDialogServicios: function (sInputValue) {

        var oView = this.getView();
        var ItmNumber = this.oComponent.getModel("ModoApp").getData().ItmNumber;
        var configPos = {
          mode: "A",
          type: "P",
          Vbelp: ItmNumber
        }

        var oModConfigPos = new JSONModel();
        oModConfigPos.setData(configPos);
        this.oComponent.setModel(oModConfigPos, "posPedFrag");

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
        }
        this.pDialogPosiciones.then(function (oDialogPosiciones) {
          oDialogPosiciones.open(sInputValue);
          //this._configDialogCliente(oDialog)
        });
      },*/

      /*_getDialogServicios: function (sInputValue) {

        var oView = this.getView();
        var ItmNumber = this.oComponent.getModel("ModoApp").getData().ItmNumber;
        var ItmNumberPos = this.oComponent.getModel("PedidoPos").getData();
        var posicion;

        var configPos = {
          mode: "A",
          type: "P",
          Vbelp: ItmNumber
        }

        var oModConfigPos = new JSONModel();
        oModConfigPos.setData(configPos);
        this.oComponent.setModel(oModConfigPos, "posPedFrag");

        if (ItmNumberPos.length > 0) {
          for (var i = 0; i < ItmNumberPos.length; i++) {
            posicion = ItmNumberPos[i].ItmNumber + 10;
          }
          configPos = {
            mode: "A",
            type: "P",
            Vbelp: posicion
          }
        }

        var posped = this.getView().getModel("PedidoPos").getData();

        var oModConfigPos = new JSONModel();
        oModConfigPos.setData(configPos);
        this.oComponent.setModel(oModConfigPos, "posPedFrag");

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
        }
        this.pDialogPosiciones.then(function (oDialogPosiciones) {
          oDialogPosiciones.open(sInputValue);
          //this._configDialogCliente(oDialog)
        });
      },*/

      

      
      
      

      

      /*ABRIR GESTOR DE ARCHIVOS*/
      handleUploadPress: function (oEvent) {
        //Inicializamos el modelo de adjunto 
        //this.act_adj = null;

        //var oMdesc = this.oComponent.getModel("datosAdj").getData();
        //var desc = oMdesc.Desc;

        /*if (!desc || desc == undefined) {
          desc = this.getView().byId("descAdjunto").getValue();
        }*/

        /*if (!desc) {
            MessageBox.error(this.oI18nModel.getProperty("errDesArch"));
            this.getView().byId("fileUploader").setValue("");
            return;
        }*/

        /*var fileDetails = oEvent.getParameters("file").files[0];
        sap.ui.getCore().fileUploaderArr = [];

        if (fileDetails) {
          var mimeDet = fileDetails.type,
            fileName = fileDetails.name;
          //Calling method....
          var adjuntos = this.oComponent.getModel("Adjuntos").getData();
          var nadj = adjuntos.length;

          this.base64conversionMethod(
            C,
            fileName,
            fileDetails,
            nadj,
            adjuntos,
            "");
        } else {
          sap.ui.getCore().fileUploaderArr = [];
        }*/


        this.act_adj = null;
        var oMdesc = this.oComponent.getModel("datosAdj").getData();
        var desc = oMdesc.Desc;
        var fileDetails = oEvent.getParameters("file").files[0];
        sap.ui.getCore().fileUploaderArr = [];
        if (fileDetails) {
          var mimeDet = fileDetails.type,
            fileName = fileDetails.name;
          var adjuntos = this.oComponent.getModel("Adjuntos").getData();
          var nadj = adjuntos.length;
          this.base64conversionMethod(mimeDet, fileName, fileDetails, nadj, adjuntos, "")
        } else {
          sap.ui.getCore().fileUploaderArr = []
        }




      },

      /*CONVERTIR FICHEROS A BASE64 */
      base64conversionMethod: function (fileMime, fileName, fileDetails, DocNum, adjuntos, desc) {
        var that = this;
        var oModAdj = new JSONModel();

        FileReader.prototype.readAsBinaryString = function (fileData) {
          var binary = "";
          var reader = new FileReader();
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
              //"Descripcion": desc,
              "Content": that.base64conversionRes,
            };
            /*that.oComponent.getModel("Adjuntos").refresh(true);
            that.getView().byId("descAdjunto").setValue("");
            that.getView().byId("fileUploader").setValue("");*/
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
            "Filename": fileName,
            //"Descripcion": desc,
            "Content": that.base64conversionRes,
          };

          /*that.oComponent.getModel("Adjuntos").refresh(true);
           that.getView().byId("descAdjunto").setValue("");
           that.getView().byId("fileUploader").setValue("");*/
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
        const sOperation = sOperationPath.split("/").slice(-1).pop;

        adjs.splice(sOperation, 1);
        this.oComponent.setModel(new JSONModel(adjs), "Adjuntos");
      },

      /**
       * FRAMUMO - 08.03.24 - Fin Visualizar Adjunto en la Modif
       */
      onPressIcono: function(oEvent) {
       
        const oI18nModel = this.oComponent.getModel("i18n");
        var oTable = this.getView().byId("idTableAdjuntos");
        var adj = this.Adjunto(oEvent);
        
   
        var DatosAdjunto = [];
        var obj = {};
        var that = this;

        obj = {
          Foltp: adj.Foltp,
          Folyr: adj.Folyr,
          Folno: adj.Folno,
          Objtp: adj.Objtp,
          Objyr: adj.Objyr,
          Objno: adj.Objno
        };

        DatosAdjunto.push(obj);
          obj = {};

        var json1 = {
          Activity: "DISPLAY",
          Foltp: adj.Foltp,
          Folyr: adj.Folyr,
          Folno: adj.Folno,
          Objtp: adj.Objtp,
          Objyr: adj.Objyr,
          Objno: adj.Objno
        };

        this.mainService.create("/VisualizarAdjuntoSet", json1, {
          success: function(result) {

          },
          error: function (err) {
            MessageBox.error(that.oI18nModel.getProperty("errFat"));
          }
        })
      },

      Adjunto: function(oEvent) {
        var oModAdj = this.oComponent.getModel("Adjuntos").getData();
        const sOperationPath = oEvent.getSource().getBindingContext("Adjuntos").getPath();
        const sOperation = sOperationPath.split("/").slice(-1).pop();

        var sum = oModAdj[sOperation];

        return sum;
      }

      /**
       * FRAMUMO - 08.03.24 - Fin Visualizar Adjunto en la Modif
       */
      
    });
  });