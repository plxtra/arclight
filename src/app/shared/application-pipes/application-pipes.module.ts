import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TimesPipe } from './times-pipe';

@NgModule({
  imports: [
    CommonModule,
    TimesPipe
  ],
  exports: [
    TimesPipe
  ]
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ApplicationPipesModule { }
