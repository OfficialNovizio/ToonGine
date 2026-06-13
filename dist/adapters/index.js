"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMCPClient = exports.syncWithHermes = exports.getConfig = void 0;
// src/adapters/index.ts — Barrel export for toongine/adapters
var config_1 = require("./config");
Object.defineProperty(exports, "getConfig", { enumerable: true, get: function () { return config_1.getConfig; } });
var hermes_sync_1 = require("./hermes-sync");
Object.defineProperty(exports, "syncWithHermes", { enumerable: true, get: function () { return hermes_sync_1.syncWithHermes; } });
var mcp_client_1 = require("./mcp-client");
Object.defineProperty(exports, "createMCPClient", { enumerable: true, get: function () { return mcp_client_1.createMCPClient; } });
//# sourceMappingURL=index.js.map