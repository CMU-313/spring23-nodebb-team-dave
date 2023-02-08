"use strict";
import * as katex from 'katex';

module.exports.parse = function(data: any, callback: (err: any, data: any) => void) {
    if(!data || !data.postData || !data.postData.content) {
        return callback(null, data);
    }

    const block = /\$\$([\s\S]*?)\$\$/g;
    const inline = /\$([\s\S]*?)\$/g;

    const replaceBlock = function(match: string, p1: string, offset: number, string: string) {
        return katex.renderToString(p1, {displayMode: true});
    };
    const replaceInline = function(match: string, p1: string, offset: number, string: string) {
        return katex.renderToString(p1, {displayMode: false});
    }
    try {
        data.postData.content = data.postData.content.replace(block, replaceBlock).replace(inline, replaceInline);
    } catch(a) {

    }

    callback(null, data);
};
