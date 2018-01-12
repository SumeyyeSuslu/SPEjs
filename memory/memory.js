"use strict";
var Memory = (function () {
    function Memory() {
        this.elements = [];
    }
    Memory.prototype.add = function (name, content) {
        var el = {};
        var hasProperty_ = this.hasProperty(name);
        if (hasProperty_.hasProperty) {
            this.elements[hasProperty_.index].content = content;
        }
        else {
            this.elements.push({
                'name': name,
                'content': content
            });
        }
    };
    Memory.prototype.hasProperty = function (name) {
        var retValue = {
            'content': '',
            'hasProperty': false,
            'index': -1
        };
        for (var k = (this.elements.length - 1); k >= 0; k--) {
            if (this.elements[k].name === name) {
                retValue.content = this.elements[k].content;
                retValue.hasProperty = true;
                retValue.index = k;
                break;
            }
        }
        return retValue;
    };
    return Memory;
}());
module.exports = Memory;
