define(["require", "exports", "app/_sys/grpc-service"], function (require, exports, grpc_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const service = new grpc_service_1.GrpcService();
    const promise = service.unaryCall({
        service: "/test.TestService/HelloWorld",
        request: [grpc_service_1.GrpcType.String],
        reply: [grpc_service_1.GrpcType.String]
    }, "test");
    promise.then(r => console.log(r)).catch(e => console.log(e));
    class default_1 {
        constructor(id, element, data) {
            this.id = id;
            this.element = element;
            this.data = data;
        }
    }
    exports.default = default_1;
});
//# sourceMappingURL=messages.js.map