"use strict";

jQuery.sap.declare("monitorpedidos.model.Util");

monitorpedidos.model.Util = {
    createSearchFilterObject: function (aFilterIds, aFilterValues) {

        var aFiltersAND = [];
        
        for (let i = 0; i < aFilterIds.length; i++) {
            // Si es un array, se establecen condiciones OR
            if(Array.isArray(aFilterValues[i])){
                var aFiltersOR = []
                for (var j = 0; j < aFilterValues[i].length; j++) {
                    aFiltersOR.push(new sap.ui.model.Filter(aFilterIds[i], "EQ", aFilterValues[i][j], ""));
                }
                if (aFiltersOR.length > 0) {
                    aFiltersAND.push(new sap.ui.model.Filter(
                        {
                            filters: aFiltersOR,
                            and: false
                        }
                    ));    
                }
                //oFilters.push(newsap.ui.model.Filter({filters:[newsap.ui.model.Filter("code", sap.ui.model.FilterOperator.EQ, oItem.code),newsap.ui.model.Filter("referencenumber", sap.ui.model.FilterOperator.EQ, oItem.referencenumber)],and: true})});
            }else{ // Si no es un array, se establce una condición AND
                aFiltersAND.push(new sap.ui.model.Filter(aFilterIds[i], "EQ", aFilterValues[i], ""));
            }
        }
        var aFilters = new sap.ui.model.Filter({ filters: aFiltersAND, and: true });
        return aFilters;
    },

    zfill: function (number, width) {
        var numberOutput = Math.abs(number); /* Valor absoluto del número */
        var length = number.toString().length; /* Largo del número */
        var zero = "0"; /* String de cero */

        if (width <= length) {
            if (number < 0) {
                return "-" + numberOutput.toString();
            } else {
                return numberOutput.toString();
            }
        } else {
            if (number < 0) {
                return "-" + zero.repeat(width - length) + numberOutput.toString();
            } else {
                return zero.repeat(width - length) + numberOutput.toString();
            }
        }
    },
    convertFromStringToDate: function (responseDate) {
                let dateComponents = responseDate.split('T');
                let datePieces = dateComponents[0].split("/");
                let timePieces = dateComponents[1].split(":");
                // return (new Date(datePieces[2], (datePieces[1] - 1), datePieces[0],
                //     timePieces[0], timePieces[1], timePieces[2]))
                return (new Date(datePieces[2], (datePieces[1] - 1), datePieces[0],
                    timePieces[0], timePieces[1], timePieces[2]));
    },
    formatTime: function (time){

        var seconds = time.getSeconds().toString() ,
        minutes = time.getMinutes().toString(),
        hours = time.getHours().toString();

        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
                
        var timeOut =  hours + minutes + seconds ;

        return timeOut;

    }  
}
