import { ItemInfoType } from "app/api";

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
