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

  function (Controller, JSONModel, Fragment, History, Filter, FilterOperator, Util, MessageBox, ExportTypeCSV, Export, exportLibrary) {
    "use strict";
    var codmat, nommat, codord, nomord, codceco, nomceco;
    return Controller.extend("monitorpedidos.controller.AltaPedidos", {

      onInit: function () {
        this.mainService = this.getOwnerComponent().getModel("mainService");
        this.oComponent = this.getOwnerComponent();
        this.oI18nModel = this.oComponent.getModel("i18n");

        var oModAdj = new JSONModel();
        var oModAdjSHP = new JSONModel();

        this.oComponent.setModel(oModAdj, "datosAdj");
        this.oComponent.setModel(oModAdjSHP, "AdjuntoSHPSet");
        this.condicionpago();

      },

      condicionpago: function () {
        var kunnr = this.getOwnerComponent().getModel("ModoApp").getProperty("/Codcli");
        var Vkorg = this.getOwnerComponent().getModel("ModoApp").getProperty("/Vkbur");
        var aFilters = [],
          aFilterIds = [],
          aFilterValues = [];

        aFilterIds = ["Vkorg"];
        aFilterValues = [Vkorg];
        aFilterIds = ["Kunnr"];
        aFilterValues = [kunnr];

        aFilters = Util.createSearchFilterObject(aFilterIds, aFilterValues);


        Promise.all([
          this.readDataEntity(this.mainService, "/CondicionPagoSet", aFilters),
        ]).then(this.buildCondicion.bind(this), this.errorFatal.bind(this));

      },

      buildCondicion: function (values) {
        if (values[0].results) {
          var oModelCondicion = new JSONModel();
          oModelCondicion.setData(values[0].results);
          this.oComponent.setModel(oModelCondicion, "listadoCondicion");
          this.oComponent.getModel("listadoCondicion").refresh(true);
        }
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
        var posiciones = [],
          posicion;
        var cabecera = Object.assign({}, this.oComponent.getModel("PedidoCab").getData()),
          posiciones = this.oComponent.getModel("PedidoPos").getData(),
          condiciones = [],
          clientes = [];
        
        cabecera.Erdat = this.getView().byId("fechaAltaPed").getValue();
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
        cabecera.FechaApro = "\/Date(" + fechihd + ")\/";

        cabecera.PedidoPosSet = posiciones;
        cabecera.RespuestaPedido = {};

        Promise.all([this.createDataEntity(this.mainService, "/PedidoCabSet", cabecera)]).then(
          this.resolveCreatePed.bind(this), this.errorFatal.bind(this));
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
        /* var num;
        var posicion = this.oComponent.getModel("posPedFrag").getData();
        var posiciones = this.oComponent.getModel("PedidoPos").getData();
        var cabecera = this.oComponent.getModel("PedidoCab").getData();
        var omodApp = this.oComponent.getModel("ModoApp").getData().mode;
        var aFilters = [],
          aFilterIds = [],
          aFilterValues = [];

        if (posicion.Posnr) {
          num = Util.zfill(posicion.Posnr, 6);
          aFilterIds.push("Posnr");
          aFilterValues.push(posicion.Posnr);

        }
        if (posicion.Matnr) {
          aFilterIds.push("Matnr");
          aFilterValues.push(posicion.Matnr);
        }
        if (posicion.Matwa) {
          aFilterIds.push("Matwa");
          aFilterValues.push(posicion.Matwa);
        }
        if (posicion.Netwr) {
          aFilterIds.push("Netwr");
          aFilterValues.push(posicion.Netwr);
        }
        if (posicion.Arktx) {
          aFilterIds.push("Arktx");
          aFilterValues.push(posicion.Arktx);
        }
        var posBACK = [];
        this.posicionesBackup = [];
    

        for (var i = 0; i < posiciones.length; i++) {
          posBACK.push(posiciones);
          
        }
        
        this.posicionesBackup = posBACK;
        this.posPedBackup = this.oComponent.getModel("ModoApp").getData().posPed;
        this.totalPedido = this.oComponent.getModel("posPedFrag").getData().ImpPedido;
        var secu;
        if (posicion.mode === 'A') {
          secu = posicion.Secu;
        } else {
          secu = posiciones.length + 1;
        }

        var posicionN = {
          Posnr: posicion.Posnr,
          Matnr: posicion.Matnr,
          Matwa: posicion.Matwa,
          Netwr: posicion.Netwr,
          Arktx: posicion.Arktx
        }

        if (posicion.mode === 'A') {

         // posiciones.push(posicionN);


          if (posicion.type === "P") {
            var posSig = this.oComponent.getModel("ModoApp").getData().posPed;
            posSig = posSig + 10;
            this.oComponent.getModel("ModoApp").setProperty("/posPed", posSig);
            this.oComponent.getModel("ModoApp").refresh(true);
          }
        
        }

        this.ordenaPedPos(true);*/
        /*var error = this.validaForm("pedPosDial");

        if (error !== "") {
          MessageBox.error(this.oI18nModel.getProperty("errObliPed"));
        } else {
          sap.ui.core.BusyIndicator.show();
          var posicion = this.oComponent.getModel("PosPedFrag").getData();
          var cabecera = this.oComponent.getModel("PedidoCab").getData();

          //Se comprueba el valor de la cantidad
          var regex = "^[0-9]\\d{0,9}(,\\d{0,2})?$";
          var cantidad = posicion.Reqty;

          if (!cantidad.match(regex)) {
            MessageBox.error(this.oI18nModel.getProperty("errForNum"));
            sap.ui.core.BusyIndicator.hide();
            return;
          }

          posicion.Reqty = posicion.Reqty.replace(/,/g,'.');

          //Se validan los datos de posición
          var aFilters = [],
              aFilterIds = [],
              aFilterValues = [];
          
          if (posicion.Vbeln) {
            aFilterIds.push("Vbeln");
            aFilterValues.push(posicion.Vbeln);
          }

          if (posicion.Maktx) {
            aFilterIds.push("Maktx");
            aFilterValues.push(posicion.Maktx);
          }

          if (posicion.Matnr) {
            aFilterIds.push("Matnr");
            aFilterValues.push(posicion.Matnr);
          }

          if (posicion.CondDay) {
            aFilterIds.push("CondDay");
            aFilterValues.push(posicion.CondDay);
          }

          if (posicion.Netwr) {
            aFilterIds.push("Netwr");
            aFilterValues.push(posicion.Netwr);
          }

          if (posicion.Reqty) {
            aFilterIds.push("Reqty");
            aFilterValues.push(posicion.Reqty);
          }

          if (posicion.Waers) {
            aFilterIds.push("Waers");
            aFilterValues.push(posicion.Waers);
          }

          if (posicion.Yaufnr) {
            aFilterIds.push("Yaufnr");
            aFilterValues.push(posicion.Yaufnr);
          }

          if (posicion.Ykostl) {
            aFilterIds.push("Ykostl");
            aFilterValues.push(posicion.Ykostl);
          }

          var oJsonPosPed;

          if (posicion.posPed == 10) {
            oJsonPosPed = posicion.posPed
          } else {
            oJsonPosPed = "";
          }

          var oJson = {
            POSID: oJsonPosPed
          }
          }*/

        var posicion = this.oComponent.getModel("posPedFrag").getData();
        //var posiciones = this.oComponent.getModel("PedidoPos").getData();
        var posiciones = [];

        var posBACK = [];
        this.posicionesBackup = [];

        /*posiciones.forEach(function (Linea) {
          posBACK.push(Linea);
        });*/

        //Hacemos un backup de posicion SIG
        this.posicionesBackup = this.oComponent.getModel("ModoApp").getData().posPed;
        this.totalPedido = this.oComponent.getModel("PedidoCab").getData().ImpPedido;

        var maktx = this.getView().byId("f_nommat").getValue();

        //Calculamos la secuencia
        var secu;
        if (posicion.mode === 'M') {
          secu = posicion.Secu;
        } else {
          secu = posiciones.length + 1;
        }

        //Mapeamos las posiciones
        var posicionN = {
          Vbelp: posicion.Vbelp,
          CondTyp: "PR00",
          SalesUniT: "UN",
          Txz01: posicion.Txz01,
          Posid: posicion.Posid,
          MatServ: posicion.Matnr,
          Maktx: maktx,
          CondDay: posicion.CondDay,
          Netwr: posicion.Netwr,
          Reqty: posicion.Reqty,
          Waers: posicion.Waers,
          Yaufnr: posicion.Yaufnr,
          Ykostl: posicion.Ykostl,
          //Zterm: condPago,
          Secu: secu
        }

        if (posicion.mode === 'A') {
          posiciones.push(posicionN);
          var posSig = this.oComponent.getModel("ModoApp").getData().posPed;
          posSig = posSig + 10;
          this.oComponent.getModel("ModoApp").setProperty("/posPed", posSig);
          this.oComponent.getModel("ModoApp").refresh(true);
        }

        //Se ordena la tabla por Vbelp y Secu
        posiciones.sort(function (a, b) {
          //return a.Ebelp.toString().localeCompare(b.Ebelp.toString()) || a.Secu.toString().localeCompare(b.Secu.toString());
          return a.Vbelp > b.Vbelp || a.Secu > b.Secu;
        });

        this.oComponent.getModel("PedidoPos").setData(posiciones);
        this.ordenaPedPos(false);


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
        var modeApp = this.oComponent.getModel("ModoApp").getData().mode;
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

              posicionN.Vbelp = posInicial;
              //posicionN.PosnrT = posInicial;
              //posicionN.Secu      = secu;
            } else {

              if (posiciones[i].Vbelp == posAnt) {

                posicionN.Vbelp = posicionesN[i - 1].Vbelp;
                //posicionN.PosnrT = "";
                //posicionN.Secu      = secu;//posicionesN[i-1].Secu + 1;
              } else {

                posicionN.Vbelp = posicionesN[i - 1].Vbelp + 10;
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
            sumTotal = (Number(sumTotal) + Number(posicionN.Netwr)).toFixed(2);
            //this.getView().byId("inputimport").setValue(sumTotal);
            var posAnt = posiciones[i].Vbelp;
          }

          if (sumTotal == 0) {
            sumTotal = "0.00";
          }

          this.oComponent.getModel("PedidoCab").setProperty("/ImpPedido", sumTotal);
          this.oComponent.getModel("PedidoCab").refresh(true);

          var PosSigCre = posicionesN[posiciones.length - 1].Vbelp;
          var posSig = this.oComponent.getModel("posPedFrag").getData().Vbelp;
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

          var posSig = this.oComponent.getModel("posPedFrag").getData().posPed;
          posSig = 10;
          this.oComponent.getModel("posPedFrag").setProperty("/posPed", posSig);
          //this.oComponent.getModel("posPedFrag").refresh(true);

          this.oComponent.getModel("PedidoPos").refresh(true);
        }
        this.byId("pedPosDial").close();
      },

      onaddPosPed: function () {
        this._getDialogServicios();
      },

      cancelPedPos: function () {
        this.byId("pedPosDial").close();
      },
      _getDialogServicios: function (sInputValue) {
        /*var oView = this.getView();
        var posPed = this.oComponent.getModel("ModoApp").getData().posPed;
        var config = {
          mode: "A",
          type: "P",
          Vbeln: posPed,
        }
        var oModConfig = new JSONModel();
        oModConfig.setData(config);

        this.oComponent.setModel(oModConfig, "posPedFrag");

        if (!this.aDialog) {
          this.aDialog = Fragment.load({
            id: oView.getId(),
            name: "monitorpedidos.fragment.AddPosicionesPed",
            controller: this,
          }).then(function (bDialog) {
            oView.addDependent(bDialog);
            return bDialog;
          });
        }
        this.aDialog.then(function (bDialog) {
          var that = this;
          bDialog.open(sInputValue);
          // that.dameServicios(that.mainService);

        });*/
        var oView = this.getView();
        var posPed = this.oComponent.getModel("ModoApp").getData().posPed;
        var config = {
          mode: "A",
          type: "P",
          Vbeln: posPed,
          //Mwskz: this.oComponent.getModel("Impuestos").getData()[0].Value
        }
        var oModPosiciones = new JSONModel();
        var oModCabecera = new JSONModel();
        var oModPedFragment = new JSONModel();
        oModPedFragment.setData(config);

        this.oComponent.setModel(oModPedFragment, "posPedFrag");
        this.oComponent.setModel(oModPosiciones, "PedidoPos");
        this.oComponent.setModel(oModCabecera, "PedidoCab");

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