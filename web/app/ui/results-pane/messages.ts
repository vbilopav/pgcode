import { ItemInfoType } from "app/api";

/*
import * as signalR from "libs/signalr/signalr.min.js";

(async () => {
    const connectionsHub = new signalR.HubConnectionBuilder().withUrl("/connectionsHub").build();
    if (connectionsHub.state != signalR.HubConnectionState.Connected) {
        await connectionsHub.start();
    }
    try{ 
        //const result1 = JSON.parse(await connectionsHub.invoke("GetConnection", "Denther", "Europe/Zagreb"));
        //console.log(result1);
        const result2 = await connectionsHub.invoke("GetInitial");
        console.log(result2);
    } catch (error) {
        console.log(error);
    }
})();
*/
/*
import { GrpcService, GrpcType, GrpcError } from "app/_sys/grpc-service";

(async () => {

    interface IInitialResponse { 
        connections: Array<IConnectionInfo>,
        user: string,
        version: string
    }
    
    interface IConnectionInfo {
        name: string, 
        version: string,
        host: string, 
        port: number, 
        database: string,
        user: string 
    }
    
    const service = new GrpcService();


    try {
        const result = await service.unaryCall({
            service: "/api.ConnectionService/GetInitial",
            request: [],
            reply: [
                {connections: [
                    {name: GrpcType.String}, 
                    {version: GrpcType.String},
                    {host: GrpcType.String},
                    {port: GrpcType.Int32},
                    {database: GrpcType.String},
                    {user: GrpcType.String}
                ]}, 
                {user: GrpcType.String}, 
                {version: GrpcType.String}
            ]
        }) as IInitialResponse;
        console.log(result);

    } catch (e) {
        let error = e as GrpcError;
        console.log(error.code);
    }
    

    const result = await service.unaryCall({
        service: "/api.ConnectionService/GetConnection",
        request: [GrpcType.String, GrpcType.String],
        reply: [GrpcType.String]
    }, "Denther", "Europe/Zagreb");

    console.log(result);

})();
*/

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
