import { Injectable } from '@angular/core';
import { LockOpenListItem } from '@pbkware/js-utils';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class LockerHandleService implements LockOpenListItem.Opener {

  public readonly lockerName: string;

  constructor() {
    this.lockerName = uuidv4();
  }
}
