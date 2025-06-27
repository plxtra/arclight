import { Pipe, PipeTransform } from '@angular/core';

// Usage: *ngFor="let r of 10|times"
@Pipe({
    name: 'times',
    // standalone: false
})
export class TimesPipe implements PipeTransform {
  transform(value: number): unknown {
    const iterable = {} as Iterable<unknown>;
    iterable[Symbol.iterator] = function* () {
      let n = 0;
      while (n < value) {
        yield ++n;
      }
    };
    return iterable;
  }
}
