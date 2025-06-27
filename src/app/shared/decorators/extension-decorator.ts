/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export function extension(ctr: any) {
  let originalFunction: Function;
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    originalFunction = descriptor.value;

    ctr.prototype[propertyKey] = function (...args: any) {
      return originalFunction(this, ...args);
    }
  }
}
