/*global QUnit*/

sap.ui.define([
	"monitorpedidos/controller/MonitorPedidos.controller"
], function (Controller) {
	"use strict";

	QUnit.module("MonitorPedidos Controller");

	QUnit.test("I should test the MonitorPedidos controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
