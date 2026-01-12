import { Pipe, PipeTransform } from '@angular/core';

import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
@Pipe({
  name: 'timeAgo',
  standalone: true,
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';

    let dateValue = value;
    if (typeof value === 'string') {
      dateValue = value.replace(' ', 'T');
    }

    const date = new Date(dateValue);

    // Safety check to prevent "Invalid Date" errors in the UI
    if (!isValid(date)) {
      console.warn('TimeAgoPipe: Invalid date provided', value);
      return 'just now';
    }

    return formatDistanceToNow(date, { addSuffix: true });
  }
}
