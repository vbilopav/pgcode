import { publish, SET_APP_STATUS } from "app/_sys/pubsub";
import { AppStatus, IMain } from "app/types";

interface IResponse<T> {
    ok: boolean,
    status: number,
    data?: T
}

interface INameValue {
    name: string, value: string
}

interface IConnections {
    connections: Array<INameValue>,
    selected: string
}

const _createResponse:<T> (response: Response, data?: T) => IResponse<T> = (response, data) => Object({ok: response.ok, status: response.status, data: data});

const fetchConnections: () => Promise<IResponse<IConnections>> = async () => {
    publish(SET_APP_STATUS, AppStatus.busy);

    try {
        const response = await fetch("connections");
        if (!response.ok) {
            publish(SET_APP_STATUS, AppStatus.error, response.status);
            return _createResponse(response);
        }
        publish(SET_APP_STATUS, AppStatus.ready);
        return _createResponse(response, await response.json() as IConnections);
    } catch (error) {
        publish(SET_APP_STATUS, AppStatus.error);
        throw error;
    }
}


export {
    fetchConnections,
}