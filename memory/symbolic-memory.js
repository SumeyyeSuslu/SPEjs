"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Memory = require('./memory');
var SymbolicMemory = (function (_super) {
    __extends(SymbolicMemory, _super);
    function SymbolicMemory() {
        _super.apply(this, arguments);
    }
    return SymbolicMemory;
}(Memory));
module.exports = SymbolicMemory;
