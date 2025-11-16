declare module 'mapbox-gl/dist/mapbox-gl-csp-worker?worker&inline' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}
