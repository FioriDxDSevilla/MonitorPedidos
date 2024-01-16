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
    var codmat, nommat, codord, nomord, codceco, nomceco;
    return Controller.extend("monitorpedidos.controller.AltaPedidos", {

      onInit: function () {
        this.mainService = this.getOwnerComponent().getModel("mainService");
        this.oComponent = this.getOwnerComponent();
        this.oI18nModel = this.oComponent.getModel("i18n");


        var oModAdj = new JSONModel();
        var oModAdjSHP = new JSONModel();

        //this.oComponent.setModel(oModAdj, "datosAdj");
        //2º1this.oComponent.setModel(oModAdjSHP, "AdjuntoSHPSet");

        this.oComponent.setModel(new JSONModel([]), "datosAdj");
        this.oComponent.setModel(new JSONModel([]), "AdjuntoSHPSet");
        //this.condicionpago();
        this.motivopedido();
        this.NIApedido();
        this.DIRpedido();
        this.Plataformapedido();

      },

      fechahoy : function (){
        var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1; //January is 0!
                var yyyy = today.getFullYear();
                var today1 = (dd + ' ' + mm + ', ' + yyyy);
                //var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "YYYY/MM/DD" });   
                //var todayFormatted = dateFormat.format(today1);

                this.getView().byId("DTPfecha").setValue(today1);
      },
      /*ABRIR GESTOR DE ARCHIVOS*/

      handleUploadPress: function (oEvent) {
        //Inicializamos el modelo de adjunto 
        this.act_adj = null;

        var oMdesc = this.oComponent.getModel("datosAdj").getData();
        var desc = oMdesc.Desc;

        if (!desc || desc == undefined) {
          desc = this.getView().byId("descAdjunto").getValue();
        }

        /*if (!desc) {
            MessageBox.error(this.oI18nModel.getProperty("errDesArch"));
            this.getView().byId("fileUploader").setValue("");
            return;
        }*/

        var fileDetails = oEvent.getParameters("file").files[0];
        sap.ui.getCore().fileUploaderArr = [];

        if (fileDetails) {
          var mimeDet = fileDetails.type,
            fileName = fileDetails.name;
          //Calling method....
          var adjuntos = this.oComponent.getModel("AdjuntoSHPSet").getData();
          var nadj = adjuntos.length;
          this.base64conversionMethod(
            mimeDet,
            fileName,
            fileDetails,
            nadj,
            adjuntos,
            desc);
        } else {
          sap.ui.getCore().fileUploaderArr = [];
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
              "Descripcion": desc,
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
            "Descripcion": desc,
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


        var adjuntos = this.oComponent.getModel("AdjuntoSHPSet").getData();
        var oMdesc = this.oComponent.getModel("datosAdj").getData();
        var desc = oMdesc.Desc;

        if (!desc || desc == undefined) {
          MessageBox.error(this.oI18nModel.getProperty("errDesArch"));
          return;
        } else if (!this.act_adj) {
          MessageBox.error(this.oI18nModel.getProperty("errNoArch"));
          return;
        } else {

          this.act_adj.Descripcion = desc;
          adjuntos.push(this.act_adj);
          this.oComponent.getModel("AdjuntoSHPSet").refresh(true);
          this.getView().byId("descPresAdjunto").setValue("");
          this.getView().byId("fileUploader").setValue("");
          this.act_adj = null;
        }

      },

      /* Función para eliminar un adjunto de la tabla */

      onDeleteAdj: function (oEvent) {
        var oModAdj = this.oComponent.getModel("AdjuntoSHPSet");
        var adjs = oModAdj.getData();
        const sOperationPath = oEvent
          .getSource()
          .getBindingContext("AdjuntoSHPSet")
          .getPath();
        const sOperation = sOperationPath.split("/").slice(-1).pop;

        adjs.splice(sOperation, 1);
        this.oComponent.setModel(new JSONModel(adjs), "AdjuntoSHPSet");
      },

      onCrear: function () {

        var oJson;
        /*var cabecera = {},
            posiciones = [],
            pedidosClientes = [],
            pedidosCondicion = [],
            pedidosCantidad = [];*/
        var SolicitudPepCrSet = [];
        var SolicitudPedCondSet = [];
        var SolicitudPedQtySet = [];
        var obj = {};
        var objCond = {};
        var objQty = {};
        var Posiciones = this.getView().getModel("PedidoPos").getData();
        var results_array = Posiciones;
        var message;
        var crear = "Se ha creado la solicitud de Presupuesto: ";
        
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
        var DocType = this.oComponent.getModel("ModoApp").getData().Tipopedido;
        var SalesOrg = this.oComponent.getModel("ModoApp").getData().Vkbur;
        var DistrChan = this.oComponent.getModel("ModoApp").getData().CvCanal;
        var Division = this.oComponent.getModel("ModoApp").getData().CvSector;
        var SalesOff = this.getView().byId("idOficinaV").getSelectedKey();
        var BillBlock = "ZR";
        var Currency = this.getView().byId("idMoneda").getText();

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
        var PartnNumb = this.oComponent.getModel("ModoApp").getData().Codcli;
        
        //pedidosCondicion = this.oComponent.getModel("PedidoCond").getData(); 

        /*for (var i = 0; i < posiciones.length; i++) {
          pedidosCondicion.ItmNumber = posiciones[i].ItmNumber;
          pedidosCondicion.CondType = "PR00";
          pedidosCondicion.CondValue = posiciones[i].CondValue;
          pedidosCondicion.CondUnit = posiciones[i].SalesUnit;
          pedidosCondicion.Currency = posiciones[i].Currency;
        }*/
        
        /*pedidosCondicion.CondType = "PR00";
        pedidosCondicion.CondValue = "11,5";
        pedidosCondicion.CondUnit = "UN";
        pedidosCondicion.Currency = this.getView().byId("idMoneda").getText();*/

        //pedidosCantidad.ReqQty = "6";
        /*for (var i = 0; i < posiciones.length; i++) {
          pedidosCantidad.ItmNumber = posiciones[i].ItmNumber;
          pedidosCantidad.ReqQty = posiciones[i].ReqQty;
        }*/

        /*cabecera.posiciones = posiciones;
        cabecera.pedidosClientes = pedidosClientes;
        cabecera.pedidosCondicion = pedidosCondicion;
        cabecera.pedidosCantidad = pedidosCantidad;
        cabecera.RespuestaPedido = {};*/

        for (var i = 0; i < Posiciones.length; i++) {
          obj = {
              Secu: (i + 1).toString(),
              ItmNumber: results_array[i].ItmNumber,
              Material: results_array[i].Material,
              //Importe: results_array[i].Importe.toString(),
              SalesUnit: results_array[i].SalesUnit,
              Plant: '1001',
          };
          SolicitudPepCrSet.push(obj);
          obj = {};                
         }
         
         for (var i = 0; i < Posiciones.length; i++) {
          objCond = {
              Secu: (i + 1).toString(),
              ItmNumber: results_array[i].ItmNumber,
              CondValue: results_array[i].CondValue.toString(),
              CondType: 'PR00',
              CondUnit: results_array[i].SalesUnit,
              Currency: results_array[i].Currency,
          };
          SolicitudPedCondSet.push(objCond);
          objCond = {};                
         } 

         for (var i = 0; i < Posiciones.length; i++) {
          objQty = {
              Secu: (i + 1).toString(),
              ItmNumber: results_array[i].ItmNumber,
              ReqQty: results_array[i].ReqQty,
          };
          SolicitudPedQtySet.push(objQty);
          objQty = {};                
         } 
         
        
        oJson = {
          DocType: DocType,
          SalesOrg:  SalesOrg,
          DistrChan: DistrChan,
          Division:Division,
          SalesOff: SalesOff,
          BillBlock: BillBlock,
          Currency: Currency,
          PedidosClientesSet: {
            PartnRole: PartnRole,
            PartnNumb: PartnNumb,
          }, 
          PedidoPosicionSet: SolicitudPepCrSet,
          PedidoCondicionSet: SolicitudPedCondSet,
          RespuestaPedido: {
            //Idsolc: Idsolc,
          }
        };

        /*Promise.all([this.createDataEntity(this.mainService, "/PedidoCabSet", cabecera)]).then(
          this.resolveCreatePed.bind(this), this.errorFatal.bind(this));*/
        this.mainService.create("/PedidoCabSet", oJson, {
          success: function(result) {
            if (result.RespuestaPedido.Vbeln != "0") {
              message = crear + result.IdSolicitud01.Vbeln;
              if (result.RespuestaPedido.Mensaje) {
                message = result.RespuestaPedido.Mensaje + "\n" + message;
              }
              MessageBox.show(message, {
                icon: sap.m.MessageBox.Icon.SUCCESS,
                onClose: function(oAction) {
                  var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
                  oRouter.navTo("RouteMonitor");
                }
              })
            }
          }
        });
      },

      resolveCreatePed: function (result) {

        var message;
        var crear = this.oI18nModel.getProperty("txtCrea");
        var that = this;


        if (result[0].RespuestaPedido.Mensaje == "" && result[0].RespuestaPedido.Vbeln != "") {

          message = (result[0].RespuestaPedido.Mensaje + "\n" + crear + result[0].RespuestaPedido.Vbeln);
          MessageBox.show(message, {
            icon: sap.m.MessageBox.Icon.SUCCESS,
            onClose: function (oAction) {
              var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
              oRouter.navTo("RouteView1");
            }
          });
        }
      },

      addPedPos: function () {
        var num;
        var posiciones = [],
          cabecera = [];

        var posicion = this.oComponent.getModel("posPedFrag").getData();
        var omodApp = this.oComponent.getModel("ModoApp").getData().modeAlta;

        posiciones = this.oComponent.getModel("PedidoPos").getData();
        cabecera = this.oComponent.getModel("PedidoCab").getData();

        var aFilters = [],
          aFilterIds = [],
          aFilterValues = [];

        // Posicion Pedido  
        if (posicion.ItmNumber) {
          num = Util.zfill(posicion.ItmNumber, 8);
          aFilterIds.push("ItmNumber");
          aFilterValues.push(posicion.ItmNumber);
        }

        //Material
        if (posicion.Material) {
          aFilterIds.push("Material");
          aFilterValues.push(posicion.Material);
        }

        //Descripcion Material
        if (posicion.ShortText) {
          aFilterIds.push("ShortText");
          aFilterValues.push(posicion.ShortText);
        }
      
        //Fecha de Precio
        if (posicion.BillDate) {
          aFilterIds.push("BillDate");
          aFilterValues.push(posicion.BillDate);
        }

        //Precio posiciones
        if (posicion.CondValue) {
          aFilterIds.push("CondValue");
          aFilterValues.push(posicion.CondValue);
        }

        //Cantidad posicion
        if (posicion.ReqQty) {
          aFilterIds.push("ReqQty");
          aFilterValues.push(posicion.ReqQty);
        }

        //Moneda
        if (posicion.Currency) {
          aFilterIds.push("Currency");
          aFilterValues.push(posicion.Currency);
        }

        //Unidad
        if (posicion.SalesUnit) {
          aFilterIds.push("SalesUnit");
          aFilterValues.push(posicion.SalesUnit);
        }

        //Area de Venta
        if (posicion.Plant) {
          aFilterIds.push("Plant");
          aFilterValues.push(posicion.Plant);
        }

        //Centro de Coste
        if (posicion.Ykostl) {
          aFilterIds.push("Ykostl");
          aFilterValues.push(posicion.Ykostl);
        }

        //Orden de Ingreso
        if (posicion.Yaufnr) {
          aFilterIds.push("Yaufnr");
          aFilterValues.push(posicion.Yaufnr);
        }

        var posBACK = [];
        this.posicionesBackup = [];

        posiciones.forEach(function (Linea) {
          posBACK.push(Linea);
        });

        this.posicionesBackup = posBACK;
        this.posPedBackup = this.oComponent.getModel("ModoApp").getData().ItmNumber;
        this.totalPedido = this.oComponent.getModel("posPedFrag").getData().CondValue;

        var secu;

        if (posicion.mode === 'A') {
          secu = posicion.Secu;
      
        } else {
          secu = posiciones.length + 1;
 
        }

        //Mapeamos las posiciones
        var posicionN = {
          ItmNumber: posicion.ItmNumber,
          CondType: "PR00",
          SalesUnit: posicion.SalesUnit,
          Material: posicion.Material,
          ShortText: posicion.ShortText,
          BillDate: posicion.BillDate,
          ReqQty: posicion.ReqQty,
          Currency: posicion.Currency,
          CondValue: posicion.CondValue,
          Yaufnr: posicion.Yaufnr,
          Ykostl: posicion.Ykostl,
          //Zterm: condPago,
          //Secu: secu
        }

        if (posicion.mode === 'A') {
          posiciones.push(posicionN);

          if (posicion.type === "P") {
            var posSig = this.oComponent.getModel("ModoApp").getData().ItmNumber;

            posSig = posSig + 10;
            this.oComponent.getModel("ModoApp").setProperty("/posPed", posSig);
            this.oComponent.getModel("ModoApp").refresh(true);
          }

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
            //NUEVA Lógica de Secu para Modificar pedido
            /*if (modeApp == "M") {
                //Estamos modificando una pos creada
                if (!posicionN.modificabe) {
                    posicionN.Secu = posiciones[i].Secu;
                } else {
                    /**
                     * fmunozmorales - 19.04.23 - prueba secuencia
                     
                    //posicionN.Secu = secuModi;
                    secuModi = secuModi + 1;
                }

            } else {
                posicionN.Secu = secu;
            }*/
            posicionN.Secu = posiciones[i].Secu;
           
            //secuModi = secuModi + 1;
            posicionesN.push(posicionN);
            

            secu = secu + 1;
            sumTotal = (Number(sumTotal) + Number(posicionN.CondValue)).toFixed(2);
            //this.getView().byId("inputimport").setValue(sumTotal);
            var posAnt = posiciones[i].ItmNumber;
          }

          if (sumTotal == 0) {
            sumTotal = "0.00";
          }

          this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", sumTotal);
          this.oComponent.getModel("PedidoCab").refresh(true);

          var PosSigCre = posicionesN[posiciones.length - 1].Posnr;
          var posSig = this.oComponent.getModel("posPedFrag").getData().ItmNumber;
          posSig = PosSigCre + 10;
          //this.oComponent.getModel("ModoApp").setProperty("/posPed", posSig);
          //this.oComponent.getModel("ModoApp").setProperty("/secuModi", secuModi);
          //this.oComponent.getModel("ModoApp").refresh(true);

          var oModPos = new JSONModel();
     
          oModPos.setData(posicionesN);
         
          this.oComponent.getModel("PedidoPos").setProperty("/posSig", posSig);
          this.oComponent.setModel(oModPos, "PedidoPos");

        } else {

          this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", 0);
          this.oComponent.getModel("PedidoCab").refresh(true);

          var posSig = this.oComponent.getModel("posPedFrag").getData().ItmNumber;
          posSig = 10;
          this.oComponent.getModel("posPedFrag").setProperty("/posPed", posSig);
          //this.oComponent.getModel("posPedFrag").refresh(true);

          //this.oComponent.getModel("PedidoPos").refresh(true);
        }
        this.byId("pedPosDial").close();
      },


      onaddPosPed: function () {
        this._getDialogServicios();
      },

      cancelPedPos: function () {
        this.byId("pedPosDial").close();
      },

      onDeletePosPed: function (oEvent) {
        this.deletePosPed(oEvent, false, true);
      },

      deletePosPed: function (oEvent, serv, pos) {
        var oTable = this.getView().byId("TablaPosiciones")
        var oModel = this.getView().getModel("PedidoPos");
        var aRows = oModel.getData();
        var aContexts = oTable.getSelectedIndices(); //oTable.getSelectedContexts();
        var items = aContexts.map(function (c) {
          //return c.getObject();
          return this.oComponent.getModel("PedidoPos").getProperty("/" + c);
        }.bind(this));
        //var posIn = pos;

        if (items.length == 1) {

          var that = this;
          that.posIn = pos;
          /*//Seleccionamos la linea marcada
          for (var i = aContexts.length - 1; i >= 0; i--) {
          var oThisObj = aContexts[i].getObject();
          var index = $.map(aRows, function(obj, index) {
              if (obj === oThisObj) {
                  return index;
          }});
          }*/
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

            /*if (!this.oApproveDialog) {
              this.oApproveDialog = new Dialog({
                type: DialogType.Message,
                title: this.oI18nModel.getProperty("delPos"),
                content: new sap.m.Text({
                  text: that.ques
                }), //ques
                beginButton: new sap.m.Button({
                  type: ButtonType.Emphasized,
                  text: "Si",
                  press: function () {
                    if (that.posIn) {
                      //Estamos eliminando una Posición y eliminaremos todos los servicios
                      that.deletePosTable(that.Posnr, false, that); //(selrow.Posnr, false , that);
                    } else {
                      //Eliminamos solo el servicio marcado
                      that.deletePosTable(false, that.indice, that) //( false, indice ,that);
                    }
                    that.oApproveDialog.destroy(true);
                    that.oApproveDialog = null;
                    //this.oComponent.getModel("PedidoPos").refresh(true);
                  }.bind(this)
                }),
                endButton: new sap.m.Button({
                  text: "Cancelar",
                  press: function () {
                    this.oApproveDialog.close();
                  }.bind(this)
                })
              });
              this.oApproveDialog.open();
            }*/
            //this.oApproveDialog.open();
            that.deletePosTable(that.ItmNumber, false, that);
          }
        } else {
          MessageBox.error(this.oI18nModel.getProperty("errpedPosUn"));
        }
      },

      deletePosTable: function (posPed, posTab, that) {
        var posped = that.getView().getModel("PedidoPos").getData();
        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;

        if (!posPed) {

          //Si estamos eliminando una posición "padre" que no es la ultima
          if (posped[posTab].PosnrT && posped.length > 1 && posTab + 1 < posped.length) {

            if (posped[posTab + 1].Posnr === posped[posTab].PosnrT) {
              posped[posTab + 1].PosnrT = posped[posTab].PosnrT;
            }

          }
          //posped.splice(posTab, 1);
          //NUEVA Logica de borrado
          if (modeApp != "A" || posped[posTab].modificabe) {
            posped.splice(posTab, 1);
          } else {
            posped[posTab].iconoB = "sap-icon://delete";
            posped[posTab].iconoM = true;
            posped[posTab].Loekz = "L";
          }

        } else if (!posTab) {

          for (var i = posped.length - 1; i >= 0; i--) {

            if (posped[i].Posnr == posPed) {
              //posped.splice(i, 1);
              //NUEVA Logica de borrado
              /**
               * fmunozmorales - 13.04.23 - Logica borrado en copia de pedidos
               */
              //if (modeApp != "M" || posped[i].modificabe) {
              //if (modeApp != "M" && posped[i].modificabe) {
              //if (modeApp != "M" && !posped[i].modificabe) {
              /**
               * 24.04.23 - fmunozmorales - DP - Mejoras Fiori V.1
               */
              if (modeApp != "A") {
                posped.splice(i, 1);
                /*} else if (modeApp != "M" && posped[i].modificabe) {
                  posped.splice(i, 1);*/
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
              //  Promise.all([this.callFunctionEntity(this.mainService, "/DepartamentoByPep", oJson)]).then(
              //    this.calculaDptbyPosid.bind(this), this.errorFatal.bind(this));
            }

          } else {
            // Si no hay posiciones, se limpia el departamento.
            //this.oComponent.getModel("PedidoCab").setProperty("/Ekgrp", "");
            //var CEkgrp = that.getView().byId("idDptPed");
            //CEkgrp.setEditable(false);
          }

        }

      },


      _getDialogServicios: function (sInputValue) {

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
      },

      onBusqMateriales: function () {
        this.dameMateriales();
      },
      dameMateriales: function () {
        var Matnr = this.getView().byId("f_codMat").getValue();
        var Maktx = this.getView().byId("f_nomMat").getValue();
        var Matkl = this.getView().byId("f_grArt").getValue();

        var aFilterIds, aFilterValues, aFilters;

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
      onValueHelpOrd: function (oEvent) {
        //this.Dialog = sap.ui.xmlfragment("aguasdevalencia.fragment.ClienteMonitorPedidos", this);
        //this.Dialog.open();
        this._getDialogOrdenes();
      },

      onValueHelpCecos: function (oEvent) {
        //this.Dialog = sap.ui.xmlfragment("aguasdevalencia.fragment.ClienteMonitorPedidos", this);
        //this.Dialog.open();
        this._getDialogCecos();
      },
      _getDialogOrdenes: function (sInputValue) {
        var oView = this.getView();

        if (!this.pDialogOrdenes) {
          this.pDialogOrdenes = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragments.OrdenPedIngreso",
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
            name: "monitorpedidos.fragments.CecoPedIngreso",
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

      onBusqOrdenes: function () {
        var Aufnr = this.getView().byId("f_codOrd").getValue();
        var Ktext = this.getView().byId("f_nomOrd").getValue();
        //var Bukrs = this.getView().byId("f_ordbukrs").getValue();
        var Bukrs = this.getOwnerComponent().getModel("ModoApp").getProperty("/Vkbur");
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

      motivopedido: function () {
        var Auart = this.getOwnerComponent().getModel("ModoApp").getData().Tipopedido;
        var Vkorg = this.getOwnerComponent().getModel("ModoApp").getData().Vkbur; //Vkbur es la organiz. ventas en ModoApp
        var aFilters = [],
          aFilterIds = [],
          aFilterValues = [];

        aFilterIds = ["Auart", "Vkorg"];
        aFilterValues = [Auart, Vkorg];
  

        aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


        Promise.all([
          this.readDataEntity(this.mainService, "/MotivosPedidoSet", aFilters),
        ]).then(this.buildMotivo.bind(this), this.errorFatal.bind(this));

      },

      buildMotivo: function (values) {
        if (values[0].results) {
          var oModelMotivo = new JSONModel();
          oModelMotivo.setData(values[0].results);
          this.oComponent.setModel(oModelMotivo, "listadoMotivo");
          this.oComponent.getModel("listadoMotivo").refresh(true);
        }
      },

      NIApedido: function () {
        var Kunnr = this.getOwnerComponent().getModel("ModoApp").getData().Codcli;
        var Bukrs = this.getOwnerComponent().getModel("ModoApp").getData().Vkbur; //Vkbur es la organiz. ventas en ModoApp
        var aFilters = [],
          aFilterIds = [],
          aFilterValues = [];

        aFilterIds = ["Kunnr", "Bukrs"];
        aFilterValues = [Kunnr, Bukrs];
  

        aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


        Promise.all([
          this.readDataEntity(this.mainService, "/DatosNIASet", aFilters),
        ]).then(this.buildNIA.bind(this), this.errorFatal.bind(this));

      },

      buildNIA: function (values) {
        if (values[0].results) {
          var oModelNIA = new JSONModel();
          oModelNIA.setData(values[0].results);
          this.oComponent.setModel(oModelNIA, "listadoNIA");
          this.oComponent.getModel("listadoNIA").refresh(true);
        }
      },

      DIRpedido: function () {
        var Kunnr = this.getOwnerComponent().getModel("ModoApp").getData().Codcli;
        var Bukrs = this.getOwnerComponent().getModel("ModoApp").getData().SocPed; //SocPed es el código de sociedad en ModoApp
        var aFilters = [],
          aFilterIds = [],
          aFilterValues = [];

        aFilterIds = ["Kunnr", "Bukrs"];
        aFilterValues = [Kunnr, Bukrs];
  

        aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


        Promise.all([
          this.readDataEntity(this.mainService, "/CamposDIRSet", aFilters),
        ]).then(this.buildDIR.bind(this), this.errorFatal.bind(this));

      },

      buildDIR: function (values) {
        if (values[0].results) {
          var oModelDIR = new JSONModel();
          oModelDIR.setData(values[0].results);
          this.getView().byId("f_DIRorgest").setValue(values[0].results[0].Centges);
          this.getView().byId("f_DIRuni").setValue(values[0].results[0].Centuni);
          this.getView().byId("f_DIRofcont").setValue(values[0].results[0].Centpro);
          this.getView().byId("f_DIRadm").setValue(values[0].results[0].Codadm);
        }
      },

      Plataformapedido: function () {
        var Kunnr = this.getOwnerComponent().getModel("ModoApp").getData().Codcli;
        var Bukrs = this.getOwnerComponent().getModel("ModoApp").getData().SocPed; //SocPed es el código de sociedad en ModoApp
        var aFilters = [],
          aFilterIds = [],
          aFilterValues = [];

        aFilterIds = ["Kunnr", "Bukrs"];
        aFilterValues = [Kunnr, Bukrs];
  

        aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


        Promise.all([
          this.readDataEntity(this.mainService, "/DamePlataformaSet", aFilters),
        ]).then(this.buildPlataforma.bind(this), this.errorFatal.bind(this));

      },

      buildPlataforma: function (values) {
        if (values[0].results) {
          var oModelPlataforma = new JSONModel();
          oModelPlataforma.setData(values[0].results);
          this.getView().byId("f_Plataforma").setValue(values[0].results[0].Plataforma);

        }
      },

      onPressOrdenes: function (oEvent) {
        var ord = this.getSelectOrd(oEvent, "listadoOrdenes");
        codord = ord.Aufnr;
        nomord = ord.Ktext;
        this.getView().byId("f_ordenes").setValue(codord);

        this.oComponent.getModel("posPedFrag").setProperty("/Yaufnr", codord);
        this.oComponent.getModel("posPedFrag").refresh(true);

        this.byId("ordDial").close();

      },

      onPressCecos: function (oEvent) {
        var ceco = this.getSelectCeco(oEvent, "listadoCecos");
        codceco = ceco.Kostl;
        nomceco = ceco.Ltext;
        this.getView().byId("f_cecos").setValue(codceco);
        this.oComponent.getModel("posPedFrag").setProperty("/Ykostl", codceco);
        this.oComponent.getModel("posPedFrag").refresh(true);
        this.byId("cecoDial").close();

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
      CloseOrdDiag: function () {
        this.byId("ordDial").close();
      },

      CloseCecoDiag: function () {
        this.byId("cecoDial").close();
      },
      errorFatal: function (e) {
        MessageBox.error(this.oI18nModel.getProperty("errFat"));
        sap.ui.core.BusyIndicator.hide();
      }
    });
  });