"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  toInitialUpperCase: function toInitialUpperCase(str) {
    return str.substring(0, 1).toUpperCase() + str.substring(1);
  },
  toInitialLowerCase: function toInitialLowerCase(str) {
    return str.substring(0, 1).toLowerCase() + str.substring(1);
  }
};