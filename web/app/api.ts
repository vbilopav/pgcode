import { publish, SET_APP_STATUS } from "app/_sys/pubsub";
import { AppStatus, IResponse, IInitialResponse, IConnectionResponse } from "app/types";

const _createResponse:<T> (response: Response, data?: T) => IResponse<T> = (response, data) => Object({ok: response.ok, status: response.status, data: data});

const fetchInitial: () => Promise<IResponse<IInitialResponse>> = async () => {
    publish(SET_APP_STATUS, AppStatus.BUSY);

    try {
        const response = await fetch("api/initial");
        if (!response.ok) {
            publish(SET_APP_STATUS, AppStatus.ERROR, response.status);
            return _createResponse(response);
        }
        
        return _createResponse(response, await response.json() as IInitialResponse);
    } catch (error) {
        publish(SET_APP_STATUS, AppStatus.ERROR);
        throw error;
    }
}

const fetchConnection: (name: string) => Promise<IResponse<IConnectionResponse>> = async name => {
    publish(SET_APP_STATUS, AppStatus.BUSY);

    try {
        const response = await fetch(`api/connection/${name}`);
        if (!response.ok) {
            publish(SET_APP_STATUS, AppStatus.ERROR, response.status);
            return _createResponse(response);
        }
        
        return _createResponse(response, await response.json() as IConnectionResponse);
    } catch (error) {
        publish(SET_APP_STATUS, AppStatus.ERROR);
        throw error;
    }
}


export {
    fetchInitial, fetchConnection
}