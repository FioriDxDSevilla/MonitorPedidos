sap.ui.define([
  "sap/ui/core/mvc/Controller"
],

  function (Controller) {
    "use strict";

    return Controller.extend("monitorpedidos.controller.AltaPedidos", {

      onInit: function () {




      },


      /*ABRIR GESTOR DE ARCHIVOS*/

      handleUploadPress: function (oEvent) {
        //Inicializamos el modelo de adjunto 
        this.act_adj = null;

        var oMdesc = this.oComponent.getModel("datosAdj").getData();
        var desc = oMdesc.Desc;

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

      onAttFile: function (){

        var adjuntos = this.oComponent.getModel("AdjuntoSHPSet").getData();
        var oMdesc = this.oComponent.getModel("datosAdj").getData();
        var desc= oMdesc.Desc;

        if (!desc){
            MessageBox.error( this.oI18nModel.getProperty("errDesArch")); 
            return;
        }else if (!this.act_adj){
            MessageBox.error( this.oI18nModel.getProperty("errNoArch"));
            return;
        }else{

            this.act_adj.Descripcion= desc;
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
  }

    });
  });