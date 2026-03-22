"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionsController = void 0;
const common_1 = require("@nestjs/common");
const create_execution_dto_1 = require("./dto/create-execution.dto");
const executions_service_1 = require("./executions.service");
let ExecutionsController = class ExecutionsController {
    executionsService;
    constructor(executionsService) {
        this.executionsService = executionsService;
    }
    createExecution(agentId, createExecutionDto, request) {
        return this.executionsService.createExecution(agentId, createExecutionDto, request);
    }
    listExecutions(agentId) {
        return this.executionsService.listExecutionsForAgent(agentId);
    }
    getExecution(executionId) {
        return this.executionsService.getExecution(executionId);
    }
};
exports.ExecutionsController = ExecutionsController;
__decorate([
    (0, common_1.Post)('agents/:id/executions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_execution_dto_1.CreateExecutionDto, Object]),
    __metadata("design:returntype", void 0)
], ExecutionsController.prototype, "createExecution", null);
__decorate([
    (0, common_1.Get)('agents/:id/executions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExecutionsController.prototype, "listExecutions", null);
__decorate([
    (0, common_1.Get)('executions/:executionId'),
    __param(0, (0, common_1.Param)('executionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExecutionsController.prototype, "getExecution", null);
exports.ExecutionsController = ExecutionsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [executions_service_1.ExecutionsService])
], ExecutionsController);
//# sourceMappingURL=executions.controller.js.map