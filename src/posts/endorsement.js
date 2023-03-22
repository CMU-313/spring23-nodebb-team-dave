"use strict";
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : adopt(result.value).then(fulfilled, rejected);
            }
            step(
                (generator = generator.apply(thisArg, _arguments || [])).next()
            );
        });
    };
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../database");
const plugins = require("../plugins");
module.exports = function (Posts) {
    Posts.hasEndorsed = function (pid) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return (
                (yield db.getObjectField(`post:${pid}`, "endorsed")) === "true"
            );
        });
    };
    function toggleEndorsement(type, pid) {
        return __awaiter(this, void 0, void 0, function* () {
            const isEndorsing = type === "endorse";
            const [postData, hasEndorsed] = yield Promise.all([
                Posts.getPostFields(pid, ["pid", "endorsed"]),
                Posts.hasEndorsed(pid),
            ]);
            if (isEndorsing && hasEndorsed) {
                throw new Error("[[error:already-endorsed]]");
            }
            if (!isEndorsing && !hasEndorsed) {
                throw new Error("[[error:already-unendorsed]]");
            }
            postData.endorsed = postData.endorsed === "true" ? "false" : "true";
            yield Posts.setPostField(pid, "endorsed", postData.endorsed);
            plugins.hooks
                .fire(`action:post.${type}`, {
                    pid: pid,
                    current: hasEndorsed ? "endorsed" : "unendorsed",
                })
                .catch((err) => {
                    console.error("Error setting post field:", err);
                    throw new Error("[[error:unknown]]");
                });
            return {
                post: postData,
                isEndorsed: isEndorsing,
            };
        });
    }
    Posts.endorse = function (pid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield toggleEndorsement("endorse", pid);
        });
    };
    Posts.unendorse = function (pid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield toggleEndorsement("unendorse", pid);
        });
    };
};
