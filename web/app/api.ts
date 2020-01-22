import { publish, SET_APP_STATUS } from "app/_sys/pubsub";
import { AppStatus, IResponse, IInitialResponse, IConnectionResponse } from "app/types";

const _createResponse:<T> (response: Response, data?: T) => IResponse<T> = (response, data) => Object({ok: response.ok, status: response.status, data: data});

const _fetchAndPublishStatus:<T> (url: string) => Promise<IResponse<T>> = async url => {
    publish(SET_APP_STATUS, AppStatus.BUSY);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            publish(SET_APP_STATUS, AppStatus.ERROR, response.status);
            return _createResponse(response);
        }
        return _createResponse(response, await response.json());
    } catch (error) {
        publish(SET_APP_STATUS, AppStatus.ERROR, error.message);
        throw error;
    }
}

export const fetchInitial: () => Promise<IResponse<IInitialResponse>> = async () => 
    _fetchAndPublishStatus<IInitialResponse>("api/initial");

export const fetchConnection: (name: string) => Promise<IResponse<IConnectionResponse>> = async name => 
    _fetchAndPublishStatus<IConnectionResponse>(`api/connection/${name}`);

export const setSchema: (schema: string) => Promise<IResponse<string>> = async schema => 
    _fetchAndPublishStatus<string>(`api/schema/${schema}`);
