declare module 'd3' {
  const d3: any;
  export = d3;
}

declare module 'lodash.clonedeep' {
  function cloneDeep<T>(value: T): T;
  export = cloneDeep;
}
