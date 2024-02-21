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
    var codmat, nommat, codord, nomord, codceco, nomceco, fechaPos, codordPos, nomordPos, codcecoPos, nomcecoPos, sStatus;
    return Controller.extend("monitorpedidos.controller.AltaPedidos", {

      onInit: function () {
        this.mainService = this.getOwnerComponent().getModel("mainService");
        this.oComponent = this.getOwnerComponent();
        this.oI18nModel = this.oComponent.getModel("i18n");


        var oModAdj = new JSONModel();
        var oModAdjSHP = new JSONModel();
        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        /*if (modeApp == 'M' || modeApp == 'D') {
          const myRoute = this.getOwnerComponent().getRouter().getRoute("RouteAltaPedidos");
        myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);
        }*/
        

      },

      /*onMyRoutePatternMatched(event) {
        // your code when the view is about to be displayed ..
        this.actualizaimp();
      },*/


      onCancelar: function () {
        this.getView().byId("textAreaCabFact").setValue(null);
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
        this.getView().byId("f_cecos").setValue(null);
        this.getView().byId("f_ordenes").setValue(null);
        this.getView().byId("f_ordenes").setValue(null);
        this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", null);
        this.oComponent.getModel("PedidoCab").setProperty("/Moneda", null);

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("RouteMonitorPedidos");
      },

      actualizaimp: function () {
        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        //this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", '0');
        //this.oComponent.getModel("PedidoCab").setProperty("/Moneda", 'EUR');

        //MODO DE MODIFICACION Y VISUALIZACION DE PEDIDOS
        if (modeApp == 'M'|| modeApp == 'D') {
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

      fechahoy: function () {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        var today1 = (dd + ' ' + mm + ', ' + yyyy);
        //var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "YYYY/MM/DD" });   
        //var todayFormatted = dateFormat.format(today1);

        this.getView().byId("DTPdesde").setValue(today1);
      },
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

      onCrear: function () {

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
          var Currency = this.oComponent.getModel("PedidoCab").getData().Moneda;
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
          var Currency = this.oComponent.getModel("PedidoCab").getData().Moneda;
          var TxtCabecera = this.getView().byId("textAreaCabFact").getValue();
          //var TxtInfRechazo = this.getView().byId("textAreaCabInfRech").getValue();
          var TxtAclaraciones = this.getView().byId("textAreaCabAcl").getValue();
          var Zznia = this.getView().byId("f_camponia").getSelectedKey();
          var Zzresponsable = "";
          var Yykostkl = codceco;
          var Yyaufnr = codord;
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
        /*Promise.all([this.createDataEntity(this.mainService, "/PedidoCabSet", oJson)]).then(
          this.resolveCreatePed.bind(this), this.errorFatal.bind(this));*/

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
                    that.getView().byId("f_cecos").setValue(null);
                    that.getView().byId("f_ordenes").setValue(null);

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
                    that.getView().byId("f_cecos").setValue(null);
                    that.getView().byId("f_ordenes").setValue(null);

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

      resolveCreatePed: function (result) {

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
      },

      addPedPos: function () {
        var posiciones = [];
        var posicionN;

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        var posPedFrag = this.oComponent.getModel("posPedFrag").getData();
        var modePosPed = posPedFrag.mode;

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
            BillDate: fechaposicion,
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
            BillDate: fechaposicion,
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

        this.ordenaPedPos(true);
      },

      validaForm: function (formulario) {
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
      },

      
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

          this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", '0');
          this.oComponent.getModel("PedidoCab").setProperty("/Moneda", 'EUR');
          this.oComponent.getModel("PedidoCab").refresh(true);
          this.actualizaimp();

          var posSig = this.oComponent.getModel("posPedFrag").getData().ItmNumber;
          posSig = 10;
          this.oComponent.getModel("posPedFrag").setProperty("/posPed", posSig);
          //this.oComponent.getModel("posPedFrag").refresh(true);

          //this.oComponent.getModel("PedidoPos").refresh(true);
        }
        this.oComponent.setModel(new JSONModel(), "listadoCecos");
        this.oComponent.setModel(new JSONModel(), "listadoOrdenes");
        this.oComponent.setModel(new JSONModel(), "listadoServicios");

        this.byId("pedPosDial").close();
      },

      onaddPosPed: function () {
        this._getDialogServicios();
      },

      onaddPosPedCon: function () {
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

        //this.oComponent.setModel(this.oComponent.getModel("PedidoPosContrato"), "ModoApp");
      },

      onNavAltaContrato: function () {

        var oTable = this.getView().byId("TablaPosicionesContrato");
        /*var t_indices = oTable.getBinding().aIndices;

        this.oComponent.setModel(this.oComponent.getModel("PedidoPosContrato"), "PedidoPosContrato_Aux");

        var aContexts = oTable.getSelectedIndices();
        var items = aContexts.map(function (c) {
            //return c.getObject();
            return this.oComponent.getModel("PedidoPosContrato_Aux").getProperty("/" + t_indices[c]);
        }.bind(this));                
        var results_array = items;*/
        var aSelectedIndices = oTable.getSelectedIndices();
        var pedidosContrato = this.oComponent.getModel("PedidoPosContrato").getData();
        var pedidosContrato_Aux = JSON.parse(JSON.stringify(pedidosContrato)); // Copy data model without references
        var results_array = [];
        var oldPos = this.oComponent.getModel("PedidoPos").getData();
        var posnr_ItmNumber = oldPos.length * 10;

        for (var i = 0; i < aSelectedIndices.length; i++) {
          var indice = aSelectedIndices[i];
          var posicionPed = pedidosContrato_Aux[indice];
          posnr_ItmNumber = posnr_ItmNumber + 10;
          //posicionPed.Posnr = posnr_ItmNumber;
          posicionPed.ItmNumber = posnr_ItmNumber;
          results_array.push(posicionPed);
        }
        results_array = oldPos.concat(results_array);

        /*var posnr_ItmNumber;
        for (var i = 0; i < results_array.length; i++) {
            //results_array[i].Posnr = String((i+1) * 10).padStart(6, '0'); // establecer el formato de SAP 000000
            posnr_ItmNumber = (i+1) * 10;
            //results_array[i].Posnr = posnr_ItmNumber;
            results_array[i].ItmNumber = posnr_ItmNumber;
          }*/

        this.oComponent.getModel("PedidoPos").setData(results_array);
        this.oComponent.getModel("ModoApp").refresh(true);

        // Deseleccionar las opciones
        aSelectedIndices.forEach(function (oItem) {
          oTable.setSelectedIndex(-1);
        });
        this.byId("OptionDialContrato").close();
      },

      CloseOptionsDiagContrato: function () {
        this.byId("OptionDialContrato").close();
      },

      onCopyPosPed: function () {

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        var oTable, aContexts;

        if (modeApp == 'M') {
          oTable = this.getView().byId("TablaPosicionesDisp");
          var aContexts = oTable.getSelectedIndices();

          if (aContexts.length == 0) {
            //Mostramos un error porque no se ha seleccionado una linea
            MessageBox.warning(this.oI18nModel.getProperty("errModPos"));
          } else {
            var posiciones = this.oComponent.getModel("DisplayPosPed").getData();
            var posiciones_Aux = JSON.parse(JSON.stringify(posiciones)); // Copy data model without references
            var pedidoCopy = posiciones_Aux[aContexts[0]];
            var itmNumberCopy = Number(posiciones_Aux[posiciones_Aux.length - 1].Posnr) + 10;
            pedidoCopy.Posnr = ('000000' + itmNumberCopy).slice(-6);

            posiciones.push(pedidoCopy);
            this.oComponent.getModel("DisplayPosPed").refresh(true);
          }

        } else {
          oTable = this.getView().byId("TablaPosiciones");
          var aContexts = oTable.getSelectedIndices();

          if (aContexts.length == 0) {
            //Mostramos un error porque no se ha seleccionado una linea
            MessageBox.warning(this.oI18nModel.getProperty("errModPos"));
          } else {
            var posiciones = this.oComponent.getModel("PedidoPos").getData();
            var posiciones_Aux = JSON.parse(JSON.stringify(posiciones)); // Copy data model without references
            var pedidoCopy = posiciones_Aux[aContexts[0]];
            var itmNumberCopy = Number(posiciones_Aux[posiciones_Aux.length - 1].ItmNumber) + 10;
            pedidoCopy.ItmNumber = ('000000' + itmNumberCopy).slice(-6);

            posiciones.push(pedidoCopy);
            this.oComponent.getModel("PedidoPos").refresh(true);
          }
        }
      },

      onModPosPed: function () {

        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
        var oTable, aContexts, items;
        //MODO DE MODIFICACION DE PEDIDOS
        if (modeApp == 'M') {
          oTable = this.getView().byId("TablaPosicionesDisp");
          aContexts = oTable.getSelectedIndices();
          items = aContexts.map(function (c) {
            return this.oComponent.getModel("DisplayPosPed").getProperty("/" + c);
          }.bind(this));
          if (items.length == 0) {
            //Mostramos un error porque no se ha seleccionado una linea
            MessageBox.warning(this.oI18nModel.getProperty("errModPos"));
          } else {
            //Obtenemos la fecha de la linea seleccionada

            if (items[0].BillDate) {
              fechaPos = items[0].BillDate
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

          }

          ///MODO DE CREACION DE PEDIDOS
        } else if (modeApp == 'C') {
          oTable = this.getView().byId("TablaPosiciones");
          aContexts = oTable.getSelectedIndices();
          items = aContexts.map(function (c) {
            return this.oComponent.getModel("PedidoPos").getProperty("/" + c);
          }.bind(this));
          if (items.length == 0) {
            //Mostramos un error porque no se ha seleccionado una linea
            MessageBox.warning(this.oI18nModel.getProperty("errModPos"));
          } else {
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
        }
      },

      cancelPedPos: function () {
        this.byId("pedPosDial").close();
      },

      onDeletePosPed: function (oEvent) {
        this.deletePosPed(oEvent, false, true);
      },

      deletePosPed: function (oEvent, serv, pos) {

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

      _getDialogServicios: function (sInputValue) {

        var oView = this.getView();
        //var ItmNumber = this.oComponent.getModel("ModoApp").getData().ItmNumber;
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


        var recogececos = this.getView().byId("f_cecos").getValue();
        var recogeorden = this.getView().byId("f_ordenes").getValue();

        var configPos = {
          mode: "A",
          type: "P",
          index: null,
          Vbelp: posicion,
          // Los CECOS / OT se recogen de cabecera de manera predeterminada
          Yykostl: recogececos,
          Yyaufnr: recogeorden,
          Ykostl: recogececos,
          Yaufnr: recogeorden
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
          oDialogPosiciones.open(sInputValue);
        });

      },

      onBusqMateriales: function () {
        this.dameMateriales();
      },
      dameMateriales: function () {
        var Matnr = this.getView().byId("f_codMat").getValue();
        var Maktx = this.getView().byId("f_nomMat").getValue();
        var Matkl = this.getView().byId("f_grArt").getValue();
        var Bzirk = this.oComponent.getModel("ModoApp").getData().Bzirk;

        var aFilterIds, aFilterValues, aFilters;

        aFilterIds = [
          "Matnr",
          "Maktx",
          "Matkl",
          "Bzirk"
        ];
        aFilterValues = [
          Matnr,
          Maktx,
          Matkl,
          Bzirk
        ];

        if (Matnr == "" || Matnr == undefined) {
          var i = aFilterIds.indexOf("Matnr");

          if (i !== -1) {
            aFilterIds.splice(i, 1);
            aFilterValues.splice(i, 1);
          }
        }

        if (Maktx == "" || Maktx == undefined) {
          var i = aFilterIds.indexOf("Maktx");

          if (i !== -1) {
            aFilterIds.splice(i, 1);
            aFilterValues.splice(i, 1);
          }
        }

        if (Matkl == "" || Matkl == undefined) {
          var i = aFilterIds.indexOf("Matkl");

          if (i !== -1) {
            aFilterIds.splice(i, 1);
            aFilterValues.splice(i, 1);
          }
        }

        if (Bzirk == "" || Bzirk == undefined) {
          var i = aFilterIds.indexOf("Bzirk");

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
          this.oComponent.setModel(oModelMateriales, "listadoServicios");
          this.oComponent.getModel("listadoServicios").refresh(true);
        }
      },

      onValueHelpRequestServ: function () {
        this._getDialogMaterial();
      },

      _getDialogMaterial: function (sInputValue) {
        var oView = this.getView();

        if (!this.pDialogMaterial) {
          this.pDialogMaterial = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragments.MaterialesPedido",
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

      createDataEntity: function (oModel, path, json) {

        return new Promise(function (resolve, reject) {
          oModel.create(path, json, {
            success: function (oData, that) {
              resolve(oData);
            },
            error: function (oResult) {
              reject(oResult);
            }
          });
        });

      },

      onPressServicio: function (oEvent) {
        var mat = this.getSelectMat(oEvent, "listadoServicios");
        codmat = mat.Matnr;
        nommat = mat.Maktx;
        this.getView().byId("f_material").setValue(codmat);
        this.getView().byId("f_nommat").setValue(nommat);
        this.oComponent.getModel("posPedFrag").setProperty("/Matnr", codmat);
        this.oComponent.getModel("posPedFrag").refresh(true);
        this.byId("matDial").close();
      },

      getSelectMat: function (oEvent, oModel) {
        var oModMat = this.oComponent.getModel(oModel).getData();
        const sOperationPath = oEvent.getSource().getBindingContext(oModel).getPath();
        const sOperation = sOperationPath.split("/").slice(-1).pop();
        var idMaterial = oModMat[sOperation];
        return idMaterial;
      },
      CloseMatDiag: function () {
        this.byId("matDial").close();
      },
      cancelPedPos: function () {
        this.byId("pedPosDial").close();
      },
      onValueHelpOrdCabecera: function (oEvent) {
        //this.Dialog = sap.ui.xmlfragment("aguasdevalencia.fragment.ClienteMonitorPedidos", this);
        //this.Dialog.open();
        this._getDialogOrdenesCabecera();
      },

      onValueHelpOrdPosicion: function (oEvent) {
        //this.Dialog = sap.ui.xmlfragment("aguasdevalencia.fragment.ClienteMonitorPedidos", this);
        //this.Dialog.open();
        this._getDialogOrdenesPosicion();
      },

      onValueHelpCecosCabecera: function (oEvent) {
        //this.Dialog = sap.ui.xmlfragment("aguasdevalencia.fragment.ClienteMonitorPedidos", this);
        //this.Dialog.open();
        this._getDialogCecosCabecera();
      },
      onValueHelpCecosPosicion: function (oEvent) {
        //this.Dialog = sap.ui.xmlfragment("aguasdevalencia.fragment.ClienteMonitorPedidos", this);
        //this.Dialog.open();
        this._getDialogCecosPosicion();
      },
      _getDialogOrdenesCabecera: function (sInputValue) {
        var oView = this.getView();

        if (!this.pDialogOrdenesCabecera) {
          this.pDialogOrdenesCabecera = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragments.OrdenPedIngreso",
            controller: this,
          }).then(function (oDialogOrdenesCabecera) {
            // connect dialog to the root view of this component (models, lifecycle)
            oView.addDependent(oDialogOrdenesCabecera);
            return oDialogOrdenesCabecera;
          });
        }
        this.pDialogOrdenesCabecera.then(function (oDialogOrdenesCabecera) {
          oDialogOrdenesCabecera.open(sInputValue);
        });
      },

      _getDialogOrdenesPosicion: function (sInputValue) {
        var oView = this.getView();

        if (!this.pDialogOrdenesPosicion) {
          this.pDialogOrdenesPosicion = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragments.OrdenPedIngresoPosicion",
            controller: this,
          }).then(function (oDialogOrdenesPosicion) {
            // connect dialog to the root view of this component (models, lifecycle)
            oView.addDependent(oDialogOrdenesPosicion);
            return oDialogOrdenesPosicion;
          });
        }
        this.pDialogOrdenesPosicion.then(function (oDialogOrdenesPosicion) {
          oDialogOrdenesPosicion.open(sInputValue);
        });
      },

      _getDialogCecosCabecera: function (sInputValue) {
        var oView = this.getView();

        if (!this.pDialogCecosCabecera) {
          this.pDialogCecosCabecera = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragments.CecoPedIngreso",
            controller: this,
          }).then(function (oDialogCecosCabecera) {
            // connect dialog to the root view of this component (models, lifecycle)
            oView.addDependent(oDialogCecosCabecera);
            return oDialogCecosCabecera;
          });
        }
        this.pDialogCecosCabecera.then(function (oDialogCecosCabecera) {
          oDialogCecosCabecera.open(sInputValue);
        });
      },

      _getDialogCecosPosicion: function (sInputValue) {
        var oView = this.getView();

        if (!this.pDialogCecosPosicion) {
          this.pDialogCecosPosicion = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragments.CecoPedIngresoPosicion",
            controller: this,
          }).then(function (oDialogCecosPosicion) {
            // connect dialog to the root view of this component (models, lifecycle)
            oView.addDependent(oDialogCecosPosicion);
            return oDialogCecosPosicion;
          });
        }
        this.pDialogCecosPosicion.then(function (oDialogCecosPosicion) {
          oDialogCecosPosicion.open(sInputValue);
        });
      },

      onBusqCecosCabecera: function () {
        var Kostl = this.getView().byId("f_codCecoCabecera").getValue();
        var Ltext = this.getView().byId("f_nomCecoCabecera").getValue();
        this.onBusqCecos(Kostl, Ltext)
      },

      onBusqCecosPosicion: function () {
        var Kostl = this.getView().byId("f_codCecoPosicion").getValue();
        var Ltext = this.getView().byId("f_nomCecoPosicion").getValue();
        this.onBusqCecos(Kostl, Ltext)
      },

      onBusqCecos: function (Kostl, Ltext) {
        /*
        var Kostl = this.getView().byId("f_codCeco").getValue();
        var Ltext = this.getView().byId("f_nomCeco").getValue();
        */

        //var Bukrs = this.getView().byId("f_cecoSoc").getValue();
        //var Bukrs = this.getOwnerComponent().getModel("ModoApp").getProperty("/Vkbur");
        //var Bukrs = this.getView().byId("f_nifcAcr").getValue();
        if (this.getOwnerComponent().getModel("ModoApp").getProperty("/mode") == 'M') {
          var Bukrs = this.getOwnerComponent().getModel("DisplayPEP").getProperty("/Vkorg");
        } else {
          var Bukrs = this.getOwnerComponent().getModel("ModoApp").getProperty("/Vkbur");
        }

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

      onBusqOrdenesCabecera: function () {
        var Aufnr = this.getView().byId("f_codOrdCabecera").getValue();
        var Ktext = this.getView().byId("f_nomOrdCabecera").getValue();
        var Bukrs = this.getView().byId("f_ordbukrsCabecera").getValue();
        var Ceco = codceco;
        this.onBusqOrdenes(Aufnr, Ktext, Bukrs, Ceco);
      },

      onBusqOrdenesPosicion: function () {
        var Aufnr = this.getView().byId("f_codOrdPosicion").getValue();
        var Ktext = this.getView().byId("f_nomOrdPosicion").getValue();
        var Bukrs = this.getView().byId("f_ordbukrsPosicion").getValue();
        var Ceco = codcecoPos;
        this.onBusqOrdenes(Aufnr, Ktext, Bukrs, Ceco);
      },

      onBusqOrdenes: function (Aufnr, Ktext, Bukrs, Ceco) {
        /*
        var Aufnr = this.getView().byId("f_codOrd").getValue();
        var Ktext = this.getView().byId("f_nomOrd").getValue();
        var Bukrs = this.getView().byId("f_ordbukrs").getValue();
        */

        //var Bukrs = this.getOwnerComponent().getModel("ModoApp").getProperty("/Vkbur");
        /*
        var Ceco = codceco;
        */
        //var Bukrs = this.getView().byId("f_nifcAcr").getValue();

        var aFilterIds, aFilterValues, aFilters;

        //FILTRADO DE CLIENTES////////////////////////////////////////////////////////////////////////////////////////////

        aFilterIds = [
          "Aufnr",
          "Ktext",
          "Bukrs",
          "Ceco"
        ];
        aFilterValues = [
          Aufnr,
          Ktext,
          Bukrs,
          Ceco
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

        if (Ceco == "") {
          var i = aFilterIds.indexOf("Ceco");

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
        if (values[0].results.length > 0) {
          sap.ui.core.BusyIndicator.hide();
          var oModelOrdenes = new JSONModel();
          oModelOrdenes.setData(values[0].results);
          this.oComponent.setModel(oModelOrdenes, "listadoOrdenes");
          this.oComponent.getModel("listadoOrdenes").refresh(true);
        } else {
          sap.ui.core.BusyIndicator.hide();
          MessageBox.warning(this.oI18nModel.getProperty("noOrd"));
          //this.byId("ordDial").close();
        }
      },

      buildCecosModel: function (values) {
        if (values[0].results) {
          sap.ui.core.BusyIndicator.hide();
          var oModelCecos = new JSONModel();
          oModelCecos.setData(values[0].results);
          this.oComponent.setModel(oModelCecos, "listadoCecos");
          this.oComponent.getModel("ModoApp").setProperty("/cordenes", true);
          this.oComponent.getModel("ModoApp").refresh(true);
          this.oComponent.getModel("listadoCecos").refresh(true);
        }
      },



      /*onPressOrdenes: function (oEvent) {
        var ord = this.getSelectOrd(oEvent, "listadoOrdenes");
        codord = ord.Aufnr;
        nomord = ord.Ktext;
        this.getView().byId("f_ordenes").setValue(codord);
        //this.getView().byId("f_ordenesPOS").setValue(codord);

        this.oComponent.getModel("posPedFrag").setProperty("/Yaufnr", codord);
        this.oComponent.getModel("posPedFrag").refresh(true);

        this.byId("ordDial").close();

      },*/

      onPressOrdenesCabecera: function (oEvent) {
        var ord = this.getSelectOrd(oEvent, "listadoOrdenes");
        codord = ord.Aufnr;
        nomord = ord.Ktext;

        this.getView().byId("f_ordenes").setValue(codord);
        /*if (!this.getView().byId("f_ordenesPOS")){
          this.getView().byId("f_ordenes").setValue(codord);
        }else{
          this.getView().byId("f_ordenesPOS").setValue(codord);
        }*/
        //this.getView().byId("f_ordenesPOS").setValue(codord);

        //this.oComponent.getModel("posPedFrag").setProperty("/Yaufnr", codord);
        //this.oComponent.getModel("posPedFrag").refresh(true);
        this.getView().byId("f_codOrdCabecera").setValue(null);
        this.byId("ordDialCabecera").close();

      },
      onPressOrdenesPosicion: function (oEvent) {
        var ord = this.getSelectOrd(oEvent, "listadoOrdenes");
        codordPos = ord.Aufnr;
        nomordPos = ord.Ktext;

        this.getView().byId("f_ordenesPOS").setValue(codordPos);
        /*if(!this.getView().byId("f_ordenesPOS")){
          this.getView().byId("f_ordenesPOS").setValue(this.getView().byId("f_ordenes").getValue());
        }  */
        //this.getView().byId("f_ordenesPOS").setValue(codord);

        this.oComponent.getModel("posPedFrag").setProperty("/Yaufnr", codordPos);
        this.oComponent.getModel("posPedFrag").refresh(true);
        this.getView().byId("f_codOrdPosicion").setValue(null);
        this.byId("ordDialPosicion").close();

      },

      /*onPressCecos: function (oEvent) {
        var ceco = this.getSelectCeco(oEvent, "listadoCecos");
        codceco = ceco.Kostl;
        nomceco = ceco.Ltext;
        if (this.getView().byId("f_cecosPOS") != undefined) {
          this.getView().byId("f_cecosPOS").setValue(codceco);
        } else {
          this.getView().byId("f_cecos").setValue(codceco);
        }
        //this.getView().byId("f_cecos").setValue(codceco);
        //this.getView().byId("f_cecosPOS").setValue(codceco);
        this.oComponent.getModel("posPedFrag").setProperty("/Ykostl", codceco);
        this.oComponent.getModel("posPedFrag").refresh(true);
        this.byId("cecoDial").close();

      },*/

      onPressCecosCabecera: function (oEvent) {
        var ceco = this.getSelectCeco(oEvent, "listadoCecos");
        codceco = ceco.Kostl;
        nomceco = ceco.Ltext;

        //var cecospos = this.getView().byId("f_cecosPOS");
        this.getView().byId("f_cecos").setValue(codceco);

        //this.getView().byId("f_cecosPOS").setValue(codceco);
        //this.oComponent.getModel("posPedFrag").setProperty("/Ykostl", codceco);
        //this.oComponent.getModel("posPedFrag").refresh(true);
        this.getView().byId("f_codCecoCabecera").setValue(null);
        this.byId("cecoDialCabecera").close();

      },

      onPressCecosPosicion: function (oEvent) {
        var ceco = this.getSelectCeco(oEvent, "listadoCecos");
        codcecoPos = ceco.Kostl;
        nomcecoPos = ceco.Ltext;

        this.getView().byId("f_cecosPOS").setValue(codcecoPos);
        /*if(!this.getView().byId("f_cecosPOS")){
          this.getView().byId("f_cecosPOS").setValue(this.getView().byId("f_cecos").getValue());
        } */

        //this.getView().byId("f_cecosPOS").setValue(codceco);
        this.oComponent.getModel("posPedFrag").setProperty("/Ykostl", codcecoPos);
        this.oComponent.getModel("posPedFrag").refresh(true);
        this.getView().byId("f_codCecoPosicion").setValue(null);
        this.byId("cecoDialPosicion").close();

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
      CloseOrdDiagCabecera: function () {
        this.byId("ordDialCabecera").close();
      },

      CloseOrdDiagPosicion: function () {
        this.byId("ordDialPosicion").close();
      },

      CloseCecoDiagCabecera: function () {
        this.byId("cecoDialCabecera").close();
      },
      CloseCecoDiagPosicion: function () {
        this.byId("cecoDialPosicion").close();
      },
      errorFatal: function (e) {
        MessageBox.error(this.oI18nModel.getProperty("errFat"));
        sap.ui.core.BusyIndicator.hide();
      }
    });
  });