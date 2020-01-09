import { publish, SET_APP_STATUS } from "app/_sys/pubsub";
import { AppStatus, IConnectionInfo } from "app/types";

interface IResponse<T> {
    ok: boolean,
    status: number,
    data?: T
}

interface IConnections {
    connections: Array<IConnectionInfo>
}

const _createResponse:<T> (response: Response, data?: T) => IResponse<T> = (response, data) => Object({ok: response.ok, status: response.status, data: data});

const fetchConnections: () => Promise<IResponse<IConnections>> = async () => {
    publish(SET_APP_STATUS, AppStatus.BUSY);

    try {
        const response = await fetch("connections");
        if (!response.ok) {
            publish(SET_APP_STATUS, AppStatus.ERROR, response.status);
            return _createResponse(response);
        }
        publish(SET_APP_STATUS, AppStatus.READY);
        return _createResponse(response, await response.json() as IConnections);
    } catch (error) {
        publish(SET_APP_STATUS, AppStatus.ERROR);
        throw error;
    }
}


export {
    fetchConnections,
}