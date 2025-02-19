import * as THREE from "three";
import * as WEBIFC from "web-ifc";
import {IfcLineObject} from "web-ifc";
import {IfcInfo} from "./IfcInfo";

export class Model {
  ifcInfo = new IfcInfo(this);
  get IfcOwnerHistory() {
    return this.ifcInfo.IfcOwnerHistory;
  }
  material = new THREE.MeshLambertMaterial();

  materialT = new THREE.MeshLambertMaterial({
    transparent: true,
    opacity: 0.2,
  });

  ifcAPI = new WEBIFC.IfcAPI();

  private _modelID?: number;

  get modelID() {
    if (this._modelID === undefined) {
      throw new Error("Model not initialized! Call the init() method.");
    }
    return this._modelID;
  }

  get context() {
    return this.ifcInfo.ifcUnit.IfcGeometricRepresentationContext;
  }

  async init() {
    await this.ifcAPI.Init();
    this.ifcAPI.SetLogLevel(WEBIFC.LogLevel.LOG_LEVEL_OFF);
    this._modelID = this.ifcAPI.CreateModel({schema: "IFC4X3"});
  }

  set(item: WEBIFC.IfcLineObject) {
    this.ifcAPI.WriteLine(this.modelID, item);
  }

  delete(
    item: WEBIFC.IfcLineObject | WEBIFC.Handle<IfcLineObject> | null,
    recursive = false
  ) {
    if (item === null) {
      return;
    }

    let foundItem: WEBIFC.IfcLineObject;
    if (item instanceof WEBIFC.Handle) {
      foundItem = this.ifcAPI.GetLine(this.modelID, item.value);
    } else {
      foundItem = item;
    }
    if (!foundItem) {
      return;
    }
    if (recursive) {
      for (const key in foundItem) {
        // @ts-ignore
        const value = foundItem[key];
        if (value instanceof WEBIFC.Handle) {
          this.delete(value);
        }
      }
    }
    this.ifcAPI.DeleteLine(this.modelID, foundItem.expressID);
  }

  get<T extends WEBIFC.IfcLineObject>(item: WEBIFC.Handle<T> | T | null) {
    if (item === null) {
      throw new Error("Item not found!");
    }
    if (item instanceof WEBIFC.Handle) {
      return this.ifcAPI.GetLine(this.modelID, item.value) as T;
    }
    return item;
  }

  update() {
    if (this._modelID === undefined) {
      throw new Error("Malformed model!");
    }
    const model = this.ifcAPI.SaveModel(this._modelID);
    this.ifcAPI.CloseModel(this._modelID);
    this._modelID++;
    this.ifcAPI.OpenModel(model);
  }
  export() {
    if (this._modelID === undefined) {
      throw new Error("Malformed model!");
    }
    return this.ifcAPI.SaveModel(this._modelID);
  }
}
