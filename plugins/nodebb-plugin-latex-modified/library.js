"use strict";
exports.__esModule = true;
var katex = require("katex");
module.exports.parse = function (data, callback) {
    if (!data || !data.postData || !data.postData.content) {
        return callback(null, data);
    }
    var block = /\$\$([\s\S]*?)\$\$/g;
    var inline = /\$([\s\S]*?)\$/g;
    var replaceBlock = function (match, p1, offset, string) {
        return katex.renderToString(p1, { displayMode: true });
    };
    var replaceInline = function (match, p1, offset, string) {
        return katex.renderToString(p1, { displayMode: false });
    };
    try {
        data.postData.content = data.postData.content.replace(block, replaceBlock).replace(inline, replaceInline);
    }
    catch (a) {
    }
    callback(null, data);
};
