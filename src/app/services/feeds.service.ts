import { Injectable, inject } from '@angular/core';
import { Feed, FeedClassId, FeedsDataDefinition, FeedsDataItem } from '@plxtra/motif-core';
import { UnifyService } from './unify.service';

@Injectable({
  providedIn: 'root'
})
export class FeedsService {
  readonly scanner: Feed | undefined;

  constructor() {
    const unifyService = inject(UnifyService);

    // make sure not created in UserSessionService or any services used by it
    // Expect all feeds to have been retrieved before this service is created
    const adiService = unifyService.adi;
    const dataDefinition = new FeedsDataDefinition();
    const dataItem = adiService.subscribe(dataDefinition) as FeedsDataItem;
    this.scanner = dataItem.getFeed(FeedClassId.Scanner, undefined);
    adiService.unsubscribe(dataItem);
  }
}
