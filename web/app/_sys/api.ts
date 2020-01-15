import { publish, SET_APP_STATUS } from "app/_sys/pubsub";
import { AppStatus, IResponse, IInitial } from "app/types";

const _createResponse:<T> (response: Response, data?: T) => IResponse<T> = (response, data) => Object({ok: response.ok, status: response.status, data: data});

const fetchInitial: () => Promise<IResponse<IInitial>> = async () => {
    publish(SET_APP_STATUS, AppStatus.BUSY);

    try {
        const response = await fetch("api/initial");
        if (!response.ok) {
            publish(SET_APP_STATUS, AppStatus.ERROR, response.status);
            return _createResponse(response);
        }
        
        return _createResponse(response, await response.json() as IInitial);
    } catch (error) {
        publish(SET_APP_STATUS, AppStatus.ERROR);
        throw error;
    }
}


export {
    fetchInitial
}