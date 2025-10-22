declare module "leaflet" {
  export type LatLngTuple = [number, number];

  export class LatLngBounds {
    constructor(latLngs: LatLngTuple[] | LatLngTuple);
    extend(latLng: LatLngTuple): this;
    pad(bufferRatio: number): LatLngBounds;
  }

  const Leaflet: any;
  export default Leaflet;
}
