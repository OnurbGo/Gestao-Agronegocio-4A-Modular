"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenApiProxyService = void 0;
const common_1 = require("@nestjs/common");
let OpenApiProxyService = class OpenApiProxyService {
    constructor() {
        this.coreUrl = process.env.CORE_OPENAPI_URL || "http://core-service:3000/openapi.json";
        this.escritorioUrl = process.env.ESCRITORIO_OPENAPI_URL ||
            "http://escritorio-service:3000/openapi.json";
    }
    getCoreSpec() {
        return this.fetchSpec(this.coreUrl, "Core");
    }
    getEscritorioSpec() {
        return this.fetchSpec(this.escritorioUrl, "Escritorio");
    }
    async fetchSpec(url, serviceName) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        }
        catch (error) {
            throw new common_1.ServiceUnavailableException(`Nao foi possivel carregar a documentacao do ${serviceName}.`);
        }
    }
};
exports.OpenApiProxyService = OpenApiProxyService;
exports.OpenApiProxyService = OpenApiProxyService = __decorate([
    (0, common_1.Injectable)()
], OpenApiProxyService);
