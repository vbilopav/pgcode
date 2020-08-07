import { ItemInfoType } from "app/api";
import { GrpcService, GrpcType } from "app/_sys/grpc-service";


    const service = new GrpcService();

    const promise = service.unaryCall({
        service: "/test.TestService/HelloWorld",
        request: [GrpcType.String],
        reply: [GrpcType.String]
    }, "test");

    promise.then(r => console.log(r)).catch(e => console.log(e));



export default class  {
    private readonly id: string;
    private readonly element: Element;
    private readonly data: ItemInfoType;

    constructor(id: string, element: Element, data: ItemInfoType) {
        this.id = id;
        this.element = element;
        this.data = data;
    }
}
