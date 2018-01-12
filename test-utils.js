"use strict";
var chalk = require('chalk');
function desc(description, function_) {
    log(description);
    function_();
}
exports.desc = desc;
function log(message) {
    console.log('    ' + message + '.');
}
exports.log = log;
function printInfo(message) {
    log(chalk.green('○') + ' ' + message);
}
exports.printInfo = printInfo;
function printSuccess(message) {
    log(chalk.bold.green('✓') + ' ' + message);
}
exports.printSuccess = printSuccess;
function printError(message) {
    log(chalk.bold.red('✖') + ' ' + message);
}
exports.printError = printError;
function assert(condition, message) {
    if (!condition) {
        printError(message);
        process.exit(1);
    }
}
exports.assert = assert;

