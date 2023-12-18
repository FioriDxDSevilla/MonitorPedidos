"use strict";

jQuery.sap.declare("monitorpedidos.model.Util");

monitorpedidos.model.Util = {
    createSearchFilterObject: function (aFilterIds, aFilterValues) {

        var aFilters = [],
            iCount;

        for (iCount = 0; iCount < aFilterIds.length; iCount = iCount + 1) {
            aFilters.push(new sap.ui.model.Filter(aFilterIds[iCount], "EQ", aFilterValues[iCount], ""));
        }
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
